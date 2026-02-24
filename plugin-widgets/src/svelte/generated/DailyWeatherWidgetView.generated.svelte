<script context="module" lang="ts">
    // Auto-generated Svelte Native component for widget "DailyWeatherWidget"
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

<gridlayout width={size.width} height={size.height} backgroundColor={colorWidgetBackground} padding={8} class="widget-container">
        <stacklayout verticalAlignment="top" horizontalAlignment="stretch" orientation="vertical">
            <stacklayout verticalAlignment="top" horizontalAlignment="left" padding={8} orientation="horizontal">
                <stacklayout verticalAlignment="top" horizontalAlignment="left" orientation="vertical">
                    <label text={data.locationName} fontSize={12} color={colorOnSurfaceVariant} textAlignment="left" maxLines={1}></label>
                    <label text={data.temperature} fontSize={26} fontWeight={700} color={colorOnSurface}></label>
                </stacklayout>
                <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                    <image src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} width={54} height={54} visibility={(data.iconPath != null) ? 'visible' : 'collapsed'}></image>
                    <label text={data.description} fontSize={11} color={colorOnSurfaceVariant} textAlignment="right" maxLines={1} visibility={(data.description != null) ? 'visible' : 'collapsed'}></label>
                </stacklayout>
            </stacklayout>
            <label text={lc('Daily')} textAlignment="left" fontSize={12} fontWeight={500} color={colorOnSurfaceVariant} paddingLeft={8} paddingRight={8} marginBottom={4}></label>
            <collectionview items={data.dailyData?.slice(0, 10)} showIndicators={false} orientation="vertical">
                <Template let:item>
                <stacklayout padding={2} verticalAlignment="center" horizontalAlignment="center" orientation="vertical">
                    <stacklayout paddingLeft={6} paddingRight={6} paddingTop={2} paddingBottom={2} backgroundColor={colorSurfaceVariant} cornerRadius={8} verticalAlignment="center" horizontalAlignment="center" orientation="vertical">
                        <stacklayout verticalAlignment="center" horizontalAlignment="center" orientation="horizontal">
                            <label text={item.day} fontSize={12} fontWeight={500} color={colorOnSurface} maxLines={1}></label>
                            <image src={item.iconPath} width={36} height={36}></image>
                            <stacklayout verticalAlignment="bottom" horizontalAlignment="right" orientation="vertical">
                                <stacklayout verticalAlignment="bottom" horizontalAlignment="center" padding={6} orientation="horizontal">
                                    <label text={item.temperatureHigh} fontSize={13} fontWeight={700} color={colorOnSurface} maxLines={1}></label>
                                    <label text={item.temperatureLow} fontSize={11} color={colorOnSurfaceVariant} maxLines={1}></label>
                                </stacklayout>
                                <stacklayout verticalAlignment="bottom" horizontalAlignment="center" padding={6} orientation="horizontal">
                                    <label text={item.precipAccumulation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipAccumulation != null) ? 'visible' : 'collapsed'}></label>
                                    <label text={"💧" + item.precipitation} fontSize={10} color={colorOnSurfaceVariant} visibility={(item.precipitation != null) ? 'visible' : 'collapsed'}></label>
                                </stacklayout>
                            </stacklayout>
                        </stacklayout>
                    </stacklayout>
                </stacklayout>
                </Template>
            </collectionview>
        </stacklayout>
</gridlayout>
