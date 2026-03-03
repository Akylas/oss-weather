<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "ForecastWeatherWidget"
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
    export let size: { width: number; height: number } = { width: 160, height: 300};

    $: ({ colorWidgetBackground, colorOnSurfaceVariant, colorOnSurface, colorSurfaceVariant } = $colors);
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} class="widget-container">
        <stacklayout orientation="vertical">
            <gridlayout padding={8} horizontalAlignment="stretch" columns="auto,*,auto" verticalAlignment="top" marginBottom={8}>
                <stacklayout orientation="vertical" col={0} verticalAlignment="top" horizontalAlignment="left">
                    <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} textAlignment="left" maxLines={1} horizontalAlignment="left" verticalAlignment="top"></label>
                    <label text={data.temperature} fontSize={26} fontWeight={700} color={colorOnSurface} horizontalAlignment="left" verticalAlignment="top"></label>
                </stacklayout>
                <stacklayout orientation="vertical" col={2} verticalAlignment="top" horizontalAlignment="left">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={54} height={54} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="bottom"></image>
                    <label text={data.description} fontSize={11} color={colorOnSurfaceVariant} textAlignment="right" maxLines={1} visibility={(data.description != null) ? 'visible' : 'collapsed'} horizontalAlignment="right" verticalAlignment="bottom"></label>
                </stacklayout>
            </gridlayout>
                <label text={lc('Hourly')} textAlignment="left" fontSize={12} fontWeight={500} color={colorOnSurfaceVariant} paddingLeft={8} paddingRight={8} horizontalAlignment="left" verticalAlignment="top" marginBottom={4}></label>
            <collectionview items={data.hourlyData?.slice(0, 8)} showIndicators={false} orientation="horizontal" horizontalAlignment="center" verticalAlignment="top" marginBottom={16}>
                <Template let:item>
                <stacklayout width={53} padding={2} paddingLeft={4} paddingRight={4} orientation="vertical">
                    <label text={item.time} fontSize={10} color={colorOnSurfaceVariant} maxLines={1} horizontalAlignment="center" verticalAlignment="center"></label>
                    <image src={`${iconService.iconSetFolderPath}/images/${item.iconPath}.png`} width={28} height={28} horizontalAlignment="center" verticalAlignment="center"></image>
                    <label text={item.temperature} fontSize={12} fontWeight={700} color={colorOnSurface} maxLines={1} horizontalAlignment="center" verticalAlignment="center"></label>
                    <label text={item.precipAccumulation} fontSize={9} color={colorOnSurfaceVariant} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'} horizontalAlignment="center" verticalAlignment="center"></label>
                </stacklayout>
                </Template>
            </collectionview>
                <label text={lc('Daily')} textAlignment="left" fontSize={12} fontWeight={500} color={colorOnSurfaceVariant} paddingLeft={8} paddingRight={8} horizontalAlignment="left" verticalAlignment="top" marginBottom={4}></label>
            <collectionview items={data.dailyData?.slice(0, 10)} showIndicators={false} orientation="vertical" horizontalAlignment="center" verticalAlignment="top">
                <Template let:item>
                        <gridlayout horizontalAlignment="stretch" columns="auto,*,auto,*,auto" verticalAlignment="center" paddingLeft={6} paddingRight={6} paddingTop={2} paddingBottom={2} backgroundColor={colorSurfaceVariant} cornerRadius={8} padding={2}>
                            <label text={item.day} fontSize={12} fontWeight={500} color={colorOnSurface} maxLines={1} col={0} verticalAlignment="center" horizontalAlignment="center"></label>
                            <image src={`${iconService.iconSetFolderPath}/images/${item.iconPath}.png`} width={36} height={36} col={2} verticalAlignment="center" horizontalAlignment="center"></image>
                            <stacklayout orientation="vertical" col={4} verticalAlignment="center" horizontalAlignment="center">
                                <stacklayout padding={6} orientation="horizontal" horizontalAlignment="right" verticalAlignment="bottom">
                                    <label text={item.temperatureHigh} fontSize={13} fontWeight={700} color={colorOnSurface} maxLines={1} verticalAlignment="center" horizontalAlignment="right"></label>
                                    <label text={item.temperatureLow} fontSize={13} color={colorOnSurfaceVariant} maxLines={1} verticalAlignment="center" horizontalAlignment="right"></label>
                                </stacklayout>
                                <stacklayout padding={6} orientation="horizontal" horizontalAlignment="right" verticalAlignment="bottom">
                                    <label text={item.precipAccumulation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'} verticalAlignment="center" horizontalAlignment="right"></label>
                                    <label text={"💧" + item.precipitation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipitation != null) ? 'visible' : 'collapsed'} verticalAlignment="center" horizontalAlignment="right"></label>
                                </stacklayout>
                            </stacklayout>
                        </gridlayout>
                </Template>
            </collectionview>
        </stacklayout>
</gridlayout>
