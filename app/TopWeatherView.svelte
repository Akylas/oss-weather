<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import HourlyView from './HourlyView.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    import { localize as l } from '~/helpers/formatter';
    import dayjs from 'dayjs';
    export let item;
    export let height;

    function formatLastUpdate(date) {
        if (dayjs(date).isBefore(dayjs().startOf('d'))) {
            return convertTime(date, 'dddd HH:mm');
        } else {
            return convertTime(date, 'HH:mm');
        }
    }
    let textHtmlBottom;
    let textHtmlTop;

    $: {
        if (item.temperature !== undefined) {
            textHtmlTop = `<big><big><big><font color="${colorFromTempC(item.temperature)}">${formatValueToUnit(item.temperature, UNITS.Celcius)}</font></big></big></big><br>
        (${formatValueToUnit(item.temperatureMin, UNITS.Celcius)} | ${formatValueToUnit(item.temperatureMax, UNITS.Celcius)})<br>
        <font face="${mdiFontFamily}">mdi-hand</font>
        ${formatValueToUnit(item.apparentTemperature, UNITS.Celcius)}
        `;
        } else {
            textHtmlTop = `<big><big><big><font color="${colorFromTempC(item.temperatureMin)}">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font> | <font color="${colorFromTempC(
                item.temperatureMax
            )}">${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}</font></big></big></big>`;
        }
    }
    $: {
        textHtmlBottom = `<font face="${wiFontFamily}">${item.windIcon}</font>
        ${formatValueToUnit(item.windSpeed, UNITS.Speed)}<br>
        <font  face="${wiFontFamily}">wi-cloud</font>
        ${Math.round(item.cloudCover * 100)}%<br>
        <font color="#ffa500" face="${wiFontFamily}">wi-sunrise</font>
        ${convertTime(item.sunriseTime, 'HH:mm')}
        <font color="#ff7200" face="${wiFontFamily}">wi-sunset</font>
        ${convertTime(item.sunsetTime, 'HH:mm')}
        `;
    }
</script>

<gridLayout rows="auto,2*,*,auto" {height} columns="*,auto" backgroundColor="black" paddingLeft="10" paddingRight="10">
    <label row="0" colSpan="3" fontSize="18" textAlignment="right" text={convertTime(item.time, 'dddd')} />

    <label fontSize="12" row="0" rowSpan="2" verticalTextAlignment="top" html={textHtmlTop} />
    <!-- {#if item.temperature !== undefined}
            <label fontSize="12" row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top">
                <span fontSize="26" text={formatValueToUnit(item.temperature, UNITS.Celcius) + '\n'} color={colorFromTempC(item.temperature)} />
                <span text="({formatValueToUnit(item.temperatureMin, UNITS.Celcius)} | {formatValueToUnit(item.temperatureMax, UNITS.Celcius)}){'\n'}" />
                <span fontFamily={mdiFontFamily} text="mdi-hand" />
                <span text={formatValueToUnit(item.apparentTemperature, UNITS.Celcius)} />
            </label>
        {:else}
            <label row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top">
                <span fontSize="26" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} color={colorFromTempC(item.temperatureMin)} />
                <span color="#777" fontSize="26" text=" | " />
                <span fontSize="26" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)} color={colorFromTempC(item.temperatureMax)} />
            </label>
        {/if} -->
    <label row="0" rowSpan="2" fontSize="14" html={textHtmlBottom} verticalTextAlignment="bottom" />

    <!-- <label fontSize="14" row="0" rowSpan="2" verticalTextAlignment="bottom">
        <span fontFamily={wiFontFamily} fontSize="22" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'}" />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" />
    </label> -->
    {#if item.hourlyData}
        <stacklayout row="2" colSpan="2" borderRadius="4" backgroundColor="#444" orientation="horizontal" verticalAlignment="center" margin="10" padding="10">
            <WeatherIcon verticalAlignment="middle" fontSize="50" icon={item.hourlyData.icon} autoPlay="true" />
            <label fontSize="18" paddingLeft="4" verticalAlignment="middle" text={item.hourlyData.summary} />

        </stacklayout>
    {/if}
    <WeatherIcon row="0" rowSpan="2" col="1" verticalAlignment="middle" fontSize="150" icon={item.icon} autoPlay="true" />
    <label row="1" paddingLeft="10" fontSize="14" verticalTextAlignment="middle" textAlignment="left" text={item.summary} />
    <label paddingRight="10" row="1" col="0" colSpan="2" fontSize="14" textAlignment="right" verticalTextAlignment="bottom" text="{l('last_updated')}:{'\n'}{formatLastUpdate(item.lastUpdate)}" />
    <HourlyView  marginLeft="-10" marginRight="-10" row="3" colSpan="2" items={item.hourly} scrollIndex="0" />
</gridLayout>
