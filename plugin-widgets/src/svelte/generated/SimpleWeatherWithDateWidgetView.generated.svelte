<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "SimpleWeatherWithDateWidget"
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
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={6} class="widget-container">
        <stacklayout verticalAlignment="center" horizontalAlignment="stretch" padding={size.height < 60 ? 2 : size.height < 80 ? 4 : 6} orientation="vertical">
            {#if size.width >= 200}
                <stacklayout verticalAlignment="top" horizontalAlignment="stretch" orientation="vertical">
                    <stacklayout verticalAlignment="space-between" horizontalAlignment="left" orientation="horizontal" marginBottom={4}>
                        <stacklayout verticalAlignment="top" horizontalAlignment="left" orientation="vertical">
                            <label fontSize={20} fontWeight={700} color={colorOnSurface} marginBottom={2}></label>
                            <label fontSize={14} color={colorOnSurfaceVariant}></label>
                        </stacklayout>
                        <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                            <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={56} height={56} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} marginBottom={4}></image>
                            <label text={data.temperature} fontSize={24} fontWeight={700} color={colorOnSurface} textAlignment="right"></label>
                        </stacklayout>
                    </stacklayout>
                </stacklayout>
            {:else}
                <stacklayout verticalAlignment="center" horizontalAlignment="center" padding={size.height < 60 ? 2 : 4} orientation="vertical">
                    <label fontSize={size.width < 150 ? size.height < 60 ? 14 : size.height < 80 ? 18 : 22 : size.height < 80 ? 20 : 28} fontWeight={700} color={colorOnSurface}></label>
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" padding={size.height < 60 ? 4 : 8} orientation="horizontal">
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.height < 60 ? 28 : size.height < 80 ? 36 : 48} height={size.height < 60 ? 28 : size.height < 80 ? 36 : 48} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                        <label text={data.temperature} fontSize={size.height < 60 ? 18 : size.height < 80 ? 24 : 32} fontWeight={700} color={colorOnSurface}></label>
                    </stacklayout>
                </stacklayout>
            {/if}
            <label text={data.locationName} fontSize={size.height < 60 ? 9 : size.height < 80 ? 11 : 12} color={colorOnSurfaceVariant} maxLines={1} textAlignment={size.width >= 200 ? "start" : "center"}></label>
        </stacklayout>
</gridlayout>
