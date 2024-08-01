import { WeatherLocation } from '../api';
import { Provider } from './provider';
import { AirQualityData } from './weather';

export abstract class AirQualityProvider extends Provider {
    abstract getAirQuality(
        weatherLocation: WeatherLocation,
        options?: { model?: string; warnings?: boolean; minutely?: boolean; hourly?: boolean; current?: boolean; forceModel?: boolean }
    ): Promise<AirQualityData>;
}
