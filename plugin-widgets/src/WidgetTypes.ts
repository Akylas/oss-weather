// app/services/widgets/shared/WidgetTypes.ts
// Shared types and interfaces for both Android and iOS widgets

import { ProviderType } from '~/services/providers/weather';

export interface WidgetConfig {
    locationName: string;
    latitude?: number;
    longitude?: number;
    model?: string;
    provider?: ProviderType;
    widgetKind?: string;
    iconSet?: string;
    settings?: Record<string, any>;
}

export interface WeatherWidgetData {
    temperature: string;
    iconPath: string;
    description: string;
    locationName: string;
    date: string;
    hourlyData: HourlyData[];
    dailyData: DailyData[];
    forecastData: ForecastData[];
    lastUpdate: number;
}

export interface HourlyData {
    time: string;
    temperature: string;
    iconPath: string;
    precipitation: string;
    precipAccumulation: string;
    windSpeed: string;
}

export interface DailyData {
    day: string;
    temperatureHigh: string;
    temperatureLow: string;
    iconPath: string;
    precipitation: string;
    precipAccumulation: string;
}

export interface ForecastData {
    dateTime: string;
    temperature: string;
    iconPath: string;
    description: string;
    precipitation: string;
    precipAccumulation: string;
}

export enum WidgetType {
    SIMPLE = 'simple',
    SIMPLE_DATE = 'simple_date',
    SIMPLE_CLOCK = 'simple_clock',
    HOURLY = 'hourly',
    DAILY = 'daily',
    FORECAST = 'forecast'
}

export interface WidgetUpdateRequest {
    widgetId: string;
    widgetType: WidgetType;
}

export const DEFAULT_UPDATE_FREQUENCY = 30; // minutes
export const MIN_UPDATE_FREQUENCY = 15; // minutes
export const MAX_UPDATE_FREQUENCY = 1440; // minutes (24 hours)
