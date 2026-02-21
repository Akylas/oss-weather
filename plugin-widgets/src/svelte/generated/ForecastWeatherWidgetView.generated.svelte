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
    export let size: { width: number; height: number } = { width: 260, height: 200};

    $: ({ colorWidgetBackground, colorOnSurface, colorOnSurfaceVariant, colorSurface } = $colors);
</script>

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={8} class="widget-container">
        <stacklayout verticalAlignment="top" horizontalAlignment="stretch" orientation="vertical">
            <stacklayout verticalAlignment="space-between" horizontalAlignment="left" paddingLeft={8} paddingRight={8} orientation="horizontal" marginBottom={8}>
                <stacklayout verticalAlignment="top" horizontalAlignment="left" orientation="vertical">
                    <label text={data.temperature} fontSize={32} fontWeight={700} color={colorOnSurface} marginBottom={2}></label>
                    <label text={data.locationName} fontSize={14} color={colorOnSurfaceVariant} textAlignment="left" maxLines={1}></label>
                </stacklayout>
                <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={48} height={48} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'} marginBottom={2}></image>
                    <label text={data.description} fontSize={12} color={colorOnSurfaceVariant} textAlignment="right" maxLines={1} visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
                </stacklayout>
            </stacklayout>
            <label textAlignment="left" text={lc('Hourly')} fontSize={12} fontWeight={500} color={colorOnSurfaceVariant} paddingLeft={8} paddingRight={8} marginBottom={4}></label>
            <collectionview items={data.hourlyData?.slice(0, 8)} height={size.width > 240 ? 80 : 70} showIndicators={false} orientation="horizontal" marginBottom={8}>
                <Template let:item>
                <stacklayout verticalAlignment="center" horizontalAlignment="center" width={53} padding={2} paddingLeft={4} paddingRight={4} orientation="vertical">
                    <label text={item.time} fontSize={10} color={colorOnSurfaceVariant} maxLines={1}></label>
                    <image src={item.iconPath} width={28} height={28}></image>
                    <label text={item.temperature} fontSize={12} fontWeight={700} color={colorOnSurface} maxLines={1}></label>
                    <label text={item.precipAccumulation} fontSize={9} color={colorOnSurfaceVariant} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'}></label>
                </stacklayout>
                </Template>
            </collectionview>
            <label text={lc('Daily')} textAlignment="left" fontSize={12} fontWeight={500} color={colorOnSurfaceVariant} paddingLeft={8} paddingRight={8} marginBottom={4}></label>
            <collectionview items={data.dailyData} showIndicators={false} orientation="vertical">
                <Template let:item>
                <stacklayout padding={6} backgroundColor={colorSurface} cornerRadius={8} marginBottom={4} orientation="vertical">
                    <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="horizontal">
                        <label text={item.day} fontSize={12} fontWeight={500} color={colorOnSurface} maxLines={1}></label>
                        <image src={item.iconPath} width={28} height={28} marginRight={8}></image>
                        <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                            <stacklayout verticalAlignment="bottom" horizontalAlignment="center" padding={6} orientation="horizontal">
                                <label text={item.temperatureHigh} fontSize={13} fontWeight={700} color={colorOnSurface} maxLines={1}></label>
                                <label text={item.temperatureLow} fontSize={13} color={colorOnSurfaceVariant} maxLines={1}></label>
                            </stacklayout>
                            <stacklayout verticalAlignment="bottom" horizontalAlignment="center" padding={6} orientation="horizontal">
                                <label text={item.precipAccumulation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'}></label>
                                <label text={"💧" + item.precipitation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipitation != null) ? 'visible' : 'collapsed'}></label>
                            </stacklayout>
                        </stacklayout>
                    </stacklayout>
                </stacklayout>
                </Template>
            </collectionview>
        </stacklayout>
</gridlayout>
