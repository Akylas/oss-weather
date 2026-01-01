import { widgetService } from '~/services/widgets/WidgetBridge';

/**
 * Native BroadcastReceiver that can be registered in AndroidManifest.xml
 * Handles widget update requests even when app is not running
 */
@NativeClass()
@JavaProxy('__PACKAGE__.WidgetUpdateReceiver')
export class WidgetUpdateReceiver extends android.content.BroadcastReceiver {
    constructor() {
        super();
        return global.__native(this);
    }

    onReceive(context: android.content.Context, intent: android.content.Intent): void {
        try {
            const action = intent.getAction();

            DEV_LOG && console.log(`WidgetUpdateReceiver: onReceive action=${action}`);
            if (action === '__PACKAGE__.WIDGET_UPDATE_REQUEST') {
                const widgetId = intent.getIntExtra('widgetId', -1);

                if (widgetId === -1) {
                    console.warn('WidgetUpdateReceiver: Received update request with invalid widgetId');
                    return;
                }

                DEV_LOG && console.log(`WidgetUpdateReceiver: Received update request for widgetId=${widgetId}`);
                // Set widget to loading state
                const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
                widgetManager.setWidgetLoading(context, widgetId);

                // Then fetch data and update widget
                widgetService.updateWidget(widgetId + '').catch((error) => {
                    console.error(`WidgetUpdateReceiver: Error updating widget ${widgetId}:`, error, error.stack);
                    widgetManager.setWidgetError(context, widgetId, error.message || 'Update failed');
                });
            } else if (action === '__PACKAGE__.WIDGET_ADDED') {
                const widgetId = intent.getIntExtra('widgetId', -1);
                DEV_LOG && console.log(`WidgetUpdateReceiver: Widget added, widgetId=${widgetId}`);
                
                widgetService.reloadConfigs();
                
                // Request SCHEDULE_EXACT_ALARM permission for clock widgets on Android 12+
                if (widgetId !== -1 && android.os.Build.VERSION.SDK_INT >= 31) { // Android 12+
                    try {
                        const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
                        const config = widgetManager.getWidgetConfig(context, widgetId);
                        
                        if (config && config.widgetKind === 'SimpleWeatherWithClockWidget') {
                            const alarmManager = context.getSystemService(android.content.Context.ALARM_SERVICE) as android.app.AlarmManager;
                            
                            if (!alarmManager.canScheduleExactAlarms()) {
                                console.log('WidgetUpdateReceiver: Clock widget added but SCHEDULE_EXACT_ALARM not granted, opening settings');
                                
                                // Open settings to allow user to grant the permission
                                const settingsIntent = new android.content.Intent(
                                    android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
                                );
                                settingsIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                                context.startActivity(settingsIntent);
                            }
                        }
                    } catch (error) {
                        console.error('WidgetUpdateReceiver: Error checking clock permission:', error);
                    }
                }
            }
        } catch (error) {
            console.error('WidgetUpdateReceiver: Error in onReceive:', error, error?.stack);
        }
    }
}
