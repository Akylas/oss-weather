import { getFromLocation } from '@nativescript-community/geocoding';
import * as https from '@nativescript-community/https';
import Observable, { EventData } from '@nativescript-community/observable';
import { Application, ApplicationEventData, ApplicationSettings, Folder, Utils, knownFolders } from '@nativescript/core';
import { connectionType, getConnectionType, startMonitoring, stopMonitoring } from '@nativescript/core/connectivity';
import dayjs from 'dayjs';
import { getTimes } from 'suncalc';
import { lang } from '~/helpers/locale';
import { CustomError, HTTPError, NoNetworkError, wrapNativeException } from '~/utils/error';
import { createGlobalEventListener, globalObservable } from '~/utils/svelte/ui';
import { Photon, PhotonProperties } from '../../typings/photon';
import { WeatherData } from './providers/weather';
import { iconService } from './icon';
import { SHOW_CURRENT_DAY_DAILY, SHOW_DAILY_IN_CURRENTLY } from '~/helpers/constants';
import { FavoriteLocation } from '~/helpers/favorites';

type HTTPSOptions = https.HttpsRequestOptions;

export const onNetworkChanged = createGlobalEventListener('network');

export const NetworkConnectionStateEvent = 'connected';
export interface NetworkConnectionStateEventData extends EventData {
    data: {
        connected: boolean;
        connectionType: connectionType;
    };
}

export interface HttpRequestOptions extends HTTPSOptions {
    noJSON?: boolean;
    offlineSupport?: boolean;
    queryParams?: {};
}

export function getCacheControl(maxAge = 60, stale = 59) {
    return `max-age=${maxAge}, max-stale=${stale}, stale-while-revalidate=${stale}`;
}

export function queryString(params, location) {
    const obj = {};
    let i, len, key, value;

    if (typeof params === 'string') {
        value = location.match(new RegExp('[?&]' + params + '=?([^&]*)[&#$]?'));
        return value ? value[1] : undefined;
    }

    const locSplit = location.split(/[?&]/);
    // _params[0] is the url

    const parts = [];
    for (i = 0, len = locSplit.length; i < len; i++) {
        const theParts = locSplit[i].split('=');
        if (!theParts[0]) {
            continue;
        }
        if (theParts[1]) {
            parts.push(theParts[0] + '=' + theParts[1]);
        } else {
            parts.push(theParts[0]);
        }
    }
    if (Array.isArray(params)) {
        let data;

        for (i = 0, len = params.length; i < len; i++) {
            data = params[i];
            if (typeof data === 'string') {
                parts.push(data);
            } else if (Array.isArray(data)) {
                parts.push(data[0] + '=' + data[1]);
            }
        }
    } else if (typeof params === 'object') {
        for (key in params) {
            value = params[key];
            if (typeof value === 'undefined') {
                delete obj[key];
            } else {
                if (typeof value === 'object') {
                    obj[key] = encodeURIComponent(JSON.stringify(value));
                } else {
                    obj[key] = encodeURIComponent(value);
                }
            }
        }
        for (key in obj) {
            parts.push(key + (obj[key] === true ? '' : '=' + obj[key]));
        }
    }

    return parts.splice(0, 2).join('?') + (parts.length > 0 ? '&' + parts.join('&') : '');
}

interface NetworkService extends Observable {
    on(eventNames: 'connected', callback: (data: NetworkConnectionStateEventData) => void, thisArg?: any);
    on(eventNames: 'connection', callback: (e: EventData & { connectionType: connectionType; connected: boolean }) => void, thisArg?: any);
}

class NetworkService extends Observable {
    _connectionType: connectionType = connectionType.none;
    _connected = false;
    get connected() {
        return this._connected;
    }
    set connected(value: boolean) {
        if (this._connected !== value) {
            this._connected = value;
            globalObservable.notify({ eventName: 'network', data: value });
            this.notify<NetworkConnectionStateEventData>({
                eventName: NetworkConnectionStateEvent,
                object: this as any,
                data: {
                    connected: value,
                    connectionType: this._connectionType
                }
            });
        }
    }
    get connectionType() {
        return this._connectionType;
    }
    set connectionType(value: connectionType) {
        if (this._connectionType !== value) {
            this._connectionType = value;
            this.connected = value !== connectionType.none;
        }
    }
    monitoring = false;
    start() {
        if (this.monitoring) {
            return;
        }
        this.monitoring = true;
        Application.on(Application.foregroundEvent, this.onAppResume, this);
        startMonitoring(this.onConnectionStateChange.bind(this));
        this.connectionType = getConnectionType();
        const folder = Folder.fromPath(knownFolders.documents().path).getFolder('cache');
        const diskLocation = folder.path;
        DEV_LOG && console.log('setCache', diskLocation);

        https.setCache({
            diskLocation,
            diskSize: 40 * 1024 * 1024,
            memorySize: 10 * 1024 * 1024
        });
        if (__ANDROID__) {
            try {
                //@ts-ignore
                https.addInterceptor(com.nativescript.https.CacheInterceptor.INTERCEPTOR);
                //@ts-ignore
                https.addNetworkInterceptor(com.nativescript.https.CacheInterceptor.INTERCEPTOR);
            } catch (error) {
                console.error(error);
            }
        }
    }
    stop() {
        if (!this.monitoring) {
            return;
        }
        Application.off(Application.foregroundEvent, this.onAppResume, this);
        this.monitoring = false;
        stopMonitoring();
    }
    onAppResume(args: ApplicationEventData) {
        this.connectionType = getConnectionType();
    }
    onConnectionStateChange(newConnectionType: connectionType) {
        this.connectionType = newConnectionType;
    }
}

export const networkService = new NetworkService();

async function handleRequestResponse<T>(
    response: https.HttpsResponse<https.HttpsResponseLegacy<T>>,
    requestParams: HttpRequestOptions,
    requestStartTime,
    retry
): Promise<{ content: T; time: number }> {
    const statusCode = response.statusCode;
    let content: T;
    if (requestParams.noJSON !== true) {
        try {
            content = await response.content.toJSONAsync();
        } catch (err) {
            console.error(err);
        }
    }
    if (!content) {
        content = (await response.content.toStringAsync()) as any;
    }
    if (!content) {
        content = response.reason as any;
    }
    const isJSON = typeof content === 'object' || Array.isArray(content);
    DEV_LOG && console.log('handleRequestResponse', statusCode, response.headers, JSON.stringify(content));
    if (Math.round(statusCode / 100) !== 2) {
        let jsonReturn;
        if (isJSON) {
            jsonReturn = content;
        } else {
            const match = /<title>(.*)\n*<\/title>/.exec(content as any as string);
            throw new HTTPError({
                statusCode,
                message: match ? match[1] : content.toString(),
                requestParams
            });
        }
        if (jsonReturn) {
            if (Array.isArray(jsonReturn)) {
                jsonReturn = jsonReturn[0];
            }
            // if (statusCode === 401 && jsonReturn.error === 'invalid_grant') {
            //     return this.handleRequestRetry(requestParams, retry);
            // }
            const error = jsonReturn.error_description || jsonReturn.reason || jsonReturn.error || jsonReturn;
            throw new HTTPError({
                statusCode: error.code || statusCode,
                message: error.error_description || error.form || error.message || error.error || error,
                requestParams
            });
        }
    }
    return { content: content as any as T, time: dayjs(response.headers['Date']).valueOf() } as RequestResult<T>;
}
function getRequestHeaders(requestParams?: HttpRequestOptions) {
    const headers = requestParams?.headers ?? {};
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}

export interface RequestResult<T> {
    content: T;
    time: number;
}
export async function request<T = any>(requestParams: HttpRequestOptions, retry = 0) {
    if (requestParams.offlineSupport !== true && !networkService.connected) {
        throw new NoNetworkError();
    }
    if (requestParams.queryParams) {
        requestParams.url = queryString(requestParams.queryParams, requestParams.url);
        delete requestParams.queryParams;
    }
    requestParams.headers = getRequestHeaders(requestParams);

    const requestStartTime = Date.now();
    DEV_LOG && console.log('request', requestParams);
    try {
        const response = await https.request<T>(requestParams);
        return handleRequestResponse<T>(response, requestParams, requestStartTime, retry);
    } catch (error) {
        throw wrapNativeException(
            error,
            (message) =>
                new HTTPError({
                    message,
                    statusCode: -1,
                    requestParams
                })
        );
    }
}

export function prepareItems(weatherLocation: WeatherLocation, weatherData: WeatherData, lastUpdate?, now = dayjs()) {
    const newItems = [];

    const startOfHour = now.startOf('h').valueOf();
    const endOfMinute = now.endOf('m').valueOf();
    const firstHourIndex = weatherData.hourly.findIndex((h) => h.time >= startOfHour);
    const firstMinuteIndex = weatherData.minutely?.data ? weatherData.minutely.data.findIndex((h) => h.time >= endOfMinute) : -1;
    const hours = firstHourIndex >= 0 ? weatherData.hourly.slice(firstHourIndex) : [];
    const showCurrentInDaily = ApplicationSettings.getBoolean('show_current_day_daily', SHOW_CURRENT_DAY_DAILY);
    const showDayDataInCurrent = ApplicationSettings.getBoolean('show_daily_in_currently', SHOW_DAILY_IN_CURRENTLY);
    weatherData.daily.data.forEach((d, index) => {
        if (index === 0) {
            const dailyData = weatherData.daily.data[index];
            // eslint-disable-next-line prefer-const
            let { precipAccumulation, cloudCover, cloudCeiling, iso, isDay, uvIndex, windGust, ...current } = dailyData;
            if (showDayDataInCurrent) {
                Object.assign(current, { precipAccumulation, cloudCover, cloudCeiling, iso, uvIndex, windGust });
            }

            current = firstHourIndex >= 0 ? { ...hours[index] } : current;
            if (firstHourIndex === 0 && firstMinuteIndex > 10) {
                Object.assign(current, weatherData.minutely.data[firstMinuteIndex - 1]);
            }
            if (now.valueOf() - weatherData.currently.time <= 1000 * 60 * 20) {
                Object.assign(current, weatherData.currently);
            }
            // const { ...currentDaily } = current;
            let min = 10000;
            let max = -10000;
            hours.forEach((h, i) => {
                // h.temperature = (h.temperature -24) * 4 + 24;
                if (h.temperature < min) {
                    min = h.temperature;
                }
                if (h.temperature > max) {
                    max = h.temperature;
                }
            });
            const delta = max - min;

            const times = getTimes(now.toDate(), weatherLocation.coord.lat, weatherLocation.coord.lon);
            // current weather is a mix of actual current weather, hourly and daily
            newItems.push({
                ...current,
                lastUpdate,
                isDay: now.valueOf() < times.sunsetStart.valueOf() && now.valueOf() > times.sunriseEnd.valueOf(),
                temperatureMin: dailyData.temperatureMin,
                temperatureMax: dailyData.temperatureMax,
                moonIcon: dailyData.moonIcon,
                // icon: iconService.getIcon(currentDaily.iconId, currentDaily.isDay),
                sunriseTime: times.sunriseEnd,
                sunsetTime: times.sunsetStart,
                hourly: hours.map((h, i) => ({
                    ...h,
                    index: i,
                    // icon: iconService.getIcon(h.iconId, h.isDay),
                    min,
                    max,
                    tempDelta: (h.temperature - min) / delta,
                    curveTempPoints: [
                        hours[i - 3]?.temperature,
                        hours[i - 2]?.temperature,
                        hours[i - 1]?.temperature,
                        h.temperature,
                        hours[i + 1]?.temperature,
                        hours[i + 2]?.temperature,
                        hours[i + 3]?.temperature
                    ]
                        .filter((s) => s !== undefined)
                        .map((s) => (s - min) / delta),
                    odd: i % 2 === 0
                })),
                minutely: firstMinuteIndex >= 0 ? weatherData.minutely.data.slice(firstMinuteIndex, firstMinuteIndex + 8) : [],
                alerts: weatherData.alerts
            });
            if (showCurrentInDaily) {
                newItems.push(
                    Object.assign(d, {
                        // icon: iconService.getIcon(d.iconId, d.isDay),
                        index: newItems.length
                    })
                );
            }
        } else {
            newItems.push(
                Object.assign(d, {
                    // icon: iconService.getIcon(d.iconId, d.isDay),
                    index: newItems.length
                })
            );
        }
    });

    return newItems;
}

const supportedOSMKeys = ['moutain_pass', 'natural', 'place', 'tourism'];
const supportedOSMValues = ['winter_sports'];

export interface WeatherLocation {
    name: string;
    sys?: PhotonProperties;
    coord: {
        lat: number;
        lon: number;
    };
}
const PHOTON_SUPPORTED_LANGUAGES = ['en', 'de', 'fr'];
export async function photonSearch(q, lat?, lon?, queryParams = {}) {
    let actualLang = lang.split('-')[0];
    if (PHOTON_SUPPORTED_LANGUAGES.indexOf(actualLang) === -1) {
        actualLang = 'en';
    }
    const results = await request<Photon>({
        url: 'https://photon.komoot.io/api',

        method: 'GET',
        queryParams: {
            q,
            lat,
            lon,
            lang: actualLang,
            limit: 40
        }
    });
    return results.content.features
        .filter((r) => supportedOSMKeys.indexOf(r.properties.osm_key) !== -1 || supportedOSMValues.indexOf(r.properties.osm_value) !== -1)
        .map(
            (f) =>
                ({
                    name: f.properties.name,
                    sys: f.properties,
                    coord: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
                }) as WeatherLocation
        );
}

    return (
        await request<{ iana_timezone: string }>({
            url: 'https://api.geotimezone.com/public/timezone',

            method: 'GET',
            queryParams: {
                latitude: location.coord[1],
                longitude: location.coord[0]
            },
            headers: {
                'User-Agent': 'OSSWeatherApp'
            }
        })
    ).content.iana_timezone;
}
export async function geocodeAddress(coord: { lat: number; lon: number }) {
    try {
        const results = await getFromLocation(coord.lat, coord.lon, 10);
        DEV_LOG && console.log('found addresses', results);
        if (results?.length > 0) {
            const result = results[0];
            const newData = {
                coord,
                name: result.locality,
                sys: {
                    city: result.locality,
                    country: result.country,
                    state: result.administrativeArea,
                    housenumber: result.subThoroughfare,
                    postcode: result.postalCode,
                    street: result.thoroughfare
                }
            } as WeatherLocation;
            // console.log('geocodeAddress', coord, newData, formatAddress(newData.sys));
            // newData.name = formatAddress(newData.sys);
            return newData;
        } else {
            return {
                coord,
                sys: {},
                name: coord.lat.toFixed(2) + ',' + coord.lon.toFixed(2)
            } as WeatherLocation;
        }
    } catch (error) {
        console.error('geocodeAddress error:', error);
        return {
            coord,
            sys: {},
            name: coord.lat.toFixed(2) + ',' + coord.lon.toFixed(2)
        } as WeatherLocation;
    }
}
