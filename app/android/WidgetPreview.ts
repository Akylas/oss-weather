import { Property, View } from '@nativescript/core';

// Define properties for WidgetPreview
export const widgetClassProperty = new Property<WidgetPreview, string>({
    name: 'widgetClass',
    defaultValue: 'SimpleWeatherWidget'
});

export const locationNameProperty = new Property<WidgetPreview, string>({
    name: 'locationName',
    defaultValue: 'My Location'
});

export class WidgetPreview extends View {
    public widgetClass: string = 'SimpleWeatherWidget';
    public locationName: string = 'My Location';

    private containerView: android.widget.FrameLayout;
    private contentView: android.view.View;

    createNativeView(): any {
        const context = this._context;

        // Create a container FrameLayout
        this.containerView = new android.widget.FrameLayout(context);
        this.containerView.setClipChildren(true);

        // Build the widget preview content
        this.updateWidgetContent();

        return this.containerView;
    }

    private updateWidgetContent(): void {
        if (!this.containerView || !this._context) return;

        const context = this._context;

        // Remove old content
        this.containerView.removeAllViews();

        // Create fake widget data based on widget type
        const fakeData = this.createFakeWidgetData();

        // Build a native view that mimics the widget appearance
        this.contentView = this.buildWidgetPreviewView(context, fakeData);
        this.containerView.addView(this.contentView);
    }

    private createFakeWidgetData(): any {
        // Return fake weather data for preview
        return {
            temperature: '8°C',
            locationName: this.locationName || 'My Location',
            description: 'Partly Cloudy',
            iconPath: null,
            hourlyData: [
                { time: '12:00', temperature: '8°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' },
                { time: '13:00', temperature: '9°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' },
                { time: '14:00', temperature: '10°C', iconPath: null, description: 'Sunny', precipAccumulation: '' },
                { time: '15:00', temperature: '11°C', iconPath: null, description: 'Sunny', precipAccumulation: '' },
                { time: '16:00', temperature: '10°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' },
                { time: '17:00', temperature: '9°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' }
            ],
            dailyData: [
                { day: 'Mon', temperatureHigh: '12°C', temperatureLow: '5°C', iconPath: null, description: 'Sunny', precipAccumulation: '' },
                { day: 'Tue', temperatureHigh: '10°C', temperatureLow: '3°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' },
                { day: 'Wed', temperatureHigh: '8°C', temperatureLow: '2°C', iconPath: null, description: 'Rain', precipAccumulation: '2mm' },
                { day: 'Thu', temperatureHigh: '9°C', temperatureLow: '4°C', iconPath: null, description: 'Cloudy', precipAccumulation: '' },
                { day: 'Fri', temperatureHigh: '11°C', temperatureLow: '5°C', iconPath: null, description: 'Sunny', precipAccumulation: '' }
            ]
        };
    }

    private buildWidgetPreviewView(context: android.content.Context, data: any): android.view.View {
        const density = context.getResources().getDisplayMetrics().density;
        const dp = (value: number) => Math.round(value * density);

        // Get colors from theme
        const surfaceColor = android.graphics.Color.parseColor('#1C1B1F');
        const onSurfaceColor = android.graphics.Color.parseColor('#E6E1E5');
        const onSurfaceVariantColor = android.graphics.Color.parseColor('#CAC4D0');

        // Create main container with rounded background
        const container = new android.widget.LinearLayout(context);
        container.setOrientation(android.widget.LinearLayout.VERTICAL);
        container.setGravity(android.view.Gravity.CENTER);
        container.setPadding(dp(16), dp(12), dp(16), dp(12));

        // Create rounded background drawable
        const background = new android.graphics.drawable.GradientDrawable();
        background.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        background.setCornerRadius(dp(16));
        background.setColor(surfaceColor);
        container.setBackground(background);

        // Build content based on widget type
        switch (this.widgetClass) {
            case 'HourlyWeatherWidget':
                this.buildHourlyContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
            case 'DailyWeatherWidget':
                this.buildDailyContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
            case 'SimpleWeatherWithClockWidget':
                this.buildClockContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
            case 'SimpleWeatherWithDateWidget':
                this.buildDateContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
            case 'ForecastWeatherWidget':
                this.buildForecastContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
            case 'SimpleWeatherWidget':
            default:
                this.buildSimpleContent(context, container, data, dp, onSurfaceColor, onSurfaceVariantColor);
                break;
        }

        return container;
    }

    private buildSimpleContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Location header
        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12);
        location.setTextColor(onSurfaceVariant);
        location.setGravity(android.view.Gravity.CENTER);
        container.addView(location);

        // Weather icon placeholder
        const iconText = new android.widget.TextView(context);
        iconText.setText('☁️');
        iconText.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 48);
        iconText.setGravity(android.view.Gravity.CENTER);
        const iconParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        iconParams.setMargins(0, dp(8), 0, dp(8));
        iconText.setLayoutParams(iconParams);
        container.addView(iconText);

        // Temperature
        const temp = new android.widget.TextView(context);
        temp.setText(data.temperature);
        temp.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 32);
        temp.setTextColor(onSurface);
        temp.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        temp.setGravity(android.view.Gravity.CENTER);
        container.addView(temp);

        // Description
        const desc = new android.widget.TextView(context);
        desc.setText(data.description);
        desc.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 14);
        desc.setTextColor(onSurfaceVariant);
        desc.setGravity(android.view.Gravity.CENTER);
        container.addView(desc);
    }

    private buildClockContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Clock
        const clock = new android.widget.TextClock(context);
        clock.setFormat24Hour('HH:mm');
        clock.setFormat12Hour('h:mm a');
        clock.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 36);
        clock.setTextColor(onSurface);
        clock.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        clock.setGravity(android.view.Gravity.CENTER);
        container.addView(clock);

        // Weather row
        const weatherRow = new android.widget.LinearLayout(context);
        weatherRow.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        weatherRow.setGravity(android.view.Gravity.CENTER);
        const rowParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        rowParams.setMargins(0, dp(8), 0, 0);
        weatherRow.setLayoutParams(rowParams);

        // Icon
        const icon = new android.widget.TextView(context);
        icon.setText('☁️');
        icon.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 32);
        weatherRow.addView(icon);

        // Temperature
        const temp = new android.widget.TextView(context);
        temp.setText('  ' + data.temperature);
        temp.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 24);
        temp.setTextColor(onSurface);
        temp.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        weatherRow.addView(temp);

        container.addView(weatherRow);

        // Location
        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
        location.setTextColor(onSurfaceVariant);
        location.setGravity(android.view.Gravity.CENTER);
        const locParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        locParams.setMargins(0, dp(8), 0, 0);
        location.setLayoutParams(locParams);
        container.addView(location);
    }

    private buildDateContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Date
        const dateFormat = new java.text.SimpleDateFormat('EEEE, MMM d', java.util.Locale.getDefault());
        const dateText = new android.widget.TextView(context);
        dateText.setText(dateFormat.format(new java.util.Date()));
        dateText.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12);
        dateText.setTextColor(onSurfaceVariant);
        dateText.setGravity(android.view.Gravity.CENTER);
        container.addView(dateText);

        // Weather row
        const weatherRow = new android.widget.LinearLayout(context);
        weatherRow.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        weatherRow.setGravity(android.view.Gravity.CENTER);
        const rowParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        rowParams.setMargins(0, dp(12), 0, dp(12));
        weatherRow.setLayoutParams(rowParams);

        // Icon
        const icon = new android.widget.TextView(context);
        icon.setText('☁️');
        icon.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 32);
        weatherRow.addView(icon);

        // Temperature
        const temp = new android.widget.TextView(context);
        temp.setText('  ' + data.temperature);
        temp.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 20);
        temp.setTextColor(onSurface);
        temp.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        weatherRow.addView(temp);

        container.addView(weatherRow);

        // Location
        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
        location.setTextColor(onSurfaceVariant);
        location.setGravity(android.view.Gravity.CENTER);
        container.addView(location);
    }

    private buildHourlyContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Location header
        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 14);
        location.setTextColor(onSurfaceVariant);
        const locParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        locParams.setMargins(0, 0, 0, dp(8));
        location.setLayoutParams(locParams);
        container.addView(location);

        // Hourly row
        const hourlyRow = new android.widget.LinearLayout(context);
        hourlyRow.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        hourlyRow.setGravity(android.view.Gravity.CENTER);

        const hourlyData = data.hourlyData.slice(0, 6);
        for (const hour of hourlyData) {
            const hourColumn = this.createHourColumn(context, hour, dp, onSurface, onSurfaceVariant);
            hourlyRow.addView(hourColumn);
        }

        container.addView(hourlyRow);
    }

    private createHourColumn(context: android.content.Context, hour: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): android.widget.LinearLayout {
        const column = new android.widget.LinearLayout(context);
        column.setOrientation(android.widget.LinearLayout.VERTICAL);
        column.setGravity(android.view.Gravity.CENTER);
        column.setPadding(dp(8), 0, dp(8), 0);

        // Time
        const time = new android.widget.TextView(context);
        time.setText(hour.time);
        time.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
        time.setTextColor(onSurfaceVariant);
        time.setGravity(android.view.Gravity.CENTER);
        column.addView(time);

        // Icon
        const icon = new android.widget.TextView(context);
        icon.setText('☁️');
        icon.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 24);
        icon.setGravity(android.view.Gravity.CENTER);
        const iconParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        iconParams.setMargins(0, dp(4), 0, dp(4));
        icon.setLayoutParams(iconParams);
        column.addView(icon);

        // Temperature
        const temp = new android.widget.TextView(context);
        temp.setText(hour.temperature);
        temp.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 14);
        temp.setTextColor(onSurface);
        temp.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        temp.setGravity(android.view.Gravity.CENTER);
        column.addView(temp);

        return column;
    }

    private buildDailyContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Location header
        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 14);
        location.setTextColor(onSurfaceVariant);
        const locParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        locParams.setMargins(0, 0, 0, dp(8));
        location.setLayoutParams(locParams);
        container.addView(location);

        // Daily rows
        const dailyData = data.dailyData.slice(0, 4);
        for (const day of dailyData) {
            const dayRow = this.createDayRow(context, day, dp, onSurface, onSurfaceVariant);
            container.addView(dayRow);
        }
    }

    private createDayRow(context: android.content.Context, day: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): android.widget.LinearLayout {
        const row = new android.widget.LinearLayout(context);
        row.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        row.setGravity(android.view.Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(4), 0, dp(4));

        // Day name
        const dayName = new android.widget.TextView(context);
        dayName.setText(day.day);
        dayName.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12);
        dayName.setTextColor(onSurface);
        const dayParams = new android.widget.LinearLayout.LayoutParams(0, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        dayName.setLayoutParams(dayParams);
        row.addView(dayName);

        // Icon
        const icon = new android.widget.TextView(context);
        icon.setText('☁️');
        icon.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 20);
        icon.setGravity(android.view.Gravity.CENTER);
        const iconParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        iconParams.setMargins(dp(8), 0, dp(8), 0);
        icon.setLayoutParams(iconParams);
        row.addView(icon);

        // High/Low temps
        const temps = new android.widget.TextView(context);
        temps.setText(day.temperatureHigh + ' / ' + day.temperatureLow);
        temps.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 12);
        temps.setTextColor(onSurface);
        temps.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        row.addView(temps);

        return row;
    }

    private buildForecastContent(context: android.content.Context, container: android.widget.LinearLayout, data: any, dp: (v: number) => number, onSurface: number, onSurfaceVariant: number): void {
        // Current weather header
        const headerRow = new android.widget.LinearLayout(context);
        headerRow.setOrientation(android.widget.LinearLayout.HORIZONTAL);
        headerRow.setGravity(android.view.Gravity.CENTER_VERTICAL);

        // Icon
        const icon = new android.widget.TextView(context);
        icon.setText('☁️');
        icon.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 32);
        headerRow.addView(icon);

        // Temp and location
        const tempLoc = new android.widget.LinearLayout(context);
        tempLoc.setOrientation(android.widget.LinearLayout.VERTICAL);
        tempLoc.setPadding(dp(8), 0, 0, 0);

        const temp = new android.widget.TextView(context);
        temp.setText(data.temperature);
        temp.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 24);
        temp.setTextColor(onSurface);
        temp.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        tempLoc.addView(temp);

        const location = new android.widget.TextView(context);
        location.setText(data.locationName);
        location.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
        location.setTextColor(onSurfaceVariant);
        tempLoc.addView(location);

        headerRow.addView(tempLoc);
        container.addView(headerRow);

        // Hourly label
        const hourlyLabel = new android.widget.TextView(context);
        hourlyLabel.setText('Hourly');
        hourlyLabel.setTextSize(android.util.TypedValue.COMPLEX_UNIT_SP, 11);
        hourlyLabel.setTextColor(onSurfaceVariant);
        const labelParams = new android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        );
        labelParams.setMargins(0, dp(8), 0, dp(4));
        hourlyLabel.setLayoutParams(labelParams);
        container.addView(hourlyLabel);

        // Hourly scroll
        const hourlyScroll = new android.widget.HorizontalScrollView(context);
        const hourlyRow = new android.widget.LinearLayout(context);
        hourlyRow.setOrientation(android.widget.LinearLayout.HORIZONTAL);

        const hourlyData = data.hourlyData.slice(0, 6);
        for (const hour of hourlyData) {
            const col = this.createHourColumn(context, hour, dp, onSurface, onSurfaceVariant);
            hourlyRow.addView(col);
        }
        hourlyScroll.addView(hourlyRow);
        container.addView(hourlyScroll);
    }

    [widgetClassProperty.setNative](value: string) {
        this.widgetClass = value;
        if (this.containerView) {
            this.updateWidgetContent();
        }
    }

    [locationNameProperty.setNative](value: string) {
        this.locationName = value;
        if (this.containerView) {
            this.updateWidgetContent();
        }
    }

    disposeNativeView(): void {
        super.disposeNativeView();
        this.containerView = null;
        this.contentView = null;
    }
}

widgetClassProperty.register(WidgetPreview);
locationNameProperty.register(WidgetPreview);
