<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Template } from 'svelte-native/components';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
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

<gridLayout class="dailyView" rows="120" columns="80,*,auto,*,80" borderTopWidth="1" paddingTop="0" paddingBottom="0">

    <label
        col="0"
        fontSize="22"
        verticalTextAlignment="top"
        marginLeft="10"
        marginTop="10"
        html={`${convertTime(item.time, 'ddd ')}<br><small><small><font color=${textLightColor}>${convertTime(item.time, 'DD/MM')}</font></small></small>`} />

    <label col="0" visibility={item.windSpeed > 6 ? 'visible':'collapsed'} color={textLightColor} fontSize="22" verticalTextAlignment="bottom" marginLeft="10" fontFamily={wiFontFamily} text={item.windBeaufortIcon} />
    <label width="60%" colSpan="7" color={textLightColor} fontSize="15" textAlignment="center" fontStyle="italic" verticalTextAlignment="bottom" paddingBottom="4" text={item.summary} />
    <stacklayout col="2" paddingTop="15" orientation="horizontal" >
        <label
            fontSize="14"
            textAlignment="center"
            width="60"
            html={`<big><big><font face=${wiFontFamily}>${item.windIcon}</font></big></big><br>${formatValueToUnit(item.windSpeed, UNITS.Speed)}`} />
        <label
            fontSize="14"
            visibility={item.cloudCover > 0.1 ? 'visible':'collapsed'}
            color={item.cloudColor}
            textAlignment="center"
            width="60"
            html={`<big><big><font face=${wiFontFamily}>wi-cloud</font></big></big><br>${Math.round(item.cloudCover * 100)}%`} />
        <label
            fontSize="14"
            color="#4681C3"
            textAlignment="center"
            width="60"
            html={`<big><big></label><font face=${wiFontFamily}>wi-raindrop</font></big></big><br>${item.precipIntensity >= 0.1 ? formatValueToUnit(Math.floor(item.precipIntensity * 24), UNITS.MM) + "<br>": ''}${Math.round(item.precipProbability * 100)}%`} />
        <label
            width="60"
            fontSize="14"
            color="#6B4985"
            textAlignment="center"
            html={`<big><big><font face=${wiFontFamily}>${item.moonIcon}</font></big></big><br>${l('moon')}`} />
    </stacklayout>
    <WeatherIcon col="4" marginRight="10" marginTop="10" horizontalAlignment="right" fontSize="60" icon={item.icon} />

    <label
        col="4"
        fontSize="20"
        verticalTextAlignment="top"
        textAlignment="right"
        marginTop="5"
        marginRight="10"
        html={`<small><font color=${textLightColor}>${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font></small> ${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}`} />
    <stackLayout col="4" horizontalAlignment="right" backgroundColor={item.color} width="5" />
</gridLayout>
