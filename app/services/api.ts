import { foregroundEvent } from '@akylas/nativescript/application';
import { getFromLocation } from '@nativescript-community/geocoding';
import * as https from '@nativescript-community/https';
import Observable, { EventData } from '@nativescript-community/observable';
import { ApplicationEventData, off as applicationOff, on as applicationOn, resumeEvent } from '@nativescript/core/application';
import { connectionType, getConnectionType, startMonitoring, stopMonitoring } from '@nativescript/core/connectivity';
import dayjs from 'dayjs';
import { lang } from '~/helpers/locale';
import { CustomError } from '~/utils/error';
import { createGlobalEventListener, globalObservable } from '~/variables';
import { Photon, PhotonProperties } from './photon';

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
    queryParams?: {};
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

export class TimeoutError extends CustomError {
    constructor(props?) {
        super(
            Object.assign(
                {
                    message: 'timeout_error'
                },
                props
            ),
            'TimeoutError'
        );
    }
}

export class NoNetworkError extends CustomError {
    constructor(props?) {
        super(
            Object.assign(
                {
                    message: 'no_network'
                },
                props
            ),
            'NoNetworkError'
        );
    }
}
export interface HTTPErrorProps {
    statusCode: number;
    message: string;
    requestParams: HTTPSOptions;
}
export class HTTPError extends CustomError {
    statusCode: number;
    requestParams: HTTPSOptions;
    constructor(props: HTTPErrorProps | HTTPError) {
        super(
            Object.assign(
                {
                    message: 'httpError'
                },
                props
            ),
            'HTTPError'
        );
    }
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
        applicationOn(foregroundEvent, this.onAppResume, this);
        startMonitoring(this.onConnectionStateChange.bind(this));
        this.connectionType = getConnectionType();
    }
    stop() {
        if (!this.monitoring) {
            return;
        }
        applicationOff(foregroundEvent, this.onAppResume, this);
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

async function handleRequestResponse<T>(response: https.HttpsResponse<https.HttpsResponseLegacy<T>>, requestParams: HttpRequestOptions, requestStartTime, retry): Promise<T> {
    const statusCode = response.statusCode;
    let content: T;
    try {
        content = await response.content.toJSONAsync();
    } catch (err) {
        console.error(err);
    }
    if (!content) {
        content = (await response.content.toStringAsync()) as any;
    }
    const isJSON = typeof content === 'object' || Array.isArray(content);
    // DEV_LOG && console.log('handleRequestResponse', statusCode, content);
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
            if (statusCode === 401 && jsonReturn.error === 'invalid_grant') {
                return this.handleRequestRetry(requestParams, retry);
            }
            const error = jsonReturn.error_description || jsonReturn.error || jsonReturn;
            throw new HTTPError({
                statusCode: error.code || statusCode,
                message: error.error_description || error.form || error.message || error.error || error,
                requestParams
            });
        }
    }
    return content as any as T;
}
function getRequestHeaders(requestParams?: HttpRequestOptions) {
    const headers = requestParams?.headers ?? {};
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}
export async function request<T = any>(requestParams: HttpRequestOptions, retry = 0) {
    if (!networkService.connected) {
        throw new NoNetworkError();
    }
    if (requestParams.queryParams) {
        requestParams.url = queryString(requestParams.queryParams, requestParams.url);
        delete requestParams.queryParams;
    }
    requestParams.headers = getRequestHeaders(requestParams);

    const requestStartTime = Date.now();
    DEV_LOG && console.log('request', requestParams);
    const response = await https.request<T>(requestParams);
    return handleRequestResponse<T>(response, requestParams, requestStartTime, retry);
}

export function prepareItems(weatherData: WeatherData, lastUpdate, now = dayjs()) {
    const newItems = [];

    const startOfHour = now.startOf('h').valueOf();
    const endOfMinute = now.endOf('m').valueOf();
    weatherData.daily.data.forEach((d, index) => {
        if (index === 0) {
            let currentDaily = weatherData.daily.data[index];
            const firstHourIndex = currentDaily.hourly.findIndex((h) => h.time >= startOfHour);
            const firstMinuteIndex = weatherData.minutely ? weatherData.minutely.data.findIndex((h) => h.time >= endOfMinute) : -1;
            Object.assign(currentDaily, weatherData.currently);
            if (firstHourIndex > 1) {
                currentDaily = Object.assign({}, currentDaily, currentDaily.hourly[firstHourIndex - 1]);
            } else if (firstMinuteIndex > 10) {
                currentDaily = Object.assign({}, currentDaily, weatherData.minutely.data[firstMinuteIndex - 1]);
            }
            const hours = firstHourIndex >= 0 ? currentDaily.hourly.slice(firstHourIndex) : [];
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
            // current weather is a mix of actual current weather, hourly and daily
            newItems.push(
                Object.assign(currentDaily, currentDaily.hourly[firstHourIndex], firstHourIndex === 0 ? weatherData.currently : {}, {
                    lastUpdate,
                    hourly: hours.map((h, i) => ({
                        ...h,
                        index: i,
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
                    minutely: firstMinuteIndex >= 0 ? weatherData.minutely.data.slice(firstMinuteIndex) : [],
                    alerts: weatherData.alerts
                })
            );
        } else {
            // const items = d.hourly;
            // const sunriseTime = dayjs(d.sunriseTime).endOf('h').valueOf();
            newItems.push(
                Object.assign(d, {
                    index: newItems.length
                    // scrollIndex: items.findIndex((h) => h.time >= sunriseTime)
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
export async function photonSearch(q, lat?, lon?, queryParams = {}) {
    const results = await request<Photon>({
        url: 'https://photon.komoot.io/api',

        method: 'GET',
        queryParams: {
            q,
            lat,
            lon,
            lang,
            limit: 40
        }
    });
    return results.features
        .filter((r) => supportedOSMKeys.indexOf(r.properties.osm_key) !== -1 || supportedOSMValues.indexOf(r.properties.osm_value) !== -1)
        .map(
            (f) =>
                ({
                    name: f.properties.name,
                    sys: f.properties,
                    coord: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
                } as WeatherLocation)
        );
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
    }
}
