<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import HourlyView from './HourlyView.svelte';
    import AlertView from './AlertView.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily, textLightColor } from '~/variables';
    import { showBottomSheet } from '~/bottomsheet';
    import { l } from '~/helpers/locale';
    import { getChart } from '~/helpers/sveltehelpers';
    import dayjs from 'dayjs';
    import Theme from '@nativescript/theme';
    import LineChart from 'nativescript-chart/charts/LineChart';
    import { LineData } from 'nativescript-chart/data/LineData';
    import { LineDataSet, Mode } from 'nativescript-chart/data/LineDataSet';
    import { XAxisPosition } from 'nativescript-chart/components/XAxis';
    import { LinearGradient, TileMode } from 'nativescript-canvas';
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
            parent: this,
            view: AlertView,
            // transparent: gVars.isIOS,
            props: {
                alerts: item.alerts
            }
        });
    }

    let lineChart;
    let chartInitialized = false;
    let chartSet;
    let lastChartData;
    function updateLineChart(item) {
        const chart = getChart(lineChart.nativeView);
        // chart.setLogEnabled(true)
        const darkTheme = Theme.getMode() === 'dark';
        if (chart) {
            let data = item.minutely;
            if (!item.minutely.some(d => d.precipIntensity > 0)) {
                data = null;
            }
            if (lastChartData === data) {
                return;
            }
            if (!data) {
                if (chartSet) {
                    chartSet.clear();
                }
                return;
            }
            lastChartData = data;
            const count = data.length;
            const now = dayjs().valueOf();
            if (!chartInitialized) {
                chartInitialized = true;
                console.log('init chart');
                chart.setNoDataText(null)
                chart.setAutoScaleMinMaxEnabled(true);
                chart.getLegend().setEnabled(false);
                chart.getXAxis().setEnabled(true);
                chart.getXAxis().setDrawGridLines(false);
                chart.getXAxis().setDrawMarkTicks(true);
                chart.getXAxis().setValueFormatter({
                    getAxisLabel: f => {
                        const result = Math.floor((f - now) / 600000) * 10;
                        return result === 0 ? '' : result + 'm';
                    }
                });
                chart.getXAxis().setLabelCount(count / 2, true);
                chart.getXAxis().setPosition(XAxisPosition.BOTTOM);
                chart.getAxisLeft().setEnabled(true);
                chart.getAxisLeft().setAxisMinimum(0);
                chart.getAxisRight().setEnabled(false);
                // chart.setMinOffset(0);
                // chart.setExtraTopOffset(0);
                // chart.setLogEnabled(true);
            }
            if (!chartSet) {
                chartSet = new LineDataSet(data, 'precipIntensity', 'time', 'precipIntensity');
                chartSet.setColor('#4681C3');
                chartSet.setLineWidth(3);
                chartSet.setDrawIcons(false);
                chartSet.setDrawValues(false);
                chartSet.setDrawFilled(true);
                // chartSet.setFillAlpha(255);
                chartSet.setFillColor('#4681C3');
                // chartSet.setFillShader(new LinearGradient(0, 0, 0, 150, '#44ffffff', '#00ffffff', TileMode.CLAMP));
                // chartSet.setValueTextColors([darkTheme?'white':'black']);
                // chartSet.setValueFormatter({
                //     getFormattedValue(value, entry) {
                //         return formatValueToUnit(value, UNITS.Celcius);
                //     }
                // });
                chartSet.setMode(Mode.STEPPED);
                chart.setData(new LineData([chartSet]));
            } else {
                chartSet.setValues(data);
                chart.getData().notifyDataChanged();
                chart.notifyDataSetChanged();
            }
            // chart.getXAxis().setAxisMinimum(false);
        }
    }

    let textHtmlBottom;
    // let textHtmlTop;

    // $: {
    // console.log('item changed', item.lastUpdate);
    //     if (item.temperature !== undefined) {
    //         textHtmlTop = `<big><big><big><big><font color="${colorFromTempC(item.temperature)}">${formatValueToUnit(item.temperature, UNITS.Celcius)}</font></big></big></big></big>
    //     ${item.temperature !== item.apparentTemperature ? ('<br>' + formatValueToUnit(item.apparentTemperature, UNITS.Celcius)) : ''}
    //     `;
    //     } else {
    //         textHtmlTop = `<big><big><big><font color="${colorFromTempC(item.temperatureMin)}">${formatValueToUnit(item.temperatureMin, UNITS.Celcius)}</font> | <font color="${colorFromTempC(
    //             item.temperatureMax
    //         )}">${formatValueToUnit(item.temperatureMax, UNITS.Celcius)}</font></big></big></big><br>`;
    //     }
    // }

    // let alerts;
    // $: {
    //     const now = Date.now() + 3600;
    //     alerts = item.alerts && item.alerts.filter(a => a.expires > now);
    // }
    let alerts;
    $: {
        if (lineChart) {
            updateLineChart(item);
        }
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

<gridLayout rows="auto,auto,auto,*" {height} columns="auto,*">
    <label marginRight="10" row="0" colSpan="2" fontSize="20" textAlignment="right" verticalTextAlignment="top" text={convertTime(item.time, 'dddd')} />

    {#if item.temperature !== undefined}
        <label marginLeft="10" fontSize="12" row="0" verticalTextAlignment="top">
            <!-- <label fontSize="12" row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top"> -->
            <span fontSize="26" text={formatValueToUnit(item.temperature, UNITS.Celcius)} />
            <!-- <span text="({formatValueToUnit(item.temperatureMin, UNITS.Celcius)} | {formatValueToUnit(item.temperatureMax, UNITS.Celcius)}){'\n'}" /> -->
            <!-- <span fontFamily={mdiFontFamily} text="mdi-hand" /> -->
            <span color={textLightColor} text={item.temperature !== item.apparentTemperature ? ' ' + formatValueToUnit(item.apparentTemperature, UNITS.Celcius) : ''} />
            <!-- </label> -->
        </label>
    {:else}
        <label marginLeft="10" fontSize="12" row="0" verticalTextAlignment="top">
            <!-- <label row="0" rowSpan="2" paddingLeft="10" verticalAlignment="top"> -->
            <span fontSize="26" text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} />
            <span color="#777" fontSize="26" text=" | " />
            <span fontSize="26" text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)} />
        </label>
    {/if}
    <!-- <label
        marginLeft="10"
        width="24"
        row="1"
        height="24"
        fontSize="14"
        borderRadius="12"
        text={item.uvIndex}
        backgroundColor={item.uvIndexColor}
        horizontalAlignment="left"
        verticalAlignment="top"
        verticalTextAlignment="center"
        textAlignment="center" /> -->

    <wraplayout row="1" verticalAlignment="top" horizontalAlignment="left">
        <label
            width="60"
            fontSize="14"
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<big><big><font face="${wiFontFamily}">${item.windIcon}</font></big></big><br>${formatValueToUnit(item.windSpeed, UNITS.Speed)}`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={item.windIcon + '\n'} />
            <span text={formatValueToUnit(item.windSpeed, UNITS.Speed)} /> -->
        </label>
        <label
            width="60"
            fontSize="14"
            color={item.cloudColor}
            visibility={item.cloudCover > 0 ? 'visible' : 'collapsed'}
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<big><big><font face="${wiFontFamily}">wi-cloud</font></big></big><br>${Math.round(item.cloudCover * 100)}%`} />
        <label
            width="60"
            fontSize="14"
            visibility={item.precipIntensity >= 0.1 && item.precipProbability > 0.1 ? 'visible' : 'collapsed'}
            color="#4681C3"
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<big><big><font face="${wiFontFamily}">wi-raindrop</font></big></big><br>${item.precipIntensity >= 0.1 ? formatValueToUnit(item.precipIntensity, UNITS.MM) + '<br>' : ''}${Math.round(item.precipProbability * 100)}%`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={'wi-raindrop' + '\n'} />
            <span text={Math.round(item.precipProbability * 100) + '%'} /> -->
        </label>
        <!-- <label
            width="60"
            fontSize="14"
            color={item.uvIndexColor}
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<big><big><font face="${wiFontFamily}">wi-day-sunny</font></big></big><br>${item.uvIndex}`}>
        </label> -->
        <label
            width="60"
            fontSize="14"
            color="#6B4985"
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<big><big><font face="${wiFontFamily}">${item.moonIcon}</font></big></big><br>${l('moon')}`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={item.moonIcon + '\n'} /> -->
        </label>
    </wraplayout>
    <!-- <label marginLeft="10" row="0" rowSpan="2" fontSize="14" html={textHtmlBottom} verticalTextAlignment="bottom" /> -->

    <label
        id="testSpan"
        marginLeft="10"
        fontSize="14"
        row="2"
        verticalTextAlignment="bottom"
        html={`<font face="${wiFontFamily}" color="#ffa500">wi-sunrise</font>${convertTime(item.sunriseTime, 'HH:mm')}<font face="${wiFontFamily}" color="#ff7200">wi-sunset</font>${convertTime(item.sunsetTime, 'HH:mm')}`}>

        <!-- <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" /> -->
    </label>
    <!-- <button
        variant="text"
        row="2"
        visibility={alerts && alerts.length ? 'visible' : 'collapsed'}
        marginLeft="10"
        verticalAlignment="center"
        horizontalAlignment="left"
        rippleColor={alerts && alerts.length && alerts[0].alertColor}
        color={alerts && alerts.length && alerts[0].alertColor}
        fontSize="36"
        fontFamily={mdiFontFamily}
        text="mdi-alert"
        on:tap={showAlerts}
        width="50"
        height="50" /> -->
    <linechart bind:this={lineChart} row="1" verticalAlignment="bottom" height="70" />
    <WeatherIcon row="1" col="1" horizontalAlignment="right" verticalAlignment="center" fontSize="140" icon={item.icon} />
    <!-- <label row="2" col="0" marginLeft="10" fontSize="14" fontStyle="italic" textAlignment="left" text={item.summary} verticalTextAlignment="center" /> -->
    <label marginRight="10" row="2" col="0" colSpan="2" fontSize="14" textAlignment="right" verticalTextAlignment="bottom" text="{l('last_updated')}: {formatLastUpdate(item.lastUpdate)}" />
    <!-- <stacklayout visibility={item.hourlyData ? 'visible' : 'collapsed'} row="3" colSpan="2" class="alertView" orientation="horizontal" verticalAlignment="center" paddingLeft="20">
        <WeatherIcon verticalAlignment="middle" fontSize="50" icon={item.hourlyData.icon} />
        <label fontSize="16" paddingLeft="4" verticalAlignment="middle" text={item.hourlyData.summary} maxLines="2" ellipsis="end" />
    </stacklayout> -->
    <HourlyView row="3" colSpan="2" items={item.hourly} />
</gridLayout>
