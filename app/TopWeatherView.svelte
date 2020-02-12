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
    // $: {
    // console.log('current weather', Object.keys(item), item.temperature, item.temperatureMin, item.lastUpdate);
    // }

    // $: {
    //     textHtmlBottom = `<font face="${mdiFontFamily}">mdi-navigation</font>
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

<gridLayout rows="auto,2*,*,auto" {height} columns="*,auto" padding="0" backgroundColor="black">
    <label row="0" colSpan="3" fontSize="18" paddingRight="10" textAlignment="right" text={convertTime(item.time, 'dddd')} />

    {#if item.temperature !== undefined}
        <label row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top">
            <span fontSize="26" text={formatValueToUnit(item.temperature, UNITS.Celcius) + '\n'} color={colorFromTempC(item.temperature)} />
            <span fontSize="12" text="({formatValueToUnit(item.temperatureMin, UNITS.Celcius)} | {formatValueToUnit(item.temperatureMax, UNITS.Celcius)}){'\n'}" />
            <span class="mdi" fontSize="12" text="mdi-hand" />
            <span fontSize="12" text={formatValueToUnit(item.apparentTemperature, UNITS.Celcius)} />
        </label>
    {:else}
        <label row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top">
            <span fontSize="26" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} color={colorFromTempC(item.temperatureMin)} />
            <span color="#777" fontSize="26" text=" | " />
            <span fontSize="26" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)} color={colorFromTempC(item.temperatureMax)} />
        </label>
    {/if}
    <!-- <label row="0" rowSpan="2" paddingLeft="10" fontSize="14" html={textHtmlBottom} verticalTextAlignment="bottom" textAlignment="left" /> -->

    <label fontSize="14" row="0" rowSpan="2" verticalTextAlignment="bottom">
        <span class="wi" fontSize="22" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'}" />
        <span class="wi" fontSize="16" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
        <span class="wi" fontSize="16" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span class="wi" fontSize="16" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" />
    </label>
    {#if item.hourlyData}
        <stacklayout row="2" colSpan="2" borderRadius="4" backgroundColor="#444" orientation="horizontal" verticalAlignment="center" margin="10" padding="10">
            <WeatherIcon verticalAlignment="middle" fontSize="50" icon={item.hourlyData.icon} autoPlay="true" />
            <label fontSize="18" paddingLeft="4" verticalAlignment="middle" text={item.hourlyData.summary} />

        </stacklayout>
    {/if}
    <WeatherIcon row="0" rowSpan="2" col="1" verticalAlignment="middle" fontSize="150" icon={item.icon} autoPlay="true" />
    <label row="1" paddingLeft="10" fontSize="14" verticalTextAlignment="middle" textAlignment="left" text={item.summary} />
    <label paddingRight="10" row="1" col="0" colSpan="2" fontSize="14" textAlignment="right" verticalTextAlignment="bottom" text="{l('last_updated')}:{'\n'}{formatLastUpdate(item.lastUpdate)}" />
    <HourlyView row="3" colSpan="2" items={item.hourly} scrollIndex="0" />
</gridLayout>
