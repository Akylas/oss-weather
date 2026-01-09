import { Application, ApplicationSettings } from '@nativescript/core';
import { WeatherLocation } from './api';
import { WeatherData } from './providers/weather';

const GADGETBRIDGE_ENABLED_KEY = 'gadgetbridge_enabled';

/**
 * Gadgetbridge Service for broadcasting weather data to smartwatches
 * Delegates to native Kotlin implementation for JSON encoding and broadcasting
 */
class GadgetbridgeService {
    private enabled = false;

    constructor() {
        this.enabled = ApplicationSettings.getBoolean(GADGETBRIDGE_ENABLED_KEY, false);
    }

    /**
     * Enable or disable Gadgetbridge weather broadcasts
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        ApplicationSettings.setBoolean(GADGETBRIDGE_ENABLED_KEY, enabled);
    }

    /**
     * Check if Gadgetbridge is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Broadcast weather data to Gadgetbridge via native Kotlin implementation
     */
    broadcastWeather(location: WeatherLocation, weatherData: WeatherData) {
        if (!this.enabled || !__ANDROID__) {
            return;
        }

        try {
            const context = Application.android.context;
            
            // Convert weather data and location to JSON strings
            const weatherDataJson = JSON.stringify(weatherData);
            const locationJson = JSON.stringify(location);
            
            // Call native Kotlin method to handle broadcasting on background thread
            const GadgetbridgeServiceClass = com.akylas.weather.gadgetbridge.GadgetbridgeService;
            GadgetbridgeServiceClass.broadcastWeather(context, weatherDataJson, locationJson);
            
            DEV_LOG && console.log('[Gadgetbridge] Weather data sent to native service for broadcasting');
        } catch (error) {
            console.error('[Gadgetbridge] Failed to broadcast weather:', error);
        }
    }
}

export const gadgetbridgeService = new GadgetbridgeService();

