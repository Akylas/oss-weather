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
    export let size: { width: number; height: number } = { width: 160, height: 300 };

    $: ({ colorOnSurface, colorOnSurfaceVariant, colorSurfaceVariant, colorWidgetBackground } = $colors);
</script>

<gridlayout class="widget-container" backgroundColor={colorWidgetBackground} height={size.height} padding={8} width={size.width}>
    <stacklayout horizontalAlignment="stretch" orientation="vertical" verticalAlignment="top">
        <stacklayout horizontalAlignment="left" orientation="horizontal" padding={8} verticalAlignment="top">
            <stacklayout horizontalAlignment="left" orientation="vertical" verticalAlignment="top">
                <label color={colorOnSurfaceVariant} fontSize={12} maxLines={1} text={data.locationName} textAlignment="left"></label>
                <label color={colorOnSurface} fontSize={26} fontWeight={700} text={data.temperature}></label>
            </stacklayout>
            <stacklayout horizontalAlignment="right" orientation="vertical" verticalAlignment="bottom">
                <image height={54} src={`${iconService.iconSetFolderPath}/images/${data.iconPath}.png`} visibility={data.iconPath != null ? 'visible' : 'collapsed'} width={54}></image>
                <label color={colorOnSurfaceVariant} fontSize={11} maxLines={1} text={data.description} textAlignment="right" visibility={data.description != null ? 'visible' : 'collapsed'}></label>
            </stacklayout>
        </stacklayout>
        <stacklayout horizontalAlignment="left" marginBottom={4} orientation="vertical" verticalAlignment="top">
            <label color={colorOnSurfaceVariant} fontSize={12} fontWeight={500} paddingLeft={8} paddingRight={8} text={lc('Daily')} textAlignment="left"></label>
        </stacklayout>
        <collectionview items={data.dailyData?.slice(0, 10)} orientation="vertical" showIndicators={false}>
            <Template let:item>
                <stacklayout horizontalAlignment="center" orientation="vertical" padding={2} verticalAlignment="center">
                    <stacklayout
                        backgroundColor={colorSurfaceVariant}
                        cornerRadius={8}
                        horizontalAlignment="center"
                        orientation="vertical"
                        paddingBottom={2}
                        paddingLeft={6}
                        paddingRight={6}
                        paddingTop={2}
                        verticalAlignment="center">
                        <stacklayout horizontalAlignment="center" orientation="horizontal" verticalAlignment="center">
                            <label color={colorOnSurface} fontSize={12} fontWeight={500} maxLines={1} text={item.day}></label>
                            <image height={36} src={`${iconService.iconSetFolderPath}/images/${item.iconPath}.png`} width={36}></image>
                            <stacklayout horizontalAlignment="right" orientation="vertical" verticalAlignment="bottom">
                                <stacklayout horizontalAlignment="center" orientation="horizontal" padding={6} verticalAlignment="bottom">
                                    <label color={colorOnSurface} fontSize={13} fontWeight={700} maxLines={1} text={item.temperatureHigh}></label>
                                    <label color={colorOnSurfaceVariant} fontSize={11} maxLines={1} text={item.temperatureLow}></label>
                                </stacklayout>
                                <stacklayout horizontalAlignment="center" orientation="horizontal" padding={6} verticalAlignment="bottom">
                                    <label color={colorOnSurfaceVariant} fontSize={10} text={item.precipAccumulation} visibility={item.precipAccumulation != null ? 'visible' : 'collapsed'}></label>
                                    <label color={colorOnSurfaceVariant} fontSize={10} text={'💧' + item.precipitation} visibility={item.precipitation != null ? 'visible' : 'collapsed'}></label>
                                </stacklayout>
                            </stacklayout>
                        </stacklayout>
                    </stacklayout>
                </stacklayout>
            </Template>
        </collectionview>
    </stacklayout>
</gridlayout>
