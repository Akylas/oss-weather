import { titlecase } from '@nativescript-community/l';
import { getString, remove, setString } from '@nativescript/core/application-settings';
import { WeatherDataType, weatherDataIconColors } from '~/helpers/formatter';
import { lang } from '~/helpers/locale';
import { WeatherLocation, request } from './api';
import { CityWeather, Coord, OneCallResult } from './openweathermap';
import { prefs } from './preferences';
import { WeatherProvider } from './weatherprovider';
import { Currently, DailyData, Hourly, WeatherData } from './weather';
import { ApplicationSettings } from '@akylas/nativescript';

export class OWMProvider extends WeatherProvider {
    static owmApiKey = OWMProvider.readOwmApiKeySetting();

    constructor() {
        super();
    }

    private static async fetch<T = any>(apiName: string, queryParams: OWMParams = {}) {
        return request<T>({
            url: `https://api.openweathermap.org/data/2.5/${apiName}`,
            method: 'GET',
            queryParams: {
                lang,
                units: 'metric',
                appid: OWMProvider.owmApiKey,
                ...queryParams
            }
        });
    }

    public override async getWeather(weatherLocation: WeatherLocation) {
        const coords = weatherLocation.coord;
        const feelsLikeTemperatures = ApplicationSettings.getBoolean('feels_like_temperatures', false);
        const result = await OWMProvider.fetch<OneCallResult>('onecall', coords);
        // console.log('test', JSON.stringify(result.daily));
        const r = {
            currently: weatherDataIconColors(
                {
                    time: result.current.dt * 1000,
                    temperature: feelsLikeTemperatures ? result.current.feels_like : result.current.temp,
                    pressure: result.current.pressure,
                    humidity: result.current.humidity,
                    cloudCover: result.current.clouds,
                    windSpeed: result.current.wind_speed * 3.6,
                    windGust: result.current.wind_gust * 3.6,
                    windBearing: result.current.wind_deg,
                    uvIndex: result.current.uvi,
                    sunriseTime: result.current.sunrise * 1000,
                    sunsetTime: result.current.sunset * 1000,
                    icon: result.current.weather[0]?.icon,
                    description: titlecase(result.current.weather[0]?.description)
                } as Currently,
                WeatherDataType.CURRENT,
                coords
            ),
            daily: {
                data: result.daily.map((data) => {
                    const d = {} as DailyData;
                    d.time = data.dt * 1000;
                    d.icon = data.weather[0]?.icon;
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
                    d.sunriseTime = data.sunrise * 1000;
                    d.sunsetTime = data.sunset * 1000;
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
        const hourlyLastIndex = result.hourly.length - 1;
        r.daily.data[0].hourly = result.hourly?.map((data, index) => {
            const hasNext = index < hourlyLastIndex;
            const d = {} as Hourly;
            d.time = data.dt * 1000;
            d.icon = data.weather[0]?.icon;
            d.description = titlecase(data.weather[0]?.description);
            d.windSpeed = Math.round(data.wind_speed * 3.6); // max value
            d.windGust = Math.round(data.wind_gust * 3.6);
            d.temperature = feelsLikeTemperatures ? data.feels_like : data.temp;

            d.windBearing = data.wind_deg;
            if (hasNext) {
                const nextData = result.hourly[index + 1];
                d.precipAccumulation = nextData.snow ? nextData.snow['1h'] : nextData.rain ? nextData.rain['1h'] : 0;
            }
            // d.precipAccumulation = data.snow ? data.snow['1h'] : data.rain ? data.rain['1h'] : 0;
            d.precipProbability = Math.round(data.pop * 100);
            d.cloudCover = data.clouds;
            d.humidity = data.humidity;
            d.pressure = data.pressure;
            weatherDataIconColors(d, WeatherDataType.HOURLY, coords, data.rain?.['1h'], data.snow?.['1h']);

            return d;
        });
        return r;
    }

    static readOwmApiKeySetting() {
        let key = getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY);
        DEV_LOG && console.log('readOwmApiKeySetting', key);
        if (key?.length === 0) {
            remove('owmApiKey');
            key = OWM_MY_KEY || OWM_DEFAULT_KEY;
        }
        return key?.trim();
    }

    public static async getCityName(pos: Coord) {
        const result = await OWMProvider.fetch<CityWeather>('weather', {
            lat: pos.lat,
            lon: pos.lon
        });
        return result;
    }

    public static setOWMApiKey(apiKey) {
        OWMProvider.owmApiKey = apiKey?.trim();
        if (OWMProvider.owmApiKey?.length) {
            setString('owmApiKey', OWMProvider.owmApiKey);
        } else {
            remove('owmApiKey');
        }
    }

    public static hasOWMApiKey() {
        DEV_LOG && console.log('hasOWMApiKey', OWMProvider.owmApiKey, OWM_DEFAULT_KEY);
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
