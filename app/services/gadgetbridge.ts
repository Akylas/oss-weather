import { Application, ApplicationSettings } from '@nativescript/core';
import { WeatherLocation } from './api';
import { Currently, DailyData, WeatherData } from './providers/weather';

const GADGETBRIDGE_ENABLED_KEY = 'gadgetbridge_enabled';

/**
 * Gadgetbridge Service for broadcasting weather data to smartwatches
 * using the LineageOS Weather API protocol with WeatherGz format
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
     * Create WeatherGz format byte array for current weather
     * Format: version(1) + timestamp(8) + temp(4) + condition(4) + humidity(4) + windSpeed(4) + windDir(4)
     */
    private createCurrentWeatherGz(current: Currently): number[] {
        const buffer: number[] = [];
        
        // Version byte
        buffer.push(0x01);
        
        // Timestamp (8 bytes, big-endian long)
        const timestamp = current.time;
        this.writeLong(buffer, timestamp);
        
        // Temperature in Celsius * 100 (4 bytes, big-endian int)
        const temp = Math.round((current.temperature || 0) * 100);
        this.writeInt(buffer, temp);
        
        // Weather condition code (4 bytes, big-endian int)
        const conditionCode = current.iconId || 0;
        this.writeInt(buffer, conditionCode);
        
        // Humidity (4 bytes, big-endian int, 0-100)
        const humidity = Math.round(current.relativeHumidity || 0);
        this.writeInt(buffer, humidity);
        
        // Wind speed in km/h * 100 (4 bytes, big-endian int)
        const windSpeed = Math.round((current.windSpeed || 0) * 100);
        this.writeInt(buffer, windSpeed);
        
        // Wind direction in degrees (4 bytes, big-endian int)
        const windDir = Math.round(current.windBearing || 0);
        this.writeInt(buffer, windDir);
        
        return buffer;
    }

    /**
     * Create WeatherGz format byte array for forecast data
     * Each forecast: timestamp(8) + minTemp(4) + maxTemp(4) + condition(4)
     */
    private createForecastWeatherGz(daily: DailyData[]): number[] {
        const buffer: number[] = [];
        
        // Version byte
        buffer.push(0x01);
        
        // Number of forecast entries (4 bytes)
        this.writeInt(buffer, Math.min(daily.length, 7)); // Limit to 7 days
        
        // Forecast entries (up to 7 days)
        for (let i = 0; i < Math.min(daily.length, 7); i++) {
            const forecast = daily[i];
            
            // Timestamp (8 bytes)
            this.writeLong(buffer, forecast.time);
            
            // Min temperature in Celsius * 100 (4 bytes)
            const minTemp = Math.round((forecast.temperatureMin || forecast.temperature || 0) * 100);
            this.writeInt(buffer, minTemp);
            
            // Max temperature in Celsius * 100 (4 bytes)
            const maxTemp = Math.round((forecast.temperatureMax || forecast.temperature || 0) * 100);
            this.writeInt(buffer, maxTemp);
            
            // Weather condition code (4 bytes)
            const conditionCode = forecast.iconId || 0;
            this.writeInt(buffer, conditionCode);
        }
        
        return buffer;
    }

    /**
     * Write a 64-bit long value in big-endian format
     * Converts millisecond timestamp to seconds to avoid precision loss
     */
    private writeLong(buffer: number[], value: number) {
        // Convert milliseconds to seconds to fit safely in 64-bit
        const seconds = Math.floor(value / 1000);
        
        // Split into high and low 32-bit parts
        const high = Math.floor(seconds / 0x100000000);
        const low = seconds >>> 0; // Ensure unsigned
        
        buffer.push((high >>> 24) & 0xFF);
        buffer.push((high >>> 16) & 0xFF);
        buffer.push((high >>> 8) & 0xFF);
        buffer.push(high & 0xFF);
        buffer.push((low >>> 24) & 0xFF);
        buffer.push((low >>> 16) & 0xFF);
        buffer.push((low >>> 8) & 0xFF);
        buffer.push(low & 0xFF);
    }

    /**
     * Write a 32-bit int value in big-endian format
     */
    private writeInt(buffer: number[], value: number) {
        buffer.push((value >>> 24) & 0xFF);
        buffer.push((value >>> 16) & 0xFF);
        buffer.push((value >>> 8) & 0xFF);
        buffer.push(value & 0xFF);
    }

    /**
     * Convert number array to Java byte array with proper sign handling
     */
    private toJavaByteArray(buffer: number[]): any {
        if (__ANDROID__) {
            const javaArray = Array.create('byte', buffer.length);
            for (let i = 0; i < buffer.length; i++) {
                // Convert to signed byte range (-128 to 127)
                const byte = buffer[i] & 0xFF;
                javaArray[i] = byte > 127 ? byte - 256 : byte;
            }
            return javaArray;
        }
        return null;
    }

    /**
     * Broadcast weather data to Gadgetbridge
     */
    broadcastWeather(location: WeatherLocation, weatherData: WeatherData) {
        if (!this.enabled || !__ANDROID__) {
            return;
        }

        try {
            // Use proper NativeScript API to get application context
            const context = Application.android.context;
            
            // Create WeatherGz data
            const currentWeatherGz = this.createCurrentWeatherGz(weatherData.currently);
            const forecastWeatherGz = this.createForecastWeatherGz(weatherData.daily.data);
            
            // Create intent
            const Intent = android.content.Intent;
            const intent = new Intent('lineageos.intent.action.PUBLISH_WEATHER');
            
            // Add location information
            const locationId = `${location.lat},${location.lon}`;
            intent.putExtra('weather_location_id', locationId);
            intent.putExtra('weather_location', location.name || locationId);
            
            // Add weather data in WeatherGz format
            intent.putExtra('weather', this.toJavaByteArray(currentWeatherGz));
            intent.putExtra('forecast', this.toJavaByteArray(forecastWeatherGz));
            
            // Broadcast to Gadgetbridge
            context.sendBroadcast(intent);
            
            DEV_LOG && console.log('[Gadgetbridge] Weather data broadcasted successfully');
        } catch (error) {
            console.error('[Gadgetbridge] Failed to broadcast weather:', error);
        }
    }
}

export const gadgetbridgeService = new GadgetbridgeService();
