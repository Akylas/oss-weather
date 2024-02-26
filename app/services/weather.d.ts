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

export interface DailyData {
    time: number;
    icon: string;
    description: string;
    windSpeed: number;
    windGust: number;
    temperatureMin: number;
    temperatureMax: number;
    temperatureNight?: number;
    precipProbability: number;
    cloudCover: number;
    cloudCeiling?: number;
    precipColor: string | Color;
    precipUnit: UNITS;
    windBearing: number;
    humidity: number;
    pressure: number;
    moonIcon: string;
    sunriseTime?: number;
    sunsetTime?: number;
    precipAccumulation: number;
    color: string | Color;
    cloudColor?: string | Color;
    uvIndexColor: string | Color;
    uvIndex: number;
    windBeaufortIcon?: any;
    windIcon: string;
    hourly: Hourly[];

    rainSnowLimit?: number;
    iso?: number;
}

export interface Hourly {
    time: number;
    icon: string;
    description: string;
    cloudCeiling?: number;
    windSpeed: number;
    temperature: number;
    windBearing: number;
    precipAccumulation: number;
    snowfall: number;
    precipProbability: number;
    precipProbabilities?: {
        rain: number;
        snow: number;
        ice: number;
    };
    cloudCover: number;
    humidity: number;
    windGust: number;
    pressure: number;
    precipColor: string | Color;
    precipUnit: UNITS;
    color: string | Color;
    windBeaufortIcon?: any;
    cloudColor: string | Color;
    windIcon: string;
    rainSnowLimit?: number;
    iso?: number;
    snowDepth?: number;
}
export interface Currently {
    time: number;
    temperature: number;
    pressure: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudColor: string | Color;
    uvIndexColor: string | Color;
    precipColor: string | Color;
    precipUnit: UNITS;
    color: string | Color;
    uvIndex: number;
    moonIcon: string;
    sunriseTime: number;
    sunsetTime: number;
    icon: string;
    description: string;
    windBeaufortIcon: string;
    windIcon: string;
}
