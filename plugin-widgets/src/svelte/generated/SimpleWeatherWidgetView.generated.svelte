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

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={size.width < 100 ? 4 : size.width < 150 ? 6 : 8} class="widget-container">
        {#if size.width < 120}
            <stacklayout padding={10} verticalAlignment="center" horizontalAlignment="center" orientation="vertical">
                <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={32} height={32} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} marginBottom={4}></image>
                <label text={data.temperature} fontSize={14} fontWeight={700} color={colorOnSurface} marginBottom={4}></label>
                <label text={data.locationName} fontSize={8} color={colorOnSurfaceVariant} maxLines={1}></label>
            </stacklayout>
        {:else}
            <stacklayout verticalAlignment="center" padding={10} horizontalAlignment="left" orientation="horizontal">
                <stacklayout verticalAlignment="center" horizontalAlignment="left" orientation="vertical">
                    <label text={data.temperature} fontSize={40} fontWeight={700} color={colorOnSurface} marginBottom={8}></label>
                    <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} maxLines={1}></label>
                </stacklayout>
                <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={64} height={64} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                    <label text={data.description} fontSize={12} color={colorOnSurfaceVariant} textAlignment="right" visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
                </stacklayout>
            </stacklayout>
        {/if}
</gridlayout>
