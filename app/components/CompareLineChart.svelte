<script context="module" lang="ts">
    import { Align, Canvas, FontMetrics, Paint, RectF } from '@nativescript-community/ui-canvas';
    import { CombinedChart, LineChart, ScatterChart } from '@nativescript-community/ui-chart';
    import { ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
    import { LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { CombinedData } from '@nativescript-community/ui-chart/data/CombinedData';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
    import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
    import { AxisRenderer } from '@nativescript-community/ui-chart/renderer/AxisRenderer';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { Color, ObservableArray } from '@nativescript/core';
    import dayjs from 'dayjs';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { PROP_TO_UNIT, convertWeatherValueToUnit } from '~/helpers/formatter';
    import { formatDate, lc } from '~/helpers/locale';
    import { onThemeChanged } from '~/helpers/theme';
    import { DailyData, Hourly, WeatherData } from '~/services/providers/weather';
    import { showError } from '~/utils/error';
    import { colors, fontScale } from '~/variables';

    const legendIconPaint = new Paint();
    legendIconPaint.setTextSize(13);

    legendIconPaint.strokeWidth = 2;
    const legendPaint = new Paint();
    legendPaint.setTextSize(13);
    const labelPaint = new Paint();
    labelPaint.setTextSize(13);
    labelPaint.setTextAlign(Align.CENTER);
    const mFontMetricsBuffer = new FontMetrics();
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors);

    interface Item {
        weatherData: { weatherData: WeatherData; model: { id: string; name: string; shortName: string; color: string } }[];
        forecast: string;
        chartType: 'linechart' | 'scatterchart';
        id: string;
        timestamp: number;
        hidden: string[];
    }
    export let item: Item & { startingSide: string };
    export let handleAllCharts = false;
    // export let startingSide;

    let chartView: NativeViewElementNode<CombinedChart>;
    const data = new CombinedData();
    let drawer: DrawerElement;
    let chartInitialized = false;

    $: if (drawer) {
        drawer.nativeView.on('open', () => (item.startingSide = 'bottom'));
        drawer.nativeView.on('close', () => (item.startingSide = null));
    }

    // we need a factor cause using timestamp means
    // using 64bit data which canvas does not support (android Matrix specifically)
    const legends = new ObservableArray([]);
    let lastKey: string;
    function updateLineChart(item: Item) {
        const key = item.id + item.forecast + item.timestamp;
        if (key === lastKey) {
            return;
        }
        lastKey = key;
        const chart = chartView?.nativeView;
        if (chart) {
            const xAxis = chart.getXAxis();
            const leftAxis = chart.getAxisLeft();
            if (!chartInitialized) {
                chartInitialized = true;

                leftAxis.setTextColor(colorOnSurface);
                chart.getXAxis().setTextColor(colorOnSurface);
                chart.setMinOffset(0);
                chart.setAutoScaleMinMaxEnabled(true);
                chart.setBorderWidth(1);
                chart.setDrawBorders(true);
                chart.setClipDataToContent(false);
                xAxis.setEnabled(true);
                xAxis.setTextSize(10 * $fontScale);
                xAxis.setLabelTextAlign(Align.CENTER);
                xAxis.ensureLastLabel = true;
                xAxis.setPosition(XAxisPosition.BOTTOM);
                xAxis.setYOffset(12);

                leftAxis.setSpaceBottom(5);
                leftAxis.setSpaceTop(5);
                chart.setData(data);
            }
            const limitLine = new LimitLine(Date.now());
            limitLine.setLineWidth(2);
            limitLine.enableDashedLine(4, 2, 0);
            limitLine.setLineColor(colorOnSurfaceVariant);
            xAxis.removeAllLimitLines();
            xAxis.addLimitLine(limitLine);
            leftAxis.setGridColor(colorOnSurfaceVariant + '33');
            xAxis.setGridColor(colorOnSurfaceVariant + '33');
            const newLegends = [];
            if (item.forecast === 'hourly') {
                xAxis.setForcedInterval(3600 * 1000);
                chart.setExtraOffsets(0, 0, 15, 0);

                xAxis.setValueFormatter({
                    getAxisLabel: (value, axis) => {
                        const date = dayjs(value);
                        // if (date.get('m') === 0) {
                        if (date.get('h') === 0) {
                            return formatDate(value, 'ddd');
                        } else if (date.get('h') % 4 === 0) {
                            return formatDate(value, 'HH');
                        }
                        // }
                    }
                });
            } else {
                xAxis.setForcedInterval(24 * 3600 * 1000);
                chart.setExtraOffsets(0, 0, 15, 0);
                xAxis.setValueFormatter({
                    getAxisLabel: (value, axis) => formatDate(value, 'DD/MM')
                });
            }

            xAxis.setCustomRenderer({
                drawGridLine(c: Canvas, renderer: AxisRenderer, rect: RectF, x: any, y: any, axisValue: any, paint: Paint) {
                    if (dayjs(axisValue).get('h') === 0) {
                        c.drawLine(x, rect.bottom, x, rect.top, paint);
                    }
                },
                drawLabel(c: Canvas, renderer: AxisRenderer, text, x, y, paint: Paint, anchor, angleDegrees) {
                    if (text) {
                        c.drawText(text, x, y, paint);
                    }
                }
            });
            const chartType = item.chartType;
            data.mLineData = null;
            data.mScatterData = null;
            const dataSets = item.weatherData.map((wData) => {
                const key = item.id;
                const data = (item.forecast === 'hourly' ? wData.weatherData.daily.data[0].hourly : wData.weatherData.daily.data).map((d: DailyData | Hourly) => ({
                    ...d,
                    [key]: convertWeatherValueToUnit(d, key, { round: false })[0]
                }));
                const color = wData.model.color;
                switch (chartType) {
                    case 'scatterchart': {
                        const set = new ScatterDataSet(data, wData.model.id, 'time', key);
                        set['modelId'] = wData.model.id;
                        const enabled = item.hidden.indexOf(wData.model.id) === -1;
                        set.setScatterShape(ScatterShape.CIRCLE);
                        set.setDrawIcons(enabled);
                        set.setScatterShapeSize(enabled ? 4 : 0);
                        set.setColor(color);
                        // set.setFillColor(color);
                        newLegends.push({
                            name: wData.model.name,
                            shortName: wData.model.shortName,
                            id: wData.model.id,
                            enabled,
                            color
                        });
                        return set;
                    }
                    case 'linechart':
                    default: {
                        const set = new LineDataSet(data, wData.model.id, 'time', key);
                        set['modelId'] = wData.model.id;
                        const enabled = item.hidden.indexOf(wData.model.id) === -1;
                        set.setLineWidth(enabled ? 1 : 0);
                        set.setDrawCircles(enabled);
                        set.setCircleSize(1);
                        // set.setDrawValues(true);
                        set.setColor(color);
                        // set.setFillColor(color);
                        newLegends.push({
                            name: wData.model.name,
                            shortName: wData.model.shortName,
                            id: wData.model.id,
                            enabled,
                            color
                        });
                        return set;
                    }
                }
            });
            legends.splice(0, legends.length, ...newLegends);
            // DEV_LOG && console.log('legends', JSON.stringify(legends));
            switch (chartType) {
                case 'scatterchart':
                    data.setData(new ScatterData(dataSets as ScatterDataSet[]));
                    break;
                default:
                    data.setData(new LineData(dataSets as LineDataSet[]));
                    break;
            }
            chart.setData(data);
        }
    }
    $: if (chartView) {
        updateLineChart(item);
    }

    onThemeChanged(() => {
        const chart = chartView?.nativeView;
        if (chart) {
            const newColor = $colors.colorOnSurface;
            DEV_LOG && console.log('onThemeChanged', !!chart, colorOnSurface, newColor);
            const leftAxis = chart.getAxisLeft();
            const xAxis = chart.getXAxis();
            leftAxis.setTextColor(newColor);
            xAxis.setTextColor(newColor);

            leftAxis.setGridColor(colorOnSurfaceVariant + '33');
            xAxis.setGridColor(colorOnSurfaceVariant + '33');
            leftAxis.getLimitLines().forEach((l) => l.setLineColor(newColor));
            // chart.getLegend().setTextColor(newColor);
            chart.invalidate();
        }
    });
    let canvasView;
    function redraw() {
        const chart = chartView?.nativeView;
        if (chartInitialized && chart) {
            const xAxis = chart.getXAxis();
            const leftAxis = chart.getAxisLeft();
            leftAxis.setTextSize(10 * $fontScale);
            xAxis.setTextSize(10 * $fontScale);
            labelPaint.setTextSize(10 * $fontScale);
        }
        labelPaint.getFontMetrics(mFontMetricsBuffer);
        chartView?.nativeView.invalidate();
        canvasView?.nativeView.invalidate();
    }
    fontScale.subscribe(redraw);

    function swipeMenuTranslationFunction(side, width, value, delta, progress) {
        const result = {
            bottomDrawer: {
                translateY: side === 'left' ? -value : value
                //    translateX: side === 'right' ? -delta : delta
            },
            backDrop: {
                // translateX: side === 'right' ? -delta : delta,
                opacity: progress * 0.05
            }
        } as any;

        return result;
    }
    function onDrawLegend({ id, name, shortName, color, enabled }: { id: string; shortName: string; name: string; color: string; enabled: boolean }, { canvas }: { canvas: Canvas }) {
        const h = canvas.getHeight();
        legendIconPaint.color = color;
        legendPaint.color = color;
        if (enabled) {
            // legendIconPaint.setStyle(enabled ? Style.FILL : Style.STROKE);

            canvas.drawRect(0, 0, 5, h, legendIconPaint);
        }
        const nameAndKey = name.split(': ');
        if (nameAndKey.length === 2) {
            canvas.drawText(nameAndKey[0], 15, h / 2 - 3, legendPaint);
            canvas.drawText(nameAndKey[1], 15, h / 2 - mFontMetricsBuffer.ascent, legendPaint);
        } else {
            canvas.drawText(name, 15, h / 2 - mFontMetricsBuffer.ascent / 2, legendPaint);
        }
    }

    function toggleLegend(legendItem, event) {
        try {
            legendItem.enabled = !legendItem.enabled;
            const index = legends.findIndex((l) => l.id === legendItem.id);
            const hiddenIndex = item.hidden.indexOf(legendItem.id);
            if (hiddenIndex >= 0 && legendItem.enabled) {
                item.hidden.splice(hiddenIndex, 1);
            } else if (hiddenIndex === -1 && !legendItem.enabled) {
                item.hidden.push(legendItem.id);
            }
            if (index >= 0) {
                const chart = chartView?.nativeView;
                if (chart) {
                    const enabled = legendItem.enabled;
                    const set = chart.getData().getDataSetByLabel(legendItem.id, false);
                    switch (item.chartType) {
                        case 'scatterchart':
                            (set as ScatterDataSet).setScatterShapeSize(enabled ? 4 : 0);
                            break;
                        default:
                            (set as LineDataSet).setDrawCircles(enabled);
                            (set as LineDataSet).setLineWidth(enabled ? 1 : 0);
                            break;
                    }
                    chart.invalidate();
                }
                legends.setItem(index, legendItem);
            }
        } catch (error) {
            showError(error);
        }
    }
    function getUnit(prop) {
        return PROP_TO_UNIT[prop];
    }

</script>

<drawer
    bind:this={drawer}
    bottomDrawerMode="over"
    bottomSwipeDistance={200}
    closeAnimationDuration={100}
    gestureEnabled={false}
    openAnimationDuration={100}
    startingSide={item.startingSide}
    translationFunction={swipeMenuTranslationFunction}
    {...$$restProps}>
    <gridlayout prop:mainContent rows="auto,*">
        <label class="sectionHeader" paddingTop={10} text={`${item.id} ${getUnit(item.id) || ''} (${lc(item.forecast)})`} />
        <mdbutton class="mdi" horizontalAlignment="right" text="mdi-format-list-bulleted-square" variant="text" on:tap={() => drawer.toggle()} />

        <combinedchart bind:this={chartView} row={1} />
    </gridlayout>
    <gridlayout prop:bottomDrawer backgroundColor={new Color(colorBackground).setAlpha(200)} columns="*" height={40} rows="*">
        <collectionview colWidth={150} height="40" items={legends} orientation="horizontal">
            <Template let:item>
                <canvasview rippleColor={item.color} on:draw={(event) => onDrawLegend(item, event)} on:tap={(event) => toggleLegend(item, event)} />
            </Template>
        </collectionview>
    </gridlayout>
</drawer>
