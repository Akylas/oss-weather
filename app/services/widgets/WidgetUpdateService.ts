// app/services/widgets/WidgetUpdateService.ts
// Service to trigger widget updates when weather data changes in the app

import { ApplicationSettings } from '@nativescript/core';
import { SETTINGS_WEATHER_LOCATION } from '~/helpers/constants';
import { WeatherLocation } from '../api';
import { widgetService } from './WidgetBridge';

/**
 * Notify widgets when weather data is refreshed for the current/default location
 */
export async function notifyWidgetsWeatherUpdated() {
    return widgetService.updateAllWidgets(true);
}

/**
 * Notify widgets when weather data is refreshed for a specific location
 */
export async function notifyWidgetsWeatherUpdatedForLocation(location: WeatherLocation) {
    DEV_LOG && console.log('[WidgetUpdateService] Updating widgets for location:', location.name);
    return widgetService.updateWidgetsForLocation(location.name);
}

/**
 * Check if a location is the current/default location
 */
export function isCurrentLocation(location: WeatherLocation): boolean {
    if (!location) return false;

    try {
        const currentLocationStr = ApplicationSettings.getString(SETTINGS_WEATHER_LOCATION);
        if (!currentLocationStr) return false;

        const currentLocation: WeatherLocation = JSON.parse(currentLocationStr);

        // Compare coordinates
        return currentLocation.coord?.lat === location.coord?.lat && currentLocation.coord?.lon === location.coord?.lon;
    } catch (error) {
        console.error('[WidgetUpdateService] Error checking current location:', error, error.stack);
        return false;
    }
}
