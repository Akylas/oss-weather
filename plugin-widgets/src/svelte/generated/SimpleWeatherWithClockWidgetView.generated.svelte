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
    export let size: { width: number; height: number } = { width: 80, height: 80};

    $: ({ colorWidgetBackground, colorOnSurface, colorOnSurfaceVariant } = $colors);

    function nowTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={8} class="widget-container">
        {#if size.width >= 180}
            <gridlayout>
                <stacklayout verticalAlignment="space-between" horizontalAlignment="left" padding={8} orientation="horizontal">
                    <stacklayout verticalAlignment="top" horizontalAlignment="left" padding={4} orientation="vertical">
                        <label fontSize={48} fontWeight={config.settings?.clockBold ?? true ? 700 : 400} color={colorOnSurface} textAlignment="left" text={nowTime()}></label>
                        <label fontSize={14} color={colorOnSurfaceVariant} textAlignment="left"></label>
                    </stacklayout>
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="vertical">
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={62} height={62} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                        <label text={data.temperature} fontSize={28} fontWeight={700} color={colorOnSurface} textAlignment="right"></label>
                    </stacklayout>
                </stacklayout>
                <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                    <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} maxLines={1} paddingLeft={14} paddingRight={14}></label>
                </stacklayout>
            </gridlayout>
        {:else}
            <gridlayout padding={size.width < 100 ? 4 : size.width < 150 ? 6 : 8}>
                <stacklayout verticalAlignment="top" horizontalAlignment="center" padding={size.width < 100 ? 2 : size.width < 150 ? 4 : 8} orientation="vertical">
                    <label fontSize={size.width < 100 ? 24 : size.width < 150 ? 32 : 48} fontWeight={config.settings?.clockBold ?? true ? 700 : 400} color={colorOnSurface} text={nowTime()}></label>
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" padding={size.width < 100 ? 4 : size.width < 150 ? 6 : 8} orientation="horizontal">
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} height={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                        <label text={data.temperature} fontSize={size.width < 100 ? 18 : size.width < 150 ? 24 : 32} fontWeight={700} color={colorOnSurface}></label>
                    </stacklayout>
                </stacklayout>
                <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                    <label text={data.locationName} fontSize={size.width < 100 ? 8 : size.width < 150 ? 10 : 12} color={colorOnSurfaceVariant} maxLines={1}></label>
                </stacklayout>
            </gridlayout>
        {/if}
</gridlayout>
