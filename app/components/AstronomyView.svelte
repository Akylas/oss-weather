<script lang="ts" context="module">
    import { getMoonIllumination, GetMoonIlluminationResult, getMoonPosition, getPosition, getTimes, GetTimesResult } from 'suncalc';
    import { Align, Canvas, DashPathEffect, Paint, Style } from '@nativescript-community/ui-canvas';
    import { CanvasLabel } from '@nativescript-community/ui-canvaslabel/canvaslabel.common';
    import { LineChart } from '@nativescript-community/ui-chart/charts';
    import { AxisBase } from '@nativescript-community/ui-chart/components/AxisBase';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { Entry } from '@nativescript-community/ui-chart/data/Entry';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { Highlight } from '@nativescript-community/ui-chart/highlight/Highlight';
    import { Utils } from '@nativescript-community/ui-chart/utils/Utils';
    import { ViewPortHandler } from '@nativescript-community/ui-chart/utils/ViewPortHandler';
    import dayjs, { Dayjs } from 'dayjs';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { formatTime, l, lc, lu } from '~/helpers/locale';
    import { showError } from '~/utils/error';
    import { pickDate } from '~/utils/utils';
    import { mdiFontFamily, textColor } from '~/variables';
    import { WeatherLocation } from '~/services/api';
    const PI = Math.PI;
    const PI_DIV2 = PI / 2;
    const TO_DEG = 180 / PI;
    const TO_RAD = PI / 180;
    interface CompassInfo {
        exact: string;
        rough: string;
        bearing: number;
    }

    function getCompassInfo(bearing) {
        if (bearing < 0) {
            bearing += 360;
        }
        let result;
        switch (Math.round(bearing / 22.5)) {
            case 1:
                result = {
                    exact: l('NNE'),
                    rough: l('N')
                };
                break;
            case 2:
                result = {
                    exact: l('NE'),
                    rough: l('N')
                };
                break;
            case 3:
                result = {
                    exact: l('ENE'),
                    rough: l('E')
                };
                break;
            case 4:
                result = {
                    exact: l('E'),
                    rough: l('E')
                };
                break;
            case 5:
                result = {
                    exact: l('ESE'),
                    rough: l('E')
                };
                break;
            case 6:
                result = {
                    exact: l('SE'),
                    rough: l('E')
                };
                break;
            case 7:
                result = {
                    exact: l('SSE'),
                    rough: l('S')
                };
                break;
            case 8:
                result = {
                    exact: l('S'),
                    rough: l('S')
                };
                break;
            case 9:
                result = {
                    exact: l('SSW'),
                    rough: l('S')
                };
                break;
            case 10:
                result = {
                    exact: l('SW'),
                    rough: l('S')
                };
                break;
            case 11:
                result = {
                    exact: l('WSW'),
                    rough: l('W')
                };
                break;
            case 12:
                result = {
                    exact: l('W'),
                    rough: l('W')
                };
                break;
            case 13:
                result = {
                    exact: l('WNW'),
                    rough: l('W')
                };
                break;
            case 14:
                result = {
                    exact: l('NW'),
                    rough: l('W')
                };
                break;
            case 15:
                result = {
                    exact: l('NNW'),
                    rough: l('N')
                };
                break;
            default:
                result = {
                    exact: l('N'),
                    rough: l('N')
                };
        }

        result['bearing'] = bearing;
        return result as CompassInfo;
    }
</script>

<script lang="ts">
    let chart: NativeViewElementNode<LineChart>;

    let chartInitialized = false;
    export let location: WeatherLocation;
    export let startTime = dayjs();
    // let limitLine: LimitLine;
    let illumination: GetMoonIlluminationResult; // MoonPhase;
    let sunTimes: GetTimesResult; // SunTimes;
    let sunAzimuth: CompassInfo; // SunTimes;
    let sunriseEndAzimuth: CompassInfo; // SunTimes;
    let sunsetStartAzimuth: CompassInfo; // SunTimes;
    let moonAzimuth: CompassInfo;
    let sunPoses: any[]; // SunPosition[];
    let moonPoses: any[]; // MoonPosition[];

    const moonPaint = new Paint();
    moonPaint.strokeWidth = 1.5;

    const highlightPaint = new Paint();
    highlightPaint.setColor('white');
    highlightPaint.setStrokeWidth(2);
    highlightPaint.setPathEffect(new DashPathEffect([3, 3], 0));
    highlightPaint.setTextAlign(Align.LEFT);
    highlightPaint.setTextSize(10);

    let bottomLabel: NativeViewElementNode<CanvasLabel>;
    function updateChartData() {
        if (!chart) {
            return;
        }
        const computeStartTime = startTime.startOf('d');
        const chartView = chart.nativeView;
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
            chartView.setHighlightPerTapEnabled(true);
            chartView.setHighlightPerDragEnabled(true);
            chartView.setCustomRenderer({
                drawHighlight(c: Canvas, h: Highlight<Entry>, set: LineDataSet, paint: Paint) {
                    const hours = Math.min(Math.floor(h.x / 6), 23);
                    const minutes = (h.x * 10) % 60;
                    startTime = startTime.set('h', hours).set('m', minutes);
                    c.drawLine(h.drawX, 0, h.drawX, c.getHeight(), highlightPaint);
                    highlightPaint.setTextAlign(Align.LEFT);
                    let x = h.drawX + 4;
                    const text = formatTime(startTime);
                    const size = Utils.calcTextSize(highlightPaint, text);
                    if (x > c.getWidth() - size.width) {
                        x = h.drawX - 4;
                        highlightPaint.setTextAlign(Align.RIGHT);
                    }
                    c.drawText(text, x, 14, highlightPaint);
                    bottomLabel?.nativeView?.redraw();
                }
            });
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
                    return formatTime(time);
                }
            });
            // if (!limitLine) {
            //     limitLine = new LimitLine(0, 'test');
            //     limitLine.setLineColor('white');
            //     limitLine.enableDashedLine(3, 3, 0);
            //     limitLine.setTextColor('white');
            //     limitLine.ensureVisible = true;
            //     xAxis.addLimitLine(limitLine);
            // }
        }
        // const nowMinutes = startTime.diff(computeStartTime, 'minutes');
        // limitLine.setLabel(formatTime(startTime));
        // limitLine.setLimit(nowMinutes / 10);

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

            const nowMinutes = startTime.diff(computeStartTime, 'minutes');
            const h = chartView.getHighlightByXValue(nowMinutes / 10);
            chartView.highlight(h[0]);
        } else {
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
                updateStartTime(dayjs(date));
            }
        } catch (error) {
            showError(error);
        }
    }

    $: {
        try {
            if (chart) {
                updateChartData();
            }
        } catch (err) {
            showError(err);
        }
    }

    function updateStartTime(time: Dayjs) {
        startTime = time;
        updateChartData();
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
            moonAzimuth = getCompassInfo(getMoonPosition(date, location.coord.lat, location.coord.lon).azimuth * TO_DEG + 180);
            sunTimes = getTimes(date, location.coord.lat, location.coord.lon);
            sunAzimuth = getCompassInfo(getPosition(date, location.coord.lat, location.coord.lon).azimuth * TO_DEG + 180);
            // sunriseEndAzimuth = getCompassInfo(getPosition(sunTimes.sunriseEnd, location.coord.lat, location.coord.lon).azimuth * TO_DEG + 180);
            // sunsetStartAzimuth = getCompassInfo(getPosition(sunTimes.sunsetStart, location.coord.lat, location.coord.lon).azimuth * TO_DEG + 180);
        } catch (err) {
            console.error(err);
        }
    }

    // async function setDateTime() {
    //     try {
    //         const SliderPopover = (await import('~/components/SliderPopover.svelte')).default;
    //         const nowMinutes = startTime.diff(startTime.startOf('d'), 'minutes');
    //         showPopover({
    //             view: SliderPopover,
    //             anchor: bottomLabel,
    //             vertPos: VerticalPosition.ABOVE,
    //             props: {
    //                 backgroundColor: new Color($widgetBackgroundColor).setAlpha(200).hex,
    //                 min: 0,
    //                 max: 24 * 60 - 1,
    //                 step: 1,
    //                 value: nowMinutes,
    //                 formatter(value) {
    //                     const hours = Math.floor(value / 60);
    //                     const minutes = value % 60;
    //                     return formatTime(dayjs().set('h', hours).set('m', minutes));
    //                 },
    //                 valueFormatter(value) {
    //                     const hours = Math.floor(value / 60);
    //                     const minutes = value % 60;
    //                     return formatTime(dayjs().set('h', hours).set('m', minutes));
    //                 },
    //                 onChange(value) {
    //                     const hours = Math.floor(value / 60);
    //                     const minutes = value % 60;
    //                     startTime = startTime.set('h', hours).set('m', minutes);
    //                 }
    //             }
    //         });
    //     } catch (err) {
    //         showError(err);
    //     }
    // }

    function drawMoonPosition({ canvas }: { canvas: Canvas }) {
        const w = canvas.getWidth();
        const h = canvas.getHeight();

        moonPaint.setColor($textColor);

        const cx = w - 60;
        const cy = h / 2;
        const cr = 14;

        function getCenter(bearing, altitude?) {
            const rad = TO_RAD * ((bearing - 90) % 360);
            // const ryd = (cr) * (1 - Math.max(0, altitude) / 90);
            const ryd = cr;
            const result = [cx + Math.cos(rad) * ryd, cy + +Math.sin(rad) * ryd];
            return result;
        }
        moonPaint.setColor('darkgray');
        moonPaint.style = Style.STROKE;
        canvas.drawCircle(cx, cy, cr, moonPaint);
        moonPaint.style = Style.FILL;
        moonPaint.setColor('gray');
        let center = getCenter(moonAzimuth.bearing);
        canvas.drawCircle(center[0], center[1], 5, moonPaint);
        moonPaint.setColor('#ffdd55');
        center = getCenter(sunAzimuth.bearing);
        canvas.drawCircle(center[0], center[1], 5, moonPaint);
    }
</script>

<gridlayout rows="50,200,50,auto" columns="*,*">
    <mdbutton variant="text" class="icon-btn" text="mdi-chevron-left" horizontalAlignment="left" on:tap={() => updateStartTime(startTime.subtract(1, 'd'))} />
    <label colSpan={2} text={startTime.format('LL')} textAlignment="center" verticalTextAlignment="center" on:tap={selectDate} fontSize={17} marginLeft={50} marginRight={50} />
    <mdbutton col={1} variant="text" class="icon-btn" text="mdi-chevron-right" horizontalAlignment="right" on:tap={() => updateStartTime(startTime.add(1, 'd'))} />
    <linechart row={1} colSpan={3} bind:this={chart} backgroundColor="#222222">
        <rectangle fillColor="#a0caff" height="50%" width="100%" />
    </linechart>
    {#if sunTimes}
        <canvaslabel bind:this={bottomLabel} row={2} colSpan={3} fontSize={18} padding="0 10 0 10" on:draw={drawMoonPosition}>
            <cgroup color="#ffa500" verticalAlignment="middle">
                <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-up" />
                <cspan text={' ' + formatTime(sunTimes.sunriseEnd)} />
            </cgroup>
            <cgroup color="#ff7200" textAlignment="center" verticalAlignment="middle">
                <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-down" />
                <cspan text={' ' + formatTime(sunTimes.sunsetStart)} />
            </cgroup>
            <cgroup textAlignment="right" verticalAlignment="middle">
                <!-- <cspan text={moonAzimuth.exact + '(' + Math.round(illumination.fraction * 100) + '%) '} /> -->
                <cspan fontFamily={mdiFontFamily} text={getMoonPhaseIcon(illumination)} />
            </cgroup>
        </canvaslabel>
    {/if}

    <!-- <CompassView row={3} {location} updateWithSensor={false} date={startTime} /> -->
    <!-- <canvaslabel row={3} col={1} fontSize={13} padding={10} height={200}>
        <cgroup paddingTop={10}>
            <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-up" color="#ffa500" />
            <cspan text={lc('sunrise')} />
        </cgroup>
        <cspan text={formatTime(sunTimes.sunriseEnd) + ' ' + sunriseEndAzimuth.exact} textAlignment="right" paddingTop={10} />
        <cgroup paddingTop={40}>
            <cspan fontFamily={mdiFontFamily} text="mdi-weather-sunset-down" color="#ff7200" />
            <cspan text={lc('sunset')} />
        </cgroup>
        <cspan text={formatTime(sunTimes.sunsetStart) + ' ' + sunsetStartAzimuth.exact} textAlignment="right" paddingTop={40} />
    </canvaslabel> -->
</gridlayout>
