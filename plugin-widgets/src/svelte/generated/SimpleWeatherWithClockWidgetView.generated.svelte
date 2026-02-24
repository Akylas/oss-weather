<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "SimpleWeatherWithClockWidget"
    import type { Writable } from 'svelte/store';
    import { Template } from '@nativescript-community/svelte-native/components';
    import { formatDate, l } from '~/helpers/locale';
    import { titlecase } from '@nativescript-community/l';
    import { iconService } from '~/services/icon';
    import { colors } from '~/variables';
    import { lc } from '~/helpers/locale';
    import type { WeatherWidgetData, WidgetConfig } from '~/services/widgets/WidgetTypes';
    </script>
    <script lang="ts">
    export let config: WidgetConfig;
    export let data: WeatherWidgetData;
    export let size: { width: number; height: number } = { width: 120, height: 50};

    $: ({ colorWidgetBackground, colorOnSurface, colorOnSurfaceVariant } = $colors);

    function nowTime() {
        return formatDate(new Date(), 'LT');
    }
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={4} class="widget-container">
        {#if size.width >= 180}
            <gridlayout horizontalAlignment="stretch" verticalAlignment="stretch" padding={4}>
                <gridlayout horizontalAlignment="stretch" verticalAlignment="stretch" padding={8} columns="auto,*,auto">
                    <stacklayout verticalAlignment="top" horizontalAlignment="left" orientation="vertical" col={0}>
                        <label fontSize={48} fontWeight={config.settings?.clockBold ?? true ? 700 : 400} color={colorOnSurface} text={nowTime()} marginBottom={4}></label>
                        <label fontSize={14} color={colorOnSurfaceVariant} text={formatDate(new Date(), 'll')}></label>
                    </stacklayout>
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="vertical" col={2}>
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={62} height={62} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                        <label text={data.temperature} fontSize={Math.min(size.width * 0.2, 15)} fontWeight={700} color={colorOnSurface} textAlignment="right"></label>
                        <label text={data.description} fontSize={Math.min(size.width * 0.04, 15)} color={colorOnSurface} textAlignment="right"></label>
                    </stacklayout>
                </gridlayout>
                <stacklayout horizontalAlignment="stretch" verticalAlignment="bottom" orientation="vertical">
                    <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} maxLines={1}></label>
                </stacklayout>
            </gridlayout>
        {:else}
            <gridlayout horizontalAlignment="stretch" verticalAlignment="stretch" padding={3}>
                <stacklayout horizontalAlignment="stretch" verticalAlignment="stretch" orientation="vertical">
                    <stacklayout horizontalAlignment="stretch" orientation="vertical">
                        <label fontSize={Math.min(size.height * 0.24, 40)} fontWeight={config.settings?.clockBold ?? true ? 700 : 400} color={colorOnSurface} textAlignment={size.height <= 50 ? "right" : "left"} text={nowTime()}></label>
                    </stacklayout>
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="horizontal">
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} height={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                        <label text={data.temperature} fontSize={Math.min(size.width * 0.2, 20)} fontWeight={700} color={colorOnSurface}></label>
                    </stacklayout>
                </stacklayout>
                <gridlayout verticalAlignment="bottom" horizontalAlignment="right" rows="*,auto">
                    <label text={data.locationName} fontSize={size.width < 100 ? 8 : size.width < 150 ? 10 : 12} color={colorOnSurfaceVariant} maxLines={1} row={1}></label>
                </gridlayout>
            </gridlayout>
        {/if}
</gridlayout>
