import { Color } from '@nativescript/core';
import { getMoonIllumination } from 'suncalc';
import { iconService } from '~/services/icon';
import { CommonAirQualityData, CommonWeatherData, Currently, DailyData, Hourly } from '~/services/providers/weather';
import { PROP_TO_UNIT, UNITS, WeatherProps } from '~/services/weatherData';
import { cloudyColor, imperialUnits, metricDecimalTemp, rainColor, snowColor, sunnyColor } from '~/variables';
import { formatDate } from './locale';

export function kelvinToCelsius(kelvinTemp) {
    return kelvinTemp - 273.15;
}

function celciusToFahrenheit(kelvinTemp) {
    return (9 * kelvinTemp) / 5 + 32;
}

export function toImperialUnit(unit: UNITS, imperial = imperialUnits) {
    if (imperial === false) {
        return unit;
    }
    switch (unit) {
        case UNITS.MM:
        case UNITS.CM:
            return 'in';
        case UNITS.Distance:
            return 'ft';
        case UNITS.DistanceKm:
            return 'm';
        case UNITS.Speed:
            return 'mph';
        case UNITS.SpeedM:
            return 'ft/h';
        default:
            return unit;
    }
}
export function convertValueToUnit(value: any, unit: UNITS, options: { round?: boolean; roundedTo05?: boolean } = {}): [number, string] {
    if (value === undefined || value === null) {
        return [null, unit];
    }
    const round = options.round ?? true;
    switch (unit) {
        // case UNITS.kPa:
        //     return [(value / 10).toFixed(), 'kPa'];
        // case UNITS.hPa:
        //     return [value.toFixed(), 'hPa'];
        // case UNITS.MMHg:
        //     return [(value * 0.750061561303).toFixed(), 'mm Hg'];
        // case UNITS.InchHg:
        //     return [(value * 0.0295299830714).toFixed(), 'in Hg'];
        case UNITS.Percent:
        case UNITS.UV:
            return [round ? Math.round(value) : value, unit];
        case UNITS.CM:
        case UNITS.MM:
            let digits = 10;
            if (imperialUnits) {
                digits = 100;
                value *= 0.03937008; // to in
            } else if (unit === UNITS.CM) {
                value /= 10;
                if (value < 0.1) {
                    unit = UNITS.MM;
                    value *= 10;
                }
            }
            return [round ? Math.round(value * digits) / digits : value, toImperialUnit(unit, imperialUnits)];
        case UNITS.Celcius:
            if (imperialUnits) {
                value = celciusToFahrenheit(value);
            }
            return [metricDecimalTemp ? Math.round(value * 10) / 10 : round ? Math.round(value) : value, unit];
        case UNITS.Date:
            return [formatDate(value, 'L LT'), ''];

        case UNITS.SpeedM:
        case UNITS.Distance:
            if (imperialUnits) {
                value *= 3.28084; // to feet
            }
            return [Math.round(value), toImperialUnit(unit, imperialUnits)];
        case UNITS.DistanceKm:
            if (imperialUnits) {
                value *= 3.28084; // to feet
                if (value < 5280) {
                    return [round ? Math.round(value) : value, toImperialUnit(UNITS.Distance, imperialUnits)];
                } else if (value > 528000) {
                    value /= 5280;
                    return [round ? Math.round(value) : value, toImperialUnit(unit, imperialUnits)];
                } else {
                    value /= 5280;
                    return [round ? Math.round(value * 10) / 10 : value, toImperialUnit(unit, imperialUnits)];
                }
            } else {
                if (value < 1000) {
                    return [round ? Math.round(value) : value, UNITS.Distance];
                } else if (value > 100000) {
                    value /= 1000;
                    return [round ? Math.round(value) : value, unit];
                } else {
                    value /= 1000;
                    return [round ? Math.round(value * 10) / 10 : value, unit];
                }
            }

        case UNITS.Speed:
            if (imperialUnits) {
                value *= 0.6213712; // to mph
            }
            // if (value < 100) {
            //     return [value.toFixed(1), unit];
            // } else {
            // if > 100 we still need to send a . at the end...
            if (options.roundedTo05 === true) {
                return [((Math.round(value * 2) / 2) * 10) / 10, toImperialUnit(unit, imperialUnits)];
            }
            return [round ? Math.round(value) : value, toImperialUnit(unit, imperialUnits)];
        // }
        default:
            return [round ? Math.round(value) : value, toImperialUnit(unit, imperialUnits)];
    }
}

export function convertWeatherValueToUnit(item: CommonWeatherData, key: string, options?: { prefix?: string; join?: string; unitScale?: number; roundedTo05?: boolean; round?: boolean }) {
    return convertValueToUnit(item[key], PROP_TO_UNIT[key], options);
}
export function formatWeatherValue(item: CommonWeatherData, key: string, options?: { prefix?: string; join?: string; unitScale?: number; roundedTo05?: boolean }) {
    if (key === WeatherProps.iconId) {
        return iconService.getIcon(item.iconId, item.isDay, false);
    }
    return formatValueToUnit(item[key], PROP_TO_UNIT[key], options);
}

export function formatValueToUnit(value: any, unit: UNITS, options: { prefix?: string; join?: string; unitScale?: number; roundedTo05?: boolean } = {}) {
    if (unit === UNITS.Celcius) {
        options.join ??= '';
    } else {
        options.join ??= ' ';
    }
    const array = convertValueToUnit(value, unit, options);
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

// export function colorFromTempC(tempC) {
//     let a = (tempC + 0) / 60;
//     a = a < 0 ? 0 : a > 1 ? 1 : a;

//     // Scrunch the green/cyan range in the middle
//     // const sign = a < 0.5 ? -1 : 1;
//     // a = sign * Math.pow(2 * Math.abs(a - .5), .35)/2 + .5;

//     // Linear interpolation between the cold and hot
//     const h0 = 179;
//     const h1 = -190;
//     const h = h0 * (1 - a) + h1 * a;
//     return Color('hsl(' + [h, '75%', '40%'] + ')').toHexString();
// }
export function colorForUV(uvIndex) {
    if (uvIndex >= 11) {
        return '#9E47CC';
    } else if (uvIndex >= 8) {
        return '#F55023';
    } else if (uvIndex >= 6) {
        return '#FE8F00';
    } else if (uvIndex >= 3) {
        return '#FFBC03';
    } else {
        return '#9BC600';
    }
}

export function colorForAqi(uvIndex) {
    if (uvIndex >= 100) {
        return '#7d2181';
    } else if (uvIndex >= 80) {
        return '#ec2c45';
    } else if (uvIndex >= 60) {
        return '#f38725';
    } else if (uvIndex >= 40) {
        return '#f9cc33';
    } else if (uvIndex >= 20) {
        return '#c5e173';
    } else {
        return '#7bd878';
    }
}

// export function colorForIcon(icon, time, sunrise, sunset) {
//     // console.log('colorForIcon', icon);
//     switch (icon) {
//         case 'clear-night':
//             return nightColor;
//         case 'clear-day':
//             return sunnyColor;
//         // break;
//         // return cloudyColor;
//         // break;
//         // case 'partly-cloudy-night':
//         // case 'partly-cloudy-day':
//         // case 'partly-cloudy':
//         //     return scatteredCloudyColor;
//         // case 'cloudy':
//         // case 'fog':
//         //     return cloudyColor;
//         // case 'rain':
//         //     return rainColor;
//         // case 'snow':
//         //     return snowColor;
//         default:
//             if (time > sunset || time < sunrise) {
//                 return nightColor;
//             } else {
//                 return sunnyColor;
//             }
//     }
// }

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
    'wi-moon-new'
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
    'wi-wind-beaufort-12'
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
    last_quarter: 'wi-moon-first-quarter'
};

// const new_moon = new Date(1970, 0, 7, 20, 35, 0).valueOf();

// const MINUTES_IN_DAY = 24 * 60;
// const SECONDS_IN_DAY = MINUTES_IN_DAY * 60;
// const SYNODIC_MONTH = 29.530588853;
// function gregorianToJulian(year, month, day, hour, minute, second, utcOffset) {
//     if (month <= 2) {
//         year -= 1;
//         month += 12;
//     }

//     const A = Math.floor(year / 100);
//     const B = 2 - A + Math.floor(A / 4);
//     const jDay = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
//     const jTime = (hour * (60 * 60) + minute * 60 + second) / SECONDS_IN_DAY;

//     return jDay + jTime - utcOffset / 24;
// }
// function calculateMoon(year, month, day, hours, minutes, seconds, utcOffset = 0) {
//     const julianNewMoonReference = gregorianToJulian(2000, 1, 6, 18, 14, 0, 0); //Lunation Number 18:14 UTC, January 6, 2000
//     const julianCalculate = gregorianToJulian(year, month, day, hours, minutes, seconds, utcOffset);

//     const age = (julianCalculate - julianNewMoonReference) % SYNODIC_MONTH;
//     return Math.floor(age);
// }

export function getMoonPhase(date: Date) {
    const illumination = getMoonIllumination(date);
    // const phase = calculateMoon(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
    return Math.round(illumination.phase * 28);
}
export function moonIcon(moonPhase: number) {
    return moonIcons[moonPhase % 29];
}
export function ccMoonIcon(moonPhase: string) {
    return ccMoonIcons[moonPhase];
}

export function windBeaufortIcon(windSpeed) {
    if (windSpeed < 29) {
        return null;
    }
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
        // } else if (windSpeed >= 20) {
        // beaufortLevel = 4;
        // } else if (windSpeed >= 12) {
        //     beaufortLevel = 3;
        // } else if (windSpeed >= 6) {
        //     beaufortLevel = 2;
        // } else if (windSpeed >= 2) {
        //     beaufortLevel = 1;
    }
    return windIcons[beaufortLevel];
}

const cardinals = ['app-wind_0', 'app-wind_1', 'app-wind_2', 'app-wind_3', 'app-wind_4', 'app-wind_5', 'app-wind_6', 'app-wind_7', 'app-wind_0'];
export function windIcon(degrees) {
    if (degrees === -1) {
        return 'app-refresh';
    }
    return cardinals[Math.round((degrees % 360) / 45)];
}

export enum WeatherDataType {
    DAILY,
    HOURLY,
    CURRENT
}

export function aqiDataIconColors<T extends CommonAirQualityData>(d: T) {
    d.aqiColor = colorForAqi(d.aqi);
    return d;
}
export function weatherDataIconColors<T extends DailyData | Currently | Hourly>(d: T, type: WeatherDataType, coord: { lat: number; lon: number }, rain = 0, snow = 0) {
    // if (type !== WeatherDataType.CURRENT) {
    // d.color = Color.mix(color, cloudyColor, d.cloudCover).hex;
    const cloudCover = d.cloudCover ? Math.max(d.cloudCover, 0) : 0;
    if (snow || rain || d.precipAccumulation) {
        d.precipColor = rainColor.hex;
        d.precipIcon = 'wi-raindrop';
        d.precipUnit = UNITS.MM;
        let ratio;
        if (snow > rain) {
            ratio = rain / snow;
        } else {
            ratio = snow / rain;
        }
        // we need to compare snow and rain, but sometimes it is not "normal"
        // and we get rain with sub 0 temperatures...
        if (snow && rain && ratio > 0.3 && (d.temperature || 0) > 0) {
            d.precipColor = Color.mix(snowColor, rainColor, 50);
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, cloudCover), snowColor, Math.min(d.precipAccumulation * 10, 100)).hex;
            d.mixedRainSnow = true;
            d.precipIcon = 'app-rain-snow';
            d.precipFontUseApp = true;
        } else if (snow && (snow > rain || (d.temperature || 0) < 0)) {
            d.precipColor = snowColor.hex;
            d.precipIcon = 'wi-snowflake-cold';
            d.precipUnit = UNITS.CM;
            d.precipShowSnow = true;
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, cloudCover), snowColor, Math.min(d.precipAccumulation * 10, 100)).hex;
        } else if (rain) {
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, cloudCover), rainColor, Math.min(d.precipAccumulation * 10, 100)).hex;
        } else {
            // DEV_LOG && console.log('not possible?', rain, snow, d);
            d.color = Color.mix(Color.mix(sunnyColor, cloudyColor, cloudCover), rainColor, Math.min(d.precipAccumulation * 10, 100)).hex;
        }
    } else {
        d.color = Color.mix(sunnyColor, cloudyColor, cloudCover ?? 0).hex;
    }
    // }
    if (d['uvIndex'] !== undefined) {
        d['uvIndexColor'] = colorForUV(d['uvIndex']);
    }
    if (type !== WeatherDataType.HOURLY) {
        // we ask the moon phase at around 8pm so that it corresponds to the day
        const moonPhase = getMoonPhase(new Date(d.time + 20 * 3600000));
        d['moonPerc'] = Math.round((28 / moonPhase) * 100);
        d['moonIcon'] = moonIcon(moonPhase);
    }
    if (cloudCover) {
        d.cloudColor = cloudyColor.setAlpha(cloudCover * 2.55).hex;
    }

    const wBIcon = windBeaufortIcon(d.windSpeed);
    if (wBIcon) {
        d.windBeaufortIcon = wBIcon;
    }
    d.windIcon = windIcon(d.windBearing);
    return d;
}

export function formatAddress(address, part = 0) {
    let result = '';
    // if ((properties.layer === 'housenumber' || properties.name || properties.osm_value || properties.osm_key || properties.class) && address && address.houseNumber) {
    if (address && address.houseNumber) {
        result += address.houseNumber + ' ';
    }
    if (address.street) {
        result += address.street + ' ';
    }

    if (part === 1 && result.length > 0) {
        return result;
    }
    if (part === 2) {
        if (result.length === 0) {
            return undefined;
        } else {
            result = '';
        }
    }
    // if (address.postcode) {
    //     result += address.postcode + ' ';
    // }
    if (address.city) {
        result += address.city;
        if (address.county && address.county !== address.city) {
            result += '(' + address.county + ')';
        }
        result += ' ';
    }
    // if (address.county) {
    //     result += address.county + ' ';
    // }
    // if (address.state) {
    //     result += address.state + ' ';
    // }
    return result.trim();
}
