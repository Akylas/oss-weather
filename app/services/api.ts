import { getString, remove, setString } from '@nativescript/core/application-settings';
import { connectionType, getConnectionType, startMonitoring, stopMonitoring } from '@nativescript/core/connectivity';
import { EventData, Observable } from '@nativescript/core/data/observable';
import * as http from '@nativescript/core/http';
import dayjs from 'dayjs';
import Color from 'tinycolor2';
import { ccMoonIcon, colorForIcon, colorForUV, moonIcon, windBeaufortIcon } from '~/helpers/formatter';
import { lang } from '~/helpers/locale';
import { IMapPos } from '~/helpers/geo';
import { CustomError } from '~/utils/error';
import { clog } from '~/utils/logging';
import { DarkSky } from './darksky';
import { CityWeather, Coord } from './owm';
import { ClimaCellDaily, ClimaCellHourly, ClimaCellNowCast } from './climacell';
import { cloudyColor, rainColor, snowColor, sunnyColor } from '~/variables';
import { Photon } from './photon';

let dsApiKey = getString('dsApiKey', DARK_SKY_KEY);
let ccApiKey = getString('ccApiKey', CLIMA_CELL_KEY);

type HTTPOptions = http.HttpRequestOptions;

export const NetworkConnectionStateEvent = 'connected';
export interface NetworkConnectionStateEventData extends EventData {
    data: {
        connected: boolean;
        connectionType: connectionType;
    };
}

export interface HttpRequestOptions extends HTTPOptions {
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
export function setCCApiKey(apiKey) {
    ccApiKey = apiKey;
    if (apiKey) {
        setString('ccApiKey', apiKey);
    } else {
        remove('ccApiKey');
    }
}
export function hasCCApiKey() {
    return !!ccApiKey;
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
                    message: 'timeout_error',
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
                    message: 'no_network',
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
    requestParams: HTTPOptions;
}
export class HTTPError extends CustomError {
    statusCode: number;
    requestParams: HTTPOptions;
    constructor(props: HTTPErrorProps | HTTPError) {
        super(
            Object.assign(
                {
                    message: 'httpError',
                },
                props
            ),
            'HTTPError'
        );
    }
}

interface NetworkService {
    // on(eventNames: 'connected', callback: (data: NetworkConnectionStateEventData) => void, thisArg?: any);
    // on(eventNames: 'connection', callback: (e: EventData & { connectionType: connectionType; connected: boolean }) => void, thisArg?: any);
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
            this.notify({
                eventName: NetworkConnectionStateEvent,
                object: this,
                data: {
                    connected: value,
                    connectionType: this._connectionType,
                },
            } as NetworkConnectionStateEventData);
        }
    }
    get connectionType() {
        return this._connectionType;
    }
    set connectionType(value: connectionType) {
        if (this._connectionType !== value) {
            this._connectionType = value;
            this.connected = value !== connectionType.none;
            // this.notify({ eventName: 'connection', object: this, connectionType: value, connected: this.connected });
        }
    }
    log(...args) {
        clog(`[${this.constructor.name}]`, ...args);
    }
    monitoring = false;
    start() {
        if (this.monitoring) {
            return;
        }
        this.monitoring = true;
        startMonitoring(this.onConnectionStateChange.bind(this));
        this.connectionType = getConnectionType();
    }
    stop() {
        if (!this.monitoring) {
            return;
        }
        this.monitoring = false;
        stopMonitoring();
    }
    onConnectionStateChange(newConnectionType: connectionType) {
        this.connectionType = newConnectionType;
    }
}

export const networkService = new NetworkService();

async function handleRequestRetry(requestParams: HttpRequestOptions, retry = 0) {
    throw new HTTPError({
        statusCode: 401,
        message: 'HTTP error',
        requestParams,
    });
}

async function handleRequestResponse(response: http.HttpResponse, requestParams: HttpRequestOptions, requestStartTime, retry) {
    const statusCode = response.statusCode;
    // return Promise.resolve()
    // .then(() => {
    let jsonContent;
    let content;
    try {
        jsonContent = response.content.toJSON();
    } catch (e) {
        // console.log('failed to parse result to JSON', e);
        content = response.content;
    }
    // const isJSON = !!jsonContent;
    // clog('handleRequestResponse response', requestParams.url, statusCode, Math.round(statusCode / 100), content);
    if (Math.round(statusCode / 100) !== 2) {
        // let jsonReturn;
        if (!jsonContent) {
            // jsonReturn = jsonContent;
            // } else {
            // try {
            // jsonReturn = JSON.parse(content);
            // } catch (err) {
            // error result might html
            const match = /<title>(.*)\n*<\/title>/.exec(content);
            return Promise.reject(
                new HTTPError({
                    statusCode,
                    message: match ? match[1] : content.toString(),
                    requestParams,
                })
            );
            // }
        } else {
            if (Array.isArray(jsonContent)) {
                jsonContent = jsonContent[0];
            }
            if (statusCode === 401 && jsonContent.error === 'invalid_grant') {
                return this.handleRequestRetry(requestParams, retry);
            }
            const error = jsonContent.error_description || jsonContent.error || jsonContent;
            throw new HTTPError({
                statusCode: error.code || statusCode,
                message: error.error_description || error.form || error.message || error.error || error,
                requestParams,
            });
        }
    }
    // if (isJSON) {
    return jsonContent || content;
    // }
    // try {
    //     return response.content.toJSON();
    // } catch (e) {
    //     // console.log('failed to parse result to JSON', e);
    //     return response.content;
    // }
    // })
    // .catch(err => {
    //     const delta = Date.now() - requestStartTime;
    //     if (delta >= 0 && delta < 500) {
    //         return timeout(delta).then(() => Promise.reject(err));
    //     } else {
    //         return Promise.reject(err);
    //     }
    // });
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

    // clog('request', requestParams);
    const requestStartTime = Date.now();
    return http.request(requestParams).then((response) => handleRequestResponse(response, requestParams, requestStartTime, retry)) as Promise<T>;
}

const apiKey = getString('apiKey', OWM_KEY);

export interface OWMParams extends Partial<IMapPos> {
    // pos?: IMapPos;
    id?: number; // cityId
    q?: string; // search query
}
export async function fetchOWM(apiName: string, queryParams: OWMParams = {}) {
    clog('fetchOWM', apiName, queryParams);
    return request({
        url: `https://api.openweathermap.org/data/2.5/${apiName}`,
        method: 'GET',
        queryParams: {
            lang,
            appid: apiKey,
            ...queryParams,
        },
    });
}

export async function getCityName(pos: Coord) {
    clog('getCityName', pos);
    const result: CityWeather = await fetchOWM('weather', {
        lat: pos.lat,
        lon: pos.lon,
    });
    console.log('fetchOWM', 'done', result);

    return result;
}
// export async function findCitiesByName(q: string) {
//     clog('findCitiesByName', q);
//     const result: {
//         list: CityWeather[];
//     } = await fetchOWM('find', {
//         q
//     });
//     console.log('findCitiesByName', 'done', result);

//     return result.list;
// }

// export interface WeatherData {
//     date: dayjs.Dayjs;
//     sunrise: dayjs.Dayjs;
//     sunset: dayjs.Dayjs;
//     temp: string;
//     tempC: number;
//     feels_like: string;
//     feels_likeC: number;
//     pressure: string;
//     pressureHpa: number;
//     humidity: string;
//     humidityPerc: number;
//     desc: string;
//     id: number;
//     icon: string;
//     windSpeed: string;
//     windSpeedKMH: number;
//     windDeg: number;
//     fallPHour: number;
//     fallDesc: string;
//     frontAlpha: number;
//     tempColor: string;
//     // nightTime
// }

// export async function getForecast(cityId: number) {
//     clog('getForecast', cityId);
//     const result = (await fetchOWM('forecast', {
//         id: cityId
//     })) as {
//         city: {
//             coord: {
//                 lat: number;
//                 lon: number;
//             };
//         };
//         list: ListWeather[];
//     };

//     let sunrise;
//     let sunset;
//     let lastDateStart: dayjs.Dayjs;
//     const lat = result.city.coord.lat;
//     const lon = result.city.coord.lon;

//     const results: WeatherData[][] = [];
//     let weatherResult: WeatherData[];
//     result.list.forEach(result => {
//         const dateDate = new Date(result.dt * 1000);
//         const date = dayjs(result.dt * 1000);
//         const dateStart = date.startOf('d');
//         if (!lastDateStart || !lastDateStart.isSame(dateStart)) {
//             weatherResult = [];
//             results.push(weatherResult);
//             sunrise = dayjs(getSunrise(lat, lon, dateDate));
//             sunset = dayjs(getSunset(lat, lon, dateDate));
//             lastDateStart = dateStart;
//         }
//         const rain = result.rain ? result.rain['3h'] || result.rain['1h'] || 0 : 0;
//         const snow = result.snow ? result.snow['3h'] || result.snow['1h'] || 0 : 0;
//         const icon = result.weather[0].icon.slice(0, 2) + (isDayTime(sunrise, sunset, date) ? 'd' : 'n');
//         const fallPHour = rain > 0 ? rain : snow;
//         const temp = result.main.temp;
//         weatherResult.push({
//             date,
//             sunrise,
//             sunset,
//             temp: formatValueToUnit(temp, UNITS.Celcius),
//             tempC: kelvinToCelsius(temp),
//             feels_like: formatValueToUnit(result.main.feels_like, UNITS.Celcius),
//             feels_likeC: result.main.feels_like,
//             pressure: formatValueToUnit(result.main.pressure, UNITS.hPa),
//             pressureHpa: result.main.pressure,
//             humidity: result.main.humidity + '%',
//             humidityPerc: result.main.humidity,
//             desc: titlecase(result.weather[0].description),
//             id: result.weather[0].id,
//             icon,
//             windSpeed: formatValueToUnit(result.wind.speed, UNITS.Speed),
//             windSpeedKMH: result.wind.speed,
//             windDeg: result.wind.deg,
//             fallPHour,
//             fallDesc: formatValueToUnit(fallPHour, UNITS.MM),
//             frontAlpha: Math.min(fallPHour / 5, 1),
//             tempColor: colorFromTempC(kelvinToCelsius(temp))
//             // nightTime
//         });
//         // clog(convertTime(date, 'dddd MMM D HH:mm'), JSON.stringify(result), icon, JSON.stringify(weatherData));
//         // if (date.isBefore(tomorrow)) {
//         //     (weatherData.time = convertTime(date, 'HH:mm')), todayWeather.push(weatherData);
//         // } else if (date.isBefore(later)) {
//         //     (weatherData.time = convertTime(date, 'HH:mm')), tomorrowWeather.push(weatherData);
//         // } else {
//         //     (weatherData.time = convertTime(date, 'dddd MMM D HH:mm')), weather.push(weatherData);
//         // }
//     });
//     return results;
// }
const cardinals = ['↓', '↙︎', '←', '↖︎', '↑', '↗︎', '→', '↘︎', '↓'];
function windIcon(degrees) {
    return cardinals[Math.round((degrees % 360) / 45)];
}

function getRainColor(precipIntensity: number) {
    if (precipIntensity > 50) {
        return '#0D47A2';
    } else if (precipIntensity > 7.6) {
        return '#1976D3';
    } else if (precipIntensity > 2.5) {
        return '#1E89E6';
    } else {
        return '#2197F4';
    }
}
function getRainFactor(precipIntensity: number) {
    if (precipIntensity > 50) {
        return 1;
    } else if (precipIntensity > 7.6) {
        return 0.9;
    } else if (precipIntensity > 2.0) {
        return 0.8;
    } else {
        return 0.5;
    }
}
export async function getDarkSkyWeather(lat, lon, queryParams = {}) {
    const result = await request<DarkSky>({
        url: `https://api.darksky.net/forecast/${dsApiKey}/${lat},${lon}`,
        method: 'GET',
        queryParams: {
            lang,
            units: 'ca',
            ...queryParams,
        },
    });

    result.currently && (result.currently.time *= 1000);
    result.daily.data.forEach((d) => {
        d.time = d.time * 1000;
        if (/rain/.test(d.icon)) {
            d.color = Color.mix(sunnyColor, getRainColor(d.precipIntensity), ((d.precipProbability + 1) / 2) * 100).toRgbString();
        } else if (/snow/.test(d.icon)) {
            d.color = Color.mix(sunnyColor, snowColor, d.precipProbability * 100).toRgbString();
        } else if (/cloudy|fog/.test(d.icon)) {
            d.color = Color.mix(sunnyColor, cloudyColor, d.cloudCover * 100).toRgbString();
        } else {
            d.color = sunnyColor;
        }
        d.uvIndexColor = colorForUV(d.uvIndex);
        d.moonIcon = moonIcon(d.moonPhase);
        d.windBeaufortIcon = windBeaufortIcon(d.windSpeed);
        d.sunriseTime = d.sunriseTime * 1000;
        d.sunsetTime = d.sunsetTime * 1000;
        d.windIcon = windIcon(d.windBearing);
        d.cloudColor = Color(cloudyColor).setAlpha(d.cloudCover).toRgbString();
        d.hourly = [];
    });
    if (result.alerts) {
        console.log('alerts', result.alerts);
        result.alerts.forEach((a) => {
            const severity = a.severity;
            a.time *= 1000;
            a.expires *= 1000;
            switch (severity) {
                case 'advisory':
                    a.alertColor = '#33d860';
                    break;
                case 'watch':
                    a.alertColor = '#ffe13c';
                    break;
                case 'warning':
                    a.alertColor = '#ff4f3c';
                    break;
            }
        });
    }
    let dailyIndex = 0;
    const firstDay = result.daily.data[0];
    let currentDateData = result.daily.data[dailyIndex];
    if (result.hourly) {
        currentDateData.hourlyData = {
            icon: result.hourly.icon,
            summary: result.hourly.summary,
        };
    }

    let dayEnd = dayjs(currentDateData.time).endOf('d');
    result.hourly.data.forEach((h, i) => {
        h.time = h.time * 1000;
        h.windIcon = windIcon(h.windBearing);
        h.windBeaufortIcon = windBeaufortIcon(h.windSpeed);
        const dateStart = dayjs(h.time).startOf('d');
        if (!dateStart.isBefore(dayEnd)) {
            dailyIndex++;
            currentDateData = result.daily.data[dailyIndex];
            dayEnd = dayjs(currentDateData.time).endOf('d');
        }

        const color = colorForIcon(h.icon, h.time, currentDateData.sunriseTime, currentDateData.sunsetTime);

        if (/rain/.test(h.icon)) {
            if (h.time > currentDateData.sunsetTime || h.time < currentDateData.sunriseTime) {
                h.icon += '-night';
            } else {
                h.icon += '-day';
            }
            h.color = Color.mix(Color(color).desaturate(50), getRainColor(h.precipIntensity), h.precipProbability * 100).toRgbString();
        } else if (/snow/.test(h.icon)) {
            if (h.time > currentDateData.sunsetTime || h.time < currentDateData.sunriseTime) {
                h.icon += '-night';
            } else {
                h.icon += '-day';
            }
            h.color = Color.mix(color, snowColor, h.precipProbability * 100).toRgbString();
        } else if (/cloudy/.test(h.icon)) {
            h.color = Color.mix(color, cloudyColor, h.cloudCover * 100).toRgbString();
        } else {
            h.color = color;
        }

        h.cloudColor = Color(cloudyColor).setAlpha(h.cloudCover).toRgbString();

        h.index = currentDateData.hourly.length;
        firstDay.hourly.push(h);
    });
    delete result.hourly;
    return result;
}

const CLIMA_CELL_API_UR = 'https://api.climacell.co/v3/weather';
const CLIMA_CELL_API_URL_NOWCAST = CLIMA_CELL_API_UR + '/nowcast';
const CLIMA_CELL_API_URL_HOURLY = CLIMA_CELL_API_UR + '/forecast/hourly';
const CLIMA_CELL_API_URL_DAILY = CLIMA_CELL_API_UR + '/forecast/daily';
const CLIMA_CELL_BASE_FIELDS: string[] = [
    'temp',
    // 'feels_like',
    // 'dewpoint',
    'humidity',
    'wind_speed',
    'wind_direction',
    // 'wind_gust',
    'baro_pressure',
    'precipitation',
    // 'precipitation_type',
    'weather_code',
];
const CLIMA_CELL_NOWCAST_FIELDS = CLIMA_CELL_BASE_FIELDS.concat(['dewpoint', 'cloud_base', 'cloud_ceiling', 'cloud_cover', 'wind_gust', 'precipitation_type']).join(',');
const CLIMA_CELL_HOURLY_FIELDS = CLIMA_CELL_NOWCAST_FIELDS + ',' + ['precipitation_probability'].join(',');
const CLIMA_CELL_DAILY_FIELDS = CLIMA_CELL_BASE_FIELDS.concat(['sunrise', 'precipitation_accumulation', 'precipitation_probability', 'sunset', 'moon_phase']).join(',');
export async function getClimaCellWeather(lat, lon, queryParams = {}) {
    const now = dayjs();
    const nowcast = await request<ClimaCellNowCast>({
        url: CLIMA_CELL_API_URL_NOWCAST,
        method: 'GET',
        queryParams: {
            lat,
            lon,
            apikey: ccApiKey,
            // start_time:now,
            end_time: now.add(1, 'h').toISOString(),
            unit_system: 'si',
            fields: CLIMA_CELL_NOWCAST_FIELDS,
            ...queryParams,
        },
    });
    const hourly = await request<ClimaCellHourly>({
        url: CLIMA_CELL_API_URL_HOURLY,
        method: 'GET',
        queryParams: {
            lat,
            lon,
            apikey: ccApiKey,
            unit_system: 'si',
            end_time: now.add(96, 'h').toISOString(),
            fields: CLIMA_CELL_HOURLY_FIELDS,
            ...queryParams,
        },
    });
    const daily = await request<ClimaCellDaily>({
        url: CLIMA_CELL_API_URL_DAILY,
        method: 'GET',
        queryParams: {
            lat,
            lon,
            apikey: ccApiKey,
            unit_system: 'si',
            end_time: now.add(10, 'd').toISOString(),
            fields: CLIMA_CELL_DAILY_FIELDS,
            ...queryParams,
        },
    });
    const result = {
        daily: {
            data: daily,
        },
        hourly: {
            data: hourly,
        },
        minutely: {
            data: nowcast,
        },
    } as any;
    // const result = await request<DarkSky>({
    //     url: `https://api.darksky.net/forecast/${dsApiKey}/${lat},${lon}`,
    //     method: 'GET',
    //     queryParams: {
    //         lang,
    //         units: 'ca',
    //         ...queryParams,
    //     },
    // });

    // result.currently && (result.currently.time *= 1000);
    result.daily.data.forEach((d) => {
        d.time = dayjs(d.observation_time.value).valueOf();
        d.icon = d.weather_code.value;
        d.windSpeed = d.wind_speed[1].max.value * 3.6; // max value
        d.temperatureMinTime = dayjs(d.temp[0].observation_time.value).valueOf();
        d.temperatureMin = d.temp[0].min.value;
        d.temperatureMaxTime = dayjs(d.temp[1].observation_time.value).valueOf();
        d.temperatureMax = d.temp[1].max.value;
        d.windBearing = d.wind_direction[1].max.value;
        d.precipAccumulation = d.precipitation_accumulation.value;
        d.precipProbability = d.precipitation_probability.value / 100;
        d.cloudCover = 0;
        // d.precipType = d.precipitation_type.value;
        // d.dewPoint = d.dewpoint.value;
        d.humidity = d.humidity.value;
        d.pressure = d.baro_pressure.value;
        d.moonIcon = ccMoonIcon(d.moon_phase.value);
        d.sunriseTime = dayjs(d.sunrise.value).valueOf();
        d.sunsetTime = dayjs(d.sunset.value).valueOf();

        // d.windGust = d.wind_gust.value;
        // d.cloudCover = d.cloud_cover.value;
        // d.visibility = d.visibility.value;

        if (d.precipType === 'rain') {
            d.color = Color.mix(sunnyColor, getRainColor(d.precipAccumulation), ((d.precipProbability + 1) / 2) * 100).toRgbString();
        } else if (d.precipType in ['snow', 'ice pellets', 'freezing rain']) {
            d.color = Color.mix(sunnyColor, snowColor, d.precipProbability * 100).toRgbString();
        } else if (/cloudy|fog/.test(d.icon)) {
            d.color = Color.mix(sunnyColor, cloudyColor, 0.5).toRgbString();
        } else {
            d.color = sunnyColor;
        }

        // d.uvIndexColor = colorForUV(d.uvIndex);
        d.windBeaufortIcon = windBeaufortIcon(d.windSpeed);
        d.windIcon = windIcon(d.windBearing);
        // d.cloudColor = Color(cloudyColor).setAlpha(d.cloudCover).toRgbString();
        d.hourly = [];

        delete d.observation_time;
        delete d.weather_code;
        delete d.wind_speed;
        delete d.baro_pressure;
        delete d.temp;
        delete d.wind_direction;
        delete d.precipitation;
        delete d.precipitation_accumulation;
        delete d.precipitation_probability;
        delete d.cloud_cover;
        delete d.moon_phase;
        delete d.sunrise;
        delete d.sunset;
        delete d.lat;
        delete d.lon;
    });
    let dailyIndex = 0;
    const firstDay = result.daily.data[0];
    let currentDateData = result.daily.data[dailyIndex];
    // if (result.hourly) {
    //     currentDateData.hourlyData = {
    //         icon: result.hourly.icon,
    //         summary: result.hourly.summary,
    //     };
    // }

    let dayEnd = dayjs(currentDateData.time).endOf('d');
    result.hourly.data.forEach((h, i) => {
        h.time = dayjs(h.observation_time.value).valueOf();
        h.icon = h.weather_code.value;
        h.temperature = h.temp.value;
        h.windSpeed = h.wind_speed.value * 3.6;
        h.windBearing = h.wind_direction.value;
        h.precipIntensity = h.precipitation.value; // mm/h
        h.precipProbability = h.precipitation_probability.value / 100;
        h.precipType = h.precipitation_type.value;
        h.dewPoint = h.dewpoint.value;
        h.humidity = h.humidity.value;
        h.pressure = h.baro_pressure.value;
        h.windGust = h.wind_gust.value;
        h.cloudCover = h.cloud_cover.value / 100;
        h.cloudCeiling = h.cloud_ceiling.value > 100 ? h.cloud_ceiling.value : 0;
        delete h.observation_time;
        delete h.wind_gust;
        delete h.cloud_ceiling;
        delete h.baro_pressure;
        delete h.cloud_base;
        delete h.wind_speed;
        delete h.weather_code;
        delete h.temp;
        delete h.wind_direction;
        delete h.precipitation_accumulation;
        delete h.precipitation_probability;
        delete h.precipitation_type;
        delete h.humidity;
        delete h.cloud_cover;
        delete h.moon_phase;
        delete h.dewpoint;
        delete h.sunrise;
        delete h.sunset;
        delete h.lat;
        delete h.lon;

        h.windBeaufortIcon = windBeaufortIcon(h.windSpeed);
        h.windIcon = windIcon(h.windBearing);
        h.cloudColor = Color(cloudyColor).setAlpha(h.cloudCover).toRgbString();
        const dateStart = dayjs(h.time).startOf('d');
        if (!dateStart.isBefore(dayEnd)) {
            dailyIndex++;
            currentDateData = result.daily.data[dailyIndex];
            dayEnd = dayjs(currentDateData.time).endOf('d');
        }

        const color = colorForIcon(h.icon, h.time, currentDateData.sunriseTime, currentDateData.sunsetTime);
        // console.log(
        //     dayjs(h.time).format('HH:mm'),
        //     dayjs(currentDateData.sunriseTime).format('HH:mm'),
        //     dayjs(currentDateData.sunsetTime).format('HH:mm'),
        //     h.time > currentDateData.sunsetTime,
        //     h.time < currentDateData.sunriseTime,
        //     h.icon
        // );
        if (h.time > currentDateData.sunsetTime || h.time < currentDateData.sunriseTime) {
            h.icon += '-night';
        } else {
            h.icon += '-day';
        }
        h.precipColor = rainColor;
        h.color = Color.mix(color, cloudyColor, h.cloudCover * 100).toRgbString();
        if (h.precipType === 'rain') {
            // h.color = Color.mix(Color(color).desaturate(50), getRainColor(h.precipIntensity), h.precipProbability * 100).toRgbString();
        } else if (h.precipType in ['snow', 'ice pellets', 'freezing rain']) {
            h.precipColor = snowColor;
            // h.color = Color.mix(color, h.precipColor, h.precipProbability * 100).toRgbString();
            // } else if (/cloudy|fog/.test(h.icon)) {
            //     h.color = Color.mix(color, cloudyColor, h.cloudCover * 100).toRgbString();
            // } else {
            //     h.color = color;
        }

        h.index = currentDateData.hourly.length;
        firstDay.hourly.push(h);
    });
    delete result.hourly;

    // let hourEnd = dayjs(currentDateData.time).endOf('h');
    result.minutely.data.forEach((h, i) => {
        h.time = dayjs(h.observation_time.value).valueOf();
        h.icon = h.weather_code.value;
        h.temperature = h.temp.value;
        h.windSpeed = h.wind_speed.value * 3.6;
        h.windBearing = h.wind_direction.value;
        h.precipIntensity = h.precipitation.value;
        // h.precipProbability = h.precipitation_probability.value;
        h.precipType = h.precipitation_type.value;
        h.dewPoint = h.dewpoint.value;
        h.humidity = h.humidity.value;
        h.pressure = h.baro_pressure.value;
        h.windGust = h.wind_gust.value;
        h.cloudCover = h.cloud_cover.value / 100;
        h.cloudCeiling = h.cloud_ceiling.value > 100 ? h.cloud_ceiling.value : 0;
        delete h.observation_time;
        delete h.wind_gust;
        delete h.cloud_ceiling;
        delete h.baro_pressure;
        delete h.cloud_base;
        delete h.weather_code;
        delete h.wind_speed;
        delete h.temp;
        delete h.wind_direction;
        delete h.precipitation;
        delete h.precipitation_accumulation;
        delete h.precipitation_probability;
        delete h.precipitation_type;
        delete h.dewpoint;
        delete h.humidity;
        delete h.cloud_cover;
        delete h.moon_phase;
        delete h.sunrise;
        delete h.sunset;
        delete h.lat;
        delete h.lon;

        h.windBeaufortIcon = windBeaufortIcon(h.windSpeed);
        // h.windIcon = windIcon(h.windBearing);
        // h.cloudColor = Color(cloudyColor).setAlpha(h.cloudCover).toRgbString();
        // const hourStart = dayjs(h.time).startOf('h');
        // if (!hourStart.isBefore(dayEnd)) {
        //     dailyIndex++;
        //     currentDateData = result.daily.data[dailyIndex];
        //     dayEnd = dayjs(currentDateData.time).endOf('h');
        // }

        // const color = colorForIcon(h.icon, h.time, currentDateData.sunriseTime, currentDateData.sunsetTime);

        // if (h.precipType === 'rain') {
        //     if (h.time > currentDateData.sunsetTime || h.time < currentDateData.sunriseTime) {
        //         h.icon += '-night';
        //     } else {
        //         h.icon += '-day';
        //     }
        //     // h.color = Color.mix(Color(color).desaturate(50), getRainColor(h.precipIntensity * 5), h.precipProbability * 100).toRgbString();
        // } else if (h.precipType in ['snow', 'ice pellets', 'freezing rain']) {
        //     if (h.time > currentDateData.sunsetTime || h.time < currentDateData.sunriseTime) {
        //         h.icon += '-night';
        //     } else {
        //         h.icon += '-day';
        //     }
        //     h.color = Color.mix(color, snowColor, h.precipProbability * 100).toRgbString();
        // } else if (/cloudy|fog/.test(h.icon)) {
        //     h.color = Color.mix(color, cloudyColor, h.cloudCover * 100).toRgbString();
        // } else {
        //     h.color = color;
        // }

        h.index = currentDateData.hourly.length;
    });
    // console.log('daily', JSON.stringify(result.daily));
    // console.log('hourly', JSON.stringify(result.hourly));
    // console.log('minutely', JSON.stringify(result.minutely));
    result.currently = result.minutely.data[0];
    return result;
}
const supportedOSMKeys = ['moutain_pass', 'natural', 'place', 'tourism'];
const supportedOSMValues = ['winter_sports'];
export async function photonSearch(q, lat?, lon?, queryParams = {}) {
    return request({
        url: 'http://photon.komoot.de/api',
        method: 'GET',
        queryParams: {
            q,
            lat,
            lon,
            lang,
            limit: 40,
        },
    }).then(function (results: Photon) {
        return results.features
            .filter((r) => supportedOSMKeys.indexOf(r.properties.osm_key) !== -1 || supportedOSMValues.indexOf(r.properties.osm_value) !== -1)
            .map((f) => ({
                name: f.properties.name,
                sys: f.properties,
                coord: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
            }));
    });
}
