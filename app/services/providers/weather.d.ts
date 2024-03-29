import { Color } from '@nativescript/core';
import { providers } from './weatherproviderfactory';

export type ProviderType = (typeof providers)[number];

export interface WeatherData {
    currently: Currently;
    daily: Daily;
    minutely: Minutely;
    alerts: Alert[];
}

export interface Alert {
    sender_name?: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags?: string[];
}

export interface Minutely {
    data: MinutelyData[];
}

export interface MinutelyData {
    intensity: number;
    time: number;
}

export interface Daily {
    data: DailyData[];
}

export interface CommonWeatherData {
    time: number;
    // icon?: string;
    iconId: number;
    isDay: boolean;
    description?: string;
    windSpeed?: number;
    windGust?: number;
    temperature?: number;
    usingFeelsLike?: boolean;
    temperatureMin?: number;
    temperatureMax?: number;
    precipProbability?: number;
    precipAccumulation?: number;
    precipUnit?: UNITS;
    precipIcon?: string;
    precipFontUseApp?: boolean;
    precipShowSnow?: boolean;
    cloudCover?: number;
    cloudCeiling?: number;
    precipColor?: string | Color;
    mixedRainSnow?: boolean;
    windBearing?: number;
    humidity?: number;
    pressure?: number;
    sunriseTime?: number;
    sunsetTime?: number;
    color?: string | Color;
    cloudColor?: string | Color;
    uvIndexColor?: string | Color;
    uvIndex?: number;
    windBeaufortIcon?: any;
    windIcon?: string;
    moonIcon?: string;
    iso?: number;
    snowDepth?: number;
}

export interface DailyData extends CommonWeatherData {
    temperatureNight?: number;

    sunriseTime?: number;
    sunsetTime?: number;

    hourly: Hourly[];
    rainSnowLimit?: number;
}

export interface Hourly extends CommonWeatherData {
    precipProbabilities?: {
        rain: number;
        snow: number;
        ice: number;
    };
    rainSnowLimit?: number;
    snowfall?: number;
    rain?: number;
}
export interface Currently extends CommonWeatherData {
    time: number;

    sunriseTime?: number;
    sunsetTime?: number;
}
