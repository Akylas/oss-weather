<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Template } from 'svelte-native/components';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    // import { createEventDispatcher } from 'svelte';
    import { mdiFontFamily, wiFontFamily } from '~/variables';
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
    let textHtml;
    $: {
        textHtml = `<big><big><big><font color="${colorFromTempC(item.temperatureMax)}">${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}</font></big><br><font color="${colorFromTempC(
            item.temperatureMin
        )}">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font></big></big><br>
        <br><br><br>
        ${item.precipProbability > 0.05 ? `<font color="#4681C3" face="${wiFontFamily}">wi-umbrella</font> ${Math.round(item.precipProbability * 100)}%<br>` : '<br>'}
        <big>${item.windIcon}</big> ${formatValueToUnit(item.windSpeed, UNITS.Speed)}<br>
        <font face="${wiFontFamily}">wi-cloud</font>
        ${Math.round(item.cloudCover * 100)}%<br>
        <font color="#ffa500" face="${wiFontFamily}">wi-sunrise</font>
        ${convertTime(item.sunriseTime, 'HH:mm')}
        <font color="#ff7200" face="${wiFontFamily}">wi-sunset</font>
        ${convertTime(item.sunsetTime, 'HH:mm')}
        `;
    }
</script>

<gridLayout rows="173" columns="*,*" backgroundColor="black" borderTopColor="#333" borderTopWidth="1">
    <label marginTop="10" row="0" col="1" fontSize="18" textAlignment="right">
        <span color="#6B4985" fontFamily={wiFontFamily} fontSize="22" text={item.moonIcon} />
        <span text={convertTime(item.time, 'dddd')} />
    </label>
    <label marginBottom="10" row="0" col="1" horizontalAlignment="right" fontSize="14" textAlignment="right" fontStyle="italic" verticalTextAlignment="bottom" text={item.summary} />
    <label id="testHTML" marginTop="10" marginLeft="10" row="0" fontSize="12" html={textHtml} />
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
    <WeatherIcon row="0" col="1" verticalAlignment="middle" horizontalAlignment="right" fontSize="80" icon={item.icon} autoPlay="true" />
    <stackLayout horizontalAlignment="left" backgroundColor={item.color} width="5" />
</gridLayout>
