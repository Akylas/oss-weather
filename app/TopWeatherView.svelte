<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import HourlyView from './HourlyView.svelte';
    import AlertView from './AlertView.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    import { showBottomSheet } from '~/bottomsheet';
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

    function showAlerts() {
        showBottomSheet({
            page: AlertView,
            transparent: true,
            props: {
                alerts: item.alerts
            }
        });
    }

    let textHtmlBottom;
    let textHtmlTop;

    $: {
        if (item.temperature !== undefined) {
            textHtmlTop = `<big><big><big><big><font color="${colorFromTempC(item.temperature)}">${formatValueToUnit(item.temperature, UNITS.Celcius)}</font></big></big></big></big>
        ${item.temperature !== item.apparentTemperature ? '<br>' + formatValueToUnit(item.apparentTemperature, UNITS.Celcius) : ''}
        `;
        } else {
            textHtmlTop = `<big><big><big><font color="${colorFromTempC(item.temperatureMin)}">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font> | <font color="${colorFromTempC(
                item.temperatureMax
            )}">${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}</font></big></big></big>`;
        }
    }

    let alerts;
    $: {
        const now = Date.now() / 1000 + 3600;
        alerts = item.alerts && item.alerts.filter(a => a.expires > now);
    }
    // $: {
    //     textHtmlBottom = `<font face="${wiFontFamily}">${item.windIcon}</font>
    //     ${formatValueToUnit(item.windSpeed, UNITS.Speed)}<br>
    //     <font  face="${wiFontFamily}">wi-cloud</font>
    //     ${Math.round(item.cloudCover * 100)}%<br>
    //     <font color="#ffa500" face="${wiFontFamily}">wi-sunrise</font>
    //     ${convertTime(item.sunriseTime, 'HH:mm')}
    //     <font color="#ff7200" face="${wiFontFamily}">wi-sunset</font>
    //     ${convertTime(item.sunsetTime, 'HH:mm')}
    //     `;
    // }
</script>

<gridLayout rows="auto,2*,*,auto" {height} columns="*,auto" backgroundColor="black">
    <label row="0" colSpan="2" fontSize="18" textAlignment="right">
        <span color="#6B4985" fontFamily={wiFontFamily} fontSize="22" text={item.moonIcon} />
        <span text={convertTime(item.time, 'dddd') + '\n'} />
        <span text=" {item.uvIndex}&nbsp;" backgroundColor={item.uvIndexColor} />
    </label>
    <!-- <label row="0" colSpan="2" fontSize="18" marginTop="40" horizontalAlignment="right" text={item.uvIndex} backgroundColor={item.uvIndexColor} /> -->

    <label marginLeft="10" fontSize="12" row="0" rowSpan="2" verticalTextAlignment="top" html={textHtmlTop} />
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
    <!-- <label marginLeft="10" row="0" rowSpan="2" fontSize="14" html={textHtmlBottom} verticalTextAlignment="bottom" /> -->

    <label fontSize="14" row="0" rowSpan="2" verticalTextAlignment="bottom">
        <span fontSize="18" fontFamily={wiFontFamily} color="#4681C3" text={item.precipProbability > 0.05 ? 'wi-umbrella' : ''} />
        <span text=" {item.precipProbability > 0.05 ? Math.round(item.precipProbability * 100) + '%' : ''}" />
        <span fontSize="18" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'}" />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" />
    </label>
    {#if alerts}
        <label row="0" textAlignment="center" color={alerts[0].alertColor} colSpan="2" fontSize="36" fontFamily={mdiFontFamily} text="mdi-alert" on:tap={showAlerts} />
    {/if}
    {#if item.hourlyData}
        <stacklayout row="2" colSpan="2" borderRadius="4" backgroundColor="#222" orientation="horizontal" verticalAlignment="center" margin="10" padding="10">
            <WeatherIcon verticalAlignment="middle" fontSize="50" icon={item.hourlyData.icon} autoPlay="true" />
            <label fontSize="16" paddingLeft="4" verticalAlignment="middle" text={item.hourlyData.summary} />

        </stacklayout>
    {/if}
    <stacklayout row="1" col="1" verticalAlignment="top">
        <WeatherIcon fontSize="150" icon={item.icon} autoPlay="true" />
        <label marginRight="10" fontSize="14" fontStyle="italic" textAlignment="right" text={item.summary} />
    </stacklayout>
    <label marginRight="10" row="1" col="0" colSpan="2" fontSize="14" textAlignment="right" verticalTextAlignment="bottom" text="{l('last_updated')}:{'\n'}{formatLastUpdate(item.lastUpdate)}" />
    <HourlyView row="3" colSpan="2" items={item.hourly} scrollIndex="0" />
</gridLayout>
