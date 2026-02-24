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

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={6} class="widget-container">
        {#if size.width < 120}
            <stacklayout padding={3} horizontalAlignment="center" orientation="vertical">
                <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="vertical">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width * 0.44} height={size.width * 0.44} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                    <label text={data.temperature} fontSize={size.width * 0.2} fontWeight={700} color={colorOnSurface}></label>
                </stacklayout>
                <label text={data.locationName} fontSize={8} color={colorOnSurfaceVariant} maxLines={1}></label>
            </stacklayout>
        {:else}
            <gridlayout padding={6}>
                <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} maxLines={1}></label>
                <stacklayout verticalAlignment="top" orientation="horizontal">
                    <stacklayout verticalAlignment="center" horizontalAlignment="left" orientation="vertical">
                        <label text={data.temperature} fontSize={Math.min(size.width * 0.16, 30)} fontWeight={700} color={colorOnSurface}></label>
                    </stacklayout>
                    <stacklayout verticalAlignment="center" horizontalAlignment="right" orientation="vertical">
                        <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={64} height={64} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                    </stacklayout>
                </stacklayout>
                <gridlayout visibility={(data.description != null) ? 'visible' : 'collapsed'}>
                    <label text={data.description} fontSize={12} color={colorOnSurfaceVariant} textAlignment="right"></label>
                </gridlayout>
            </gridlayout>
        {/if}
</gridlayout>
