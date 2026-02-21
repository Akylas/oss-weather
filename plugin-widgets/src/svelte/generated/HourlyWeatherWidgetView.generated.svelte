<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "HourlyWeatherWidget"
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
    export let size: { width: number; height: number } = { width: 260, height: 60};

    $: ({ colorWidgetBackground, colorOnSurface, colorOnSurfaceVariant } = $colors);
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={6} class="widget-container">
        <stacklayout verticalAlignment="top" horizontalAlignment="stretch" padding={size.height < 60 ? 2 : size.height < 80 ? 4 : 6} orientation="vertical">
            {#if size.height >= 80}
                <stacklayout horizontalAlignment="left" orientation="vertical">
                    <label text={data.locationName} fontSize={14} fontWeight={500} color={colorOnSurface} textAlignment="left" maxLines={1} marginBottom={2}></label>
                </stacklayout>
            {:else}

            {/if}
            <collectionview items={data.hourlyData?.slice(0, 8)} showIndicators={false} orientation="horizontal">
                <Template let:item>
                <stacklayout verticalAlignment="center" horizontalAlignment="center" width={53} paddingLeft={4} paddingRight={4} padding={size.height < 60 ? 0 : 2} orientation="vertical">
                    <label text={item.time} fontSize={size.height < 60 ? 9 : 11} color={colorOnSurfaceVariant} maxLines={1}></label>
                    <image src={item.iconPath} width={size.height < 60 ? 24 : size.height < 80 ? 28 : 32} height={size.height < 60 ? 24 : size.height < 80 ? 28 : 32}></image>
                    <label text={item.temperature} fontSize={size.height < 60 ? 12 : 14} fontWeight={700} color={colorOnSurface} maxLines={1}></label>
                    {#if size.height >= 60 && item.precipAccumulation != null}
                        <stacklayout orientation="vertical">
                            <label text={item.precipAccumulation} fontSize={size.height < 80 ? 9 : 10} color={colorOnSurfaceVariant}></label>
                        </stacklayout>
                    {:else}

                    {/if}
                </stacklayout>
                </Template>
            </collectionview>
        </stacklayout>
</gridlayout>
