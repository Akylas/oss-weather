import dayjs from 'dayjs';

// import required dayjs locales
// import utc from 'dayjs/plugin/utc';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(LocalizedFormat);
import Color from 'tinycolor2';
import { nightColor, sunnyColor } from '~/variables';

// export function localize(s: string, ...args) {
//     return l(s, ...args);
// }
// dayjs.extend(utc);
// const dayjs: (...args) => Dayjs = require('dayjs');
// const Duration = require('duration');

// const supportedLanguages = ['en', 'fr'];

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
    Battery = 'battery',
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
    return '';
}

// function createDateAsUTC(date) {
//     return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
// }

// export function convertDuration(date, formatStr: string) {
//     const test = new Date(date);
//     test.setTime(test.getTime() + test.getTimezoneOffset() * 60 * 1000);
//     const result = dayjs(test).format(formatStr);
//     // console.log('convertDuration', date, formatStr, test, result);
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

export function convertValueToUnit(value: any, unit: UNITS, otherParam?): [string | number, string] {
    if (value === undefined || value === null) {
        return ['', ''];
    }
    // console.log('convertValueToUnit', value, unit, otherParam);
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
            // if (value < 0.1) {
            //     return ['', ''];
            // } else {
            return [value.toFixed(1), 'mm'];
        // }
        case UNITS.Celcius:
            return [Math.round(value * 10) / 10, ''];
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

export function formatValueToUnit(value: any, unit: UNITS, options?: { prefix?: string; otherParam?; join?: string; unitScale?: number }) {
    options = options || {};
    if (unit === UNITS.Celcius) {
        options.join = options.join || '';
    } else {
        options.join = options.join || ' ';
    }
    const array = convertValueToUnit(value, unit, options?.otherParam);
    if (options.unitScale) {
        for (let index = 0; index < options.unitScale; index++) {
            array[1] = `<small>${array[1]}</small>`;
        }
    }
    let result = array.join(options?.join);
    if (options && options.prefix && result.length > 0) {
        result = options.prefix + result;
    }
    return result;
}
export function titlecase(value) {
    return value.replace(/\w\S*/g, function (txt) {
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
    // console.log('colorForIcon', icon);
    switch (icon) {
        case 'clear-night':
            return nightColor;
        case 'clear-day':
            return sunnyColor;
        // break;
        // return cloudyColor;
        // break;
        // case 'partly-cloudy-night':
        // case 'partly-cloudy-day':
        // case 'partly-cloudy':
        //     return scatteredCloudyColor;
        // case 'cloudy':
        // case 'fog':
        //     return cloudyColor;
        // case 'rain':
        //     return rainColor;
        // case 'snow':
        //     return snowColor;
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
    'wi-moon-waxing-crescent-1',
    'wi-moon-waxing-crescent-2',
    'wi-moon-waxing-crescent-3',
    'wi-moon-waxing-crescent-4',
    'wi-moon-waxing-crescent-5',
    'wi-moon-waxing-crescent-6',
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
    'wi-moon-third-quarter',
    'wi-moon-waning-crescent-1',
    'wi-moon-waning-crescent-2',
    'wi-moon-waning-crescent-3',
    'wi-moon-waning-crescent-4',
    'wi-moon-waning-crescent-5',
    'wi-moon-waning-crescent-6',
    'wi-moon-new',
];

const windIcons = [
    'wi-wind-beaufort-0',
    'wi-wind-beaufort-1',
    'wi-wind-beaufort-2',
    'wi-wind-beaufort-3',
    'wi-wind-beaufort-4',
    'wi-wind-beaufort-5',
    'wi-wind-beaufort-6',
    'wi-wind-beaufort-7',
    'wi-wind-beaufort-8',
    'wi-wind-beaufort-9',
    'wi-wind-beaufort-10',
    'wi-wind-beaufort-11',
    'wi-wind-beaufort-12',
];

const ccMoonIcons = {
    new_moon: 'wi-moon-new',
    new: 'wi-moon-new',
    waxing_crescent: 'wi-moon-waxing-crescent-4',
    first_quarter: 'wi-moon-first-quarter',
    waxing_gibbous: 'wi-moon-waxing-gibbous-4',
    full: 'wi-moon-full',
    waning_gibbous: 'wi-moon-waxing-gibbous-4',
    third_quarter: 'wi-moon-third-quarter',
    waning_crescent: 'wi-moon-waning-crescent-4',
    last_quarter: 'wi-moon-first-quarter',
};

const new_moon = new Date(1970, 0, 7, 20, 35, 0).valueOf();

export function getMoonPhase(date: Date){ // Gets the current Julian date
    const lp = 2551443;
    const now = new Date(date.getFullYear(),date.getMonth()-1,date.getDate(),20,35,0);
    const phase = ((now.getTime() - new_moon)/1000) % lp;
    return (Math.floor(phase /(24*3600)) + 1);
}
export function moonIcon(moonPhase: number) {
    return moonIcons[moonPhase];
}
export function ccMoonIcon(moonPhase: string) {
    return ccMoonIcons[moonPhase];
}

export function windBeaufortIcon(windSpeed) {
    let beaufortLevel = 0;
    if (windSpeed >= 118) {
        beaufortLevel = 12;
    } else if (windSpeed >= 103) {
        beaufortLevel = 11;
    } else if (windSpeed >= 89) {
        beaufortLevel = 10;
    } else if (windSpeed >= 75) {
        beaufortLevel = 9;
    } else if (windSpeed >= 62) {
        beaufortLevel = 8;
    } else if (windSpeed >= 50) {
        beaufortLevel = 7;
    } else if (windSpeed >= 39) {
        beaufortLevel = 6;
    } else if (windSpeed >= 29) {
        beaufortLevel = 5;
    } else if (windSpeed >= 20) {
        beaufortLevel = 4;
    } else if (windSpeed >= 12) {
        beaufortLevel = 3;
    } else if (windSpeed >= 6) {
        beaufortLevel = 2;
    } else if (windSpeed >= 2) {
        beaufortLevel = 1;
    }
    return windIcons[beaufortLevel];
}
