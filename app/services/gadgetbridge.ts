import { Application, ApplicationSettings, Utils } from '@nativescript/core';
import { WeatherLocation } from './api';
import { WeatherData } from './providers/weather';
import { getMoonTimes, getTimes } from 'suncalc';
import dayjs from 'dayjs';
import { getMoonPhase } from '~/helpers/formatter';

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
            const context = Utils.android.getApplicationContext();

            // we need to add sun/moon data
            const toSendData = JSON.parse(JSON.stringify(weatherData)) as WeatherData;
            toSendData.daily?.data.forEach((d) => {
                const date = dayjs.utc(d.time);
                const times = getTimes(date as any, location.coord.lat, location.coord.lon);
                const moontimes = getMoonTimes(date as any, location.coord.lat, location.coord.lon);
                d.sunsetTime = dayjs.utc(times.sunsetStart.valueOf()).valueOf();
                d.sunriseTime = dayjs.utc(times.sunriseEnd.valueOf()).valueOf();
                d['moonRise'] = dayjs.utc(moontimes.rise.valueOf()).valueOf();
                if (moontimes.set) {
                    d['moonSet'] = dayjs.utc(moontimes.set.valueOf()).valueOf();
                }
                d['moonPhase'] = getMoonPhase(date as any);
            });
            // Convert weather data and location to JSON strings
            const weatherDataJson = JSON.stringify(toSendData);
            const locationJson = JSON.stringify(location);
            DEV_LOG && console.log('locationJson', locationJson);
            DEV_LOG && console.log('weatherDataJson', weatherDataJson);

            // Call native Kotlin method to handle broadcasting on background thread
            const GadgetbridgeServiceClass = com.akylas.weather.gadgetbridge.GadgetbridgeService;
            GadgetbridgeServiceClass.broadcastWeather(context, weatherDataJson, locationJson);

            DEV_LOG && console.log('[Gadgetbridge] Weather data sent to native service for broadcasting', Date.now());
        } catch (error) {
            console.error('[Gadgetbridge] Failed to broadcast weather:', error, error.stack);
        }
    }
}

export const gadgetbridgeService = new GadgetbridgeService();
