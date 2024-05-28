<script context="module" lang="ts">
    import { GetMoonIlluminationResult, GetTimesResult, getMoonIllumination, getMoonPosition, getPosition, getTimes } from 'suncalc';
    import { Align, Canvas, DashPathEffect, Paint, Style } from '@nativescript-community/ui-canvas';
    import { CanvasLabel } from '@nativescript-community/ui-canvaslabel/canvaslabel.common';
    import { LineChart } from '@nativescript-community/ui-chart';
    import { AxisBase } from '@nativescript-community/ui-chart/components/AxisBase';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { Entry } from '@nativescript-community/ui-chart/data/Entry';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { Highlight } from '@nativescript-community/ui-chart/highlight/Highlight';
    import { Utils } from '@nativescript-community/ui-chart/utils/Utils';
    import dayjs, { Dayjs } from 'dayjs';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import { formatTime, getLocalTime, getStartOfDay, l, lc, lu } from '~/helpers/locale';
    import { showError } from '~/utils/error';
    import { pickDate } from '~/utils/utils.common';
    import { colors, fonts } from '~/variables';
    import { WeatherLocation } from '~/services/api';
    import { isDarkTheme, onThemeChanged } from '~/helpers/theme';
    import { Color } from '@akylas/nativescript';

    const nightPaint = new Paint();
    const nightLiinePaint = new Paint();

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
    let { colorOnSurface, colorBackground, colorOnSurfaceVariant } = $colors;
    $: ({ colorOnSurface, colorBackground, colorOnSurfaceVariant } = $colors);
    let chartView: NativeViewElementNode<LineChart>;

    let chartInitialized = false;
    export let location: WeatherLocation;
    export let selectableDate = true;
    export let startTime = Date.now();
    export let timezoneOffset;
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
    // let chartBackgroundColor =
    function updateTheme() {
        nightPaint.color = new Color($colors.colorBackground).setAlpha(170);
        nightLiinePaint.color = new Color($colors.colorOnSurface).setAlpha(150);
    }
    updateTheme();
    onThemeChanged(() => {
        updateTheme();
        const chart = chartView?.nativeView;
        if (chart) {
            const newColor = $colors.colorOnSurface;
            // DEV_LOG && console.log('onThemeChanged', !!chart, colorOnSurface, newColor);
            const leftAxis = chart.leftAxis;
            const xAxis = chart.xAxis;
            leftAxis.textColor = xAxis.textColor = highlightPaint.color = newColor;
            const dataSets = chart.data.dataSets;
            dataSets.forEach((d) => {
                if (d.drawValuesEnabled) {
                    d.valueTextColor = newColor;
                }
            });
            chart.invalidate();
        }
    });

    let bottomLabel: NativeViewElementNode<CanvasLabel>;
    function updateChartData() {
        if (!chartView) {
            return;
        }
        const computeStartTime = getStartOfDay(startTime, timezoneOffset);
        DEV_LOG && console.log('updateChartData', startTime, timezoneOffset, computeStartTime);
        const chart = chartView.nativeView;
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
            const leftAxis = chart.leftAxis;
            const xAxis = chart.xAxis;

            leftAxis.textColor = xAxis.textColor = highlightPaint.color = colorOnSurface;
            chart.setExtraOffsets(0, 0, 0, 0);
            chart.minOffset = 0;
            chart.clipDataToContent = false;
            chart.highlightPerTapEnabled = true;
            chart.highlightPerDragEnabled = true;
            chart.customRenderer = {
                drawHighlight(c: Canvas, h: Highlight<Entry>, set: LineDataSet, paint: Paint) {
                    const w = c.getWidth();
                    const height = c.getHeight();
                    c.drawRect(0, height / 2, w, height, nightPaint);
                    c.drawLine(0, height / 2, w, height / 2, nightLiinePaint);

                    const hours = Math.min(Math.floor(h.x / 6), 23);
                    const minutes = (h.x * 10) % 60;
                    const date = dayjs(startTime).set('h', hours).set('m', minutes);
                    c.drawLine(h.drawX, 0, h.drawX, c.getHeight(), highlightPaint);
                    highlightPaint.setTextAlign(Align.LEFT);
                    let x = h.drawX + 4;
                    const text = formatTime(date);
                    const size = Utils.calcTextSize(highlightPaint, text);
                    if (x > c.getWidth() - size.width) {
                        x = h.drawX - 4;
                        highlightPaint.setTextAlign(Align.RIGHT);
                    }
                    c.drawText(text, x, 14, highlightPaint);
                    bottomLabel?.nativeView?.redraw();
                }
            };
            leftAxis.labelCount = 0;
            leftAxis.drawGridLines = false;
            leftAxis.drawAxisLine = false;
            leftAxis.drawLabels = false;
            leftAxis.axisMinimum = -PI_DIV2;
            leftAxis.axisMaximum = PI_DIV2;
            xAxis.position = XAxisPosition.BOTTOM_INSIDE;
            xAxis.forcedInterval = 24;
            xAxis.drawAxisLine = false;
            xAxis.drawGridLines = false;
            xAxis.ensureVisible = true;
            xAxis.labelTextAlign = Align.CENTER;
            xAxis.drawLabels = true;
            xAxis.valueFormatter = {
                getAxisLabel(value: any, axis: AxisBase) {
                    const time = computeStartTime.add(value * 10, 'minutes').valueOf();
                    return formatTime(time, undefined, timezoneOffset);
                }
            };
            // if (!limitLine) {
            //     limitLine = new LimitLine(0, 'test');
            //     limitLine.setLineColor('white');
            //     limitLine.enableDashedLine(3, 3, 0);
            //     limitLine.textColor=('white');
            //     limitLine.ensureVisible = true;
            //     xAxis.addLimitLine(limitLine);
            // }
        }
        // const nowMinutes = startTime.diff(computeStartTime, 'minutes');
        // limitLine.setLabel(formatTime(startTime));
        // limitLine.setLimit(nowMinutes / 10);

        const chartData = chart.data;
        if (!chartData) {
            let set = new LineDataSet(sunPoses, 'sun', undefined, 'altitude');
            set.fillFormatter = {
                getFillLinePosition: (dataSet, dataProvider) => 0
            };
            set.fillColor = set.color = '#ffdd55';
            set.fillAlpha = 50;
            set.drawFilledEnabled = true;
            set.lineWidth = 3;
            sets.push(set);
            set = new LineDataSet(moonPoses, 'moon', undefined, 'altitude');
            set.color = '#bbb';
            set.lineWidth = 1;
            sets.unshift(set);

            const lineData = new LineData(sets);
            chart.data = lineData;

            const nowMinutes = dayjs(startTime).diff(computeStartTime, 'minutes');
            const h = chart.getHighlightByXValue(nowMinutes / 10);
            chart.highlight(h[0]);
        } else {
            chartData.getDataSetByIndex(1).values = sunPoses;
            chartData.getDataSetByIndex(1).notifyDataSetChanged();
            chartData.getDataSetByIndex(0).values = moonPoses;
            chartData.getDataSetByIndex(0).notifyDataSetChanged();
            chartData.notifyDataChanged();
            chart.notifyDataSetChanged();
            chart.invalidate();
        }
    }

    async function selectDate() {
        try {
            const date = await pickDate(dayjs(startTime));
            if (date && startTime.valueOf() !== date) {
                updateStartTime(date);
            }
        } catch (error) {
            showError(error);
        }
    }

    $: {
        try {
            if (chartView) {
                updateChartData();
            }
        } catch (err) {
            showError(err);
        }
    }

    function updateStartTime(time: number) {
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
            const date = getStartOfDay(startTime, 0).toDate();
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

        moonPaint.setColor(colorOnSurface);

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

<gesturerootview columns="*,*" rows={`${selectableDate ? 50 : 0},200,50,auto`} {...$$restProps}>
    <mdbutton
        class="icon-btn"
        horizontalAlignment="left"
        text="mdi-chevron-left"
        variant="text"
        visibility={selectableDate ? 'visible' : 'hidden'}
        on:tap={() => updateStartTime(dayjs(startTime).subtract(1, 'd').valueOf())} />
    <label
        colSpan={2}
        fontSize={17}
        marginLeft={50}
        marginRight={50}
        text={formatTime(startTime, 'LL', timezoneOffset)}
        textAlignment="center"
        verticalTextAlignment="center"
        visibility={selectableDate ? 'visible' : 'hidden'}
        on:tap={selectDate} />
    <mdbutton
        class="icon-btn"
        col={1}
        horizontalAlignment="right"
        text="mdi-chevron-right"
        variant="text"
        visibility={selectableDate ? 'visible' : 'hidden'}
        on:tap={() => updateStartTime(dayjs(startTime).add(1, 'd').valueOf())} />
    <linechart bind:this={chartView} colSpan={3} row={1} />
    {#if sunTimes}
        <canvaslabel bind:this={bottomLabel} colSpan={3} fontSize={18} padding="0 10 0 10" row={2} on:draw={drawMoonPosition}>
            <cgroup color="#ffa500" verticalAlignment="middle">
                <cspan fontFamily={$fonts.mdi} text="mdi-weather-sunset-up" />
                <cspan text={' ' + formatTime(dayjs.utc(sunTimes.sunrise.valueOf()).valueOf(), undefined, timezoneOffset)} />
            </cgroup>
            <cgroup color="#ff7200" textAlignment="center" verticalAlignment="middle">
                <cspan fontFamily={$fonts.mdi} text="mdi-weather-sunset-down" />
                <cspan text={' ' + formatTime(dayjs.utc(sunTimes.sunsetStart.valueOf()).valueOf(), undefined, timezoneOffset)} />
            </cgroup>
            <cgroup textAlignment="right" verticalAlignment="middle">
                <!-- <cspan text={moonAzimuth.exact + '(' + Math.round(illumination.fraction * 100) + '%) '} /> -->
                <cspan fontFamily={$fonts.mdi} text={getMoonPhaseIcon(illumination)} />
            </cgroup>
        </canvaslabel>
    {/if}

    <!-- <CompassView row={3} {location} updateWithSensor={false} date={startTime} /> -->
    <!-- <canvaslabel row={3} col={1} fontSize={13} padding={10} height={200}>
        <cgroup paddingTop={10}>
            <cspan fontFamily={$fonts.mdi} text="mdi-weather-sunset-up" color="#ffa500" />
            <cspan text={lc('sunrise')} />
        </cgroup>
        <cspan text={formatTime(sunTimes.sunriseEnd) + ' ' + sunriseEndAzimuth.exact} textAlignment="right" paddingTop={10} />
        <cgroup paddingTop={40}>
            <cspan fontFamily={$fonts.mdi} text="mdi-weather-sunset-down" color="#ff7200" />
            <cspan text={lc('sunset')} />
        </cgroup>
        <cspan text={formatTime(sunTimes.sunsetStart) + ' ' + sunsetStartAzimuth.exact} textAlignment="right" paddingTop={40} />
    </canvaslabel> -->
</gesturerootview>
