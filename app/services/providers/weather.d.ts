import { Color } from '@nativescript/core';
import { api_providers, providers } from './weatherproviderfactory';

export type ProviderType = (typeof providers)[number];
export type AqiProviderType = (typeof api_providers)[number];

export interface WeatherData {
    time: number;
    currently: Currently;
    daily: Daily;
    minutely: Minutely;
    alerts: Alert[];
    hourly: Hourly[];
}
export interface AirQualityData {
    time: number;
    currently?: AirQualityCurrently;
    daily?: AirQualityDaily;
    hourly: AirQualityHourly[];
    // minutely?: AirQualityMinutely;
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

export interface CommonAirQualityData {
    time: number;
    aqi: number;
    aqiColor?: string;
    pollutants?: {
        co?: {
            unit: string;
            value: number;
        };
        no?: {
            unit: string;
            value: number;
        };
        no2?: {
            unit: string;
            value: number;
        };
        o3?: {
            unit: string;
            value: number;
        };
        so2?: {
            unit: string;
            value: number;
        };
        pm2_5?: {
            unit: string;
            value: number;
        };
        pm10?: {
            unit: string;
            value: number;
        };
        nh3?: {
            unit: string;
            value: number;
        };
    };
    pollens?: {
        [k: string]: {
            color?: string;
            unit: string;
            value: number;
        };
    };
}
export interface CommonWeatherData extends CommonAirQualityData {
    time: number;
    timezone?: string;
    timezoneOffset?: number;
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
    relativeHumidity?: number;
    sealevelPressure?: number;
    dewpoint?: number;
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

export interface AirQualityCurrently extends CommonAirQualityData {}
export interface AirQualityDaily {
    data: CommonAirQualityData[];
}
export interface AirQualityMinutely extends CommonAirQualityData {}
