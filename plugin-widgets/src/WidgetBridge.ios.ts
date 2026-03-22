import { WidgetConfig } from 'plugin-widgets/WidgetTypes';
import WidgetBridgeBase from './WidgetBridge.common';
import { WidgetConfigManager } from './WidgetConfigManager';
import { WidgetDataManager } from './WidgetDataManager';
import { lang, onLanguageChanged } from '~/helpers/locale';
import { Application, File } from '@nativescript/core';
import { getCurrentLocales } from '@nativescript-community/l';
import { SETTINGS_LANGUAGE } from '@shared/constants';

const TAG = '[WidgetBridge.iOS]';

const groupId = WidgetUtils.suiteName;
export const widgetsUserDefaults = NSUserDefaults.alloc().initWithSuiteName(groupId);
/**
 * Bridge between native iOS widgets and JS weather data
 *
 * ARCHITECTURE OVERVIEW:
 * ======================
 * iOS widgets run in a separate process and CANNOT wake the main app. This is
 * an iOS platform limitation for security and battery life.
 *
 * DATA FLOW:
 * ----------
 * 1. Widget Added (App Closed):
 *    - Widget extension calls notifyWidgetAdded()
 *    - Event persisted to App Group UserDefaults
 *    - Widget shows "Tap to configure" (no weather data yet)
 *
 * 2. User Opens Main App:
 *    - checkPendingWidgetEvents() processes pending events
 *    - onWidgetAdded() fetches weather data
 *    - Weather data saved to App Group container
 *    - Widget auto-refreshes with data
 *
 * 3. Ongoing Updates:
 *    - Main app updates weather data in App Group
 *    - Widgets reload based on their configured frequency
 *    - Background refresh keeps data current
 *
 * WHY WIDGETS DON'T FETCH WEATHER DIRECTLY:
 * ------------------------------------------
 * - Widget extensions have limited capabilities (no background networking)
 * - Would require duplicating all weather logic in Swift
 * - Main app is single source of truth for data
 * - This is standard architecture for iOS widgets
 */
export class WidgetBridge extends WidgetBridgeBase {
    private dataManager: WidgetDataManager;

    constructor() {
        super();
        this.dataManager = new WidgetDataManager();
        this.setupAppGroupContainer();
        this.observeWidgetEvents();
        this.syncTranslations();

        // Check for pending widget events that occurred while app was not running
        this.checkPendingWidgetEvents();

        // Listen for language changes
        try {
            Application.on(SETTINGS_LANGUAGE, () => {
                DEV_LOG && console.log(TAG, 'Language changed, syncing translations');
                this.syncTranslations();
            });
        } catch (error) {
            console.error(TAG, 'Failed to setup language change listener:', error);
        }
    }

    /**
     * Check for pending widget events that occurred while app was suspended
     */
    private checkPendingWidgetEvents() {
        try {
            // Check for last widget event
            this.handleWidgetEvent();

            DEV_LOG && console.log(TAG, 'Checked for pending widget events');
        } catch (error) {
            console.error(TAG, 'Error checking pending widget events:', error, error.stack);
        }
    }

    /**
     * Sync widget translations to App Group
     */
    private syncTranslations() {
        try {
            // Get current translations from @nativescript-community/l
            // Load the JSON translation file

            // Filter to widget-related translations only
            const widgetTranslations: { [key: string]: string } = {};
            const allTranslations: { [key: string]: string } = getCurrentLocales();
            for (const key in allTranslations) {
                if (key.startsWith('widget.') || key === 'daily' || key === 'hourly') {
                    widgetTranslations[key] = allTranslations[key];
                }
            }

            // Save to App Group UserDefaults

            if (widgetsUserDefaults) {
                const data = NSString.stringWithString(JSON.stringify(widgetTranslations)).dataUsingEncoding(NSUTF8StringEncoding);
                widgetsUserDefaults.setObjectForKey(data, 'widget_translations');
                widgetsUserDefaults.synchronize();

                DEV_LOG && console.log(TAG, `Synced ${Object.keys(widgetTranslations).length} widget translations (${lang})`);
            }
        } catch (error) {
            console.error(TAG, 'Failed to sync translations:', error, error.stack);
        }
    }

    /**
     * Observe widget lifecycle events from extension
     */
    private widgetEventObserver: any;
    private widgetEventObserverCallbackFunctionRef: any;
    private observeWidgetEvents() {
        try {
            // Listen for Darwin notifications from widget extension
            this.widgetEventObserver = new interop.Reference<any>(interop.types.void);
            this.widgetEventObserverCallbackFunctionRef = new interop.FunctionReference(observerCallback);
            // Notification name (CFString)
            const notificationName = CFStringCreateWithCString(null, 'com.akylas.weather.widgetEvent', CFStringBuiltInEncodings.kCFStringEncodingUTF8);
            CFNotificationCenterAddObserver(
                CFNotificationCenterGetDarwinNotifyCenter(),
                this.widgetEventObserver,
                this.widgetEventObserverCallbackFunctionRef,
                notificationName,
                null,
                CFNotificationSuspensionBehavior.DeliverImmediately
            );

            DEV_LOG && console.log(TAG, 'Started observing widget events');
        } catch (error) {
            console.error(TAG, 'Failed to setup widget event observer:', error, error.stack);
        }
    }

    /**
     * Handle widget event from extension
     */
    public handleWidgetEvent() {
        try {
            const data = WidgetUtils.dataForKey('last_widget_event');
            if (data) {
                const json = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding);
                const event = JSON.parse(json.toString());

                DEV_LOG && console.log(TAG, 'Widget event received:', event);

                if (event.event === 'widgetAdded') {
                    this.onWidgetAdded(event.widgetId);
                } else if (event.event === 'widgetRemoved') {
                    this.onWidgetRemoved(event.widgetId);
                }
            }
        } catch (error) {
            console.error(TAG, 'Error handling widget event:', error, error.stack);
        }
    }

    /**
     * Setup App Group container for sharing data with widgets
     */
    private setupAppGroupContainer() {
        // Ensure App Group directory exists
        const fileManager = NSFileManager.defaultManager;
        const containerURL = fileManager.containerURLForSecurityApplicationGroupIdentifier(groupId);

        if (containerURL) {
            const widgetDataDir = containerURL.URLByAppendingPathComponent('WidgetData');

            if (!fileManager.fileExistsAtPath(widgetDataDir.path)) {
                try {
                    fileManager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(widgetDataDir, true, null);
                    DEV_LOG && console.log(TAG, 'Created WidgetData directory in App Group');
                } catch (error) {
                    console.error(TAG, 'Failed to create WidgetData directory:', error, error.stack);
                }
            }
        } else {
            console.error(TAG, 'App Group container not available');
        }
    }

    /**
     * Update all widgets with latest data
     */
    async updateAllWidgets(onlyDefaults = false) {
        DEV_LOG && console.log(TAG, `updateAllWidgets called (onlyDefaults=${onlyDefaults}), activeWidgets:${this.getActiveWidgets()}`);

        const configs = WidgetConfigManager.getAllConfigs(true);
        const widgetIds = Object.keys(configs);

        if (widgetIds.length === 0) {
            DEV_LOG && console.log(TAG, 'No widgets to update');
            return;
        }

        for (const widgetId of widgetIds) {
            try {
                const config = configs[widgetId];
                this.updateWidget(widgetId, config);
            } catch (error) {
                console.error(TAG, `Error updating widget ${widgetId}:`, error, error.stack);
            }
        }

        // Reload all widget timelines
        this.reloadAllWidgetTimelines();
    }

    /**
     * Update specific widget
     */
    async updateWidget(widgetId: string, config = WidgetConfigManager.getConfig(widgetId)) {
        DEV_LOG && console.log(TAG, `updateWidget ${widgetId}`);

        try {
            // Set loading state
            this.setWidgetLoading(widgetId);

            // Fetch and format weather data using shared data manager
            const widgetData = await this.dataManager.getWidgetWeatherData(config);

            if (!widgetData) {
                console.warn(TAG, `No weather data available for widget ${widgetId}`);
                // Write null data to show "no location set" message
                this.setWidgetError(widgetId, 'could not load data');
                return;
            }

            // Write data to App Group container
            this.saveWidgetData(widgetId, {
                ...widgetData,
                loadingState: 'loaded'
            });
            this.reloadWidget(widgetId);

            DEV_LOG && console.log(TAG, `Widget ${widgetId} updated successfully`);
        } catch (error) {
            console.error(TAG, `Error updating widget ${widgetId}:`, error, error.stack);
            // Write null on error so widget shows fallback
            this.setWidgetError(widgetId, error.message || 'Unknown error');
        }
    }

    /**
     * Sync update frequency to App Group for widgets
     */
    private syncUpdateFrequency() {
        try {
            const frequency = WidgetConfigManager.getUpdateFrequency();

            if (widgetsUserDefaults) {
                widgetsUserDefaults.setIntegerForKey(frequency, 'widget_update_frequency');
                widgetsUserDefaults.synchronize();
                console.log(`WidgetBridge: Synced update frequency to iOS: ${frequency} minutes`);
            }
        } catch (error) {
            console.error('WidgetBridge: Failed to sync update frequency:', error, error.stack);
        }
    }

    /**
     * Update frequency changed - sync to widgets
     */
    onUpdateFrequencyChanged(frequency: number) {
        try {
            WidgetUtils.setWithValueForKey(frequency, 'widget_update_frequency');
            // Reload all widget timelines to pick up new frequency
            WidgetUtils.reloadAllTimelines();

            console.log(`WidgetBridge: Updated widget frequency to ${frequency} minutes`);
        } catch (error) {
            console.error('WidgetBridge: Failed to update frequency:', error, error.stack);
        }
    }

    private saveWidgetData(widgetId: string, data: any) {
        try {
            const fileManager = NSFileManager.defaultManager;
            const appGroupId = groupId;
            const containerURL = fileManager.containerURLForSecurityApplicationGroupIdentifier(appGroupId);

            if (!containerURL) {
                console.error('WidgetBridge: Failed to get App Group container');
                return;
            }

            const widgetDataDir = containerURL.URLByAppendingPathComponent('WidgetData');

            // Create directory if needed
            if (!fileManager.fileExistsAtPath(widgetDataDir.path)) {
                fileManager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(widgetDataDir, true, null);
            }

            const dataFile = widgetDataDir.URLByAppendingPathComponent(`widget_${widgetId}.json`);
            const jsonString = JSON.stringify(data);
            const nsString = NSString.stringWithString(jsonString);

            nsString.writeToFileAtomicallyEncodingError(dataFile.path, true, NSUTF8StringEncoding);

            console.log(`WidgetBridge: Saved data for widget ${widgetId}`);
        } catch (error) {
            console.error('WidgetBridge: Failed to save widget data:', error, error.stack);
        }
    }

    private setWidgetLoading(widgetId: string) {
        const loadingData = {
            temperature: '',
            iconPath: '',
            description: '',
            locationName: '',
            date: '',
            hourlyData: [],
            dailyData: [],
            forecastData: [],
            lastUpdate: Date.now() / 1000,
            loadingState: 'loading',
            errorMessage: ''
        };

        this.saveWidgetData(widgetId, loadingData);
        this.reloadWidget(widgetId);
    }

    private getActiveWidgets() {
        const data = WidgetUtils.dataForKey('active_widgets');
        if (data) {
            const json = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding);
            DEV_LOG && console.log('getActiveWidgets', data, json);
            return JSON.parse(json.toString());
        }

        return [];
    }

    /**
     * Get widget kind from widget ID
     * Widget IDs are generated as "widget_{family}_{kind}.hashValue"
     */
    private getWidgetKind(widgetId: string): string | null {
        try {
            const activeWidgets = this.getActiveWidgets();
            if (activeWidgets[widgetId]) {
                return activeWidgets[widgetId];
            }

            // Fallback: try to parse from widget ID pattern
            // Widget IDs follow pattern: hash of "widget_{family}_{kind}"
            // We can store this mapping when widget is configured
            const config = WidgetConfigManager.getConfig(widgetId);
            if (config && config.widgetKind) {
                return config.widgetKind;
            }

            return null;
        } catch (error) {
            console.error(TAG, 'Error getting widget kind:', error, error.stack);
            return null;
        }
    }

    /**
     * Reload specific widget timeline
     */
    reloadWidgetTimeline(widgetKind: string) {
        try {
            WidgetUtils.reloadTimelinesOfKind(widgetKind);
            DEV_LOG && console.log(TAG, `Reloaded widget timeline: ${widgetKind}`);
        } catch (error) {
            console.error(TAG, `Error reloading widget timeline ${widgetKind}:`, error, error.stack);
        }
    }

    /**
     * Reload specific widget by ID
     * Maps widget ID to widget kind and reloads that timeline
     */
    private reloadWidget(widgetId: string) {
        try {
            // Get widget kind from configuration
            const widgetKind = this.getWidgetKind(widgetId);

            if (widgetKind) {
                // Reload specific widget kind
                this.reloadWidgetTimeline(widgetKind);
            } else {
                // Fallback to reload all if we can't determine the kind
                WidgetUtils.reloadAllTimelines();
                DEV_LOG && console.log(TAG, `Reloaded all widgets (couldn't determine kind for id: ${widgetId})`);
            }
        } catch (error) {
            console.error(TAG, 'Failed to reload widget:', error, error.stack);
        }
    }

    /**
     * Get widget kinds that support a specific family size
     */
    private getWidgetKindsForFamily(family: 'small' | 'medium' | 'large'): string[] {
        const allKinds = [
            'SimpleWeatherWidget', // small, medium
            'SimpleWeatherWithDateWidget', // medium
            'SimpleWeatherWithClockWidget', // medium
            'HourlyWeatherWidget', // medium, large
            'DailyWeatherWidget', // medium, large
            'ForecastWeatherWidget' // large
        ];

        const familyMap = {
            small: ['SimpleWeatherWidget'],
            medium: ['SimpleWeatherWidget', 'SimpleWeatherWithDateWidget', 'SimpleWeatherWithClockWidget', 'HourlyWeatherWidget', 'DailyWeatherWidget'],
            large: ['HourlyWeatherWidget', 'DailyWeatherWidget', 'ForecastWeatherWidget']
        };

        return familyMap[family] || [];
    }
    /**
     * Reload widgets by family (small, medium, large)
     */
    reloadWidgetsByFamily(family: 'small' | 'medium' | 'large') {
        try {
            // Get all widget kinds that support this family
            const widgetKinds = this.getWidgetKindsForFamily(family);

            for (const kind of widgetKinds) {
                WidgetUtils.reloadTimelinesOfKind(kind);
            }

            DEV_LOG && console.log(TAG, `Reloaded ${widgetKinds.length} widget kinds for family: ${family}`);
        } catch (error) {
            console.error(TAG, `Error reloading widgets for family ${family}:`, error, error.stack);
        }
    }

    private setWidgetError(widgetId: string, error: string) {
        const errorData = {
            temperature: '',
            iconPath: '',
            description: '',
            locationName: '',
            date: '',
            hourlyData: [],
            dailyData: [],
            forecastData: [],
            lastUpdate: Date.now() / 1000,
            loadingState: 'error',
            errorMessage: error
        };

        this.saveWidgetData(widgetId, errorData);
        this.reloadWidget(widgetId);
    }

    /**
     * Called when a widget is added
     */
    onWidgetAdded(widgetId: string) {
        DEV_LOG && console.log(TAG, `onWidgetAdded: ${widgetId}`);

        // Schedule background refresh if this is the first widget
        const configs = WidgetConfigManager.getAllConfigs();
        if (Object.keys(configs).length === 1) {
            const frequency = WidgetConfigManager.getUpdateFrequency();
            this.scheduleWidgetRefresh(frequency);
        }
        // we ensure config exists
        const config = this.loadWidgetConfig(widgetId);
        // Update the widget immediately
        this.updateWidget(widgetId, config);
    }

    /**
     * Called when a widget is removed
     */
    onWidgetRemoved(widgetId: string) {
        DEV_LOG && console.log(TAG, `onWidgetRemoved: ${widgetId}`);

        // Remove widget data file
        this.removeWidgetData(widgetId);

        // If no more widgets, we can't really "cancel" iOS background refresh
        // but we can note it for when handleBackgroundRefresh is called
        const configs = WidgetConfigManager.getAllConfigs(true);
        if (Object.keys(configs).length === 0) {
            DEV_LOG && console.log(TAG, 'No more widgets, background refresh will skip updates');
        }
    }

    /**
     * Get icon path for iOS - copy to App Group container
     */
    private getIconPath(iconName: string, iconTheme: string): string {
        if (!iconName) return '';

        try {
            const appGroupId = groupId;
            const fileManager = NSFileManager.defaultManager;
            const containerURL = fileManager.containerURLForSecurityApplicationGroupIdentifier(appGroupId);

            if (!containerURL) {
                console.error('App Group container not available');
                return '';
            }

            // Create icons directory in App Group
            const iconsDir = containerURL.URLByAppendingPathComponent('WidgetData/icons');
            if (!fileManager.fileExistsAtPath(iconsDir.path)) {
                fileManager.createDirectoryAtURLWithIntermediateDirectoriesAttributesError(iconsDir, true, null);
            }

            const iconFileName = `${iconTheme}_${iconName}.png`;
            const destinationURL = iconsDir.URLByAppendingPathComponent(iconFileName);

            // Check if icon already copied
            if (fileManager.fileExistsAtPath(destinationURL.path)) {
                return destinationURL.path;
            }

            // Find icon in app bundle
            const bundle = NSBundle.mainBundle;
            let iconPath = bundle.pathForResourceOfTypeInDirectory(iconName, 'png', `assets/icon_themes/${iconTheme}`);

            // Fallback to default theme
            if (!iconPath) {
                iconPath = bundle.pathForResourceOfTypeInDirectory(iconName, 'png', 'assets/icon_themes/default');
            }

            if (iconPath) {
                const sourceURL = NSURL.fileURLWithPath(iconPath);
                fileManager.copyItemAtURLToURLError(sourceURL, destinationURL);
                return destinationURL.path;
            }

            return '';
        } catch (error) {
            console.error(`Error copying icon ${iconName}:`, error, error.stack);
            return '';
        }
    }

    /**
     * Remove widget data file from App Group container
     */
    private removeWidgetData(widgetId: string) {
        try {
            const appGroupId = groupId;
            const fileManager = NSFileManager.defaultManager;
            const containerURL = fileManager.containerURLForSecurityApplicationGroupIdentifier(appGroupId);

            if (!containerURL) return;

            const dataFile = containerURL.URLByAppendingPathComponent('WidgetData').URLByAppendingPathComponent(`widget_${widgetId}.json`);

            if (fileManager.fileExistsAtPath(dataFile.path)) {
                fileManager.removeItemAtURLError(dataFile);
                DEV_LOG && console.log(TAG, `Removed widget data for ${widgetId}`);
            }
        } catch (error) {
            console.error(TAG, `Error removing widget data for ${widgetId}:`, error, error.stack);
        }
    }

    /**
     * Reload all widget timelines to show updated data
     */
    private reloadAllWidgetTimelines() {
        try {
            // Use WidgetCenter to reload all timelines
            WidgetUtils.reloadAllTimelines();
            DEV_LOG && console.log(TAG, 'Reloaded all widget timelines');
        } catch (error) {
            console.error(TAG, 'Error reloading widget timelines:', error, error.stack);
        }
    }

    /**
     * Schedule background refresh for widgets
     */
    scheduleWidgetRefresh(intervalMinutes: number) {
        DEV_LOG && console.log(TAG, `scheduleWidgetRefresh: ${intervalMinutes} minutes`);

        // iOS handles widget refresh through Background App Refresh
        // We store the interval but can't directly control when iOS refreshes
        // iOS will call our background refresh handler when it decides to

        // Store the interval for reference
        WidgetConfigManager.setUpdateFrequency(intervalMinutes);
    }

    public saveWidgetConfig(widgetId: string, config: WidgetConfig) {
        try {
            DEV_LOG && console.log(TAG, 'saveWidgetConfig', widgetId, config);

            // Save to WidgetConfigManager (TypeScript side)
            // WidgetConfigManager.saveWidgetConfig(parseInt(widgetId, 10), config ? JSON.stringify(config) : null);

            // Sync to native iOS WidgetSettings
            if (config) {
                const configJson = JSON.stringify(config);
                WidgetUtils.saveWidgetConfigWithWidgetIdConfigJson(widgetId, configJson);

                // Reload the widget to apply new config
                this.reloadWidget(widgetId);
            }
        } catch (error) {
            console.error(TAG, 'Error saving widget config:', error, error.stack);
        }
    }

    public saveKindConfig(widgetKind: string, config: WidgetConfig) {
        try {
            DEV_LOG && console.log(TAG, 'saveKindConfig', widgetKind, config);

            if (config) {
                const configJson = JSON.stringify(config);
                WidgetUtils.saveKindConfigWithWidgetKindConfigJson(widgetKind, configJson);

                // Reload all widgets of this kind
                this.reloadWidgetTimeline(widgetKind);
            }
        } catch (error) {
            console.error(TAG, 'Error saving kind config:', error, error.stack);
        }
    }

    public loadWidgetConfig(widgetId: string): WidgetConfig {
        try {
            const configJson = WidgetUtils.loadWidgetConfigWithWidgetId(widgetId);
            if (configJson) {
                return JSON.parse(configJson);
            }
            return null;
        } catch (error) {
            console.error(TAG, 'Error loading widget config:', error, error.stack);
            return null;
        }
    }

    public loadKindConfig(widgetKind: string): WidgetConfig {
        try {
            const configJson = WidgetUtils.loadKindConfigWithWidgetKind(widgetKind);
            if (configJson) {
                return JSON.parse(configJson);
            }
            return null;
        } catch (error) {
            console.error(TAG, 'Error loading kind config:', error, error.stack);
            return null;
        }
    }

    /**
     * Cleanup
     */
    public destroy() {
        // Remove observer
        if (this.widgetEventObserver) {
            const center = CFNotificationCenterGetDarwinNotifyCenter();
            CFNotificationCenterRemoveObserver(center, this.widgetEventObserver, null, null);
        }
    }
}
export const widgetService = new WidgetBridge();
function observerCallback(center, observer, name, object, userInfo) {
    widgetService.handleWidgetEvent();
}
