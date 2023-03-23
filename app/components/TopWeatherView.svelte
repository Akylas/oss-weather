<script lang="ts">
    import { Align, Canvas, Paint } from '@nativescript-community/ui-canvas';
    import { LineChart } from '@nativescript-community/ui-chart';
    import { LimitLabelPosition, LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { Color } from '@nativescript/core';
    import dayjs from 'dayjs';
    import { createEventDispatcher } from 'svelte';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import HourlyView from '~/components/HourlyView.svelte';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import { convertValueToUnit, formatValueToUnit, toImperialUnit, UNITS } from '~/helpers/formatter';
    import { formatDate, formatTime, l, lc } from '~/helpers/locale';
    import { appFontFamily, imperial, mdiFontFamily, nightColor, rainColor, snowColor, textColor, wiFontFamily } from '~/variables';
    const dispatch = createEventDispatcher();

    const textIconPaint = new Paint();
    textIconPaint.setTextAlign(Align.CENTER);
    const textIconSubPaint = new Paint();
    textIconSubPaint.setTextAlign(Align.CENTER);
    const wiPaint = new Paint();
    wiPaint.setFontFamily(wiFontFamily);
    wiPaint.setTextAlign(Align.CENTER);
    const mdiPaint = new Paint();
    mdiPaint.setFontFamily(mdiFontFamily);
    mdiPaint.setTextAlign(Align.CENTER);
    const appPaint = new Paint();
    appPaint.setFontFamily(appFontFamily);
    appPaint.setTextAlign(Align.CENTER);
    interface Item {
        alerts?: any;
        minutely?: MinutelyData[];
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
        precipAccumulation?: number;
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
            return formatDate(date, 'ddd LT');
        } else {
            return formatTime(date, 'LT');
        }
    }
    //@ts-ignore
    let lineChart: NativeViewElementNode<LineChart>;
    let chartInitialized = false;
    let precipChartSet: LineDataSet;
    let cloudChartSet: LineDataSet;
    let lastChartData: {
        time: number;
        intensity: number;
    }[];

    let color: string | Color;
    let precipIcon: string;
    let hasPrecip = false;

    function updateLineChart(item: Item) {
        const chart = lineChart.nativeView;
        if (chart) {
            let data = item.minutely;
            const now = Date.now();
            const index = data.findIndex((v) => v.time >= now);
            data = data.slice(index);

            if (lastChartData === data) {
                return;
            }
            lastChartData = data;
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
            if (!chartInitialized) {
                const limitColor = new Color($textColor).setAlpha(0.5).hex;
                chartInitialized = true;
                chart.setNoDataText(null);
                chart.setAutoScaleMinMaxEnabled(true);
                chart.setDoubleTapToZoomEnabled(true);
                chart.getLegend().setEnabled(false);
                const xAxis = chart.getXAxis();
                xAxis.setEnabled(true);
                xAxis.setTextColor($textColor);
                xAxis.setLabelTextAlign(Align.CENTER);
                xAxis.setDrawGridLines(false);
                xAxis.setDrawMarkTicks(true);
                xAxis.setValueFormatter({
                    getAxisLabel: (value, axis) => Math.round(dayjs(value).diff(now, 'm') / 10) * 10 + 'm'
                });
                xAxis.setLabelCount(7, true);
                xAxis.setPosition(XAxisPosition.BOTTOM);

                const rightAxis = chart.getAxisRight();
                rightAxis.setEnabled(false);

                const leftAxis = chart.getAxisLeft();
                leftAxis.setAxisMinimum(0);
                leftAxis.setDrawGridLines(false);
                leftAxis.setDrawLabels(false);
                leftAxis.setDrawAxisLine(false);
                leftAxis.removeAllLimitLines();

                let limitLine = new LimitLine(1, l('light').toUpperCase());
                limitLine.setLineWidth(0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);

                limitLine = new LimitLine(2, l('medium').toUpperCase());
                limitLine.setLineWidth(1);
                limitLine.setLineColor(limitColor);
                limitLine.enableDashedLine(2, 2, 0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);
                limitLine = new LimitLine(3, l('heavy').toUpperCase());
                limitLine.setLineWidth(1);
                limitLine.setLineColor(limitColor);
                limitLine.enableDashedLine(2, 2, 0);
                limitLine.setXOffset(0);
                limitLine.setTextColor(limitColor);
                limitLine.setLabelPosition(LimitLabelPosition.LEFT_TOP);
                leftAxis.addLimitLine(limitLine);
            }

            let needsToSetData = false;
            let needsUpdate = false;
            hasPrecip = data.some((d) => d.intensity > 0);

            const leftAxis = chart.getAxisLeft();
            leftAxis.setAxisMinimum(0);
            leftAxis.setAxisMaximum(4);
            leftAxis.setDrawLimitLines(hasPrecip);
            if (hasPrecip) {
                const color = item.icon.startsWith('13') ? snowColor : rainColor;
                if (!precipChartSet) {
                    needsToSetData = true;
                    precipChartSet = new LineDataSet(data, 'intensity', 'time', 'intensity');
                    precipChartSet.setAxisDependency(AxisDependency.LEFT);
                    precipChartSet.setLineWidth(1);
                    // precipChartSet.setDrawCircles(true);
                    precipChartSet.setDrawFilled(true);
                    precipChartSet.setFillAlpha(150);
                    precipChartSet.setMode(Mode.CUBIC_BEZIER);
                    precipChartSet.setCubicIntensity(0.4);
                } else {
                    precipChartSet.setValues(data);
                    needsUpdate = true;
                }

                precipChartSet.setColor(color);
                precipChartSet.setFillColor(color);
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
                chart.setData(new LineData([precipChartSet].filter((s) => !!s)));
            } else if (needsUpdate) {
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

    $: {
        if (item && item.icon.startsWith('13')) {
            color = snowColor;
            precipIcon = 'wi-snowflake-cold';
        } else {
            color = rainColor;
            precipIcon = 'wi-raindrop';
        }
    }

    function drawOnCanvas({ canvas }: { canvas: Canvas }) {
        const w = canvas.getWidth();

        let centeredItemsToDraw: {
            color?: string | Color;
            paint?: Paint;
            iconFontSize: number;
            icon: string;
            value: string | number;
            subvalue?: string;
        }[] = [];
        if (item.windSpeed) {
            centeredItemsToDraw.push({
                iconFontSize: 20,
                paint: appPaint,
                icon: item.windIcon,
                value: convertValueToUnit(item.windSpeed, UNITS.Speed, $imperial)[0],
                subvalue: toImperialUnit(UNITS.Speed, $imperial)
            });
        }
        centeredItemsToDraw.push({
            paint: wiPaint,
            color: nightColor,
            iconFontSize: 20,
            icon: item.moonIcon,
            value: l('moon')
        });
        if ((item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: color,
                iconFontSize: 20,
                icon: precipIcon,
                value: formatValueToUnit(item.precipAccumulation, UNITS.MM, $imperial),
                subvalue: item.precipProbability > 0 && Math.round(item.precipProbability * 100) + '%'
            });
        } else if (item.cloudCover > 20) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: item.cloudColor,
                iconFontSize: 20,
                icon: 'wi-cloud',
                value: Math.round(item.cloudCover) + '%',
                subvalue: item.cloudCeiling && formatValueToUnit(item.cloudCeiling, UNITS.Distance, $imperial)
            });
        }
        if (item.uvIndex > 0) {
            centeredItemsToDraw.push({
                paint: mdiPaint,
                color: item.uvIndexColor,
                iconFontSize: 24,
                icon: 'mdi-weather-sunny-alert',
                value: Math.round(item.uvIndex)
            });
        }
        centeredItemsToDraw.forEach((c, index) => {
            let x = index * 55 + 26;
            const paint = c.paint || textIconPaint;
            paint.setTextSize(c.iconFontSize);
            paint.setColor(c.color || $textColor);
            if (c.icon) {
                canvas.drawText(c.icon, x, 40 + 20, paint);
            }
            if (c.value) {
                textIconSubPaint.setTextSize(12);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.value + '', x, 40 + 39, textIconSubPaint);
            }
            if (c.subvalue) {
                textIconSubPaint.setTextSize(9);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.subvalue + '', x, 40 + 50, textIconSubPaint);
            }
        });
    }
</script>

<gridLayout rows="auto,*" {height} columns="*,auto">
    <canvaslabel colSpan={2} on:draw={drawOnCanvas}>
        <cspan paddingRight={10} fontSize={20} textAlignment="right" verticalAlignment="top" text={formatDate(item.time, 'dddd')} textTransform="capitalize" />
        {#if item.temperature !== undefined}
            <cgroup paddingLeft={10} fontSize={12} verticalAlignment="top">
                <cspan fontSize={26} text={formatValueToUnit(item.temperature, UNITS.Celcius, $imperial)} />
            </cgroup>
        {/if}
        <cgroup paddingLeft={70} paddingTop={13} fontSize={14} verticalAlignment="top">
            <cspan text={formatValueToUnit(item.temperatureMin, UNITS.Celcius, $imperial)} />
            <cspan color="#777" text=" | " />
            <cspan text={formatValueToUnit(item.temperatureMax, UNITS.Celcius, $imperial)} />
        </cgroup>
        <cgroup paddingLeft={10} paddingBottom={10} fontSize={14} verticalAlignment="bottom">
            <cspan color="#ffa500" fontFamily={wiFontFamily} text="wi-sunrise " />
            <cspan text={formatTime(item.sunriseTime)} />
            <cspan color="#ff7200" fontFamily={wiFontFamily} text="  wi-sunset " />
            <cspan text={formatTime(item.sunsetTime)} />
        </cgroup>
        <cspan paddingRight={10} fontSize={14} textAlignment="right" verticalAlignment="bottom" text="{lc('last_updated')}: {formatLastUpdate(item.lastUpdate)}" paddingBottom={10} />
    </canvaslabel>
    <linechart bind:this={lineChart} marginTop={110} verticalAlignment="bottom" height={90} marginBottom={40} />
    <WeatherIcon col={1} horizontalAlignment="right" verticalAlignment="center" fontSize={140} icon={item.icon}  on:tap={(event) => dispatch('tap', event)}/>
    <HourlyView row={1} colSpan={2} items={item.hourly} />
</gridLayout>
