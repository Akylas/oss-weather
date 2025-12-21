// app/services/widgets/WidgetUpdateService.ts
// Service to trigger widget updates when weather data changes in the app

import { ApplicationSettings } from '@nativescript/core';
import { SETTINGS_WEATHER_LOCATION } from '~/helpers/constants';
import { WeatherLocation } from '../api';

let widgetService: any = null;

// Lazy load the widget service
async function getWidgetService() {
    if (!widgetService) {
        if (__ANDROID__) {
            const module = await import('./WidgetBridge.android');
            widgetService = module.widgetService;
        } else if (__IOS__) {
            const module = await import('./WidgetBridge.ios');
            widgetService = module.widgetService;
        }
    }
    return widgetService;
}

/**
 * Notify widgets when weather data is refreshed for the current/default location
 */
export async function notifyWidgetsWeatherUpdated() {
    try {
        const service = await getWidgetService();
        if (service) {
            DEV_LOG && console.log('[WidgetUpdateService] Updating widgets for default location');
            // Update all widgets using the default location
            await service.updateAllWidgets(true);
        }
    } catch (error) {
        console.error('[WidgetUpdateService] Error updating widgets:', error);
    }
}

/**
 * Notify widgets when weather data is refreshed for a specific location
 */
export async function notifyWidgetsWeatherUpdatedForLocation(location: WeatherLocation) {
    try {
        const service = await getWidgetService();
        if (service && service.updateWidgetsForLocation) {
            DEV_LOG && console.log('[WidgetUpdateService] Updating widgets for location:', location.name);
            await service.updateWidgetsForLocation(location.name);
        }
    } catch (error) {
        console.error('[WidgetUpdateService] Error updating widgets for location:', error);
    }
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
        return (
            currentLocation.coord?.lat === location.coord?.lat &&
            currentLocation.coord?.lon === location.coord?.lon
        );
    } catch (error) {
        console.error('[WidgetUpdateService] Error checking current location:', error);
        return false;
    }
}
