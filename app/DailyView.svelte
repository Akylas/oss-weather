<script lang="ts">
    import { convertTime, formatValueToUnit, UNITS } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
    import { borderColor, nightColor, rainColor, snowColor, textColor, textLightColor, wiFontFamily } from '~/variables';
    import WeatherIcon from './WeatherIcon.svelte';
    export let item;
    let color;
    let precipIcon;
    $: {
        if (item && item.icon.startsWith('13')) {
            color = snowColor;
            precipIcon= 'wi-snowflake-cold'
        } else {
            color = rainColor;
            precipIcon= 'wi-raindrop'
        }
    } 
</script>

<gridLayout height="100">
    <canvaslabel paddingRight="5">
        <rectangle horizontalAlignment="right" fillColor={item.color} width="5" height="100%" translateX="5"/>
        <cgroup fontSize="22" verticalAlignment="top" paddingLeft="10" paddingTop="5">
            <cspan text={convertTime(item.time, 'ddd ')} />
            <cspan fontSize="15" color={$textLightColor} text={'\n' + convertTime(item.time, 'DD/MM')} />
        </cgroup>
        <!-- <cspan id="testSpan" color={$textLightColor} fontSize="22" verticalAlignment="bottom" paddingLeft="10" paddingBottom="10" fontFamily={wiFontFamily} text={item.windSpeed > 6 ? item.windBeaufortIcon : null} /> -->

        {#if item.windSpeed > 6}
            <cgroup fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="-200" paddingTop="20">
                <cspan fontSize="20" fontFamily={wiFontFamily} text={item.windBeaufortIcon} />
                <cspan text={'\n '} />
            </cgroup>
        {/if}
        <cgroup fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="-100" paddingTop="20">
            <cspan fontSize="20" fontFamily={wiFontFamily} text={item.windIcon} />
            <cspan text={'\n' + formatValueToUnit(item.windSpeed, UNITS.Speed)} />
        </cgroup>
        {#if (item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1}
            <cgroup color={color} fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingTop="20">
                <cspan fontSize="20" fontFamily={wiFontFamily} text={precipIcon} />
                <cspan text={'\n' + formatValueToUnit(Math.floor(item.precipAccumulation), UNITS.MM)} />
                <cspan fontSize="9" text={item.precipProbability > 0 ? '\n' + Math.round(item.precipProbability * 100) + '%' : null} />
            </cgroup>
        {/if}
        <cgroup color={nightColor} fontSize="12" verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft="100" paddingTop="20">
            <cspan fontSize="20" fontFamily={wiFontFamily} text={item.moonIcon} />
            <cspan text={'\n' + l('moon')} />
        </cgroup>
        <cgroup fontSize="20" verticalAlignment="top" textAlignment="right" paddingTop="5" paddingRight="5">
            <cspan fontSize="17" color={$textLightColor} text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} />
            <cspan text={' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius)} />
        </cgroup>
        <cspan paddingLeft="10" paddingBottom="10" fontSize="13" color={$textLightColor} text={item.description} verticalAlignment="bottom" textAlignment="left" />

        <line color={$borderColor} startX="0%" startY="0" stopX="100%" stopY="0" strokeWidth="1" />
    </canvaslabel>
    <WeatherIcon marginRight="10" marginTop="16" horizontalAlignment="right" fontSize="60" icon={item.icon} />
</gridLayout>
