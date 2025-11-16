import { View } from '@nativescript/core';

export class WidgetPreview extends View {
    private remoteViews: any;
    private widgetProvider: any;

    createNativeView(): any {
        // Get the widget provider class
        const SimpleWeatherWidget = com.akylas.weather.widgets.SimpleWeatherWidget;
        this.widgetProvider = new SimpleWeatherWidget();

        // Create a container for the widget
        const context = this._context;
        const remoteViews = new android.widget.RemoteViews(
            context.getPackageName(),
            android.R.layout.simple_list_item_1 // Placeholder, widget will replace
        );

        // Get AppWidgetManager
        const appWidgetManager = android.appwidget.AppWidgetManager.getInstance(context);

        // Create fake widget data
        const fakeData = new com.akylas.weather.widgets.WeatherWidgetData(
            '8°C',
            'Grenoble',
            null, // iconPath
            'Partly Cloudy',
            com.akylas.weather.widgets.WidgetLoadingState.LOADED,
            null, // errorMessage
            [], // hourlyData
            [] // dailyData
        );

        // For Glance-based widgets, you'll need to render to a view
        // This is tricky because Glance is designed for app widgets
        // Better approach: Use Android's AppWidgetHostView

        const hostView = new android.appwidget.AppWidgetHostView(context);
        const appWidgetId = 0; // Fake ID for preview

        // Set up the host view
        hostView.setAppWidget(appWidgetId, this.widgetProvider.getAppWidgetInfo());

        return hostView;
    }
    disposeNativeView(): void {
        super.disposeNativeView();
        this.remoteViews = null;
        this.widgetProvider = null;
    }
}
