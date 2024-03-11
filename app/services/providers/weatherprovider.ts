import { WeatherLocation } from '../api';
import { ProviderType, WeatherData } from './weather';
import { lang, lc } from '~/helpers/locale';

const singletons = {};

export abstract class WeatherProvider {
    id: string;
    private static _singleton: WeatherProvider;
    // private static _singletonProviderType: ProviderType;

    abstract getWeather(weatherLocation: WeatherLocation, model?: string): Promise<WeatherData>;

    getModels() {
        return {};
    }
    getName() {
        return lc(`provider.${this.id}`);
    }

    public static getInstance<T extends WeatherProvider>(this: new () => T) {
        const key = this.prototype.constructor.name;
        if (!singletons[key]) {
            singletons[key] = new this();
        }
        return singletons[key];
    }
}
