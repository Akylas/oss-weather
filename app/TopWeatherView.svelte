<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { localize as l } from '~/helpers/formatter';
    import dayjs from 'dayjs';
    export let currentWeather;
    export let lastUpdate;

    function formatLastUpdate(date) {
        if (dayjs(date).isBefore(dayjs().startOf('d'))) {
            return convertTime(date, 'dddd HH:mm');
        } else {
            return convertTime(date, 'HH:mm');
        }
    }
</script>

<gridLayout rows="auto,*,auto" columns="*,auto" padding="10" backgroundColor="#424242" row="1">
    <label row="0" colSpan="3" fontSize="18" paddingRight="5" textAlignment="right" text={convertTime(currentWeather.time, 'dddd')} />

    {#if currentWeather.temperature !== undefined}
        <label row="0" rowSpan="2">
            <span fontSize="26" text={formatValueToUnit(currentWeather.temperature, UNITS.Celcius) + '\n'} color={colorFromTempC(currentWeather.temperature)} />
            <span fontSize="12" text="({formatValueToUnit(currentWeather.temperatureMin, UNITS.Celcius)}/{formatValueToUnit(currentWeather.temperatureMax, UNITS.Celcius)}){'\n'}" />
            <span fontSize="12" class="mdi" text="mdi-hand" />
            <span fontSize="12" text={formatValueToUnit(currentWeather.apparentTemperature, UNITS.Celcius)} />
        </label>
    {:else}
        <label row="0" rowSpan="2">
            <span fontSize="26" text={formatValueToUnit(currentWeather.temperatureMin, UNITS.Celcius)} color={colorFromTempC(currentWeather.temperatureMin)} />
            <span fontSize="26" text="/" />
            <span fontSize="26" text={formatValueToUnit(currentWeather.temperatureMax, UNITS.Celcius)} color={colorFromTempC(currentWeather.temperatureMax)} />
        </label>
    {/if}
    <stackLayout row="0" rowSpan="3" verticalAlignment="bottom" horizontalAlignment="left">
        <stackLayout ios:paddingLeft="7" orientation="horizontal" paddingTop="5">
            <label fontSize="18" ios:padding="0 -8 0 -8" android:paddingRight="3" class="mdi" text="mdi-navigation" verticalAlignment="center" rotate={currentWeather.windBearing + 180} />
            <label fontSize="14 " text={formatValueToUnit(currentWeather.windSpeed, UNITS.Speed)} verticalAlignment="center" />
        </stackLayout>

        <label fontSize="14">
            <span fontSize="16" class="wi" text="wi-cloud" />
            <span text=" {Math.round(currentWeather.cloudCover * 100)}%{'\n'}" />
            <span fontSize="16" class="wi" text="wi-sunrise" color="#ffa500" />
            <span text=" {convertTime(currentWeather.sunriseTime, 'HH:mm')} " />
            <span fontSize="16" class="wi" text="wi-sunset" color="#ff7200" />
            <span text=" {convertTime(currentWeather.sunsetTime, 'HH:mm')}" />
        </label>
    </stackLayout>
    <WeatherIcon row="1" col="1" verticalAlignment="middle" fontSize="100" icon={currentWeather.icon} />
    <label paddingRight="10" row="2" col="1" fontSize="14" textAlignment="right" verticalAlignment="bottom" text="{l('last_updated')}:{'\n'}{formatLastUpdate(lastUpdate)}" />
</gridLayout>
