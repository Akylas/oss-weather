<script lang="ts">
    import Theme from '@nativescript-community/css-theme';
import { Align } from '@nativescript-community/ui-canvas';
import { LimitLabelPosition,LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
import { LineData } from '@nativescript-community/ui-chart/data/LineData';
import { LineDataSet,Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
import dayjs from 'dayjs';
import Color from 'tinycolor2';
import { showBottomSheet } from '~/bottomsheet';
import { convertTime,formatValueToUnit,UNITS } from '~/helpers/formatter';
import { l } from '~/helpers/locale';
import { getChart } from '~/helpers/sveltehelpers';
import { mdiFontFamily,nightColor,rainColor,textLightColor,wiFontFamily } from '~/variables';
import AlertView from './AlertView.svelte';
import HourlyView from './HourlyView.svelte';
import WeatherIcon from './WeatherIcon.svelte';

    interface Item {
        alerts?: any;
        minutely?: { time: number; precipIntensity: number }[];
        time: number;
        lastUpdate: number;
        sunsetTime: number;
        sunriseTime: number;
        icon: string;
        windIcon: string;
        moonIcon: string;
        windSpeed?: string;
        cloudCover?: number;
        cloudCeiling?: number;
        uvIndex?: number;
        precipProbability?: number;
        precipIntensity?: number;
        cloudColor?: string;
        uvIndexColor?: string;
        temperatureMin?: number;
        temperatureMax?: number;
        temperature?: number;
        apparentTemperature?: number;
        hourly?;
    }
    export let item: Item;
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
                alerts: item.alerts,
            },
        });
    }

    let lineChart;
    let chartInitialized = false;
    let precipChartSet: LineDataSet;
    let cloudChartSet: LineDataSet;
    let lastChartData: {
        time: number;
        precipIntensity: number;
    }[];
    function updateLineChart(item: Item) {
        const chart = getChart(lineChart.nativeView);
        // chart.setLogEnabled(true)
        if (chart) {
            let data = item.minutely;
            const now = dayjs().valueOf();
            const index = data.findIndex((v) => v.time >= now);
            data = data.slice(index);
            // console.log('data', JSON.stringify(data));

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
            // const count = data.length;
            if (!chartInitialized) {
                const darkTheme = /dark|black/.test(Theme.getMode());
                const textColor = darkTheme ? 'white' : 'black';
                const limitColor = Color(textColor).setAlpha(0.5).toRgbString();
                chartInitialized = true;
                chart.setNoDataText(null);
                chart.setAutoScaleMinMaxEnabled(true);
                chart.getLegend().setEnabled(false);
                const xAxis = chart.getXAxis();
                xAxis.setEnabled(true);
                
                xAxis.setTextColor(textColor);
                xAxis.setLabelTextAlign(Align.CENTER);
                xAxis.setDrawGridLines(false);
                xAxis.setDrawMarkTicks(true);
                xAxis.setValueFormatter({
                    getAxisLabel: (f) => {
                        // console.log('getAxisLabel', f);
                        const val = lastChartData[Math.round(f)]; 
                        if (val) {
                            const result = Math.floor((val.time - now) / 600000) * 10;
                            return result === 0 ? '' : result + 'm';
                        }

                        return '';
                    },
                });
                xAxis.setLabelCount(7, true);
                xAxis.setPosition(XAxisPosition.BOTTOM);

                const rightAxis = chart.getAxisRight();
                rightAxis.setEnabled(false);
                // rightAxis.setAxisMinimum(0);
                // rightAxis.setTextColor(Color(textColor).setAlpha(0.5).toRgbString());
                // rightAxis.setDrawGridLines(false);
                // rightAxis.setDrawAxisLine(false);
                // rightAxis.setDrawLabels(false);
                // rightAxis.setLabelCount(4);
                // rightAxis.setAxisMaximum(6000);

                const leftAxis = chart.getAxisLeft();
                leftAxis.setAxisMinimum(0);
                leftAxis.setDrawGridLines(false);
                leftAxis.setDrawLabels(false);
                leftAxis.setDrawAxisLine(false);
                leftAxis.removeAllLimitLines();

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

            // if (!precipChartSet || !cloudChartSet) {
            let needsToSetData = false;
            let needsUpdate = false;
            const hasPrecip = data.some((d) => d.precipIntensity > 0);
            let min = 10000;
            let max = -10000;
            data.forEach((h) => {
                if (h.precipIntensity < min) {
                    min = h.precipIntensity;
                }
                if (h.precipIntensity > max) {
                    max = h.precipIntensity;
                }
            });

            const leftAxis = chart.getAxisLeft();
            leftAxis.setAxisMaximum(Math.max(max, 2.4));
            leftAxis.setDrawLimitLines(hasPrecip);
            // console.log(JSON.stringify(data.map((v) => ({ t: v.time, v: v.precipIntensity }))));
            if (hasPrecip) {
                if (!precipChartSet) {
                    needsToSetData = true;
                    precipChartSet = new LineDataSet(data, 'precipIntensity', undefined, 'precipIntensity');
                    precipChartSet.setAxisDependency(AxisDependency.LEFT);
                    precipChartSet.setLineWidth(1);
                    precipChartSet.setDrawIcons(false);
                    precipChartSet.setDrawValues(false);
                    // precipChartSet.setDrawCircles(true);
                    precipChartSet.setDrawFilled(true);
                    precipChartSet.setColor(rainColor);
                    precipChartSet.setFillColor(rainColor);
                    precipChartSet.setFillAlpha(150);
                    // precipChartSet.setCubicIntensity(0.2);
                    precipChartSet.setMode(Mode.CUBIC_BEZIER);
                } else {
                    precipChartSet.setValues(data);
                    needsUpdate = true;
                }
            } else if (precipChartSet && precipChartSet.getEntryCount() > 0) {
                precipChartSet.clear();
                needsToSetData = true;
            }
            // const hasCloud = data.some((d) => d.cloudCeiling > 0);
            // const rightAxis = chart.getAxisRight();
            // rightAxis.setDrawLabels(hasCloud);
            // // console.log('hasCloud', hasCloud, data);
            // if (hasCloud) {
            //     // rightAxis.setLabelCount(4, false);
            //     if (!cloudChartSet) {
            //         needsToSetData = true;
            //         cloudChartSet = new LineDataSet(data, 'cloudCeiling', 'time', 'cloudCeiling');
            //         cloudChartSet.setAxisDependency(AxisDependency.RIGHT);
            //         cloudChartSet.setLineWidth(2);
            //         cloudChartSet.setDrawIcons(false);
            //         cloudChartSet.setDrawValues(false);
            //         cloudChartSet.setDrawFilled(false);
            //         cloudChartSet.setColor('gray');
            //         cloudChartSet.setMode(Mode.HORIZONTAL_BEZIER);
            //     } else {
            //         cloudChartSet.setValues(data);
            //         needsUpdate = true;
            //     }
            // } else if (cloudChartSet) {
            //     cloudChartSet.clear();
            // }
            if (needsToSetData) {
                // chart.setData(new LineData([precipChartSet, cloudChartSet].filter((s) => !!s)));
                chart.setData(new LineData([precipChartSet].filter((s) => !!s)));
            } else if (needsUpdate) {
                // chart.setData(chart.getData());
                precipChartSet.notifyDataSetChanged();
                chart.getData().notifyDataChanged();
                chart.notifyDataSetChanged();
            }
        }
    }
    $: {
        if (lineChart) {
            updateLineChart(item);
        }
    }
</script>

<gridLayout rows="auto,*" {height} columns="*,auto">
    <!-- htmllabel 10 more views -->
    <!-- label 25 more views !!! -->
    <canvaslabel colSpan="2">
        <cspan id="first" paddingRight="10" fontSize="20" textAlignment="right" verticalAlignment="top" text={convertTime(item.time, 'dddd')} />

        {#if item.temperature !== undefined}
            <cgroup id="test" paddingLeft="10" fontSize="12" verticalAlignment="top">
                <cspan fontSize="26" text={formatValueToUnit(item.temperature, UNITS.Celcius)} />
                <cspan color={textLightColor} text={item.temperature !== item.apparentTemperature ? ' ' + formatValueToUnit(item.apparentTemperature, UNITS.Celcius) : null} />
            </cgroup>
        {/if}
        <cgroup paddingLeft="80" paddingTop="11" fontSize="14" verticalAlignment="top">
            <cspan text={formatValueToUnit(item.temperatureMin, UNITS.Celcius)} />
            <cspan color="#777" text=" | " />
            <cspan text={formatValueToUnit(item.temperatureMax, UNITS.Celcius)} />
        </cgroup>
        <!-- {/if} -->

        <cgroup paddingLeft="0" paddingTop="40" fontSize="14" verticalAlignment="top" width="60" textAlignment="center">
            <cspan fontSize="24" fontFamily={wiFontFamily} text={item.windIcon} />
            <cspan text={'\n' + formatValueToUnit(item.windSpeed, UNITS.Speed)} />
        </cgroup>
        <cgroup paddingLeft="60" paddingTop="40" fontSize="14" verticalAlignment="top" width="60" textAlignment="center" color={nightColor}>
            <cspan fontSize="24" fontFamily={wiFontFamily} text={item.moonIcon} />
            <cspan text={'\n' + l('moon')} />
        </cgroup>
        {#if item.cloudCover > 0}
            <cgroup paddingLeft="120" paddingTop="40" fontSize="14" verticalAlignment="top" width="60" textAlignment="center" color={item.cloudColor}>
                <cspan fontSize="24" fontFamily={wiFontFamily} text="wi-cloud" />
                <cspan text={'\n' + Math.round(item.cloudCover * 100) + '%'} />
                <cspan fontSize="9" text={item.cloudCeiling ? '\n' + formatValueToUnit(item.cloudCeiling, UNITS.Distance) : null} />
            </cgroup>
        {/if}
        {#if item.uvIndex > 0}
            <cgroup paddingLeft="180" paddingTop="44" fontSize="14" verticalAlignment="top" width="60" textAlignment="center" color={item.uvIndexColor}>
                <cspan fontSize="30" fontFamily={mdiFontFamily} text="mdi-weather-sunny-alert" color={item.uvIndexColor} />
                <cspan paddingTop="14" text={'\n' + Math.round(item.uvIndex)} />
            </cgroup>
        {/if}
        {#if (item.precipProbability === -1 || item.precipIntensity >= 0.1) && item.precipProbability > 0.1}
            <cgroup color={rainColor} paddingLeft={item.cloudCover > 0 ? 180 : 120} paddingTop="40" fontSize="14" verticalAlignment="top" width="60" textAlignment="center">
                <cspan fontSize="24" fontFamily={wiFontFamily} text="wi-raindrop" />
                <cspan text={item.precipIntensity >= 0.1 ? '\n' + formatValueToUnit(item.precipIntensity, UNITS.MM) : null} />
                <cspan fontSize="9" text={item.precipProbability > 0 ? '\n' + Math.round(item.precipProbability * 100) + '%' : null} />
            </cgroup>
        {/if}

        <cgroup paddingLeft="10" paddingBottom="10" fontSize="14" verticalAlignment="bottom">
            <cspan color="#ffa500" fontFamily={wiFontFamily} text="wi-sunrise" />
            <cspan text={convertTime(item.sunriseTime, 'HH:mm')} />
            <cspan color="#ff7200" fontFamily={wiFontFamily} text="wi-sunset" />
            <cspan text={convertTime(item.sunsetTime, 'HH:mm')} />
        </cgroup>
        <cspan paddingRight="10" fontSize="14" textAlignment="right" verticalAlignment="bottom" text="{l('last_updated')}: {formatLastUpdate(item.lastUpdate)}" paddingBottom="10" />
    </canvaslabel>

    <linechart bind:this={lineChart} marginTop="110" verticalAlignment="bottom" height="90" marginBottom="40" />
    <WeatherIcon col="1" horizontalAlignment="right" verticalAlignment="center" fontSize="140" icon={item.icon} />
    <HourlyView row="1" colSpan="2" items={item.hourly} />
</gridLayout>
