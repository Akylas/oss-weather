import { device } from '@nativescript/core/platform';
import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';
dayjs.extend(LocalizedFormat);

import nativeLocalize from 'nativescript-localize';
import { clog } from '~/utils/logging';
export function localize(s: string, ...args) {
    let result = nativeLocalize(s, ...args);
    if (!result || result.length === 0) {
        result = s;
    }
    return result;
}
// dayjs.extend(utc);
// const dayjs: (...args) => Dayjs = require('dayjs');
// const Duration = require('duration');

// const supportedLanguages = ['en', 'fr'];

const deviceLang = device.language;
const dayjsLocale = deviceLang.split('-')[0].toLowerCase();
console.log('deviceLang', deviceLang, dayjsLocale);
if (['en', 'fr'].indexOf(dayjsLocale) >= 0) {
    dayjs.locale(dayjsLocale); // switch back to default English locale globally
}
export enum UNITS {
    InchHg = 'InchHg',
    MMHg = 'MMHg',
    kPa = 'kPa',
    hPa = 'hPa',
    Inch = 'inch',
    MM = 'mm',
    Celcius = 'celcius',
    Farenheit = 'farenheit',
    Duration = 'duration',
    Date = 'date',
    Distance = 'm',
    DistanceKm = 'km',
    Speed = 'km/h',
    Pace = 'min/km',
    Cardio = 'bpm',
    Battery = 'battery'
}

// export function getCurrentDateLanguage() {
//     const deviceLang = Platform.device.language;
//     if (supportedLanguages.indexOf(deviceLang) !== -1) {
//         return deviceLang;
//     }
//     return 'en-US';
// }

export function convertTime(date: number | string | dayjs.Dayjs, formatStr: string) {
    if (date) {
        if (!date['format']) {
            date = dayjs(date);
        }
        return (date as dayjs.Dayjs).format(formatStr);
    }
}

// function createDateAsUTC(date) {
//     return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
// }

export function convertDuration(date, formatStr: string) {
    const test = new Date(date);
    test.setTime(test.getTime() + test.getTimezoneOffset() * 60 * 1000);
    const result = dayjs(test).format(formatStr);
    // clog('convertDuration', date, formatStr, test, result);
    return result;
}
export function kelvinToCelsius(kelvinTemp) {
    return kelvinTemp - 273.15;
}

function kelvinToFahrenheit(kelvinTemp) {
    return (9 * kelvinToCelsius(kelvinTemp)) / 5 + 32;
}

export function convertValueToUnit(value: any, unit: UNITS, otherParam?): [string, string] {
    if (value === undefined || value === null) {
        return ['', ''];
    }
    // clog('convertValueToUnit', value, unit, otherParam);
    switch (unit) {
        case UNITS.kPa:
            return [(value / 10).toFixed(), 'kPa'];
        case UNITS.hPa:
            return [value.toFixed(), 'hPa'];
        case UNITS.MMHg:
            return [(value * 0.750061561303).toFixed(), 'mm Hg'];
        case UNITS.InchHg:
            return [(value * 0.0295299830714).toFixed(), 'in Hg'];
        case UNITS.MM:
            if (value < 0.1) {
                return ['<0.1', 'mm'];
            } else {
                return [value, 'mm'];
            }
        case UNITS.Celcius:
            return [kelvinToCelsius(value).toFixed(1), '°C'];
        case UNITS.Farenheit:
            return [kelvinToFahrenheit(value).toFixed(1), '°F'];
        case UNITS.Duration:
            return [convertDuration(value, 'HH:mm:ss'), ''];

        case UNITS.Date:
            return [convertTime(value, 'M/d/yy h:mm a'), ''];

        case UNITS.Distance:
            return [value.toFixed(), unit];
        case UNITS.DistanceKm:
            if (value < 1000) {
                return [value.toFixed(), 'm'];
            } else if (value > 100000) {
                return [(value / 1000).toFixed(0), unit];
            } else {
                return [(value / 1000).toFixed(1), unit];
            }
        case UNITS.Speed:
            // if (value < 100) {
            //     return [value.toFixed(1), unit];
            // } else {
            // if > 100 we still need to send a . at the end...
            return [value.toFixed(0), unit];
        // }
        case UNITS.Pace:
            let result = value < 0.001 ? 0 : 60.0 / value;

            // no point in showing Pace > 60 min/km
            if (result > 60.0) {
                result = 0;
            }
            const minutes = Math.floor(result) % 60;
            const seconds = Math.floor((result - minutes) * 60);
            return [`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, unit];
        default:
            return [value.toFixed(), unit];
    }
}

export function formatValueToUnit(value: any, unit: UNITS, options?: { prefix?: string; otherParam? }) {
    let result = convertValueToUnit(value, unit, options ? options.otherParam : undefined).join(' ');
    if (options && options.prefix && result.length > 0) {
        result = options.prefix + result;
    }
    return result;
}
export function titlecase(value) {
    return value.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export function colorFromTempC(tempC) {
    let a = (tempC + 0) / 60;
    a = a < 0 ? 0 : a > 1 ? 1 : a;

    // Scrunch the green/cyan range in the middle
    // const sign = a < 0.5 ? -1 : 1;
    // a = sign * Math.pow(2 * Math.abs(a - .5), .35)/2 + .5;

    // Linear interpolation between the cold and hot
    const h0 = 179;
    const h1 = -190;
    const h = h0 * (1 - a) + h1 * a;
    return 'hsl(' + [h, '75%', '40%'] + ')';
}
