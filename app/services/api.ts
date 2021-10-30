import { sun } from '@modern-dev/daylight';
import * as https from '@nativescript-community/https';
import Observable, { EventData } from '@nativescript-community/observable';
import { Color } from '@nativescript/core/color';
import { ApplicationEventData, off as applicationOff, on as applicationOn, resumeEvent } from '@nativescript/core/application';
import { getString, remove, setString } from '@nativescript/core/application-settings';
import { connectionType, getConnectionType, startMonitoring, stopMonitoring } from '@nativescript/core/connectivity';
import dayjs from 'dayjs';
import { ccMoonIcon, colorForIcon, colorForUV, getMoonPhase, moonIcon, windBeaufortIcon } from '~/helpers/formatter';
import { lang } from '~/helpers/locale';
import { CustomError } from '~/utils/error';
import { cloudyColor, createGlobalEventListener, globalObservable, rainColor, snowColor, sunnyColor } from '~/variables';
import { Alert, CityWeather, Coord, Rain, Snow, Weather } from './owm';
import { Photon } from './photon';
let dsApiKey = getString('dsApiKey', DARK_SKY_KEY);
let owmApiKey = getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY);

export { Alert, CityWeather, Coord, Rain, Snow, Weather };
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

export function setDSApiKey(apiKey) {
    dsApiKey = apiKey;
    if (apiKey) {
        setString('dsApiKey', apiKey);
    } else {
        remove('dsApiKey');
    }
}
export function hasDSApiKey() {
    return !!dsApiKey;
}
export function setOWMApiKey(apiKey) {
    owmApiKey = apiKey;
    if (apiKey) {
        setString('owmApiKey', apiKey);
    } else {
        remove('owmApiKey');
    }
}
export function hasOWMApiKey() {
    return !!owmApiKey;
}

function isDayTime(sunrise, sunset, time) {
    // const sunrise = weatherData.sunrise;
    // const sunset = weatherData.sunset;
    if (sunrise && sunset) {
        return time.isBefore(sunset) && time.isAfter(sunrise);
    } else {
        // fallback
        const hourOfDay = time.get('h');
        return hourOfDay >= 7 && hourOfDay < 20;
    }
}

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
        applicationOn(resumeEvent, this.onAppResume, this);
        startMonitoring(this.onConnectionStateChange.bind(this));
        this.connectionType = getConnectionType();
    }
    stop() {
        if (!this.monitoring) {
            return;
        }
        applicationOff(resumeEvent, this.onAppResume, this);
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

async function handleRequestResponse(response: https.HttpsResponse, requestParams: HttpRequestOptions, requestStartTime, retry) {
    const statusCode = response.statusCode;
    let content;
    try {
        content = await response.content.toJSONAsync();
    } catch (err) {}
    if (!content) {
        content = await response.content.toStringAsync();
    }
    const isJSON = typeof content === 'object' || Array.isArray(content);
    if (Math.round(statusCode / 100) !== 2) {
        let jsonReturn;
        if (isJSON) {
            jsonReturn = content;
        } else {
            const match = /<title>(.*)\n*<\/title>/.exec(content);
            return Promise.reject(
                new HTTPError({
                    statusCode,
                    message: match ? match[1] : content.toString(),
                    requestParams
                })
            );
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
    return content;
}
function getRequestHeaders(requestParams?: HttpRequestOptions) {
    const headers = requestParams?.headers ?? {};
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}
export function request<T = any>(requestParams: HttpRequestOptions, retry = 0) {
    if (!networkService.connected) {
        throw new NoNetworkError();
    }
    if (requestParams.queryParams) {
        requestParams.url = queryString(requestParams.queryParams, requestParams.url);
        delete requestParams.queryParams;
    }
    requestParams.headers = getRequestHeaders(requestParams);
    requestParams.useLegacy = true;

    const requestStartTime = Date.now();
    return https.request(requestParams).then((response) => handleRequestResponse(response, requestParams, requestStartTime, retry));
}

export interface OWMParams extends Partial<Coord> {
    id?: number; // cityId
    q?: string; // search query
}
export async function fetchOWM(apiName: string, queryParams: OWMParams = {}) {
    return request({
        url: `https://api.openweathermap.org/data/2.5/${apiName}`,
        method: 'GET',
        queryParams: {
            lang,
            units: 'metric',
            appid: owmApiKey,
            ...queryParams
        }
    });
}

export async function getCityName(pos: Coord) {
    const result: CityWeather = await fetchOWM('weather', {
        lat: pos.lat,
        lon: pos.lon
    });
    return result;
}
export function prepareItems(weatherData, lastUpdate) {
    const newItems = [];
    // const endOfHour = dayjs()
    //     // .add(46, 'h')
    //     .endOf('h')
    //     .valueOf();
    const startOfHour = dayjs()
        // .add(46, 'h')
        .startOf('h')
        .valueOf();
    const endOfMinute = dayjs()
        // .add(46, 'h')
        .endOf('m')
        .valueOf();
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
            newItems.push(
                Object.assign(currentDaily, {
                    showHourly: false,
                    lastUpdate,
                    hourly: hours.map((h, i) => {
                        h.index = i;
                        h.min = min;
                        h.max = max;
                        h.tempDelta = (h.temperature - min) / delta;
                        h.curveTempPoints = [
                            hours[i - 3]?.temperature,
                            hours[i - 2]?.temperature,
                            hours[i - 1]?.temperature,
                            h.temperature,
                            hours[i + 1]?.temperature,
                            hours[i + 2]?.temperature,
                            hours[i + 3]?.temperature
                        ]
                            .filter((s) => s !== undefined)
                            .map((s) => (s - min) / delta);
                        h.odd = i % 2 === 0;
                        return h;
                    }),
                    minutely: firstMinuteIndex >= 0 ? weatherData.minutely.data.slice(firstMinuteIndex) : [],
                    alerts: weatherData.alerts
                })
            );
        } else {
            const items = d.hourly;
            const sunriseTime = dayjs(d.sunriseTime).endOf('h').valueOf();
            newItems.push(
                Object.assign(d, {
                    index: newItems.length,
                    scrollIndex: items.findIndex((h) => h.time >= sunriseTime)
                })
            );
        }
    });

    return newItems;
}
export async function getOWMWeather(lat: number, lon: number) {
    const result = (await fetchOWM('onecall', {
        lat,
        lon
    })) as {
        alerts?: Alert[];
        current: {
            dt: number;
            temp: number;
            feels_like: number;
            pressure: number;
            humidity: number;
            dew_point: number;
            clouds: number;
            wind_speed: number;
            wind_gust?: number;
            wind_deg: number;
            weather: Weather[];
            rain?: Rain;
            snow?: Snow;
            uvi: number;
            sunrise: number;
            visibility: number;
            sunset: number;
        };
        minutely?: {
            dt: number;
            precipitation: number;
        }[];
        hourly?: {
            dt: number;
            temp: number;
            feels_like: number;
            pressure: number;
            humidity: number;
            dew_point: number;
            clouds: number;
            wind_speed: number;
            wind_deg: number;
            wind_gust?: number;
            weather: Weather[];
            pop: number;
            snow?: Snow;
            rain?: Rain;
        }[];
        daily?: {
            dt: number;
            sunrise: number;
            sunset: number;
            temp: {
                day: number;
                min: number;
                max: number;
                night: number;
                eve: number;
                morn: number;
            };
            feels_like: {
                day: number;
                night: number;
                eve: number;
                morn: number;
            };
            pressure: number;
            humidity: number;
            dew_point: number;
            clouds: number;
            wind_speed: number;
            wind_gust?: number;
            wind_deg: number;
            weather: Weather[];
            pop: number;
            rain?: number;
            snow?: number;
            uvi: number;
        }[];
    };
    // console.log('test', JSON.stringify(result.daily));

    if (!result.minutely) {
        result.minutely = [];
    } else {
        result.minutely.forEach((h) => {
            h['precipIntensity'] = h.precipitation;
            h['time'] = h.dt * 1000;
            delete h.dt;
            delete h.precipitation;
        });
    }

    const r = {
        currently: {
            dt: result.current.dt * 1000,
            temperature: Math.round(result.current.temp),
            pressure: result.current.pressure,
            humidity: result.current.humidity,
            cloudCover: result.current.clouds,
            windSpeed: result.current.wind_speed * 3.6,
            windGust: result.current.wind_gust * 3.6,
            windBearing: result.current.wind_deg,
            uvIndexColor: colorForUV(result.current.uvi),
            uvIndex: result.current.uvi,
            moonIcon: moonIcon(getMoonPhase(new Date(result.current.dt * 1000))),
            sunriseTime: result.current.sunrise * 1000,
            sunsetTime: result.current.sunset * 1000,
            icon: result.current.weather[0]?.icon,
            description: result.current.weather[0]?.description,
            windBeaufortIcon: windBeaufortIcon(result.current.wind_gust * 3.6),
            windIcon: windIcon(result.current.wind_deg)
        },
        daily: {
            data: result.daily.map((data) => {
                const d = {} as any;
                d.time = data.dt * 1000;
                d.icon = data.weather[0]?.icon;
                d.description = data.weather[0]?.description;
                d.windSpeed = data.wind_speed * 3.6;
                d.windGust = data.wind_gust * 3.6;
                d.temperatureMin = Math.round(data.temp.min);
                d.temperatureMax = Math.round(data.temp.max);
                d.temperatureNight = Math.round(data.temp.night);

                d.precipProbability = data.pop;
                d.cloudCover = data.clouds;
                d.windSpeed = data.wind_speed * 3.6;
                d.windGust = data.wind_gust * 3.6;
                d.windBearing = data.wind_deg;
                d.humidity = data.humidity;
                d.pressure = data.pressure;
                d.moonIcon = moonIcon(getMoonPhase(new Date(d.time)));
                d.sunriseTime = data.sunrise * 1000;
                d.sunsetTime = data.sunset * 1000;
                d.precipIntensity = d.precipAccumulation = data.snow ? data.snow : data.rain ? data.rain : 0;

                // if (data.rain) {
                //     d.color = Color.mix(sunnyColor, getRainColor(data.rain), 1).hex;
                // } else if (data.snow) {
                //     d.color = Color.mix(sunnyColor, snowColor, 1).hex;
                // } else {
                //     d.color = Color.mix(sunnyColor, cloudyColor, d.cloudCover).hex;
                // }
                if (data.rain) {
                    d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, d.cloudCover), rainColor, Math.min(d.precipIntensity * 10, 100)).hex;
                } else if (data.snow) {
                    d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, d.cloudCover), snowColor, Math.min(d.precipIntensity * 10, 100)).hex;
                } else {
                    d.color = Color.mix(sunnyColor, cloudyColor, d.cloudCover).hex;
                }
                d.cloudColor = cloudyColor.setAlpha(d.cloudCover).hex;
                d.uvIndexColor = colorForUV(data.uvi);
                d.uvIndex = data.uvi;
                d.windBeaufortIcon = windBeaufortIcon(d.windSpeed);
                d.windIcon = windIcon(d.windBearing);
                d.hourly = [];
                return d;
            })
        },
        minutely: {
            data: result.minutely
        },
        alerts: result.alerts
    } as any;
    r.daily.data[0].hourly = result.hourly?.map((data) => {
        const d = {} as any;
        d.time = data.dt * 1000;
        d.icon = data.weather[0]?.icon;
        d.description = data.weather[0]?.description;
        d.windSpeed = data.wind_speed * 3.6; // max value
        d.temperature = Math.round(data.temp);

        d.windBearing = data.wind_deg;
        d.precipIntensity = d.precipAccumulation = data.snow ? data.snow['1h'] : data.rain ? data.rain['1h'] : 0;
        d.precipProbability = data.pop;
        d.cloudCover = data.clouds;
        d.humidity = data.humidity;
        d.windGust = data.wind_gust * 3.6;
        d.windSpeed = data.wind_speed * 3.6;
        d.pressure = data.pressure;
        const dateTimes = sun.getTimes(new Date(d.time), lat, lon);
        const color = colorForIcon(d.icon, d.time, dateTimes.sunrise.start.valueOf(), dateTimes.sunset.end.valueOf());
        d.precipColor = rainColor;
        d.color = Color.mix(color, cloudyColor, d.cloudCover).hex;
        if (data.rain) {
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, d.cloudCover), rainColor, d.precipIntensity * 10).hex;
        } else if (data.snow) {
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, d.cloudCover), snowColor, d.precipIntensity * 10).hex;
        } else {
            d.color = Color.mix(sunnyColor, cloudyColor, d.cloudCover).hex;
        }
        if (data.snow && data.snow['1h']) {
            d.precipAccumulation = data.snow['1h'] || 0;
            d.precipColor = snowColor;
        }
        d.windBeaufortIcon = windBeaufortIcon(d.windSpeed);
        d.cloudColor = cloudyColor.setAlpha(d.cloudCover).hex;
        d.windIcon = windIcon(d.windBearing);
        return d;
    });
    return r;
}
const cardinals = ['↓', '↙︎', '←', '↖︎', '↑', '↗︎', '→', '↘︎', '↓'];
function windIcon(degrees) {
    return cardinals[Math.round((degrees % 360) / 45)];
}

const supportedOSMKeys = ['moutain_pass', 'natural', 'place', 'tourism'];
const supportedOSMValues = ['winter_sports'];
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
        .map((f) => ({
            name: f.properties.name,
            sys: f.properties,
            coord: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
        }));
}
