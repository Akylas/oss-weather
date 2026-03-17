<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "DailyWeatherWidget"
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
    export let size: { width: number; height: number } = { width: 160, height: 300};

    $: ({ colorOnSurface, colorSurfaceVariant } = $colors);
</script>

<gridlayout width={size.width} height={size.height} {...$$restProps} class="widget-container">
    <stacklayout orientation="vertical">
        <gridlayout padding={8} columns="auto,*,auto" horizontalAlignment="stretch" verticalAlignment="top">
            <stacklayout orientation="vertical" col={0} verticalAlignment="top" horizontalAlignment="left">
                <label text={data.locationName} fontSize={12} opacity={0.5} textAlignment="left" maxLines={1} horizontalAlignment="left" verticalAlignment="top"></label>
                <label text={data.temperature} fontSize={26} fontWeight="bold" color={colorOnSurface} horizontalAlignment="left" verticalAlignment="top"></label>
            </stacklayout>
            <stacklayout orientation="vertical" col={2} verticalAlignment="top" horizontalAlignment="left">
                <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={54} height={54} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="bottom"></image>
                <label text={data.description} fontSize={11} opacity={0.5} textAlignment="right" maxLines={1} visibility={(data.description != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="bottom"></label>
            </stacklayout>
        </gridlayout>
            <label text={lc('daily')} textAlignment="left" fontSize={12} fontWeight="medium" opacity={0.5} paddingLeft={8} paddingRight={8} horizontalAlignment="left" verticalAlignment="top"></label>
        <absolutelayout height={4} horizontalAlignment="stretch" verticalAlignment="top"></absolutelayout>
        <collectionview items={data.dailyData?.slice(0, 10)} showIndicators={false} orientation="vertical" colWidth="auto" horizontalAlignment="stretch" verticalAlignment="top">
            <Template let:item>
            <stacklayout padding={2} orientation="vertical">
                <stacklayout paddingLeft={6} paddingRight={6} paddingTop={2} paddingBottom={2} backgroundColor={colorSurfaceVariant} borderRadius={8} orientation="vertical" horizontalAlignment="center" verticalAlignment="center">
                    <gridlayout columns="auto,*,auto,*,auto" horizontalAlignment="center" verticalAlignment="center">
                        <label text={item.day} fontSize={12} fontWeight="medium" color={colorOnSurface} maxLines={1} col={0} verticalAlignment="center" horizontalAlignment="center"></label>
                        <image src={`${iconService.iconSetFolderPath}/images/${item.iconPath}.png`} width={36} height={36} col={2} verticalAlignment="center" horizontalAlignment="center"></image>
                        <stacklayout orientation="vertical" col={4} verticalAlignment="center" horizontalAlignment="center">
                            <stacklayout padding={6} orientation="horizontal" horizontalAlignment="right" verticalAlignment="bottom">
                                <label text={item.temperatureHigh} fontSize={13} fontWeight="bold" color={colorOnSurface} maxLines={1} verticalAlignment="center" horizontalAlignment="right"></label>
                                <label text={item.temperatureLow} fontSize={11} opacity={0.5} maxLines={1} verticalAlignment="center" horizontalAlignment="right"></label>
                            </stacklayout>
                            <stacklayout padding={6} orientation="horizontal" horizontalAlignment="right" verticalAlignment="bottom">
                                <label text={item.precipAccumulation} fontSize={10} opacity={0.5} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'} verticalAlignment="center" horizontalAlignment="right"></label>
                                <label text={"💧" + item.precipitation} fontSize={10} opacity={0.5} visibility={(item.precipitation != null) ? 'visible' : 'collapsed'} verticalAlignment="center" horizontalAlignment="right"></label>
                            </stacklayout>
                        </stacklayout>
                    </gridlayout>
                </stacklayout>
            </stacklayout>
            </Template>
        </collectionview>
    </stacklayout>
</gridlayout>
