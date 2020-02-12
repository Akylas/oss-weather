<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Template } from 'svelte-native/components';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { createEventDispatcher } from 'svelte';
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    const dispatch = createEventDispatcher();

    function forward(event) {
        dispatch('longPress', item);
    }
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
    // let textHtmlTop
    // let textHtmlBottom
    //  $: {
    //     textHtmlTop = `<font color="${colorFromTempC(item.temperatureMin)}">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font> |
    //     <font color="${colorFromTempC(item.temperatureMax)}">${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}</font>`
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
    //     `
    // }
</script>

<gridLayout rows="145" columns="*,auto,auto,auto" backgroundColor="black" borderTopColor="#666" borderTopWidth="1" padding="10 0 10 0" on:longPress={forward}>
    <label row="0" colSpan="2" fontSize="18" paddingRight="5" textAlignment="right" text={convertTime(item.time, 'dddd')} />
    <!-- <label row="0" fontSize="22" verticalTextAlignment="top"  color="#777" html={textHtmlTop} /> -->
    <!-- <stackLayout row="0" verticalAlignment="top" orientation="horizontal">
        <label fontSize="22" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} color={colorFromTempC(item.temperatureMin)} />
        <label color="#777" fontSize="26" text=" | " />
        <label fontSize="22" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)} color={colorFromTempC(item.temperatureMax)} />
    </stackLayout> -->
    <!-- <label fontSize="12" row="0" verticalTextAlignment="bottom" textAlignment="left"  html={textHtmlBottom} /> -->
    <!-- <gridlayout rows="auto,auto,auto,auto" columns="auto,auto,auto,auto" row="0" verticalAlignment="bottom" horizontalAlignment="left">
        <label row="0" fontSize="16" ios:padding="0 -6 0 -6" class="mdi" text="mdi-navigation" rotate={item.windBearing + 180} />
        <label row="0" col="1" fontSize="12 " text={formatValueToUnit(item.windSpeed, UNITS.Speed)} verticalAlignment="middle" />
        <label row="1" fontSize="14" class="wi" text="wi-cloud" />
        <label row="1" col="1" fontSize="12" text=" {Math.round(item.cloudCover * 100)}%" verticalAlignment="middle" />
        <label row="2" fontSize="14" class="wi" text="wi-sunrise" color="#ffa500" />
        <label row="2" col="1" fontSize="12" text={convertTime(item.sunriseTime, 'HH:mm')} verticalAlignment="middle" />
        <label row="2" col="2" fontSize="14" class="wi" text="wi-sunset" color="#ff7200" />
        <label row="2" col="3" fontSize="12" text=" {convertTime(item.sunsetTime, 'HH:mm')}" verticalAlignment="middle" />
    </gridlayout> -->
    <label row="0" fontSize="12">
        <span fontSize="22" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} color={colorFromTempC(item.temperatureMin)} />
        <span color="#777" fontSize="26" text=" | " />
        <span fontSize="22" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)+ '\n\n\n'} color={colorFromTempC(item.temperatureMax)} />
    <!-- </label> -->

    <!-- <stackLayout row="0" verticalAlignment="bottom" horizontalAlignment="left"> -->
    <!-- <stackLayout ios:paddingLeft="7" orientation="horizontal" paddingTop="5">
            <label fontSize="16" ios:padding="0 -6 0 -6" class="mdi" text="mdi-navigation" verticalAlignment="center" rotate={item.windBearing + 180} />
            <label fontSize="12 " text={formatValueToUnit(item.windSpeed, UNITS.Speed)} verticalAlignment="center" />
        </stackLayout> -->

    <!-- <label row="0" verticalTextAlignment="bottom" fontSize="12"> -->
        <span class="wi" fontSize="18" text={item.windIcon} />
        <span text=" {formatValueToUnit(item.windSpeed, UNITS.Speed) + '\n'} " />
        <span class="wi" fontSize="14" text="wi-cloud" />
        <span text=" {Math.round(item.cloudCover * 100)}%{'\n'}" />
        <span class="wi" fontSize="14" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span class="wi" fontSize="14" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" />
    </label>
    <!-- </stackLayout> -->
    <WeatherIcon row="0" col="1" verticalAlignment="middle" fontSize="80" icon={item.icon} autoPlay="true" />
    <label row="0" colSpan="2" width="60%" horizontalAlignment="right" fontSize="14" paddingRight="5" textAlignment="right" verticalTextAlignment="bottom" text={item.summary} />
    <collectionview
        row="1"
        colSpan="2"rm
        width="100%"
        bind:this={collectionView}
        visibility={item && item.hourly && item.hourly.length > 0 && item.showHourly ? 'visible' : 'collapsed'}
        orientation="horizontal"
        height="200"
        colWidth="80"
        rowHeight="100%"
        items={item.hourly}
        on:dataPopulated={onDataPopulated}>
        <Template let:item>
            <WeatherCollectionItem {item} />
        </Template>
    </collectionview>
</gridLayout>
