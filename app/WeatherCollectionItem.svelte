<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    export let item;

    $: {
        console.log('item changed!', item.time);
    }
</script>

<stackLayout borderRadius="6" backgroundColor="#333" margin="2">
    <label paddingTop="10" width="100%" textAlignment="center">
        <span fontSize="16" fontWeight="bold" text={convertTime(item.time, 'HH:mm')} />
    </label>
    <WeatherIcon icon={item.icon} />
    <label width="100%" textAlignment="center">
        <span fontSize="16" text={formatValueToUnit(item.temperature, UNITS.Celcius) + '\n'} color={colorFromTempC(item.temperature)} />
        <span fontSize="10" text={item.summary + '\n'} />
        <span fontSize="10" class="mdi" text="mdi-hand" />
        <span fontSize="10" text={formatValueToUnit(item.apparentTemperature, UNITS.Celcius)} />
    </label>
    <stackLayout orientation="horizontal" paddingTop="5" horizontalAlignment="center">
        <label fontSize="14" ios:padding="0 -7 0 -7" android:paddingRight="2" class="mdi" text="mdi-navigation" verticalAlignment="center" rotate={item.windBearing + 180} />
        <label fontSize="12" text={formatValueToUnit(item.windSpeed, UNITS.Speed)} verticalAlignment="center" />
    </stackLayout>
    <label fontSize="12" horizontalAlignment="center">
        <span fontSize="14" class="wi" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
    </label>

    {#if item.precipProbability > 0}
        <label
            text={formatValueToUnit(item.precipIntensity, UNITS.MM)}
            horizontalAlignment="center"
            verticalAlignment="bottom"
            padding="2"
            borderRadius="2"
            backgroundColor="rgba(70, 129, 195, {item.precipProbability})" />
    {/if}
</stackLayout>
