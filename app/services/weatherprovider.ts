import { WeatherLocation } from "./api";

export abstract class WeatherProvider {
    private static _singleton: WeatherProvider;
    private static _singletonProviderType: ProviderType;

    abstract getWeather(weatherLocation: WeatherLocation);

    public static setInstance(newSingleton: WeatherProvider, singletonType: ProviderType): void {
        WeatherProvider._singleton = newSingleton;
        WeatherProvider._singletonProviderType = singletonType;
    }

    public static getInstance(): [WeatherProvider, ProviderType] {
        return [WeatherProvider._singleton, WeatherProvider._singletonProviderType];
    }
}

