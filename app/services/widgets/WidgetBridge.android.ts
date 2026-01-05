// app/services/widgets/android/AndroidWidgetBridge.ts
// Android-specific widget bridge using shared logic

import { Application, Device, Utils, knownFolders, path } from '@nativescript/core';
import { WidgetDataManager, isDefaultLocation } from './WidgetDataManager';
import { WidgetConfigManager } from './WidgetConfigManager';
import WidgetBridgeBase from './WidgetBridge.common';
import { WeatherWidgetData } from './WidgetTypes';

/**
 * Bridge between native Android widgets and JS weather data
 */
export class WidgetBridge extends WidgetBridgeBase {
    private dataManager: WidgetDataManager;

    constructor() {
        super();
        this.dataManager = new WidgetDataManager();
        this.initializeWorkManager();
    }

    /**
     * Initialize WorkManager scheduling based on active widgets
     */
    private initializeWorkManager() {
        try {
            const context = Utils.android.getApplicationContext();
            const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;

            // Schedule updates if widgets are present (this will auto-cancel if none exist)
            const frequency = WidgetConfigManager.getUpdateFrequency();
            DEV_LOG && console.info('scheduleWidgetUpdates', frequency);
            widgetManager.scheduleWidgetUpdates(context, frequency);

            console.log('WidgetBridge: Initialized WorkManager scheduling');
        } catch (error) {
            console.error('WidgetBridge: Failed to initialize WorkManager:', error, error.stack);
        }
    }

    /**
     * Update all widgets with latest data
     */
    async updateAllWidgets(onlyDefaults = false) {
        DEV_LOG && console.info('updateAllWidgets');
        const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
        const context = Utils.android.getApplicationContext();
        widgetManager.requestAllWidgetsUpdate(context);
        // const configs = WidgetConfigManager.getAllConfigs();
        // for (const widgetId of Object.keys(configs)) {
        //     try {
        //         const config = configs[widgetId];
        //         if (onlyDefaults && isDefaultLocation(config.locationName)) {
        //             continue;
        //         }
        //         await this.updateWidget(widgetId, config);
        //     } catch (error) {
        //         console.error(`Error updating widget ${widgetId}:`, error);
        //     }
        // }
    }
    /**
     * Handle widget update request from native side
     */
    async updateWidget(widgetId: string, config = WidgetConfigManager.getConfig(widgetId)) {
        try {
            DEV_LOG && console.info('updateWidget', widgetId);
            if (!config) {
                console.error(`No configuration found for widget ${widgetId}`);
                return;
            }

            // Fetch and format weather data using shared data manager
            const widgetData = await this.dataManager.getWidgetWeatherData(config);

            // Get icon paths for Android
            // const dataWithIconPaths = this.resolveIconPaths(widgetData);

            // Send data back to native
            this.sendWeatherDataToWidget(parseInt(widgetId, 10), widgetData);
        } catch (error) {
            console.error(`Error updating widget ${widgetId}:`, error, error.stack);
        }
    }

    /**
     * Send formatted weather data to native widget
     */
    private sendWeatherDataToWidget(widgetId: number, data: WeatherWidgetData) {
        try {
            const context = Utils.android.getApplicationContext();
            const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
            // Update widget
            widgetManager.updateWidgetData(context, widgetId, data ? JSON.stringify(data) : null);
        } catch (error) {
            console.error('Error sending data to widget:', error, error.stack);
        }
    }

    /**
     * Cleanup
     */
    public destroy() {}
}
export const widgetService = new WidgetBridge();
