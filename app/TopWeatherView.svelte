<script>
    import WeatherIcon from './WeatherIcon.svelte';
    import HourlyView from './HourlyView.svelte';
    import AlertView from './AlertView.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, nightColor, rainColor, wiFontFamily, textLightColor } from '~/variables';
    import { showBottomSheet } from '~/bottomsheet';
    import { l, lu } from '~/helpers/locale';
    import { getChart } from '~/helpers/sveltehelpers';
    import dayjs from 'dayjs';
    import Theme from '@nativescript/theme';
    import LineChart from 'nativescript-chart/charts/LineChart';
    import { LineData } from 'nativescript-chart/data/LineData';
    import { LimitLine, LimitLabelPosition } from 'nativescript-chart/components/LimitLine';
    import { LineDataSet, Mode } from 'nativescript-chart/data/LineDataSet';
    import { XAxisPosition } from 'nativescript-chart/components/XAxis';
    import { AxisDependency } from 'nativescript-chart/components/YAxis';
    import { LinearGradient, TileMode } from 'nativescript-canvas';
    import Color from 'tinycolor2';
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
            props: {
                alerts: item.alerts
            }
        });
    }

    let lineChart;
    let chartInitialized = false;
    let precipChartSet;
    let cloudChartSet;
    let lastChartData;
    function updateLineChart(item) {
        const chart = getChart(lineChart.nativeView);
        // chart.setLogEnabled(true)
        if (chart) {
            let data = item.minutely;

            if (lastChartData === data) {
                return;
            }
            if (!data) {
                if (precipChartSet) {
                    precipChartSet.clear();
                }
                if (cloudChartSet) {
                    cloudChartSet.clear();
                }
                return;
            }
            lastChartData = data;
            const count = data.length;
            const now = dayjs().valueOf();
            if (!chartInitialized) {
                const darkTheme = /dark/.test(Theme.getMode());
                const textColor = darkTheme ? 'white' : 'black';
                const limitColor = Color(textColor)
                    .setAlpha(0.5)
                    .toRgbString();
                chartInitialized = true;
                chart.setNoDataText(null);
                chart.setAutoScaleMinMaxEnabled(true);
                chart.getLegend().setEnabled(false);
                const xAxis = chart.getXAxis();
                xAxis.setEnabled(true);
                xAxis.setTextColor(textColor);
                xAxis.setDrawGridLines(false);
                xAxis.setDrawMarkTicks(true);
                xAxis.setValueFormatter({
                    getAxisLabel: f => {
                        const result = Math.floor((f - now) / 600000) * 10;
                        return result === 0 ? '' : result + 'm';
                    }
                });
                xAxis.setLabelCount(count / 2, true);
                xAxis.setPosition(XAxisPosition.BOTTOM);

                const rightAxis = chart.getAxisRight();
                rightAxis.setAxisMinimum(0);
                rightAxis.setDrawGridLines(false);
                rightAxis.setDrawAxisLine(false);
                rightAxis.setDrawLabels(false);
                rightAxis.setAxisMaximum(6000);

                const leftAxis = chart.getAxisLeft();
                leftAxis.setAxisMinimum(0);
                // leftAxis.setTextColor(textColor);
                leftAxis.setDrawGridLines(false);
                leftAxis.setDrawLabels(false);
                leftAxis.setDrawAxisLine(false);

                let limitLine = new LimitLine(0, l('light').toUpperCase());
                limitLine.setLineWidth(0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);

                limitLine = new LimitLine(2.5, l('medium').toUpperCase());
                limitLine.setLineWidth(1);
                limitLine.setLineColor(limitColor);
                limitLine.enableDashedLine(2, 2, 0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);
                limitLine = new LimitLine(7.6, l('heavy').toUpperCase());
                limitLine.setLineWidth(1);
                limitLine.setLineColor(limitColor);
                limitLine.enableDashedLine(2, 2, 0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);
            }
            let min = 10000;
            let max = -10000;
            data.forEach(h => {
                if (h.precipIntensity < min) {
                    min = h.precipIntensity;
                }
                if (h.precipIntensity > max) {
                    max = h.precipIntensity;
                }
            });
            const leftAxis = chart.getAxisLeft();
            leftAxis.setAxisMaximum(Math.max(max, 2.4));
            // if (!precipChartSet || !cloudChartSet) {
            let needsToSetData = false;
            let needsUpdate = false;
            if (data.some(d => d.precipIntensity > 0)) {
                if (!precipChartSet) {
                    needsToSetData = true;
                    // console.log((data.map(s=>s.precipIntensity)));
                    precipChartSet = new LineDataSet(data, 'precipIntensity', 'time', 'precipIntensity');
                    precipChartSet.setAxisDependency(AxisDependency.LEFT);
                    precipChartSet.setLineWidth(1);
                    precipChartSet.setDrawIcons(false);
                    precipChartSet.setDrawValues(false);
                    // precipChartSet.setDrawCircles(true);
                    precipChartSet.setDrawFilled(true);
                    precipChartSet.setColor(rainColor);
                    precipChartSet.setFillColor(rainColor);
                    precipChartSet.setFillAlpha(150);
                    precipChartSet.setMode(Mode.HORIZONTAL_BEZIER);
                } else {
                    precipChartSet.setValues(data);
                    needsUpdate = true;
                }
            } else if (precipChartSet) {
                precipChartSet.clear();
            }
            if (data.some(d => d.cloudCeiling > 0)) {
                if (!cloudChartSet) {
                    needsToSetData = true;
                    cloudChartSet = new LineDataSet(data, 'cloudCeiling', 'time', 'cloudCeiling');
                    cloudChartSet.setAxisDependency(AxisDependency.RIGHT);
                    cloudChartSet.setLineWidth(0);
                    cloudChartSet.setDrawIcons(false);
                    cloudChartSet.setDrawValues(false);
                    cloudChartSet.setDrawFilled(true);
                    cloudChartSet.setFillColor('#4681C3');
                    cloudChartSet.setFillAlpha(150);
                    cloudChartSet.setMode(Mode.CUBIC_BEZIER);
                } else {
                    cloudChartSet.setValues(data);
                    needsUpdate = true;
                }
            } else if (cloudChartSet) {
                cloudChartSet.clear();
            }
            if (needsToSetData) {
                chart.setData(new LineData([precipChartSet, cloudChartSet].filter(s=>!!s))); 
            } else if (needsUpdate) {
                chart.getData().notifyDataChanged();
                chart.notifyDataSetChanged();
            }
        }
    }

    let textHtmlBottom;
    let alerts;
    $: {
        if (lineChart) {
            updateLineChart(item);
        }
    }
</script>

<gridLayout rows="auto,auto,auto,auto,*" {height} columns="auto,*">
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

    <wraplayout row="1" verticalAlignment="top" horizontalAlignment="left">
        <label
            width="60"
            fontSize="14"
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<span style=" font-size:24px; font-family:${wiFontFamily};">${item.windIcon}</span><br>${formatValueToUnit(item.windSpeed, UNITS.Speed)}`}>
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
            html={`<span style="font-size:24px; font-family:${wiFontFamily};">wi-cloud</span><br>${Math.round(item.cloudCover * 100)}%${item.cloudCeiling ? `<br><span style="font-size:6;">${formatValueToUnit(item.cloudCeiling, UNITS.Distance)}</span>` : ''}`} />
        <label
            width="60"
            fontSize="14"
            visibility={item.precipIntensity >= 0.1 && item.precipProbability > 0.1 ? 'visible' : 'collapsed'}
            color={rainColor}
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<span style=" font-size:24px; font-family:${wiFontFamily};">wi-raindrop</span><br>${item.precipIntensity >= 0.1 ? formatValueToUnit(item.precipIntensity, UNITS.MM) + '<br>' : ''}${Math.round(item.precipProbability * 100)}%`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={'wi-raindrop' + '\n'} />
            <span text={Math.round(item.precipProbability * 100) + '%'} /> -->
        </label>
        <label
            width="60"
            fontSize="14"
            color={nightColor}
            horizontalAlignment="left"
            verticalAlignment="top"
            textAlignment="center"
            paddingTop="10"
            html={`<span style=" font-size:24px; font-family:${wiFontFamily};">${item.moonIcon}</span><br>${l('moon')}`}>
            <!-- <span fontSize="26" fontFamily={wiFontFamily} text={item.moonIcon + '\n'} /> -->
        </label>
    </wraplayout>
    <!-- <label marginLeft="10" row="0" rowSpan="2" fontSize="14" html={textHtmlBottom} verticalTextAlignment="bottom" /> -->

    <linechart bind:this={lineChart} row="2" verticalAlignment="bottom" height="90" />
    <WeatherIcon row="1" col="1" rowSpan="2" horizontalAlignment="right" verticalAlignment="center" fontSize="140" icon={item.icon} />

    <label
        id="testSpan"
        marginLeft="10"
        marginTop="20"
        fontSize="14"
        row="3"
        verticalTextAlignment="bottom"
        html={`<font face="${wiFontFamily}" color="#ffa500">wi-sunrise</font>${convertTime(item.sunriseTime, 'HH:mm')}<font face="${wiFontFamily}" color="#ff7200">wi-sunset</font>${convertTime(item.sunsetTime, 'HH:mm')}`}  marginBottom="10">

        <!-- <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunrise" color="#ffa500" />
        <span text=" {convertTime(item.sunriseTime, 'HH:mm')} " />
        <span fontFamily={wiFontFamily} fontSize="16" text="wi-sunset" color="#ff7200" />
        <span text=" {convertTime(item.sunsetTime, 'HH:mm')}" /> -->
    </label>
    <label marginRight="10" row="3" col="0" colSpan="2" fontSize="14" textAlignment="right" verticalTextAlignment="bottom" text="{l('last_updated')}: {formatLastUpdate(item.lastUpdate)}"  marginBottom="10" />
    <HourlyView row="4" colSpan="2"items={item.hourly} />
</gridLayout>
