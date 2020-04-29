<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, colorForIcon, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily, textLightColor } from '~/variables';
    export let item;
    // let textHtml;
    // $: {
    //     textHtml = `<big>${formatValueToUnit(item.temperature, UNITS.Celcius)}°</big>
    //     `;
    // }
    // let textBottomHtml;
    // $: {
    //     textBottomHtml = `${item.summary ? `<font color="${textLightColor}">${item.summary}</font>` : ''}<br><big><big>${item.windIcon}</big></big> ${formatValueToUnit(item.windSpeed, UNITS.Speed)}`;
    // }
</script>

<gridlayout height="100%" rows="auto,*,10" paddingTop="10" backgroundColor={`rgba(0,0,0,${item.odd ? 0.02 : 0})`}>
    <label textAlignment="center" fontSize="14" fontWeight="bold" html={`<big><b>${convertTime(item.time, 'HH:mm')}</b></big><br>${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed, {unitScale:2})}`} />
    <!-- <label width="100%" textAlignment="center">
        <span fontSize="10" text={item.summary + '\n'} />
        <span fontSize="14" text={formatValueToUnit(item.temperature, UNITS.Celcius)} color={colorFromTempC(item.temperature)} />
    </label> -->
    <!-- <label row="2" fontSize="12" paddingTop="5" horizontalAlignment="center" textAlignment="center" html={textHtml}/> -->
    <label 
        row="1" 
        verticalAlignment="bottom" 
        opacity={item.precipProbability} 
        backgroundColor={item.precipColor} 
        height={item.precipIntensity*10 + '%'}
        color="white"
        text={item.precipProbability > 0.1 && item.precipIntensity >= 0.1 ? formatValueToUnit(item.precipIntensity, UNITS.MM) : ''}
        textAlignment="center"
        verticalTextAlignment="bottom"
        fontSize="10" />
    <stacklayout row="1" verticalAlignment="bottom" marginBottom={((item.temperature - item.min) / (item.max - item.min)) * 55 + '%'}>
        <label fontSize="14" marginTop="10" textAlignment="center" html={`${formatValueToUnit(item.temperature, UNITS.Celcius)}°`} />
        <WeatherIcon icon={item.icon}  marginBottom="10"/>
    </stacklayout>
    <!-- <label row="3" fontSize="11" textAlignment="center" verticalTextAlignment="bottom" html={textBottomHtml} /> -->
    <!-- <label row="3" fontSize="12" textAlignment="center" html={textBottomHtml} /> -->
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

    <absolutelayout
        row="2"
        backgroundColor={item.color}/>

</gridlayout>
