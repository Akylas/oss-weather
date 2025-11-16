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

            if (action !== '__PACKAGE__.WIDGET_UPDATE_REQUEST') {
                return;
            }

            const widgetId = intent.getIntExtra('widgetId', -1);

            if (widgetId === -1) {
                console.warn('WidgetUpdateReceiver: Received update request with invalid widgetId');
                return;
            }

            console.log(`WidgetUpdateReceiver: Received update request for widgetId=${widgetId}`);
            // Set widget to loading state
            const widgetManager = com.akylas.weather.widgets.WeatherWidgetManager;
            widgetManager.setWidgetLoading(context, widgetId);

            // Then fetch data
            widgetService.updateWidget(widgetId + '');
        } catch (error) {
            console.error('WidgetUpdateReceiver: Error in onReceive:', error, error?.stack);
        }
    }
}
