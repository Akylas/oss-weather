import { device } from '@nativescript/core/platform';
import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(LocalizedFormat);
import Color from 'tinycolor2';

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
export const lang = getOwmLanguage();
console.log('deviceLang', lang);

// const rtf = new Intl.RelativeTimeFormat('es');

import nativeLocalize from 'nativescript-localize';
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

import 'dayjs/locale/fr';
if (['en', 'fr'].indexOf(lang) >= 0) {
    dayjs.locale(lang); // switch back to default English locale globally
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

// export function convertDuration(date, formatStr: string) {
//     const test = new Date(date);
//     test.setTime(test.getTime() + test.getTimezoneOffset() * 60 * 1000);
//     const result = dayjs(test).format(formatStr);
//     // clog('convertDuration', date, formatStr, test, result);
//     return result;
// }
export function kelvinToCelsius(kelvinTemp) {
    return kelvinTemp - 273.15;
}

// function kelvinToFahrenheit(kelvinTemp) {
//     return (9 * kelvinToCelsius(kelvinTemp)) / 5 + 32;
// }
function celciusToFahrenheit(kelvinTemp) {
    return (9 * kelvinTemp) / 5 + 32;
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
                return ['', ''];
            } else {
                return [value.toFixed(1), 'mm'];
            }
        case UNITS.Celcius:
            return [value.toFixed(1), '°'];
        case UNITS.Farenheit:
            return [celciusToFahrenheit(value).toFixed(1), '°'];
        // case UNITS.Duration:
        // return [convertDuration(value, 'HH:mm:ss'), ''];
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

export function formatValueToUnit(value: any, unit: UNITS, options?: { prefix?: string; otherParam?; join?: string }) {
    options = options || {};
    if (unit === UNITS.Celcius) {
        options.join = options.join || '';
    } else {
        options.join = options.join || ' ';
    }
    let result = convertValueToUnit(value, unit, options?.otherParam).join(options?.join);
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
    return Color('hsl(' + [h, '75%', '40%'] + ')').toHexString();
}
export function colorForUV(uvIndex) {
    if (uvIndex >= 11) {
        return '#B567A4';
    } else if (uvIndex >= 8) {
        return '#E53210';
    } else if (uvIndex >= 6) {
        return '#F18B00';
    } else if (uvIndex >= 3) {
        return '#FFF300';
    } else {
        return '#3EA72D';
    }
}

export function colorForIcon(icon, time, sunrise, sunset) {
    const sunnyColor = '#FFC82F';
    const nightColor = '#6B4985';
    const scatteredCloudyColor = '#cccccc';
    const cloudyColor = '#929292';
    const rainColor = '#4681C3';
    const snowColor = '#ACE8FF';
    // console.log('colorForIcon', icon);
    switch (icon) {
        case 'clear-night':
            return nightColor;
        case 'clear-day':
            return sunnyColor;
        // break;
        // return cloudyColor;
        // break;
        case 'partly-cloudy-night':
        case 'partly-cloudy-day':
        case 'partly-cloudy':
            return scatteredCloudyColor;
        case 'cloudy':
        case 'fog':
            return cloudyColor;
        case 'rain':
            return rainColor;
        case 'snow':
            return snowColor;
        default:
            if (time > sunset || time < sunrise) {
                return nightColor;
            } else {
                return sunnyColor;
            }
    }
}

const moonIcons = [
    'wi-moon-new',
    'wi-moon-waxing-cresent-1',
    'wi-moon-waxing-cresent-2',
    'wi-moon-waxing-cresent-3',
    'wi-moon-waxing-cresent-4',
    'wi-moon-waxing-cresent-5',
    'wi-moon-waxing-cresent-6',
    'wi-moon-first-quarter',
    'wi-moon-waxing-gibbous-1',
    'wi-moon-waxing-gibbous-2',
    'wi-moon-waxing-gibbous-3',
    'wi-moon-waxing-gibbous-4',
    'wi-moon-waxing-gibbous-5',
    'wi-moon-waxing-gibbous-6',
    'wi-moon-full',
    'wi-moon-waning-gibbous-1',
    'wi-moon-waning-gibbous-2',
    'wi-moon-waning-gibbous-3',
    'wi-moon-waning-gibbous-4',
    'wi-moon-waning-gibbous-5',
    'wi-moon-waning-gibbous-6',
    'wi-moon-3rd-quarter',
    'wi-moon-waning-crescent-1',
    'wi-moon-waning-crescent-2',
    'wi-moon-waning-crescent-3',
    'wi-moon-waning-crescent-4',
    'wi-moon-waning-crescent-5',
    'wi-moon-waning-crescent-6',
    'wi-moon-new'
];

export function moonIcon(moonPhase) {
    return moonIcons[Math.floor(moonPhase * (moonIcons.length - 1))];
}
