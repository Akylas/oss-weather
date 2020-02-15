<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, colorForIcon, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    export let item;
    let textHtml;
    $: {
        textHtml = `<big><font color="${colorFromTempC(item.temperature)}">${formatValueToUnit(item.temperature, UNITS.Celcius)}</font></big><br>
        ${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed)}<br>
        ${item.summary}`;
    }
</script>

<gridlayout height="100%" rows="auto,auto,auto,*" paddingTop="10" >
    <label textAlignment="center" fontSize="14" fontWeight="bold" text={convertTime(item.time, 'HH:mm')} />
    <WeatherIcon row="1" icon={item.icon} autoPlay="true" />
    <!-- <label width="100%" textAlignment="center">
        <span fontSize="10" text={item.summary + '\n'} />
        <span fontSize="14" text={formatValueToUnit(item.temperature, UNITS.Celcius)} color={colorFromTempC(item.temperature)} />
    </label> -->
    <!-- <label row="2" fontSize="12" paddingTop="5" horizontalAlignment="center" textAlignment="center" html={textHtml}/> -->

    <label row="2" fontSize="12" textAlignment="center" html={textHtml}/>
    <!-- <label row="2" fontSize="12" textAlignment="center">
        <span fontSize="16" text={formatValueToUnit(item.temperature, UNITS.Celcius) + '\n'} color={colorFromTempC(item.temperature)} />
        <span fontFamily={wiFontFamily} fontSize="18" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'}" />
        <span fontSize="10" text={item.summary} />
    </label> -->
    <!-- <stackLayout orientation="horizontal" paddingTop="5" horizontalAlignment="center">
        <label fontSize="14" ios:padding="0 -7 0 -7" class="mdi" text="mdi-navigation" verticalAlignment="center" rotate={item.windBearing + 180} />
        <label fontSize="12" text={formatValueToUnit(item.windSpeed, UNITS.Speed)} verticalAlignment="center" />
    </stackLayout>
    <label fontSize="12" horizontalAlignment="center">
        <span fontSize="14" class="wi" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
    </label> -->

    <label
        row="3"
        verticalAlignment="bottom"
        backgroundColor={item.color}
        height="20"
        text={item.precipProbability > 0 ? formatValueToUnit(item.precipIntensity, UNITS.MM) : ''}
        textAlignment="center"
        verticalTextAlignment="middle"
        fontSize="10" />

</gridlayout>
