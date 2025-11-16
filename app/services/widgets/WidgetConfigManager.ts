// app/services/widgets/shared/WidgetConfigManager.ts
// Shared configuration management for widgets (platform-agnostic)

import { ApplicationSettings, Utils } from '@nativescript/core';
import { DEFAULT_UPDATE_FREQUENCY, WidgetConfig } from './WidgetTypes';

const WIDGET_CONFIGS_KEY = 'widget_configs';
const UPDATE_FREQUENCY_KEY = 'widget_update_frequency';

const TAG = '[WidgetConfigManager]';

export class WidgetConfigManager {
    static configs: { [k: string]: WidgetConfig };

    static loadConfigs() {
        const data = ApplicationSettings.getString(WIDGET_CONFIGS_KEY);
        if (data) {
            try {
                this.configs = JSON.parse(data);
            } catch (error) {
                this.configs = {};
            }
        } else {
            this.configs = {};
        }
    }
    /**
     * Get all widget configurations
     */
    static getAllConfigs() {
        if (!this.configs) {
            this.loadConfigs();
        }
        return this.configs;
    }

    /**
     * Get configuration for specific widget
     */
    static getConfig(widgetId: string): WidgetConfig {
        const configs = this.getAllConfigs();
        if (!configs[widgetId]) {
            this.saveConfig(widgetId, this.createDefaultConfig());
        }
        DEV_LOG && console.log(TAG, 'getConfig', widgetId, configs[widgetId]);
        return configs[widgetId];
    }

    /**
     * Save configuration for specific widget
     */
    static saveConfig(widgetId: string, config: WidgetConfig, widgetKind?: string): void {
        const configs = this.getAllConfigs();
        configs[widgetId] = {
            ...config,
            widgetKind: widgetKind || config.widgetKind
        };
        this.saveAllConfigs();
    }

    /**
     * Save all configurations
     */
    static saveAllConfigs(): void {
        ApplicationSettings.setString(WIDGET_CONFIGS_KEY, JSON.stringify(this.configs));
    }

    /**
     * Delete configuration for specific widget
     */
    static deleteConfig(widgetId: string): void {
        const configs = this.getAllConfigs();
        delete configs[widgetId];
        this.saveAllConfigs();
    }

    /**
     * Get update frequency
     */
    static getUpdateFrequency(): number {
        return ApplicationSettings.getNumber(UPDATE_FREQUENCY_KEY, DEFAULT_UPDATE_FREQUENCY);
    }

    /**
     * Set update frequency and update native scheduling
     */
    static setUpdateFrequency(minutes: number): void {
        DEV_LOG && console.log(TAG, 'setUpdateFrequency', minutes);
        ApplicationSettings.setNumber(UPDATE_FREQUENCY_KEY, minutes);

        // Update native scheduling based on platform
        if (__ANDROID__) {
            try {
                const context = Utils.android.getApplicationContext();
                const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
                widgetManager.setUpdateFrequency(context, minutes);
                DEV_LOG && console.log(TAG, 'Updated Android WorkManager schedule with frequency:', minutes);
            } catch (error) {
                console.error(TAG, 'Failed to update Android WorkManager schedule:', error);
            }
        } else if (__IOS__) {
            try {
                // iOS: Background refresh is system-controlled, but we can update our preference
                // The actual refresh will happen when iOS decides based on usage patterns
                DEV_LOG && console.log(TAG, 'Updated iOS refresh frequency preference:', minutes);
            } catch (error) {
                console.error(TAG, 'Failed to update iOS refresh preference:', error);
            }
        }
    }

    /**
     * Create default config for new widget
     */
    static createDefaultConfig(): WidgetConfig {
        return {
            locationName: 'current'
        };
    }
}
