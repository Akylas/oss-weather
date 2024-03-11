<script context="module" lang="ts">
    import { Color, ObservableArray } from '@nativescript/core';
    import toColor from '@mapbox/to-color';
    import { Align, Canvas, FontMetrics, LayoutAlignment, Paint, StaticLayout, Style } from '@nativescript-community/ui-canvas';
    import { LineChart } from '@nativescript-community/ui-chart';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { AxisRenderer } from '@nativescript-community/ui-chart/renderer/AxisRenderer';
    import dayjs from 'dayjs';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { formatDate, formatTime, lc } from '~/helpers/locale';
    import { onThemeChanged } from '~/helpers/theme';
    import { WeatherData } from '~/services/providers/weather';
    import { showError } from '~/utils/error';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { colors, fontScale } from '~/variables';

    const legendIconPaint = new Paint();
    legendIconPaint.strokeWidth = 2;
    const legendPaint = new Paint();
    const labelPaint = new Paint();
    labelPaint.setTextAlign(Align.CENTER);
    const mFontMetricsBuffer = new FontMetrics();
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors);

    interface Item {
        weatherData: { weatherData: WeatherData; model: { id: string; name: string; shortName: string } }[];
        forecast: string;
        id: string;
    }
    export let item: Item;
    export let startingSide;

    let lineChart: NativeViewElementNode<LineChart>;
    let chartInitialized = false;

    // we need a factor cause using timestamp means
    // using 64bit data which canvas does not support (android Matrix specifically)
    const legends = new ObservableArray([]);
    function updateLineChart(item: Item) {
        const chart = lineChart?.nativeView;
        if (chart) {
            const xAxis = chart.getXAxis();
            if (!chartInitialized) {
                chartInitialized = true;
                // chart.setNoDataText(null);
                chart.setMinOffset(0);
                chart.setAutoScaleMinMaxEnabled(true);
                // chart.getLegend().setForm(LegendForm.CIRCLE);
                // chart.setDoubleTapToZoomEnabled(false);
                // chart.getLegend().setEnabled(true);
                xAxis.setEnabled(true);
                xAxis.setTextSize(10 * $fontScale);
                // xAxis.setLabelTextAlign(Align.CENTER);
                // xAxis.setDrawGridLines(false);
                // xAxis.setCenterAxisLabels(true);
                xAxis.ensureLastLabel = true;
                // xAxis.setGranularity(10 * 60 * 1000)
                // xAxis.setGranularityEnabled(true)
                xAxis.setDrawMarkTicks(true);
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
            const newLegends = [];
            if (item.forecast === 'hourly') {
                chart.setExtraOffsets(0, 0, 15, 15);

                xAxis.setValueFormatter({
                    getAxisLabel: (value, axis) => formatDate(value, 'DD/MM') + '\n' + formatTime(value)
                });
            } else {
                chart.setExtraOffsets(0, 0, 15, 0);
                xAxis.setValueFormatter({
                    getAxisLabel: (value, axis) => formatDate(value, 'DD/MM')
                });
            }

            xAxis.setCustomRenderer({
                drawLabel(c: Canvas, renderer: AxisRenderer, text, x, y, paint: Paint, anchor, angleDegrees) {
                    const staticLayout = new StaticLayout(text, labelPaint, 100, LayoutAlignment.ALIGN_NORMAL, 1, 0, false);
                    c.save();
                    c.translate(x, y);
                    staticLayout.draw(c);
                    c.restore();
                    // c.drawText(text, x, y, paint);
                }
            });
            const dataSets = item.weatherData.map((wData) => {
                DEV_LOG && console.log('wData', item.id, wData.model);
                const provider = wData.model.id.split(':')[0];
                let colorGenerator = colors[provider];
                if (!colorGenerator) {
                    colorGenerator = colors[provider] = new toColor(provider, { saturation: 1.5, brightness: 0.8 });
                }
                const key = item.id;
                const color = colorGenerator.getColor().hsl.formatted;
                const data = item.forecast === 'hourly' ? wData.weatherData.daily.data[0].hourly : wData.weatherData.daily.data;
                // const data = (item.forecast === 'hourly' ? wData.weatherData.daily.data[0].hourly : wData.weatherData.daily.data).map((d: DailyData | Hourly) => ({
                //     time: d.time,
                //     [key]: d[key]
                // }));
                const set = new LineDataSet(data, wData.model.shortName, 'time', key);
                set['modelId'] = wData.model.id;
                // set.setAxisDependency(AxisDependency.LEFT);
                set.setLineWidth(2);
                // precipChartSet.setDrawCircles(true);
                // set.setDrawFilled(true);
                // set.setFillAlpha(150);
                // set.setMode(Mode.CUBIC_BEZIER);
                // set.setCubicIntensity(0.4);
                set.setColor(color);
                // set.setFillColor(color);
                newLegends.push({
                    name: wData.model.shortName,
                    id: wData.model.id,
                    enabled: true,
                    color
                });
                return set;
            });
            legends.splice(0, legends.length, ...newLegends);
            DEV_LOG && console.log('legends', JSON.stringify(legends));
            chart.setData(new LineData(dataSets));
        }
    }
    $: if (lineChart) {
        updateLineChart(item);
    }

    onThemeChanged(() => {
        const chart = lineChart?.nativeView;
        if (chart) {
            const newColor = $colors.colorOnSurface;
            DEV_LOG && console.log('onThemeChanged', !!chart, colorOnSurface, newColor);
            chart.getAxisLeft().setTextColor(newColor);
            chart.getXAxis().setTextColor(newColor);
            chart.getLegend().setTextColor(newColor);
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
            labelPaint.setTextSize(10 * $fontScale);
        }
        labelPaint.getFontMetrics(mFontMetricsBuffer);
        lineChart?.nativeView.invalidate();
        canvasView?.nativeView.invalidate();
    }
    fontScale.subscribe(redraw);

    function swipeMenuTranslationFunction(side, width, value, delta, progress) {
        const result = {
            rightDrawer: {
                translateX: side === 'left' ? -value : value
                //    translateX: side === 'right' ? -delta : delta
            },
            backDrop: {
                // translateX: side === 'right' ? -delta : delta,
                opacity: progress * 0.1
            }
        } as any;

        return result;
    }
    function onDrawLegend({ id, name, color, enabled }: { id: string; name: string; color: string; enabled: boolean }, { canvas }: { canvas: Canvas }) {
        const h = canvas.getHeight();
        legendIconPaint.color = color;
        legendIconPaint.setStyle(enabled ? Style.FILL : Style.STROKE);
        canvas.drawCircle(10, h / 2, 5, legendIconPaint);
        canvas.drawText(name, 20, h / 2 - mFontMetricsBuffer.ascent / 2, legendPaint);
    }

    function toggleLegend(item, event) {
        try {
            item.enabled = !item.enabled;
            const index = legends.findIndex((l) => l.id === item.id);
            DEV_LOG && console.log('toggleLegend', index, item);
            if (index >= 0) {
                const chart = lineChart?.nativeView;
                if (chart) {
                    chart
                        .getData()
                        .getDataSetByLabel(item.name, false)
                        .setLineWidth(item.enabled ? 2 : 0);
                    chart.invalidate();
                }
                legends.setItem(index, item);
            }
        } catch (error) {
            showError(error);
        }
    }
</script>

<swipemenu
    closeAnimationDuration={100}
    gestureHandlerOptions={{
        // activeOffsetXStart: startingSide ? -10 : -Number.MAX_SAFE_INTEGER,
        // failOffsetXStart: startingSide ? Number.MIN_SAFE_INTEGER : 0,
        failOffsetYStart: -40,
        failOffsetYEnd: 40,
        minDist: 50
    }}
    openAnimationDuration={100}
    rightDrawerMode="over"
    rightSwipeDistance={200}
    {startingSide}
    translationFunction={swipeMenuTranslationFunction}
    {...$$restProps}>
    <gridlayout prop:mainContent rows="auto,*">
        <label class="sectionHeader" paddingTop={10} text={`${item.id} (${lc(item.forecast)})`} />
        <linechart bind:this={lineChart} row={1} />
    </gridlayout>
    <gridlayout prop:rightDrawer backgroundColor={new Color(colorBackground).setAlpha(200)} columns="*" rows="*" width={100}>
        <collectionview height="200" items={legends} nestedScrollingEnabled={false} rowHeight={30}>
            <Template let:item>
                <canvasview rippleColor={item.color} on:draw={(event) => onDrawLegend(item, event)} on:tap={(event) => toggleLegend(item, event)} />
            </Template>
        </collectionview>
    </gridlayout>
</swipemenu>
