<script lang="ts" context="module">
    import { getMoonIllumination, getMoonPosition, getPosition, getTimes } from 'suncalc';
    import { Align } from '@nativescript-community/ui-canvas';
    import { CanvasLabel } from '@nativescript-community/ui-canvaslabel/canvaslabel.common';
    import { LineChart } from '@nativescript-community/ui-chart/charts';
    import { AxisBase } from '@nativescript-community/ui-chart/components/AxisBase';
    import { LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { ViewPortHandler } from '@nativescript-community/ui-chart/utils/ViewPortHandler';
    import { Color } from '@nativescript/core';
    import dayjs, { Dayjs } from 'dayjs';
    import { formatTime } from '~/helpers/locale';
    import { showError } from '~/utils/error';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { showPopover } from '@nativescript-community/ui-popover/svelte';
    import { pickDate } from '~/utils/utils';
    import { mdiFontFamily, backgroundColor } from '~/variables';
    import { WeatherLocation } from '~/services/api';
    const PI = Math.PI;
    const TO_DEG = 180 / PI;
    const PI_DIV2 = PI / 2;
</script>

<script lang="ts">
    let chart: LineChart;
    export let height: number = 300;

    let chartInitialized = false;
    export let location: WeatherLocation;
    let startTime = dayjs();
    let limitLine: LimitLine;
    let illumination: any; // MoonPhase;
    let sunTimes: any; // SunTimes;
    let moonAzimuth: number;
    let sunPoses: any[]; // SunPosition[];
    let moonPoses: any[]; // MoonPosition[];

    let bottomLabel: CanvasLabel;
    function updateChartData(startTime: Dayjs) {
        if (!chart) {
            return;
        }
        const computeStartTime = startTime.startOf('d');
        const chartView = chart;
        const sets = [];
        sunPoses = [];
        moonPoses = [];
        for (let index = 0; index <= 24 * 60; index += 10) {
            const date = computeStartTime.add(index, 'minutes').toDate();
            sunPoses.push(getPosition(date, location.coord.lat, location.coord.lon));
            moonPoses.push(getMoonPosition(date, location.coord.lat, location.coord.lon));
        }
        if (!chartInitialized) {
            chartInitialized = true;
            const leftAxis = chartView.getAxisLeft();
            const xAxis = chartView.getXAxis();
            chartView.setExtraOffsets(0, 0, 0, 0);
            chartView.setMinOffset(0);
            chartView.setClipDataToContent(false);
            leftAxis.setLabelCount(0);
            leftAxis.setDrawGridLines(false);
            leftAxis.setDrawAxisLine(false);
            leftAxis.setDrawLabels(false);
            leftAxis.setAxisMinimum(-PI_DIV2);
            leftAxis.setAxisMaximum(PI_DIV2);
            xAxis.setPosition(XAxisPosition.BOTTOM_INSIDE);
            xAxis.setForcedInterval(24);
            xAxis.setTextColor('white');
            xAxis.setDrawAxisLine(false);
            xAxis.setDrawGridLines(false);
            xAxis.ensureVisible = true;
            xAxis.setLabelTextAlign(Align.CENTER);
            xAxis.setDrawLabels(true);
            xAxis.setValueFormatter({
                getAxisLabel(value: any, axis: AxisBase, viewPortHandler: ViewPortHandler) {
                    const time = computeStartTime.add(value * 10, 'minutes');
                    return time.format('H[h]');
                }
            });
            if (!limitLine) {
                limitLine = new LimitLine(0, 'test');
                limitLine.setLineColor('white');
                limitLine.enableDashedLine(3, 3, 0);
                limitLine.setTextColor('white');
                limitLine.ensureVisible = true;
                xAxis.addLimitLine(limitLine);
            }
        }
        const nowMinutes = startTime.diff(computeStartTime, 'minutes');
        limitLine.setLabel(startTime.format('LT'));
        limitLine.setLimit(nowMinutes / 10);

        const chartData = chartView.getData();
        if (!chartData) {
            let set = new LineDataSet(sunPoses, 'sun', undefined, 'altitude');
            set.setColor('#ffdd55');
            set.setLineWidth(3);
            sets.push(set);
            set = new LineDataSet(moonPoses, 'moon', undefined, 'altitude');
            set.setColor('white');
            set.setLineWidth(3);
            sets.unshift(set);

            const lineData = new LineData(sets);
            chartView.setData(lineData);
        } else {
            chartView.highlightValues(null);
            chartData.getDataSetByIndex(1).setValues(sunPoses);
            chartData.getDataSetByIndex(1).notifyDataSetChanged();
            chartData.getDataSetByIndex(0).setValues(moonPoses);
            chartData.getDataSetByIndex(0).notifyDataSetChanged();
            chartData.notifyDataChanged();
            chartView.notifyDataSetChanged();
            chartView.invalidate();
        }
    }

    async function selectDate() {
        try {
            const date = await pickDate(startTime);
            if (date && startTime.valueOf() !== date) {
                startTime = dayjs(date);
            }
        } catch (error) {
            showError(error);
        }
    }

    $: {
        try {
            if (chart) {
                updateChartData(startTime);
            }
        } catch (err) {
            showError(err);
        }
    }

    function getMoonPhaseIcon(illumination: any /* MoonPhase */) {
        switch (Math.round(illumination.phase * 7)) {
            case 0:
                return 'mdi-moon-new';
            case 1:
                return 'mdi-moon-waxing-crescent';
            case 2:
                return 'mdi-moon-first-quarter';
            case 3:
                return 'mdi-moon-waxing-gibbous';
            case 4:
                return 'mdi-moon-full';
            case 5:
                return 'mdi-moon-waning-gibbous';
            case 6:
                return 'mdi-moon-last-quarter';
            case 7:
                return 'mdi-moon-waning-crescent';
        }
    }
    $: {
        try {
            const date = startTime.toDate();
            illumination = getMoonIllumination(date);
            moonAzimuth = Math.round(getMoonPosition(date, location.coord.lat, location.coord.lon).azimuth * TO_DEG + 180);
            sunTimes = getTimes(date, location.coord.lat, location.coord.lon);
        } catch (err) {
            console.error(err);
        }
    }

    async function setDateTime() {
        try {
            const SliderPopover = (await import('~/components/SliderPopover.svelte')).default;
            const nowMinutes = startTime.diff(startTime.startOf('d'), 'minutes');
            showPopover({
                view: SliderPopover,
                anchor: bottomLabel,
                vertPos: VerticalPosition.ABOVE,
                props: {
                    backgroundColor: new Color($backgroundColor).setAlpha(200).hex,
                    min: 0,
                    max: 24 * 60 - 1,
                    step: 1,
                    value: nowMinutes,
                    formatter(value) {
                        const hours = Math.floor(value / 60);
                        const minutes = value % 60;
                        return dayjs().set('h', hours).set('m', minutes).format('H[h]');
                    },
                    onChange(value) {
                        const hours = Math.floor(value / 60);
                        const minutes = value % 60;
                        startTime = startTime.set('h', hours).set('m', minutes);
                    }
                }
            });
        } catch (err) {
            showError(err);
        }
    }
</script>

<gridlayout {height} rows="auto,200,*" columns="auto,*,auto">
    <mdbutton variant="text" class="icon-btn" text="mdi-chevron-left" horizontalAlignment="left" on:tap={() => (startTime = startTime.subtract(1, 'd'))} />
    <label col={1} text={startTime.format('LL')} textAlignment="center" verticalTextAlignment="center" on:tap={selectDate} fontSize="17" />
    <mdbutton col={2} variant="text" class="icon-btn" text="mdi-chevron-right" horizontalAlignment="right" on:tap={() => (startTime = startTime.add(1, 'd'))} />
    <linechart row={1} colSpan={3} bind:this={chart} backgroundColor="#222222" on:tap={setDateTime}>
        <rectangle fillColor="#a0caff" height="50%" width="100%" />
    </linechart>
    {#if sunTimes}
        <canvaslabel bind:this={bottomLabel} row={2} colSpan={3} fontSize="18" padding="0 10 0 10">
            <cgroup color="#ffa500" verticalAlignment="center">
                <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-up" />
                <cspan text={' ' + formatTime(sunTimes.sunriseEnd, 'LT')} />
            </cgroup>
            <cgroup color="#ff7200" textAlignment="center" verticalAlignment="center">
                <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-down" />
                <cspan text={' ' + formatTime(sunTimes.sunsetStart, 'LT')} />
            </cgroup>
            <cgroup textAlignment="right" verticalAlignment="center">
                <cspan fontFamily={mdiFontFamily} text={getMoonPhaseIcon(illumination)} />
                <cspan text={' ' + moonAzimuth + '(' + Math.round(illumination.fraction * 100) + '%)'} />
            </cgroup>
        </canvaslabel>
    {/if}
</gridlayout>
