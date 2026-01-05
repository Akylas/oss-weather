import { WeatherLocation } from '../api';
import { WeatherProps } from '../weatherData';
import { Provider } from './provider';
import { AirQualityData, WeatherData } from './weather';

export abstract class WeatherProvider extends Provider {
    abstract getWeather(
        weatherLocation: WeatherLocation,
        options?: { model?: string; warnings?: boolean; minutely?: boolean; hourly?: boolean; current?: boolean; forceModel?: boolean; weatherProps?: WeatherProps[] }
    ): Promise<WeatherData>;
    getModels() {
        return {};
    }
}
