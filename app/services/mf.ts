import { titlecase } from '@nativescript-community/l';
import { getString } from '@nativescript/core/application-settings';
import dayjs from 'dayjs';
import { WeatherDataType, weatherDataIconColors } from '~/helpers/formatter';
import { lang, lc } from '~/helpers/locale';
import { WeatherLocation, request } from './api';
import { Coord, Dailyforecast, ForecastForecast, MFCurrent, MFForecastResult, MFMinutely, MFWarnings, Probabilityforecast } from './meteofrance';
import { WeatherProvider } from './weatherprovider';
import { Alert, Currently, DailyData, Hourly, MinutelyData, WeatherData } from './weather';

const mfApiKey = getString('mfApiKey', MF_DEFAULT_KEY);

interface MFParams extends Partial<Coord> {
    domain?: string;
}

export class MFProvider extends WeatherProvider {
    private getDaily(weatherLocation: WeatherLocation, hourly: Hourly[], hourlyForecast: ForecastForecast[], dailyForecast: Dailyforecast) {
        let precipitationTotal = 0;
        const probPrecipitationTotal = { count: 0, total: 0 };
        const probRainPrecipitationTotal = { count: 0, total: 0 };
        const probSnowPrecipitationTotal = { count: 0, total: 0 };
        const rainSnowLimitTotal = { count: 0, total: 0 };
        const isoTotal = { count: 0, total: 0 };

        let precipProbability = 0;

        const dayStartTime = dayjs(dailyForecast.time * 1000)
            .startOf('d')
            .valueOf();
        const dayEndTime = dayjs(dailyForecast.time * 1000)
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
        // const windSpeeds = [];
        const windDegree = { count: 0, total: 0 };
        let windGust = null;

        for (const hourForecast of hourlyForecast) {
            const time = hourForecast.time * 1000;
            if (time >= dayStartTime && time < dayEndTime) {
                cloudCover.count++;
                cloudCover.total += hourForecast.total_cloud_cover;
                if (hourForecast.wind_speed) {
                    windSpeed.count++;
                    windSpeed.total += hourForecast.wind_speed;
                    // windSpeeds.push(hourForecast.wind.speed);
                }
                if (hourForecast.wind_direction !== -1) {
                    windDegree.count++;
                    windDegree.total += hourForecast.wind_direction;
                }

                if (windGust == null || hourForecast.wind_speed_gust > windGust) {
                    windGust = hourForecast.wind_speed_gust;
                }
            }
        }
        // console.log('day:', dayjs(dayStartTime).format('ddd DD/MM'), dayStartTime, dayEndTime, dailyForecast, cloudCover, windSpeed, windSpeeds, windDegree, rainSnowLimitTotal);
        const d = {
            time: dayStartTime,
            description: dailyForecast.daily_weather_description == null ? '' : dailyForecast.daily_weather_description,
            icon: this.convertMFICon(dailyForecast.daily_weather_icon),
            temperatureMax: Math.round(dailyForecast.T_max),
            temperatureMin: Math.round(dailyForecast.T_min),
            humidity: (dailyForecast.relative_humidity_max + dailyForecast.relative_humidity_min) / 2,
            uvIndex: dailyForecast.uv_index,
            windGust: Math.round(windGust * 3.6),
            windSpeed: windSpeed.count > 1 ? Math.round((windSpeed.total / (windSpeed.count || 1)) * 3.6) : 0,
            windBearing: windDegree.count > 1 ? Math.round((windDegree.total / windDegree.count) * 3.6) : -1,
            cloudCover: cloudCover.count > 1 ? Math.round(cloudCover.total / (cloudCover.count || 1)) : -1,
            sunriseTime: dailyForecast.sunrise_time * 1000,
            sunsetTime: dailyForecast.sunset_time * 1000
        } as DailyData;
        if (precipProbability > 0) {
            d.precipProbability = Math.round(precipProbability);
        }
        const precipAccumulation = Math.max(precipitationTotal, dailyForecast.total_precipitation_24h);
        if (precipAccumulation > 0) {
            d.precipAccumulation = precipAccumulation;
        }

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

    private convertMFICon(icon: string) {
        if (!icon) {
            return '01d';
        }
        const dayOrNight = icon.slice(-1) === 'n' ? 'n' : 'd';
        switch (parseInt(icon.replace(/^\D+/g, ''), 10)) {
            case 1:
                return '01' + dayOrNight;
            case 2:
                return '02' + dayOrNight;
            case 3:
            case 32:
            case 33:
            case 34:
                return '04' + dayOrNight;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                return '50' + dayOrNight;
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
                return '10' + dayOrNight;
            case 16:
            case 24:
            case 25:
            case 30:
                return '11' + dayOrNight;
            case 26:
            case 27:
            case 28:
            case 29:
                return '11' + dayOrNight;
            case 19:
            case 20:
                return '09' + dayOrNight;
            case 17:
            case 18:
            case 21:
            case 22:
            case 23:
                return '13' + dayOrNight;
            default:
                return '01' + dayOrNight;
        }
    }

    private getHourlyPrecipitationProbability(probabilityForecastResult: Probabilityforecast[], dt: number) {
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
            if (probabilityForecast.time === dt || probabilityForecast.time - 3600 === dt || probabilityForecast.time - 3600 * 2 === dt) {
                if (probabilityForecast.rain_hazard_3h != null) {
                    rainProbability = probabilityForecast.rain_hazard_3h;
                } else if (probabilityForecast.rain_hazard_6h != null) {
                    rainProbability = probabilityForecast.rain_hazard_6h;
                }
                if (probabilityForecast.snow_hazard_3h != null) {
                    snowProbability = probabilityForecast.snow_hazard_3h;
                } else if (probabilityForecast.snow_hazard_6h != null) {
                    snowProbability = probabilityForecast.snow_hazard_6h;
                }
                iceProbability = probabilityForecast.freezing_hazard;
            } else if (probabilityForecast.time - 3600 * 3 === dt || probabilityForecast.time - 3600 * 4 === dt || probabilityForecast.time - 3600 * 5 === dt) {
                /*
                 * If it's found as part of the "6 hour schedule" and we find later a "3 hour schedule"
                 * the "3 hour schedule" will overwrite the "6 hour schedule" below with the above
                 */
                if (probabilityForecast.rain_hazard_6h != null) {
                    rainProbability = probabilityForecast.rain_hazard_6h;
                }
                if (probabilityForecast.snow_hazard_6h != null) {
                    snowProbability = probabilityForecast.snow_hazard_6h;
                }
                iceProbability = probabilityForecast.freezing_hazard;
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

    private async fetch<T = any>(apiName: string, queryParams: MFParams = {}) {
        return request<T>({
            url: `https://webservice.meteofrance.com/${apiName}`,
            method: 'GET',
            queryParams: {
                language: lang,
                formatDate: 'timestamp',
                token: mfApiKey,
                ...queryParams
            }
        });
    }

    public override async getWeather(weatherLocation: WeatherLocation) {
        const coords = weatherLocation.coord;
        const result = await Promise.all([this.fetch<MFForecastResult>('v2/forecast', coords), this.fetch<MFMinutely>('v3/nowcast/rain', coords), this.fetch<MFCurrent>('v2/observation', coords)]);
        // if (forecast.position.dept) {
        // we are in france we can get more

        const forecast = result[0];
        const rain = result[1];
        const current = result[2];
        let warnings: MFWarnings;
        if (forecast.properties.french_department) {
            warnings = await this.fetch<MFWarnings>('v3/warning/full', {
                ...coords,
                domain: forecast.properties.french_department
            }).catch((err) => null);
        }
        // }
        DEV_LOG && console.log('forecast', JSON.stringify(forecast));
        DEV_LOG && console.log('rain', JSON.stringify(rain));
        DEV_LOG && console.log('current', JSON.stringify(current));
        DEV_LOG && console.log('warnings', JSON.stringify(warnings));
        let hourlyLastIndex = forecast.properties.forecast.findIndex((d) => d.weather_icon === null || d.T === null);
        if (hourlyLastIndex === -1) {
            hourlyLastIndex = forecast.properties.forecast.length - 1;
        }
        const hourlyData = forecast.properties.forecast?.slice(0, hourlyLastIndex).map((data, index) => {
            const hasNext = index < hourlyLastIndex;
            const d = {} as Hourly;
            d.time = data.time * 1000;
            d.icon = this.convertMFICon(data.weather_icon);
            d.description = titlecase(data.weather_description);
            d.temperature = Math.round(data.T);
            d.feelTemperature = Math.round(data.T_windchill);

            d.windBearing = data.wind_direction;
            const acc = (data.snow_1h || 0) + (data.rain_1h || 0);
            if (acc > 0) {
                d.precipAccumulation = acc;
            }

            const probabilities = this.getHourlyPrecipitationProbability(forecast.properties.probability_forecast || [], data.time);
            const prob = Math.round(Math.max(probabilities.rain, probabilities.snow, probabilities.ice));
            d.precipProbability = Math.round(Math.max(probabilities.rain, probabilities.snow, probabilities.ice));
            if (d.precipAccumulation && prob === 0) {
                d.precipProbability = -1;
            }
            if (prob >= 0) {
                d.precipProbability = prob;
            }
            // d.precipProbabilities = probabilities;
            d.cloudCover = data.total_cloud_cover;
            d.humidity = data.relative_humidity;
            d.windGust = data.wind_speed_gust * 3.6;
            d.windSpeed = data.wind_speed * 3.6;
            d.iso = data.iso0;
            if (typeof data['rain snow limit'] === 'number') {
                d.rainSnowLimit = data['rain snow limit'];
            }
            // d.pressure = data.pressure;
            return weatherDataIconColors(d, WeatherDataType.HOURLY, weatherLocation.coord, data.rain_1h, data.snow_1h);
        });
        const r = {
            currently: current?.properties
                ? weatherDataIconColors(
                      {
                          time: current.update_time * 1000,
                          temperature: Math.round(current.properties.gridded.T),
                          windSpeed: current.properties.gridded.wind_speed,
                          //   windGust: current.properties.gridded.wind,
                          windBearing: current.properties.gridded.wind_direction,
                          icon: this.convertMFICon(current.properties.gridded.weather_icon),
                          description: titlecase(current.properties.gridded.weather_description)
                      } as Currently,
                      WeatherDataType.CURRENT,
                      coords
                  )
                : {},
            daily: {
                data: forecast.properties.daily_forecast.slice(0, 14).map((data) => this.getDaily(weatherLocation, hourlyData, forecast.properties.forecast, data))
            },
            minutely: {
                data:
                    rain?.properties?.forecast.map(
                        (h) =>
                            ({
                                intensity: Math.max(h.rain_intensity - 1, 0),
                                time: h.time * 1000
                            }) as MinutelyData
                    ) || []
            },
            alerts: warnings
                ? warnings.timelaps.reduce((acc, timelaps) => {
                      timelaps.timelaps_items
                          .filter((it) => it.color_id > 1)
                          .forEach((w) => {
                              acc.push({
                                  start: w.begin_time * 1000,
                                  end: w.end_time * 1000,
                                  event: this.getWarningType(timelaps.phenomenon_id) + ' - ' + this.getWarningText(w.color_id),
                                  description: w.color_id >= 1 ? this.getWarningContent(timelaps.phenomenon_id, warnings) : undefined
                              } as Alert);
                          });
                      return acc;
                  }, [])
                : []
        } as WeatherData;
        r.daily.data[0].hourly = hourlyData;
        return r;
    }

    private getWarningType(phemononId: string) {
        switch (phemononId) {
            case '1':
                return lc('wind');
            case '2':
                return lc('rain_flood');
            case '3':
                return lc('thunderstorms');
            case '4':
                return lc('flood');
            case '5':
                return lc('snow_ice');
            case '6':
                return lc('heat_wave');
            case '7':
                return lc('extreme_cold');
            case '8':
                return lc('avalanche');
            case '9':
                return lc('coastal_flooding');
            default:
                return lc('divers');
        }
    }

    private getWarningText(colorId: number) {
        switch (colorId) {
            case 4:
                return lc('absolute_vigilance');
            case 3:
                return lc('be_extra_vigilant');
            case 2:
                return lc('be_vigilant');
            default:
                return lc('no_particular_vigilance');
        }
    }

    private getWarningColor(colorId: number) {
        switch (colorId) {
            case 4:
                return 'rgb(204, 0, 0)';
            case 3:
                return 'rgb(255, 184, 43)';
            case 2:
                return 'rgb(255, 246, 0)';
            case 1:
                return 'rgb(49, 170, 53)';
            default:
                return null;
        }
    }

    private getWarningContent(phenomenonId: string, warningsResult: MFWarnings): string {
        const consequences = warningsResult.consequences?.some((it) => it.phenomenonId === phenomenonId)?.textConsequence?.replace('<br>', '\n');
        const advices = warningsResult.advices?.some((it) => it.phenomenonId === phenomenonId)?.textAdvice?.replace('<br>', '\n');
        let content = '';
        if (consequences) {
            content += lc('possible_consequences') + ':\n' + consequences;
        }
        if (advices) {
            if (content.length) {
                content += '\n';
            }
            content += lc('behavioral_tips') + ':\n' + advices;
        }
        if (!content.length && warningsResult.comments?.text?.length) {
            content = warningsResult.comments?.text[0];
        }
        // There are also text blocks with hour by hour evaluation, but it’s way too detailed
        return content.length ? content : null;
    }
}

function round5(t) {
    return 5 * Math.ceil(t / 5);
}
const SixHours = 6 * 3600;
const ThirtyHours = 30 * 3600;

// function getWeatherCode(icon: string) {
//     return if (icon == null) {
//         null
//     } else with (icon) {
//         when {
//             // We need to take care of two-digits first
//             startsWith("p32") || startsWith("p33")
//                     || startsWith("p34") : return  WeatherCode.WIND
//             startsWith("p31") : return  null // What is this?
//             startsWith("p26") || startsWith("p27") || startsWith("p28")
//                     || startsWith("p29") : return  WeatherCode.THUNDER
//             startsWith("p26") || startsWith("p27") || startsWith("p28")
//                     || startsWith("p29") : return  WeatherCode.THUNDER
//             startsWith("p21") || startsWith("p22")
//                     || startsWith("p23") : return  WeatherCode.SNOW
//             startsWith("p19") || startsWith("p20") : return  WeatherCode.HAIL
//             startsWith("p17") || startsWith("p18") : return  WeatherCode.SLEET
//             startsWith("p16") || startsWith("p24")
//                     || startsWith("p25") || startsWith("p30") : return  WeatherCode.THUNDERSTORM
//             startsWith("p9") || startsWith("p10") || startsWith("p11")
//                     || startsWith("p12") || startsWith("p13")
//                     || startsWith("p14") || startsWith("p15") : return  WeatherCode.RAIN
//             startsWith("p6") || startsWith("p7")
//                     || startsWith("p8") : return  WeatherCode.FOG
//             startsWith("p4") || startsWith("p5") : return  WeatherCode.HAZE
//             startsWith("p3") : return  WeatherCode.CLOUDY
//             startsWith("p2") : return  WeatherCode.PARTLY_CLOUDY
//             startsWith("p1") : return  WeatherCode.CLEAR
//             else : return  null
//         }
//     }
// }
