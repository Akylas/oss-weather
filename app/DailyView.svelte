<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Template } from 'svelte-native/components';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    // import { createEventDispatcher } from 'svelte';
    import { mdiFontFamily, wiFontFamily, textLightColor } from '~/variables';
    // const dispatch = createEventDispatcher();

    // function forward(event) {
    //     dispatch('longPress', item);
    // }
    let collectionView;
    export let item;

    function onDataPopulated() {
        if (item && item.hourly) {
            // console.log('onDataPopulated', convertTime(item.time, 'dddd'), item.scrollIndex);
            setTimeout(() => {
                collectionView.nativeView.scrollToIndex(item.scrollIndex, false);
            }, 0);
        }
    }
    // $: {
    //     console.log('daily item', Object.keys(item));
    // }
    // let textHtml;
    // $: {
    //     textHtml = `
        
    //     `;
    // }
    // let textTopHtml;
    // $: {
    //     textTopHtml = `
    //     <font face="${wiFontFamily}">wi-cloud</font>
    //     ${Math.round(item.cloudCover * 100)}%
    //     ${
    //         item.precipProbability > 0.05
    //             ? `<font color="#4681C3" face="${wiFontFamily}">wi-raindrop</font>
    //     <font color="#4681C3">${Math.round(item.precipProbability * 100)}%</font>`
    //             : ''
    //     }
    //     ${item.windSpeed > 10 ? `<big><big><font face="${wiFontFamily}">${item.windBeaufortIcon}</font></big></big>` : ''}
    //     <big><big>${item.windIcon}</big></big>
    //     ${formatValueToUnit(item.windSpeed, UNITS.Speed)}
    //     <br>
    //     <font color="#ffa500" face="${wiFontFamily}">wi-sunrise</font>
    //     ${convertTime(item.sunriseTime, 'HH:mm')}
    //     <font color="#ff7200" face="${wiFontFamily}">wi-sunset</font>
    //     ${convertTime(item.sunsetTime, 'HH:mm')}
    //     `;
    // }
</script>

<gridLayout class="dailyView" rows="120" columns="100,*,60,60,60,*,100" borderTopWidth="1" paddingTop="0" paddingBottom="0">

    <label col="0" fontSize="22" verticalTextAlignment="top" marginLeft="10" marginTop="10" html={`${convertTime(item.time, 'ddd ')}<br><small><small><font color=${textLightColor}>${convertTime(item.time, 'DD/MM')}</font></small></small>`}>
        <!-- <span text={convertTime(item.time, 'ddd ') + '\n'} />
        <span fontSize="14" color={textLightColor} text={convertTime(item.time, 'DD/MM')} /> -->
    </label>

    {#if item.windSpeed > 6}
        <label col="0" color={textLightColor} fontSize="22" verticalTextAlignment="bottom" marginLeft="10" fontFamily={wiFontFamily} text={item.windBeaufortIcon} />
    {/if}
    <!-- <label marginTop="10" marginRight="10" row="0" col="1" fontSize="18" textAlignment="right">
        <span color="#6B4985" fontFamily={wiFontFamily} fontSize="22" text={item.moonIcon} />
        <span text={convertTime(item.time, 'ddd')} />
    </label> -->
    <label width="60%" colSpan="7" color={textLightColor} fontSize="15" textAlignment="center" fontStyle="italic" verticalTextAlignment="bottom" paddingBottom="10" text={item.summary} />

    <!-- <label id="testHTML" row="0" col="0" colSpan="3" textAlignment="center" verticalTextAlignment="top" fontSize="12" html={textTopHtml} /> -->

        <label col= "2" fontSize="14" horizontalAlignment="center"  verticalAlignment="top" textAlignment="center" paddingTop="10" html={`<big><big><font face=${wiFontFamily}>${item.windIcon}</font></big></big><br>${formatValueToUnit(item.windSpeed, UNITS.Speed)}`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={item.windIcon + '\n'} />
            <span text={formatValueToUnit(item.windSpeed, UNITS.Speed)} /> -->
        </label>
        <label col="3" fontSize="14" color="#999" horizontalAlignment="center"  verticalAlignment="top" textAlignment="center" paddingTop="10" html={`<big><big><font face=${wiFontFamily}>wi-cloud</font></big></big><br>${Math.round(item.cloudCover * 100)}%`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={'wi-cloud' + '\n'} />
            <span text={Math.round(item.cloudCover * 100) + '%'} /> -->
        </label>
        <label col="4" fontSize="14" color="#4681C3" horizontalAlignment="center"  verticalAlignment="top" textAlignment="center" paddingTop="10" html={`<big><big></label><font face=${wiFontFamily}>wi-raindrop</font></big></big><br>${Math.round(item.precipProbability * 100)}%`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={'wi-raindrop' + '\n'} />
            <span text={Math.round(item.precipProbability * 100) + '%'} /> -->
        </label>
    <!-- <label id="testHTML" row="0" col="0" colSpan="3" textAlignment="center" verticalTextAlignment="top" fontSize="12" html={textTopHtml} /> -->
    <!-- <label marginTop="10" id="test" marginLeft="10" row="0" fontSize="12" >
     <span fontSize="22" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} color={colorFromTempC(item.temperatureMin)} />
        <span color="#777" fontSize="26" text=" | " />
        <span fontSize="22" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius) + '\n\n\n'} color={colorFromTempC(item.temperatureMax)} />
        <span fontFamily={wiFontFamily} fontSize="18" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'} " />
        <span fontFamily={wiFontFamily} fontSize="14" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
        <span fontFamily={wiFontFamily} fontSize="14" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span fontFamily={wiFontFamily} fontSize="14" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" /> 
     </label> -->
    <WeatherIcon row="0" col="6" marginRight="10" marginTop="10" verticalAlignment="middle" horizontalAlignment="right" fontSize="60" icon={item.icon} />

    <label col="6" fontSize="20" verticalTextAlignment="top" textAlignment="right" marginTop="5" marginRight="10" html={`<small><font color=${textLightColor}>${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font></small> ${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}`}>
        <!-- <span fontSize="17" color={textLightColor} text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} />
        <span text={' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius)} /> -->
    </label>
    <stackLayout col="6" horizontalAlignment="right" backgroundColor={item.color} width="5" />
</gridLayout>
