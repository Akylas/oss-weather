<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "SimpleWeatherWidget"
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
    export let size: { width: number; height: number } = { width: 50, height: 50};

    $: ({ colorWidgetBackground, colorOnSurface, colorOnSurfaceVariant } = $colors);
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} class="widget-container">
        {#if size.width < 120}
            <stacklayout horizontalAlignment="stretch" verticalAlignment="stretch" padding={3} orientation="vertical">
                <stacklayout horizontalAlignment="stretch" orientation="vertical">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width * 0.44} height={size.width * 0.44} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="center" verticalAlignment="center"></image>
                    <label text={data.temperature} fontSize={size.width * 0.2} fontWeight={700} color={colorOnSurface} horizontalAlignment="center" verticalAlignment="center"></label>
                </stacklayout>
                <label text={data.locationName} fontSize={8} color={colorOnSurfaceVariant} maxLines={1} horizontalAlignment="center"></label>
            </stacklayout>
        {:else}
            <gridlayout horizontalAlignment="stretch" verticalAlignment="stretch" padding={6}>
                <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} horizontalAlignment="left" maxLines={1}></label>
                <gridlayout horizontalAlignment="stretch" verticalAlignment="stretch" columns="*,auto">
                        <label text={data.temperature} fontSize={Math.min(size.width * 0.16, 30)} fontWeight={700} color={colorOnSurface} horizontalAlignment="left" verticalAlignment="center" col={0}></label>
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={64} height={64} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="center" col={1}></image>
                </gridlayout>
                    <label text={data.description} fontSize={12} color={colorOnSurfaceVariant} textAlignment="right" horizontalAlignment="stretch" verticalAlignment="stretch" visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
            </gridlayout>
        {/if}
</gridlayout>
