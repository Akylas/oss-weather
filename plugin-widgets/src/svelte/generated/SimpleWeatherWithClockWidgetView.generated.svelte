<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "SimpleWeatherWithClockWidget"
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
    export let size: { width: number; height: number } = { width: 120, height: 50};

    $: ({ colorOnSurface } = $colors);

    function nowTime() {
        return formatDate(new Date(), 'LT');
    }
</script>

<gridlayout width={size.width} height={size.height} {...$$restProps} class="widget-container">
    {#if size.width >= 180}
        <gridlayout paddingLeft={10} paddingRight={10} paddingTop={6} paddingBottom={6}>
            <gridlayout columns="*,auto">
                <stacklayout orientation="vertical" col={0} verticalAlignment="center" horizontalAlignment="center">
                    <label fontSize={Math.min(size.width * 0.15, 50)} fontWeight={config.settings?.clockBold == true ? "bold" : "normal"} color={data.config.settings.color == null ? "onSurface" : data.config.settings.color} text={nowTime()} horizontalAlignment="left" verticalAlignment="center"></label>
                    <absolutelayout height={4} horizontalAlignment="left" verticalAlignment="center"></absolutelayout>
                    <label fontSize={14} opacity={0.6} color={data.config.settings.color == null ? "onSurface" : data.config.settings.color} text={formatDate(new Date(), 'll')} horizontalAlignment="left" verticalAlignment="center"></label>
                </stacklayout>
                <stacklayout orientation="vertical" col={1} verticalAlignment="center" horizontalAlignment="center">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={62} height={62} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="center" verticalAlignment="center"></image>
                    <label text={data.temperature} fontSize={Math.min(size.width * 0.2, 20)} fontWeight={bold} color={colorOnSurface} textAlignment="right" horizontalAlignment="center" verticalAlignment="center"></label>
                </stacklayout>
            </gridlayout>
                <label text={data.locationName} fontSize={12} opacity={0.6} maxLines={1} color={data.config.settings.color == null ? "onSurface" : data.config.settings.color} horizontalAlignment="left" verticalAlignment="top"></label>
                <label text={data.description} fontSize={12} opacity={0.6} textAlignment="right" color={data.config.settings.color == null ? "onSurface" : data.config.settings.color} verticalAlignment="bottom" horizontalAlignment="right" visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
        </gridlayout>
    {:else}
        <gridlayout padding={3}>
            <stacklayout orientation="vertical">
                    <label fontSize={Math.min(size.height * 0.24, 40)} fontWeight={config.settings?.clockBold == true ? "bold" : "normal"} color={colorOnSurface} textAlignment={size.height <= 50 ? "right" : "left"} text={nowTime()} horizontalAlignment={size.height <= 50 ? "end" : "center"} verticalAlignment="top"></label>
                <stacklayout orientation="horizontal" horizontalAlignment="center" verticalAlignment="top">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} height={size.width < 100 ? 32 : size.width < 150 ? 40 : 56} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} verticalAlignment="center" horizontalAlignment="center"></image>
                    <absolutelayout width={size.width < 100 ? 4 : size.width < 150 ? 6 : 8} verticalAlignment="center" horizontalAlignment="center"></absolutelayout>
                    <label text={data.temperature} fontSize={Math.min(size.width * 0.2, 20)} fontWeight={bold} color={colorOnSurface} verticalAlignment="center" horizontalAlignment="center"></label>
                </stacklayout>
                <absolutelayout height={size.width < 100 ? 2 : size.width < 150 ? 4 : 8} horizontalAlignment="center" verticalAlignment="top"></absolutelayout>
                <absolutelayout height={size.width < 100 ? 4 : size.width < 150 ? 6 : 8} horizontalAlignment="center" verticalAlignment="top"></absolutelayout>
            </stacklayout>
            <gridlayout rows="*,auto">
                <label text={data.locationName} fontSize={size.width < 100 ? 8 : size.width < 150 ? 10 : 12} opacity={0.6} maxLines={1} color={data.config.settings.color == null ? "onSurface" : data.config.settings.color} row={1} horizontalAlignment="right" verticalAlignment="bottom"></label>
            </gridlayout>
        </gridlayout>
    {/if}
</gridlayout>
