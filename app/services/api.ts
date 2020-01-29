import * as http from '@nativescript/core/http';
import { CustomError } from '~/utils/error';
import { device } from '@nativescript/core/platform';
import { getNumber, getString, setBoolean, setNumber, setString } from '@nativescript/core/application-settings';
import { connectionType, getConnectionType, startMonitoring, stopMonitoring } from '@nativescript/core/connectivity';

import { EventData, Observable } from '@nativescript/core/data/observable';
import { clog } from '~/utils/logging';
import { IMapPos } from '~/helpers/geo';
import { CityWeather, Coord, ListWeather } from './owm';

type HTTPOptions = http.HttpRequestOptions;

export const NetworkConnectionStateEvent = 'NetworkConnectionStateEvent';
export interface NetworkConnectionStateEventData extends EventData {
    data: {
        connected: boolean;
        connectionType: connectionType;
    };
}

export interface HttpRequestOptions extends HTTPOptions {
    queryParams?: {};
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    requestParams: HTTPOptions;
}
export class HTTPError extends CustomError {
    statusCode: number;
    requestParams: HTTPOptions;
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

interface NetworkService {
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
                    connectionType: this._connectionType
                }
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
            this.notify({ eventName: 'connection', object: this, connectionType: value, connected: this.connected });
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
        requestParams
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
    const isJSON = !!jsonContent;
    clog('handleRequestResponse response', statusCode, Math.round(statusCode / 100), typeof content);
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
            clog('request error1', content, match);
            return Promise.reject(
                new HTTPError({
                    statusCode,
                    message: match ? match[1] : 'HTTP error',
                    requestParams
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
            clog('throwing http error', error.code || statusCode, error.error_description || error.form || error.message || error.error || error);
            throw new HTTPError({
                statusCode: error.code || statusCode,
                message: error.error_description || error.form || error.message || error.error || error,
                requestParams
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
export function request(requestParams: HttpRequestOptions, retry = 0) {
    if (!networkService.connected) {
        throw new NoNetworkError();
    }
    if (requestParams.queryParams) {
        requestParams.url = queryString(requestParams.queryParams, requestParams.url);
        delete requestParams.queryParams;
    }
    requestParams.headers = getRequestHeaders(requestParams);

    clog('request', requestParams);
    const requestStartTime = Date.now();
    return http.request(requestParams).then(response => handleRequestResponse(response, requestParams, requestStartTime, retry));
}

function getOwmLanguage() {
    const language = device.language.split('-')[0].toLowerCase();

    if (language === 'cs') {
        // Czech
        return 'cz';
    } else if (language === 'ko') {
        // Korean
        return 'kr';
    } else if (language === 'lv') {
        // Latvian
        return 'la';
    } else {
        return language;
    }
}
const ownLanguge = getOwmLanguage();
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
            lang: ownLanguge,
            appid: apiKey,
            ...queryParams
        }
    });
}

export async function getCityName(pos: Coord) {
    clog('getCityName', pos);
    const result: CityWeather = await fetchOWM('weather', {
        lat: pos.lat,
        lon: pos.lon
    });
    console.log('fetchOWM', 'done', result);

    return result;
}
export async function findCitiesByName(q: string) {
    clog('findCitiesByName', q);
    const result: {
        list: CityWeather[];
    } = await fetchOWM('find', {
        q
    });
    console.log('findCitiesByName', 'done', result);

    return result.list;
}

export async function getForecast(cityId: number) {
    clog('getForecast', cityId);
    return (await fetchOWM('forecast', {
        id: cityId
    })) as {
        list: ListWeather[];
    };
}
