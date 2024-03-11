<script lang="ts">
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { Align, Canvas, LayoutAlignment, Paint, StaticLayout } from '@nativescript-community/ui-canvas';
    import { LineChart } from '@nativescript-community/ui-chart';
    import { LimitLabelPosition, LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { Color } from '@nativescript/core';
    import dayjs from 'dayjs';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import HourlyView from '~/components/HourlyView.svelte';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import type { FavoriteLocation } from '~/helpers/favorites';
    import { isFavorite, toggleFavorite } from '~/helpers/favorites';
    import { UNITS, formatValueToUnit } from '~/helpers/formatter';
    import { formatDate, formatTime, l, lc } from '~/helpers/locale';
    import { onThemeChanged } from '~/helpers/theme';
    import { weatherDataService } from '~/services/weatherData';
    import { Currently, DailyData, Hourly, MinutelyData, WeatherData } from '~/services/providers/weather';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { colors, fontScale, fonts, rainColor, snowColor } from '~/variables';
    import WeatherComponent from './WeatherComponent.svelte';
    import toColor from '@mapbox/to-color';
    import { LegendForm } from '@nativescript-community/ui-chart/components/Legend';
    const dispatch = createEventDispatcher();

    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline } = $colors);

    const textIconPaint = new Paint();
    textIconPaint.setTextAlign(Align.CENTER);
    const textPaint = new Paint();

    interface Item {
        weatherData: { weatherData: WeatherData; model: string }[];
        forecast: string;
        id: string;
    }
    export let item: Item;
    export let fakeNow = null;

    function formatLastUpdate(date) {
        if (dayjs(date).isBefore(dayjs().startOf('d'))) {
            return formatDate(date, 'ddd LT');
        } else {
            return formatTime(date, 'LT');
        }
    }
    let lineChart: NativeViewElementNode<LineChart>;
    let chartInitialized = false;
    let precipChartSet: LineDataSet;
    let cloudChartSet: LineDataSet;
    let lastChartData: {
        time: number;
        intensity: number;
    }[];

    const hasPrecip = false;

    // we need a factor cause using timestamp means
    // using 64bit data which canvas does not support (android Matrix specifically)
    const timeFactor = 1 / (1000 * 60 * 10);
    function updateLineChart(item: Item) {
        const chart = lineChart?.nativeView;
        if (chart) {
            const xAxis = chart.getXAxis();
            const leftAxis = chart.getAxisLeft();
            if (!chartInitialized) {
                chartInitialized = true;
                // chart.setNoDataText(null);
                chart.setAutoScaleMinMaxEnabled(true);
                chart.getLegend().setForm(LegendForm.CIRCLE);
                // chart.setDoubleTapToZoomEnabled(false);
                chart.getLegend().setEnabled(true);
                xAxis.setEnabled(true);
                xAxis.setTextSize(10 * $fontScale);
                xAxis.setLabelTextAlign(Align.CENTER);
                // xAxis.setDrawGridLines(false);
                // xAxis.setCenterAxisLabels(true);
                xAxis.ensureLastLabel = true;
                // xAxis.setGranularity(10 * 60 * 1000)
                // xAxis.setGranularityEnabled(true)
                xAxis.setDrawMarkTicks(true);
                // xAxis.setValueFormatter({
                //     getAxisLabel: (value, axis) => dayjs(value / timeFactor + delta).diff(now / timeFactor + delta, 'm') + 'm'
                // });
                xAxis.setPosition(XAxisPosition.BOTTOM);

                // const rightAxis = char   t.getAxisRight();
                // rightAxis.setEnabled(false);

                // leftAxis.setAxisMinimum(0);
                // leftAxis.setDrawGridLines(false);
                // leftAxis.setDrawLabels(false);
                // leftAxis.setDrawMarkTicks(false);
                // leftAxis.setDrawAxisLine(false);
                // leftAxis.removeAllLimitLines();
            }
            const colors = {};
            const dataSets = item.weatherData.map((wData) => {
                const provider = wData.model.split(':')[0];
                let colorGenerator = colors[provider];
                if (!colorGenerator) {
                    colorGenerator = colors[provider] = new toColor(provider, { saturation: 1.5, brightness: 0.8 });
                }
                const key = item.id;
                const color = colorGenerator.getColor().hsl.formatted;
                const data = item.forecast === 'hourly' ? wData.weatherData.daily.data[0].hourly : wData.weatherData.daily.data;
                console.log('set', Object.keys(item), key, wData.model, color);
                // const data = (item.forecast === 'hourly' ? wData.weatherData.daily.data[0].hourly : wData.weatherData.daily.data).map((d: DailyData | Hourly) => ({
                //     time: d.time,
                //     [key]: d[key]
                // }));
                const set = new LineDataSet(data, wData.model, 'time', key);
                // set.setAxisDependency(AxisDependency.LEFT);
                set.setLineWidth(2);
                // precipChartSet.setDrawCircles(true);
                // set.setDrawFilled(true);
                // set.setFillAlpha(150);
                // set.setMode(Mode.CUBIC_BEZIER);
                // set.setCubicIntensity(0.4);
                set.setColor(color);
                // set.setFillColor(color);
                return set;
            });
            chart.setData(new LineData(dataSets));
        }
    }
    $: if (lineChart) {
        updateLineChart(item);
    }

    onThemeChanged(() => {
        const chart = lineChart?.nativeView;
        DEV_LOG && console.log('onThemeChanged', !!chart, colorOnSurface);
        if (chart) {
            const newColor = $colors.colorOnSurface;
            chart.getAxisLeft().setTextColor(newColor);
            chart.getXAxis().setTextColor(newColor);
            chart.invalidate();
        }
    });
    let canvasView;
    function redraw() {
        const chart = lineChart?.nativeView;
        if (chartInitialized && chart) {
            const xAxis = chart.getXAxis();
            const leftAxis = chart.getAxisLeft();
            leftAxis.setTextSize(10 * $fontScale);
            xAxis.setTextSize(10 * $fontScale);
        }
        lineChart?.nativeView.invalidate();
        canvasView?.nativeView.invalidate();
    }
    fontScale.subscribe(redraw);
</script>

<linechart bind:this={lineChart} height="100%" {...$$restProps} />
