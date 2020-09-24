<script lang="ts">
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Template } from 'svelte-native/components';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { UNITS } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
    import { borderColor, wiFontFamily, nightColor, rainColor, textLightColor } from '~/variables';
    export let item;
</script>

<gridLayout height="100" borderRightWidth="5" borderRightColor={item.color}>
    <canvaslabel>
        <cgroup fontSize="22" verticalAlignment="top" paddingLeft="10" paddingTop="5">
            <cspan text={convertTime(item.time, 'ddd ')} />
            <cspan fontSize="15" color={textLightColor} text={'\n' + convertTime(item.time, 'DD/MM')} />
        </cgroup>
        <!-- <cspan id="testSpan" color={textLightColor} fontSize="22" verticalAlignment="bottom" paddingLeft="10" paddingBottom="10" fontFamily={wiFontFamily} text={item.windSpeed > 6 ? item.windBeaufortIcon : null} /> -->
        
        {#if (item.windSpeed > 6)}
            <cgroup color={rainColor} fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="-200" paddingTop="20">
                <cspan fontSize="20" fontFamily={wiFontFamily} text={item.windBeaufortIcon} />
                <cspan text={'\n ' } />
            </cgroup>
        {/if}
        <cgroup fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="-100" paddingTop="20">
            <cspan fontSize="20" fontFamily={wiFontFamily} text={item.windIcon} />
            <cspan text={'\n' + formatValueToUnit(item.windSpeed, UNITS.Speed)} />
        </cgroup>
        {#if (item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1}
            <cgroup color={rainColor} fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingTop="20">
                <cspan fontSize="20" fontFamily={wiFontFamily} text="wi-raindrop" />
                <cspan text={'\n' + formatValueToUnit(Math.floor(item.precipAccumulation), UNITS.MM)} />
                <cspan fontSize="9" text={item.precipProbability >0  ? '\n' + Math.round(item.precipProbability * 100) + '%' : null} />
            </cgroup>
        {/if}
        <cgroup color={nightColor} fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="100" paddingTop="20">
            <cspan fontSize="20" fontFamily={wiFontFamily} text={item.moonIcon} />
            <cspan text={'\n' + l('moon')} />
        </cgroup>
        <!-- <cgroup fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="200" paddingTop="20">
            <cspan fontSize="20" fontFamily={wiFontFamily} text="wi-cloud" />
            <cspan text={'\n' + Math.round(item.cloudCover * 100) + '%'} />
        </cgroup> -->

        <cgroup fontSize="20" verticalAlignment="top" textAlignment="right" paddingTop="5" paddingRight="5">
            <cspan fontSize="17" color={textLightColor} text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} />
            <cspan text={' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius)} />
        </cgroup>
        <cspan paddingLeft="10" paddingBottom="10" fontSize="13" color={textLightColor} text={item.description} verticalAlignment="bottom" textAlignment="left"/>

        <line color={borderColor} startX="0%" startY="0" stopX="100%" stopY="0" strokeWidth="1" />
    </canvaslabel>
    <!-- <label
        colSpan="2"
        fontSize="22"
        verticalTextAlignment="top"
        marginLeft="10"
        marginTop="10"
        html={`${convertTime(item.time, 'ddd ')}<br><span style="font-size:15px; color:${textLightColor};">${convertTime(item.time, 'DD/MM')}</span>`} /> -->

    <!-- <label
        visibility={item.windSpeed > 6 ? 'visible' : 'collapsed'}
        color={textLightColor}
        fontSize="22"
        row="1"
        verticalTextAlignment="bottom"
        marginLeft="10"
        fontFamily={wiFontFamily}
        text={item.windBeaufortIcon} /> -->

    <!-- <label
        col="1"
        colSpan="3"
        rowSpan="2"
        width="80%"
        color={textLightColor}
        fontSize="15"
        textAlignment="left"
        fontStyle="italic"
        verticalTextAlignment="top"
        marginTop="18"
        text={item.summary}
        maxLines="2"
        visibility={item.summary ? 'visible' : 'collapsed'} /> -->
    <!-- <stacklayout row="1" col="0" colSpan="3" orientation="horizontal"verticalAlignment="top" marginTop="10"> -->
    <!-- <label
        rowSpan="2"
        col="1"
        fontSize="12"
        verticalTextAlignment="center"
        textAlignment="center"
        html={`<span style="font-size:20px; font-family:${wiFontFamily};">${item.windIcon}</span><br>${formatValueToUnit(item.windSpeed, UNITS.Speed)}`} /> -->
    <!-- <label
        row="1"
        col="1"
        fontSize="14"
        visibility={item.cloudCover > 0.1 ? 'visible' : 'collapsed'}
        color={item.cloudColor}
        textAlignment="center"
        html={`<big><big><font face="${wiFontFamily}">wi-cloud</font></big></big><br>${Math.round(item.cloudCover * 100)}%`} /> -->
    <!-- <label
        fontSize="12"
        color={rainColor}
        textAlignment="center"
        verticalTextAlignment="center"
        rowSpan="2"
        col="2"
        html={`<span style="font-size:20px; font-family:${wiFontFamily};">wi-raindrop</span><br>${item.precipAccumulation >= 1 ? formatValueToUnit(Math.floor(item.precipAccumulation), UNITS.MM) + '<br>' : ''}${Math.round(item.precipProbability * 100)}%`} /> -->
    <!-- <label
        rowSpan="2"
        verticalTextAlignment="center"
        col="3"
        fontSize="12"
        color={nightColor}
        textAlignment="center"
        html={`<span style=" font-size:20px; font-family:${wiFontFamily};">${item.moonIcon}</span><br>${l('moon')}`} /> -->
    <!-- </stacklayout> -->
    <WeatherIcon marginRight="10" marginTop="16" horizontalAlignment="right" fontSize="60" icon={item.icon} />

    <!-- <label
        col="1"
        colSpan="4"
        fontSize="20"
        verticalTextAlignment="top"
        textAlignment="right"
        marginTop="5"
        marginRight="5"
        html={`<span style="font-size:17px; color:${textLightColor};">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</span> ${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}`} /> -->
    <!-- <image class="dailyViewBorder" verticalAlignment="bottom" /> -->
</gridLayout>
