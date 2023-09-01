import { WeatherLocation } from "./api";

export abstract class WeatherProvider {
    abstract getWeather(weatherLocation: WeatherLocation);
}

