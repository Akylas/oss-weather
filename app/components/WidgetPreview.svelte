<script context="module" lang="ts">
    import { View } from '@nativescript/core';
    import { colors } from '~/variables';
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorSurfaceContainer } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorSurfaceContainer } = $colors);

    // Props
    export let widgetClass: string = 'SimpleWeatherWidget';
    export let locationName: string = 'My Location';
    export let previewWidth: number = 200;
    export let previewHeight: number = 150;

    // Widget kind display names for fallback
    const widgetIcons: Record<string, string> = {
        SimpleWeatherWidget: '☁️',
        SimpleWeatherWithDateWidget: '📅',
        SimpleWeatherWithClockWidget: '🕐',
        HourlyWeatherWidget: '📊',
        DailyWeatherWidget: '📆',
        ForecastWeatherWidget: '🌤️'
    };

    function getIcon(): string {
        return widgetIcons[widgetClass] ?? '☁️';
    }

    // Register native view on Android
    let nativeView: View;

    function onAndroidLoaded(args: any) {
        if (__ANDROID__) {
            // The native view is already set via the element
            nativeView = args.object;
        }
    }
</script>

{#if __ANDROID__}
    <!-- On Android, use the native WidgetPreview component -->
    <widgetPreview
        {widgetClass}
        {locationName}
        width={previewWidth}
        height={previewHeight}
        on:loaded={onAndroidLoaded} />
{:else}
    <!-- On iOS, render a fallback preview since extension views cannot be embedded -->
    <gridlayout
        backgroundColor={colorSurfaceContainer}
        borderRadius={16}
        width={previewWidth}
        height={previewHeight}
        padding="12">
        <stacklayout horizontalAlignment="center" verticalAlignment="center">
            <!-- Icon -->
            <label
                fontSize={36}
                horizontalAlignment="center"
                text={getIcon()} />
            
            <!-- Temperature -->
            <label
                color={colorOnSurface}
                fontSize={24}
                fontWeight="bold"
                horizontalAlignment="center"
                marginTop={8}
                text="8°C" />
            
            <!-- Location -->
            <label
                color={colorOnSurfaceVariant}
                fontSize={12}
                horizontalAlignment="center"
                marginTop={4}
                text={locationName} />
            
            <!-- Widget type indicator -->
            <label
                color={colorOnSurfaceVariant}
                fontSize={10}
                horizontalAlignment="center"
                marginTop={8}
                opacity={0.7}
                text="Preview" />
        </stacklayout>
    </gridlayout>
{/if}
