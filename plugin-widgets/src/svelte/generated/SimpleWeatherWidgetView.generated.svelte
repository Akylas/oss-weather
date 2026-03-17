<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "SimpleWeatherWidget"
    import { Template } from '@nativescript-community/svelte-native/components';
    import { formatDate, l, lc } from '~/helpers/locale';
    import { titlecase } from '@nativescript-community/l';
    import { iconService } from '~/services/icon';
    import { colors } from '~/variables';
    import type { WeatherWidgetData, WidgetConfig } from '~/services/widgets/WidgetTypes';
</script>
<script lang="ts">
    export let config: WidgetConfig;
    export let data: WeatherWidgetData;
    export let size: { width: number; height: number } = { width: 50, height: 50};

    $: ({ colorOnSurface, colorOnSurfaceVariant, colorWidgetBackground } = $colors);
</script>

<gridlayout width={size.width} height={size.height} {...$$restProps} backgroundColor={colorWidgetBackground} class="widget-container">
    {#if size.width < 120}
        <stacklayout padding={3} orientation="vertical">
            <stacklayout orientation="vertical" horizontalAlignment="center">
                <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width * 0.44} height={size.width * 0.44} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="center" verticalAlignment="center"></image>
                <label text={data.temperature} fontSize={size.width * 0.2} fontWeight={700} color={colorOnSurface} horizontalAlignment="center" verticalAlignment="center"></label>
            </stacklayout>
            <label text={data.locationName} fontSize={8} color={colorOnSurfaceVariant} maxLines={1} horizontalAlignment="center"></label>
        </stacklayout>
    {:else}
        <gridlayout paddingLeft={10} paddingRight={10} paddingTop={6} paddingBottom={6}>
            <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} horizontalAlignment="left" maxLines={1}></label>
            <gridlayout columns="auto,*">
                    <label text={data.temperature} fontSize={Math.min(size.width * 0.26, 30)} fontWeight={700} color={colorOnSurface} horizontalAlignment="left" verticalAlignment="center" col={0}></label>
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={64} height={64} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="center" col={1}></image>
            </gridlayout>
                <label text={data.description} fontSize={12} color={colorOnSurfaceVariant} textAlignment="right" verticalAlignment="bottom" horizontalAlignment="right" visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
        </gridlayout>
    {/if}
</gridlayout>
