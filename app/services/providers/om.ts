import { titlecase } from '@nativescript-community/l';
import { getString } from '@nativescript/core/application-settings';
import dayjs from 'dayjs';
import { WeatherDataType, weatherDataIconColors } from '~/helpers/formatter';
import { l, lang } from '~/helpers/locale';
import { WeatherLocation, request } from '../api';
import { Forecast } from './openmeteo';
import { GetTimesResult, getTimes } from 'suncalc';
import { ApplicationSettings } from '@nativescript/core';
import { WeatherProvider } from './weatherprovider';
import { Currently, DailyData, Hourly, MinutelyData, WeatherData } from './weather';
import { NB_DAYS_FORECAST, NB_HOURS_FORECAST, NB_MINUTES_FORECAST } from '~/helpers/constants';
// import { Coord, Dailyforecast, Forecast, MFCurrent, MFForecastResult, MFMinutely, MFWarnings, Probabilityforecast } from './meteofrance';

// const mfApiKey = getString('mfApiKey', MF_DEFAULT_KEY);

export const OM_MODELS = {
    best_match: 'Best match',
    ecmwf_ifs04: 'ECMWF IFS 0.4°',
    ecmwf_ifs025: 'ECMWF IFS 0.25°',
    cma_grapes_global: 'CMA GRAPES Global',
    bom_access_global: 'BOM Access Global',
    metno_nordic: 'MET Norway Nordic',
    gfs_seamless: 'GFS Seamless',
    gfs_global: 'GFS Global',
    gfs_hrrr: 'GFS HRRR',
    icon_seamless: 'DWD Icon Seamless',
    icon_global: 'DWD Icon Global',
    icon_eu: 'DWD Icon EU',
    icon_d2: 'DWD Icon D2',
    gem_seamless: 'GEM Seamless',
    gem_global: 'GEM Global',
    gem_regional: 'GEM Regional',
    gem_hrdps_continental: 'GEM HRDPS Continental',
    meteofrance_seamless: 'MeteoFrance Seamless',
    meteofrance_arpege_world: 'MeteoFrance Arpege World',
    meteofrance_arpege_europe: 'MeteoFrance Arpege Europe',
    meteofrance_arome_france: ' MeteoFrance Arome France',
    meteofrance_arome_france_hd: 'MeteoFrance Arome France HD',
    arpae_cosmo_seamless: 'ARPAE Seamless',
    arpae_cosmo_2i: 'ARPAE COSMO 2I',
    arpae_cosmo_2i_ruc: 'ARPAE COSMO 2I RUC',
    arpae_cosmo_5m: 'ARPAE COSMO 5M'
};

export class OMProvider extends WeatherProvider {
    private static readonly weatherCodeDescription = {
        0: l('clear'),
        1: l('mostly_clear'),
        2: l('partly_cloudy'),
        3: l('cloudy'),
        45: l('fog'),
        48: l('freezing_fog'),
        51: l('light_drizzle'),
        53: l('drizzle'),
        55: l('heavy_drizzle'),
        56: l('light_freezing_drizzle'),
        57: l('freezing_drizzle'),
        61: l('light_rain'),
        63: l('rain'),
        65: l('heavy_rain'),
        66: l('light_freezing_rain'),
        67: l('freezing_rain'),
        71: l('light_snow'),
        73: l('snow'),
        75: l('heavy_snow'),
        77: l('snow_grains'),
        80: l('light_rain_shower'),
        81: l('rain_shower'),
        82: l('heavy_rain_shower'),
        85: l('snow_shower'),
        86: l('heavy_snow_shower'),
        95: l('thunderstorm'),
        96: l('hailstorm'),
        99: l('heavy_hailstorm')
    };

    private convertWeatherCodeToIcon(code: number, is_day: number | boolean = 1) {
        // const actualCode = code % 100;
        const night = is_day ? 'd' : 'n';
        switch (code) {
            case 0:
            case 1:
                return '01' + night;
            case 2:
                return '02' + night;
            case 3:
                return '04' + night;
            case 45:
            case 48:
                return '50' + night;
            case 51:
            case 53:
            case 55:
            case 56:
            case 57:
            case 80:
            case 81:
            case 82:
            case 85:
            case 86:
                return '09' + night;
            case 61:
            case 63:
            case 65:
            case 66:
            case 67:
                return '10' + night;
            case 71:
            case 73:
            case 75:
            case 77:
                return '13' + night;
            case 95:
            case 96:
            case 99:
                return '11' + night;
        }
    }

    // https://api.open-meteo.com/v1/forecast?latitude=45.18&longitude=5.71&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weathercode,cloudcover,cloudcover_low,cloudcover_mid,cloudcover_high,windspeed_10m,winddirection_10m,windgusts_10m,uv_index,uv_index_clear_sky&models=best_match&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant&timeformat=unixtime&forecast_days=14&timezone=auto
    private async fetch<T = any>(apiName: string = 'forecast', queryParams: OMParams = {}, preferedModel = ApplicationSettings.getString('open_meteo_prefered_model', 'best_match')) {
        let models = 'best_match';
        if (preferedModel !== 'best_match') {
            models += ',' + preferedModel;
        }
        const feelsLikeTemperatures = ApplicationSettings.getBoolean('feels_like_temperatures', false);
        const forecast_days = ApplicationSettings.getNumber('forecast_nb_days', NB_DAYS_FORECAST) + 1;
        const forecast_hours = ApplicationSettings.getNumber('forecast_nb_hours', NB_HOURS_FORECAST) + 2;
        const forecast_minutely_15 = ApplicationSettings.getNumber('forecast_nb_minutes', NB_MINUTES_FORECAST) / 15;
        return request<T>({
            url: `https://api.open-meteo.com/v1/${apiName}`,
            method: 'GET',
            queryParams: {
                forecast_days,
                forecast_hours,
                forecast_minutely_15,
                hourly:
                    'precipitation_probability,precipitation,snow_depth,weathercode,cloudcover,windspeed_10m,winddirection_10m,windgusts_10m,is_day,freezinglevel_height,snow_depth' +
                    (feelsLikeTemperatures ? ',apparent_temperature' : ',temperature_2m'),
                current: 'weathercode,is_day,cloudcover,windspeed_10m,winddirection_10m,windgusts_10m' + (feelsLikeTemperatures ? ',apparent_temperature' : ',temperature_2m'),
                minutely_15: 'precipitation',
                // models: 'best_match',
                // models: 'meteofrance_seamless',
                daily:
                    'weathercode,uv_index_max,precipitation_sum,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,rain_sum,snowfall_sum' +
                    (feelsLikeTemperatures ? ',apparent_temperature_max,apparent_temperature_min' : ',temperature_2m_max,temperature_2m_min'),
                models,
                timeformat: 'unixtime',
                timezone: 'Africa/Accra', // we force UTC to get utc timestamps
                ...queryParams
            }
        });
    }

    private getDataArray(object: any, key: string, model: string = 'best_match') {
        if (model !== 'best_match') {
            return object[key + '_' + model] || object[key + '_best_match'] || object[key];
        } else {
            return object[key];
        }
    }

    private getMixedDataArray(object: any, key: string, model: string = 'best_match') {
        const result = (object[key + '_best_match'] || object[key]).slice();
        const modelObj = object[key + '_' + model];
        if (modelObj) {
            for (let index = 0; index < Math.min(modelObj.length, result.length); index++) {
                const element = modelObj[index];
                if (element) {
                    result[index] = element;
                }
            }
        }
        return result;
    }

    public override async getWeather(weatherLocation: WeatherLocation) {
        const feelsLikeTemperatures = ApplicationSettings.getBoolean('feels_like_temperatures', false);
        const coords = weatherLocation.coord;
        const preferedModel = ApplicationSettings.getString('open_meteo_prefered_model', 'best_match');
        const forecast = await this.fetch<Forecast>('forecast', { latitude: coords.lat, longitude: coords.lon }, preferedModel);
        // console.log('forecast', Object.keys(forecast), Object.keys(forecast.hourly));
        // console.log('rain', JSON.stringify(rain));
        // console.log('current', JSON.stringify(current));
        // console.log('warnings', JSON.stringify(warnings));
        const hourly = forecast.hourly;
        const hourly_weathercodes = this.getMixedDataArray(hourly, 'weathercode', preferedModel);
        let hourlyLastIndex = hourly_weathercodes.findIndex((d) => d === null);
        if (hourlyLastIndex === -1) {
            hourlyLastIndex = hourly_weathercodes.length - 1;
        }
        const hourlyData = hourly.time.slice(0, hourlyLastIndex).map((time, index) => {
            const d = {} as Hourly;
            d.time = time * 1000;
            const code = hourly_weathercodes[index];
            d.icon = this.convertWeatherCodeToIcon(code, this.getDataArray(hourly, 'is_day', preferedModel)[index]);
            d.description = OMProvider.weatherCodeDescription[code];
            d.temperature = this.getDataArray(hourly, feelsLikeTemperatures ? 'apparent_temperature' : 'temperature_2m', preferedModel)[index];
            d.usingFeelsLike = feelsLikeTemperatures;
            d.windBearing = this.getDataArray(hourly, 'winddirection_10m', preferedModel)[index];

            const hasNext = index < hourlyLastIndex;

            const precipitation_probability = this.getDataArray(hourly, 'precipitation_probability', preferedModel);
            if (precipitation_probability && hasNext) {
                d.precipProbability = precipitation_probability[index + 1] || -1;
            }
            const snowfall = this.getDataArray(hourly, 'snowfall', preferedModel);
            if (hasNext && snowfall) {
                d.snowfall = snowfall[index + 1] || -1;
            }

            const precipitation = this.getDataArray(hourly, 'precipitation', preferedModel);
            if (hasNext && precipitation) {
                d.precipAccumulation = precipitation[index + 1] ?? -1;
            }

            d.cloudCover = this.getDataArray(hourly, 'cloudcover', preferedModel)[index];
            d.windSpeed = this.getDataArray(hourly, 'windspeed_10m', preferedModel)[index];

            const windgusts_10m = this.getDataArray(hourly, 'windgusts_10m', preferedModel);
            if (hasNext && windgusts_10m) {
                d.windGust = windgusts_10m[index + 1];
            }
            const snow_depth = this.getDataArray(hourly, 'snow_depth', preferedModel);
            if (snow_depth) {
                d.snowDepth = snow_depth[index];
            }
            const freezinglevel_height = this.getDataArray(hourly, 'freezinglevel_height', preferedModel);
            if (freezinglevel_height) {
                d.iso = freezinglevel_height[index];
            }
            // if (typeof data['rain snow limit'] === 'number') {
            //     d.rainSnowLimit = data['rain snow limit'];
            // }
            // d.pressure = data.pressure;
            return weatherDataIconColors(d, WeatherDataType.HOURLY, weatherLocation.coord, hourly.rain?.[index], hourly.snowfall?.[index]);
        });

        const minutely_15 = forecast.minutely_15;
        // minutely data starts at the start of the day!
        const minutelyPrecipitation = this.getDataArray(minutely_15, 'precipitation', preferedModel);
        const minutelyData = minutelyPrecipitation
            ? minutely_15.time.map((time, index) => {
                  const hasNext = index < minutely_15.time.length;
                  const d = {} as MinutelyData;
                  d.time = time * 1000;
                  // for now we only handle precipitation
                  if (hasNext) {
                      const precipitation = minutelyPrecipitation[index + 1] || -1;
                      d.intensity = precipitation >= 1.5 ? 3 : precipitation >= 0.7 ? 2 : precipitation > 0 ? 1 : 0;
                  }
                  return d;
              })
            : undefined;
        const current = forecast.current;
        const daily = forecast.daily;
        const daily_weathercodes = this.getMixedDataArray(daily, 'weathercode', preferedModel);
        const dailyLastIndex = daily_weathercodes.findIndex((d) => d === null);
        const r = {
            currently: current
                ? weatherDataIconColors(
                      {
                          time: current.time * 1000,
                          temperature: feelsLikeTemperatures ? current.apparent_temperature : current.temperature_2m,
                          usingFeelsLike: feelsLikeTemperatures,
                          windSpeed: current.windspeed_10m,
                          cloudCover: current.cloudcover,
                          windBearing: current.winddirection_10m,
                          icon: this.convertWeatherCodeToIcon(current.weathercode, current.is_day),
                          description: OMProvider.weatherCodeDescription[current.weathercode]
                      } as Currently,
                      WeatherDataType.CURRENT,
                      coords
                  )
                : {},
            daily: {
                data: daily.time.slice(0, dailyLastIndex).map((time, index) => {
                    const code = daily_weathercodes[index];
                    const d = {
                        time: time * 1000,
                        description: OMProvider.weatherCodeDescription[code],
                        icon: this.convertWeatherCodeToIcon(code, true),
                        temperatureMax: this.getDataArray(daily, feelsLikeTemperatures ? 'apparent_temperature_max' : 'temperature_2m_max', preferedModel)[index],
                        temperatureMin: this.getDataArray(daily, feelsLikeTemperatures ? 'apparent_temperature_min' : 'temperature_2m_min', preferedModel)[index],
                        usingFeelsLike: feelsLikeTemperatures,
                        // humidity: (dailyForecast.humidity.max + dailyForecast.humidity.min) / 2,
                        uvIndex: Math.ceil(this.getDataArray(daily, 'uv_index_max', preferedModel)?.[index]),
                        windGust: Math.round(this.getDataArray(daily, 'windgusts_10m_max', preferedModel)[index]),
                        windSpeed: Math.round(this.getDataArray(daily, 'windspeed_10m_max', preferedModel)[index]),
                        windBearing: Math.round(this.getDataArray(daily, 'winddirection_10m_dominant', preferedModel)[index]),
                        precipProbability: this.getDataArray(daily, 'precipitation_probability_max', preferedModel)?.[index],
                        precipAccumulation: this.getDataArray(daily, 'precipitation_sum', preferedModel)[index]
                        // cloudCover: Math.round(daily.clou),
                        // sunriseTime: dailyForecast.sun.rise * 1000,
                        // sunsetTime: dailyForecast.sun.set * 1000
                    } as any as DailyData;
                    // if (precipProbability > 0) {
                    //     d.precipProbability = precipProbability;
                    // }
                    // const precipAccumulation = Math.max(precipitationTotal, dailyForecast.precipitation['24h']);
                    // if (precipAccumulation > 0) {
                    //     d.precipAccumulation = precipAccumulation;
                    // }
                    // if (rainSnowLimitTotal.count > 0) {
                    //     d.rainSnowLimit = Math.round(rainSnowLimitTotal.total / rainSnowLimitTotal.count);
                    // }
                    // if (isoTotal.count > 0) {
                    //     d.iso = Math.round(isoTotal.total / isoTotal.count);
                    // }

                    // const propRain = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
                    // const propSnow = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
                    weatherDataIconColors(
                        d,
                        WeatherDataType.DAILY,
                        weatherLocation.coord,
                        this.getDataArray(daily, 'rain_sum', preferedModel)?.[index],
                        this.getDataArray(daily, 'snowfall_sum', preferedModel)?.[index]
                    );
                    d.hourly = [];
                    return d;
                })
            },
            minutely: {
                data: minutelyData
            },
            alerts: []
        } as WeatherData;
        r.daily.data[0].hourly = hourlyData;
        return r;
    }

    private isDay(time: number, lat: number, lon: number) {
        const times = getTimes(new Date(time), lat, lon);
        return time > times.sunrise.valueOf() && time < times.sunsetStart.valueOf();
    }
}

interface OMParams {
    latitude?: number;
    longitude?: number;
}

// function round5(t) {
//     return 5 * Math.ceil(t / 5);
// }
// const SixHours = 6 * 3600;
// const ThirtyHours = 30 * 3600;
// function getDaily(weatherLocation: WeatherLocation, hourly: Hourly[], hourlyForecast: Forecast[], dailyForecast: Dailyforecast) {
//     let precipitationTotal = 0;
//     const probPrecipitationTotal = { count: 0, total: 0 };
//     const probRainPrecipitationTotal = { count: 0, total: 0 };
//     const probSnowPrecipitationTotal = { count: 0, total: 0 };
//     const rainSnowLimitTotal = { count: 0, total: 0 };
//     const isoTotal = { count: 0, total: 0 };

//     let precipProbability = 0;

//     const dayStartTime = dayjs(dailyForecast.dt * 1000)
//         .startOf('d')
//         .valueOf();
//     const dayEndTime = dayjs(dailyForecast.dt * 1000)
//         .endOf('d')
//         .valueOf();
//     for (const hour of hourly) {
//         const time = hour.time;
//         if (time >= dayStartTime && time < dayEndTime) {
//             // Precipitation
//             if (hour.precipAccumulation) {
//                 precipitationTotal += hour.precipAccumulation;
//                 // Precipitation probability
//                 if (hour.precipProbability) {
//                     precipProbability = Math.max(precipProbability, hour.precipProbability);
//                     probPrecipitationTotal.count++;
//                     probPrecipitationTotal.total += hour.precipProbability;
//                 }
//                 if (hour.precipProbabilities) {
//                     if (hour.precipProbabilities.rain) {
//                         probRainPrecipitationTotal.count++;
//                         probRainPrecipitationTotal.total += hour.precipProbabilities.rain;
//                     }
//                     if (hour.precipProbabilities.snow) {
//                         probSnowPrecipitationTotal.count++;
//                         probSnowPrecipitationTotal.total += hour.precipProbabilities.snow;
//                     }
//                 }
//             }

//             if (hour.rainSnowLimit) {
//                 rainSnowLimitTotal.count++;
//                 rainSnowLimitTotal.total += hour.rainSnowLimit;
//             }
//             if (hour.iso) {
//                 isoTotal.count++;
//                 isoTotal.total += hour.iso;
//             }
//         }
//     }

//     const cloudCover = { count: 0, total: 0 };
//     const windSpeed = { count: 0, total: 0 };
//     // const windSpeeds = [];
//     const windDegree = { count: 0, total: 0 };
//     let windGust = null;

//     for (const hourForecast of hourlyForecast) {
//         const time = hourForecast.dt * 1000;
//         if (time >= dayStartTime && time < dayEndTime) {
//             cloudCover.count++;
//             cloudCover.total += hourForecast.clouds;
//             if (hourForecast.wind.speed) {
//                 windSpeed.count++;
//                 windSpeed.total += hourForecast.wind.speed;
//                 // windSpeeds.push(hourForecast.wind.speed);
//             }
//             if (hourForecast.wind.direction !== 'Variable') {
//                 windDegree.count++;
//                 windDegree.total += hourForecast.wind.direction;
//             }

//             if (windGust == null || hourForecast.wind.gust > windGust) {
//                 windGust = hourForecast.wind.gust;
//             }
//         }
//     }
//     // console.log('day:', dayjs(dayStartTime).format('ddd DD/MM'), dayStartTime, dayEndTime, dailyForecast, cloudCover, windSpeed, windSpeeds, windDegree, rainSnowLimitTotal);
//     const d = {
//         time: dayStartTime,
//         description: dailyForecast.weather12H == null ? '' : dailyForecast.weather12H.desc,
//         icon: dailyForecast.weather12H == null ? '01d' : convertMFICon(dailyForecast.weather12H.icon),
//         temperatureMax: Math.round(dailyForecast.T.max),
//         temperatureMin: Math.round(dailyForecast.T.min),
//         humidity: (dailyForecast.humidity.max + dailyForecast.humidity.min) / 2,
//         uvIndex: dailyForecast.uv,
//         windGust: Math.round(windGust * 3.6),
//         windSpeed: windSpeed.count > 1 ? Math.round((windSpeed.total / (windSpeed.count || 1)) * 3.6) : 0,
//         windBearing: windDegree.count > 1 ? Math.round((windDegree.total / windDegree.count) * 3.6) : -1,
//         cloudCover: cloudCover.count > 1 ? Math.round(cloudCover.total / (cloudCover.count || 1)) : -1,
//         sunriseTime: dailyForecast.sun.rise * 1000,
//         sunsetTime: dailyForecast.sun.set * 1000
//     } as DailyData;
//     if (precipProbability > 0) {
//         d.precipProbability = precipProbability;
//     }
//     const precipAccumulation = Math.max(precipitationTotal, dailyForecast.precipitation['24h']);
//     if (precipAccumulation > 0) {
//         d.precipAccumulation = precipAccumulation;
//     }

//     if (rainSnowLimitTotal.count > 0) {
//         d.rainSnowLimit = Math.round(rainSnowLimitTotal.total / rainSnowLimitTotal.count);
//     }
//     if (isoTotal.count > 0) {
//         d.iso = Math.round(isoTotal.total / isoTotal.count);
//     }

//     const propRain = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
//     const propSnow = Math.round(probSnowPrecipitationTotal.total / (probSnowPrecipitationTotal.count || 1));
//     weatherDataIconColors(d, WeatherDataType.DAILY, weatherLocation.coord, propRain > propSnow ? d.precipAccumulation : 0, propRain < propSnow ? d.precipAccumulation : 0);
//     d.hourly = [];
//     return d;
//     // return new HalfDay(
//     //     dailyForecast.weather12H == null ? WeatherCode.CLEAR : getWeatherCode(dailyForecast.weather12H.icon),
//     //     new Temperature(temp, null, null, null, tempWindChill, null, null),
//     //     new Precipitation(precipitationTotal, null, precipitationRain, precipitationSnow, null),
//     //     new PrecipitationProbability(probPrecipitationTotal, null, probPrecipitationRain, probPrecipitationSnow, probPrecipitationIce),
//     //     new PrecipitationDuration(null, null, null, null, null),
//     //     new Wind(windDirection, windDegree, windSpeed, windLevel),
//     //     cloudCover
//     // );
// }