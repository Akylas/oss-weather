import { titlecase } from '@nativescript-community/l';
import { WeatherDataType, weatherDataIconColors } from '~/helpers/formatter';
import { lang } from '~/helpers/locale';
import { WeatherLocation, request } from '../api';
import { CityWeather, Coord, OneCallResult } from './openweathermap';
import { prefs } from '../preferences';
import { WeatherProvider } from './weatherprovider';
import { Currently, DailyData, Hourly, WeatherData } from './weather';
import { NB_DAYS_FORECAST, NB_HOURS_FORECAST, NB_MINUTES_FORECAST } from '~/helpers/constants';
import { ApplicationSettings } from '@nativescript/core';

export class OWMProvider extends WeatherProvider {
    id = 'openweathermap';
    static owmApiKey = OWMProvider.readOwmApiKeySetting();

    constructor() {
        super();
    }

    private static async fetch<T = any>(apiVersion: string, apiName: string, queryParams: OWMParams = {}) {
        return request<T>({
            url: `https://api.openweathermap.org/data/${apiVersion}/${apiName}`,
            method: 'GET',
            queryParams: {
                lang,
                units: 'metric',
                appid: OWMProvider.owmApiKey,
                ...queryParams
            }
        });
    }

    public override async getWeather(weatherLocation: WeatherLocation, { current, warnings, minutely }: { warnings?: boolean; minutely?: boolean; current?: boolean } = {}) {
        const coords = weatherLocation.coord;
        const feelsLikeTemperatures = ApplicationSettings.getBoolean('feels_like_temperatures', false);
        const onecallVersion = ApplicationSettings.getString('owm_one_call_version', '2.5');
        const result = await OWMProvider.fetch<OneCallResult>(onecallVersion, 'onecall', coords);
        const forecast_days = ApplicationSettings.getNumber('forecast_nb_days', NB_DAYS_FORECAST) + 1;
        const forecast_hours = ApplicationSettings.getNumber('forecast_nb_hours', NB_HOURS_FORECAST) + 2;
        const forecast_minutely = ApplicationSettings.getNumber('forecast_nb_minutes', NB_MINUTES_FORECAST);
        // console.log('test', JSON.stringify(result.daily));
        const r = {
            currently: weatherDataIconColors(
                {
                    time: result.current.dt * 1000,
                    temperature: feelsLikeTemperatures ? result.current.feels_like : result.current.temp,
                    usingFeelsLike: feelsLikeTemperatures,
                    pressure: result.current.pressure,
                    humidity: result.current.humidity,
                    cloudCover: result.current.clouds,
                    windSpeed: result.current.wind_speed * 3.6,
                    windGust: result.current.wind_gust * 3.6,
                    windBearing: result.current.wind_deg,
                    uvIndex: result.current.uvi,
                    isDay: result.current.dt < result.current.sunset && result.current.dt > result.current.sunrise,
                    // sunriseTime: result.current.sunrise * 1000,
                    // sunsetTime: result.current.sunset * 1000,
                    iconId: result.current.weather[0]?.id,
                    description: titlecase(result.current.weather[0]?.description)
                } as Currently,
                WeatherDataType.CURRENT,
                coords
            ),
            daily: {
                data: result.daily.slice(0, forecast_days).map((data) => {
                    const d = {} as DailyData;
                    d.time = data.dt * 1000;
                    d.isDay = true;
                    d.iconId = data.weather[0]?.id;
                    d.description = titlecase(data.weather[0]?.description);
                    d.windSpeed = Math.round(data.wind_speed * 3.6);
                    d.windGust = Math.round(data.wind_gust * 3.6);
                    d.temperatureMin = data.temp.min;
                    d.temperatureMax = data.temp.max;
                    d.temperatureNight = data.temp.night;

                    d.precipProbability = Math.round(data.pop * 100);
                    d.cloudCover = data.clouds;
                    d.windBearing = data.wind_deg;
                    d.humidity = data.humidity;
                    d.pressure = data.pressure;
                    // d.sunriseTime = data.sunrise * 1000;
                    // d.sunsetTime = data.sunset * 1000;
                    d.precipAccumulation = data.snow ? data.snow : data.rain ? data.rain : 0;
                    d.uvIndex = data.uvi;

                    weatherDataIconColors(d, WeatherDataType.DAILY, coords, data.rain, data.snow);
                    // d.hourly = [];
                    return d;
                })
            },
            minutely: {
                data:
                    result.minutely
                        ?.map((h) => ({
                            intensity: h.precipitation >= 1.5 ? 3 : h.precipitation >= 0.7 ? 2 : h.precipitation > 0 ? 1 : 0,
                            time: h.dt * 1000
                        }))
                        .filter((d, i) => i % 5 === 0) || []
            },
            alerts: result.alerts
        } as WeatherData;
        if (result.hourly) {
            const hourlyLastIndex = Math.min(result.hourly.length, forecast_hours) - 1;
            r.daily.data[0].hourly = result.hourly.slice(0, hourlyLastIndex + 1).map((data, index) => {
                const hasNext = index < hourlyLastIndex;
                const d = {} as Hourly;
                d.time = data.dt * 1000;
                const icon = data.weather[0]?.icon;
                d.isDay = icon.endsWith('d');
                d.iconId = data.weather[0]?.id;
                d.description = titlecase(data.weather[0]?.description);
                d.windSpeed = Math.round(data.wind_speed * 3.6); // max value
                d.windGust = Math.round(data.wind_gust * 3.6);
                d.temperature = feelsLikeTemperatures ? data.feels_like : data.temp;
                d.usingFeelsLike = feelsLikeTemperatures;

                d.windBearing = data.wind_deg;
                const nextData = hasNext ? result.hourly[index + 1] : undefined;
                if (hasNext && nextData) {
                    d.snowfall = nextData.snow?.['1h'] || 0;
                    d.rain = nextData.rain?.['1h'] || 0;
                    d.precipAccumulation = (d.snowfall * 10) / 7 + d.rain;
                }
                // d.precipAccumulation = data.snow ? data.snow['1h'] : data.rain ? data.rain['1h'] : 0;
                d.precipProbability = Math.round(data.pop * 100);
                d.cloudCover = data.clouds;
                d.humidity = data.humidity;
                d.pressure = data.pressure;
                weatherDataIconColors(d, WeatherDataType.HOURLY, coords, d.rain, d.snowfall);

                return d;
            });
        }

        return r;
    }

    static readOwmApiKeySetting() {
        let key = ApplicationSettings.getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY);
        DEV_LOG && console.log('readOwmApiKeySetting', key);
        if (!key || key?.length === 0) {
            ApplicationSettings.remove('owmApiKey');
            key = OWM_MY_KEY || OWM_DEFAULT_KEY;
        }
        return key?.trim();
    }

    public static async getCityName(pos: Coord) {
        const result = await OWMProvider.fetch<CityWeather>('2.5', 'weather', {
            lat: pos.lat,
            lon: pos.lon
        });
        return result;
    }

    public static setOWMApiKey(apiKey) {
        OWMProvider.owmApiKey = apiKey?.trim();
        if (OWMProvider.owmApiKey?.length) {
            ApplicationSettings.setString('owmApiKey', OWMProvider.owmApiKey);
        } else {
            ApplicationSettings.remove('owmApiKey');
        }
    }

    public static hasOWMApiKey() {
        return OWMProvider.owmApiKey && OWMProvider.owmApiKey.length && OWMProvider.owmApiKey !== OWM_DEFAULT_KEY;
    }

    public static getOWMApiKey() {
        return OWMProvider.owmApiKey;
    }
}
prefs.on('key:owmApiKey', (event) => {
    OWMProvider.owmApiKey = OWMProvider.readOwmApiKeySetting();
});

interface OWMParams extends Partial<Coord> {
    id?: number; // cityId
    q?: string; // search query
}
