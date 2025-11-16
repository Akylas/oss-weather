// app/services/widgets/shared/WidgetDataManager.ts
// Shared logic for fetching and formatting widget data (used by both Android and iOS)

import { WeatherProvider } from '~/services/providers/weatherprovider';
import { WeatherLocation } from '~/services/api';
import { DailyData, ForecastData, HourlyData, WeatherWidgetData, WidgetConfig } from './WidgetTypes';
import { Providers, getWeatherProvider } from '../providers/weatherproviderfactory';
import { ApplicationSettings } from '@nativescript/core';
import { FavoriteLocation } from '~/helpers/favorites';
import { SETTINGS_WEATHER_LOCATION } from '~/helpers/constants';
import { WeatherProps, formatWeatherValue } from '../weatherData';
import { WeatherData } from '../providers/weather';
import dayjs from 'dayjs';
import { formatDate, formatTime } from '~/helpers/locale';
import { iconService } from '../icon';

export function isDefaultLocation(locationName: string) {
    return !locationName || locationName === 'current' || locationName === 'default';
}

export class WidgetDataManager {
    constructor() {}

    /**
     * Fetch and format weather data for a widget
     */
    async getWidgetWeatherData(config: WidgetConfig): Promise<WeatherWidgetData> {
        // Get location data
        const locationName = config.locationName;
        const latitude = config.latitude;
        const longitude = config.longitude;
        const model = config.model;
        const provider = getWeatherProvider(config.provider);

        // Create location object
        let location: WeatherLocation = {
            name: locationName,
            coord: {
                lat: latitude,
                lon: longitude
            }
        };
        // Handle "current" location - use app's current selected location
        if (isDefaultLocation(locationName)) {
            location = JSON.parse(ApplicationSettings.getString(SETTINGS_WEATHER_LOCATION, DEFAULT_LOCATION || 'null'));
        }

        // Fetch weather data using WeatherProvider.getWeather
        const weatherData = location
            ? await provider.getWeather(location, {
                  model
              })
            : null;

        // Format data for widget
        return this.formatWeatherDataForWidget(weatherData, location);
    }

    /**
     * Format weather data for widget consumption using formatWeatherValue
     */
    private formatWeatherDataForWidget(weatherData: WeatherData, location: WeatherLocation): WeatherWidgetData {
        if (!weatherData) {
            return;
        }
        // Format current weather
        const formattedData: WeatherWidgetData = {
            temperature: formatWeatherValue(weatherData.currently, WeatherProps.temperature),
            iconPath: this.getIconPath(weatherData.currently.iconId, weatherData.currently.isDay),
            description: weatherData.currently?.description || '',
            locationName: location.name || '',
            date: this.formatDate(weatherData.currently?.time || Date.now()),
            hourlyData: [],
            dailyData: [],
            forecastData: [],
            lastUpdate: Date.now()
        };

        // Format hourly data (next 24 hours)
        if (weatherData.hourly?.length > 0) {
            formattedData.hourlyData = weatherData.hourly.slice(0, 24).map((hour) => ({
                time: this.formatTime(hour.time),
                temperature: formatWeatherValue(hour, WeatherProps.temperature),
                iconPath: this.getIconPath(hour.iconId, hour.isDay),
                precipitation: formatWeatherValue(hour, WeatherProps.precipProbability),
                windSpeed: formatWeatherValue(hour, WeatherProps.windSpeed)
            }));
        }

        // Format daily data (next 7 days)
        if (weatherData.daily?.data && weatherData.daily.data.length > 0) {
            formattedData.dailyData = weatherData.daily.data.slice(0, 7).map((day) => ({
                day: this.formatDayName(day.time),
                temperatureHigh: formatWeatherValue(day, WeatherProps.temperatureMax),
                temperatureLow: formatWeatherValue(day, WeatherProps.temperatureMin),
                iconPath: this.getIconPath(day.iconId, day.isDay),
                precipitation: formatWeatherValue(day, WeatherProps.precipProbability)
            }));
        }

        // Format forecast data (combination of hourly and daily)
        const forecastData: ForecastData[] = [];

        // Add next 6 hours from hourly
        if (weatherData.hourly?.length) {
            weatherData.hourly.slice(0, 6).forEach((hour) => {
                forecastData.push({
                    dateTime: this.formatDateTime(hour.time),
                    temperature: formatWeatherValue(hour, WeatherProps.temperature),
                    iconPath: this.getIconPath(hour.iconId, hour.isDay),
                    description: hour.description || '',
                    precipitation: formatWeatherValue(hour, WeatherProps.precipProbability)
                });
            });
        }

        // Add next 4 days from daily
        if (weatherData.daily?.data) {
            weatherData.daily.data.slice(1, 5).forEach((day) => {
                forecastData.push({
                    dateTime: this.formatDateTime(day.time),
                    temperature: formatWeatherValue(day, WeatherProps.temperature),
                    iconPath: this.getIconPath(day.iconId, day.isDay),
                    description: day.description || '',
                    precipitation: formatWeatherValue(day, WeatherProps.precipProbability)
                });
            });
        }

        formattedData.forecastData = forecastData;

        return formattedData;
    }

    private getIconPath(iconId: number, isDay: boolean): string {
        const icon = iconService.getIcon(iconId, isDay);
        return `${iconService.iconSetFolderPath}/images/${icon}.png`;
    }

    /**
     * Helper methods for formatting dates/times
     */
    private formatDate(timestamp: number): string {
        return formatDate(timestamp, 'll');
    }

    private formatTime(timestamp: number): string {
        return formatTime('timestamp', 'LT');
    }

    private formatDateTime(timestamp: number): string {
        return formatDate(timestamp, 'MMM D h');
    }

    private formatDayName(timestamp: number): string {
        return formatDate(timestamp, 'ddd');
    }
}
