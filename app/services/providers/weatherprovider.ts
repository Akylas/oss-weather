import { WeatherLocation } from '../api';
import { WeatherProps } from '../weatherData';
import { AirQualityData, ProviderType, WeatherData } from './weather';
import { lang, lc } from '~/helpers/locale';

const singletons = {};

export abstract class WeatherProvider {
    id: string;
    private static _singleton: WeatherProvider;
    // private static _singletonProviderType: ProviderType;

    abstract getWeather(
        weatherLocation: WeatherLocation,
        options?: { model?: string; warnings?: boolean; minutely?: boolean; hourly?: boolean; current?: boolean; forceModel?: boolean; weatherProps?: WeatherProps[] }
    ): Promise<WeatherData>;

    async getAirQuality(
        weatherLocation: WeatherLocation,
        options?: { model?: string; warnings?: boolean; minutely?: boolean; hourly?: boolean; current?: boolean; forceModel?: boolean }
    ): Promise<AirQualityData> {
        return null;
    }

    getModels() {
        return {};
    }
    getName() {
        return lc(`provider.${this.id}`);
    }

    public static getInstance<T extends WeatherProvider>(this: new () => T) {
        // we use static id because prototype.constructor.name might not be uniq when uglified
        const key = this['id'];
        if (!singletons[key]) {
            singletons[key] = new this();
        }
        return singletons[key];
    }
}
