import { titlecase } from '@nativescript-community/l';
import { getString } from '@nativescript/core/application-settings';
import dayjs from 'dayjs';
import { WeatherDataType, weatherDataIconColors } from '~/helpers/formatter';
import { lang } from '~/helpers/locale';
import { WeatherLocation, request } from './api';
import { Coord, Dailyforecast, Forecast, MFCurrent, MFForecastResult, MFMinutely, MFWarnings, Probabilityforecast } from './meteofrance';

const mfApiKey = getString('mfApiKey', MF_DEFAULT_KEY);

export interface MFParams extends Partial<Coord> {
    domain?: string;
}

function round5(t) {
    return 5 * Math.ceil(t / 5);
}
const SixHours = 6 * 3600;
const ThirtyHours = 30 * 3600;
function getDaily(weatherLocation: WeatherLocation, hourly: Hourly[], hourlyForecast: Forecast[], dailyForecast: Dailyforecast) {
    let precipitationTotal = 0;
    const probPrecipitationTotal = { count: 0, total: 0 };
    const probRainPrecipitationTotal = { count: 0, total: 0 };
    const probSnowPrecipitationTotal = { count: 0, total: 0 };
    const rainSnowLimitTotal = { count: 0, total: 0 };
    const isoTotal = { count: 0, total: 0 };

    let precipProbability = 0;

    const dayStartTime = dayjs(dailyForecast.dt * 1000)
        .startOf('d')
        .valueOf();
    const dayEndTime = dayjs(dailyForecast.dt * 1000)
        .endOf('d')
        .valueOf();
    for (const hour of hourly) {
        const time = hour.time;
        if (time >= dayStartTime && time < dayEndTime) {
            // Precipitation
            if (hour.precipAccumulation) {
                precipitationTotal += hour.precipAccumulation;
                // Precipitation probability
                if (hour.precipProbability) {
                    precipProbability = Math.max(precipProbability, hour.precipProbability);
                    probPrecipitationTotal.count++;
                    probPrecipitationTotal.total += hour.precipProbability;
                }
                if (hour.precipProbabilities) {
                    if (hour.precipProbabilities.rain) {
                        probRainPrecipitationTotal.count++;
                        probRainPrecipitationTotal.total += hour.precipProbabilities.rain;
                    }
                    if (hour.precipProbabilities.snow) {
                        probSnowPrecipitationTotal.count++;
                        probSnowPrecipitationTotal.total += hour.precipProbabilities.snow;
                    }
                }
            }

            if (hour.rainSnowLimit) {
                rainSnowLimitTotal.count++;
                rainSnowLimitTotal.total += hour.rainSnowLimit;
            }
            if (hour.iso) {
                isoTotal.count++;
                isoTotal.total += hour.iso;
            }
        }
    }

    const cloudCover = { count: 0, total: 0 };
    const windSpeed = { count: 0, total: 0 };
    const windDegree = { count: 0, total: 0 };
    let windGust = null;

    for (const hourForecast of hourlyForecast) {
        const time = hourForecast.dt * 1000;
        if (time >= dayStartTime && time < dayEndTime) {
            cloudCover.count++;
            cloudCover.total += hourForecast.clouds;
            if (hourForecast.wind.speed) {
                windSpeed.count++;
                windSpeed.total += hourForecast.wind.speed;
            }
            if (hourForecast.wind.direction !== 'Variable') {
                windDegree.count++;
                windDegree.total += hourForecast.wind.direction;
            }

            if (windGust == null || hourForecast.wind.gust > windGust) {
                windGust = hourForecast.wind.gust;
            }
        }
    }
    const d = {
        time: dayStartTime,
        description: dailyForecast.weather12H == null ? '' : dailyForecast.weather12H.desc,
        icon: dailyForecast.weather12H == null ? '01d' : convertMFICon(dailyForecast.weather12H.icon),
        temperatureMax: Math.round(dailyForecast.T.max),
        temperatureMin: Math.round(dailyForecast.T.min),
        humidity: (dailyForecast.humidity.max + dailyForecast.humidity.min) / 2,
        uvIndex: dailyForecast.uv,
        windGust: windGust * 3.6,
        windSpeed: Math.round((windSpeed.total / (windSpeed.count || 1)) * 3.6),
        windBearing: windDegree.count ? Math.round((windDegree.total / (windDegree.count)) * 3.6) : -1,
        cloudCover: Math.round(cloudCover.total / (cloudCover.count || 1)),
        precipAccumulation: Math.max(precipitationTotal, dailyForecast.precipitation['24h']),
        precipProbability,
        // precipProbability: Math.round(probPrecipitationTotal.total / (probPrecipitationTotal.count || 1)),
        sunriseTime: dailyForecast.sun.rise * 1000,
        sunsetTime: dailyForecast.sun.set * 1000
    } as DailyData;

    if (rainSnowLimitTotal.count > 0) {
        d.rainSnowLimit = Math.round(rainSnowLimitTotal.total / rainSnowLimitTotal.count);
    }
    if (isoTotal.count > 0) {
        d.iso = Math.round(isoTotal.total / isoTotal.count);
    }

    const propRain = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
    const propSnow = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
    weatherDataIconColors(d, WeatherDataType.DAILY, weatherLocation.coord, propRain > propSnow ? d.precipAccumulation : 0, propRain < propSnow ? d.precipAccumulation : 0);
    d.hourly = [];
    return d;
    // return new HalfDay(
    //     dailyForecast.weather12H == null ? WeatherCode.CLEAR : getWeatherCode(dailyForecast.weather12H.icon),
    //     new Temperature(temp, null, null, null, tempWindChill, null, null),
    //     new Precipitation(precipitationTotal, null, precipitationRain, precipitationSnow, null),
    //     new PrecipitationProbability(probPrecipitationTotal, null, probPrecipitationRain, probPrecipitationSnow, probPrecipitationIce),
    //     new PrecipitationDuration(null, null, null, null, null),
    //     new Wind(windDirection, windDegree, windSpeed, windLevel),
    //     cloudCover
    // );
}

function convertMFICon(icon: string) {
    const night = icon.slice(-1) === 'n' ? 'n' : 'd';
    switch (parseInt(icon.replace(/^\D+/g, ''), 10)) {
        case 1:
            return '01' + night;
        case 2:
            return '02' + night;
        case 3:
            return '04' + night;
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
            return '50' + night;
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
            return '10' + night;
        case 16:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            return '11' + night;
        case 19:
        case 20:
            return '09' + night;
        case 17:
        case 18:
        case 21:
        case 22:
        case 23:
            return '13' + night;
        default:
            return '01' + night;
    }
}

function getHourlyPrecipitationProbability(probabilityForecastResult: Probabilityforecast[], dt: number) {
    let rainProbability = 0;
    let snowProbability = 0;
    let iceProbability = 0;

    let probabilityForecast: Probabilityforecast;
    for (let i = 0; i < probabilityForecastResult.length; i++) {
        probabilityForecast = probabilityForecastResult[i];
        /*
         * Probablity are given every 3 hours, sometimes every 6 hours.
         * Sometimes every 3 hour-schedule give 3 hours probability AND 6 hours probability,
         * sometimes only one of them
         * It's not very clear but we take all hours in order.
         */
        if (probabilityForecast.dt === dt || probabilityForecast.dt - 3600 === dt || probabilityForecast.dt - 3600 * 2 === dt) {
            if (probabilityForecast.rain['3h'] != null) {
                rainProbability = probabilityForecast.rain['3h'];
            } else if (probabilityForecast.rain['6h'] != null) {
                rainProbability = probabilityForecast.rain['6h'];
            }
            if (probabilityForecast.snow['3h'] != null) {
                snowProbability = probabilityForecast.snow['3h'];
            } else if (probabilityForecast.snow['6h'] != null) {
                snowProbability = probabilityForecast.snow['6h'];
            }
            iceProbability = probabilityForecast.freezing;
        } else if (probabilityForecast.dt - 3600 * 3 === dt || probabilityForecast.dt - 3600 * 4 === dt || probabilityForecast.dt - 3600 * 5 === dt) {
            /*
             * If it's found as part of the "6 hour schedule" and we find later a "3 hour schedule"
             * the "3 hour schedule" will overwrite the "6 hour schedule" below with the above
             */
            if (probabilityForecast.rain['6h'] != null) {
                rainProbability = probabilityForecast.rain['6h'];
            }
            if (probabilityForecast.snow['6h'] != null) {
                snowProbability = probabilityForecast.snow['6h'];
            }
            iceProbability = probabilityForecast.freezing;
        }
        if (rainProbability || snowProbability) {
            break;
        }
    }

    return {
        rain: rainProbability,
        snow: snowProbability,
        ice: iceProbability
    };
}

export async function fetchMF<T = any>(apiName: string, queryParams: MFParams = {}) {
    return request<T>({
        url: `https://webservice.meteofrance.com/${apiName}`,
        method: 'GET',
        queryParams: {
            lang,
            token: mfApiKey,
            ...queryParams
        }
    });
}

export async function getMFWeather(weatherLocation: WeatherLocation) {
    const coords = weatherLocation.coord;
    const forecast = await fetchMF<MFForecastResult>('forecast', coords);
    let rain: MFMinutely;
    let current: MFCurrent;
    let warnings: MFWarnings;
    if (forecast.position.dept) {
        // we are in france we can get more
        const result = await Promise.all([
            fetchMF<MFMinutely>('rain', coords).catch((err) => null),
            fetchMF<MFCurrent>('observation/gridded', coords).catch((err) => null),
            fetchMF<MFWarnings>('warning/full', {
                ...coords,
                domain: forecast.position.dept
            }).catch((err) => null)
        ]);
        rain = result[0];
        current = result[1];
        warnings = result[2];
    }
    // console.log('forecast', JSON.stringify(forecast));
    // console.log('rain', JSON.stringify(rain));
    // console.log('current', JSON.stringify(current));
    // console.log('warnings', JSON.stringify(warnings));

    const hourlyData = forecast.forecast?.map((data) => {
        const d = {} as Hourly;
        d.time = data.dt * 1000;
        d.icon = convertMFICon(data.weather.icon);
        d.description = titlecase(data.weather.desc);
        d.temperature = Math.round(data.T.value);
        d.feelTemperature = Math.round(data.T.windchill);

        d.windBearing = data.wind.direction === 'Variable' ? -1 : data.wind.direction;
        d.precipAccumulation = d.precipAccumulation = (data.snow['1h'] || 0) + (data.rain['1h'] || 0);

        const probabilities = getHourlyPrecipitationProbability(forecast.probability_forecast, data.dt);
        d.precipProbability = Math.max(probabilities.rain, probabilities.snow, probabilities.ice) / 100;
        if (d.precipAccumulation && d.precipProbability === 0) {
            d.precipProbability = -1;
        }
        d.precipProbabilities = probabilities;
        d.cloudCover = data.clouds;
        d.humidity = data.humidity;
        d.windGust = data.wind.gust * 3.6;
        d.windSpeed = data.wind.speed * 3.6;
        d.iso = data.iso0;
        if (typeof data['rain snow limit'] === 'number') {
            d.rainSnowLimit = data['rain snow limit'];
        }
        // d.pressure = data.pressure;
        return weatherDataIconColors(d, WeatherDataType.HOURLY, weatherLocation.coord, data.rain?.['1h'], data.snow?.['1h']);
    });
    const r = {
        currently: current
            ? weatherDataIconColors(
                  {
                      time: current.updated_on * 1000,
                      temperature: Math.round(current.observation.T),
                      windSpeed: current.observation.wind.speed,
                      windGust: current.observation.wind.gust,
                      windBearing: current.observation.wind.direction,
                      icon: convertMFICon(current.observation.weather.icon),
                      description: titlecase(current.observation.weather.desc)
                  } as Currently,
                  WeatherDataType.CURRENT,
                  coords
              )
            : {},
        daily: {
            data: forecast.daily_forecast.map((data) => getDaily(weatherLocation, hourlyData, forecast.forecast, data))
        },
        minutely: {
            data:
                rain?.forecast.map(
                    (h) =>
                        ({
                            intensity: h.rain - 1,
                            time: h.dt * 1000
                        } as MinutelyData)
                ) || []
        },
        alerts: warnings ? [] : []
    } as WeatherData;
    r.daily.data[0].hourly = hourlyData;
    // console.log(' r.daily', JSON.stringify(r.daily));
    return r;
}
