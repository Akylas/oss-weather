<script context="module" lang="ts">
    import { Align, Canvas, DashPathEffect, FontMetrics, Paint, RectF } from '@nativescript-community/ui-canvas';
    import { CombinedChart } from '@nativescript-community/ui-chart';
    import { ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
    import { LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { BarData } from '@nativescript-community/ui-chart/data/BarData';
    import { BarDataSet } from '@nativescript-community/ui-chart/data/BarDataSet';
    import { BarLineScatterCandleBubbleDataSet } from '@nativescript-community/ui-chart/data/BarLineScatterCandleBubbleDataSet';
    import { ChartData } from '@nativescript-community/ui-chart/data/ChartData';
    import { CombinedData } from '@nativescript-community/ui-chart/data/CombinedData';
    import { DataSet } from '@nativescript-community/ui-chart/data/DataSet';
    import { Entry } from '@nativescript-community/ui-chart/data/Entry';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
    import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
    import { Highlight } from '@nativescript-community/ui-chart/highlight/Highlight';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { EventData } from '@nativescript-community/ui-image';
    import { Application, ApplicationSettings, Color, ObservableArray, OrientationChangedEventData } from '@nativescript/core';
    import { onDestroy, onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import { CHARTS_PORTRAIT_FULLSCREEN } from '~/helpers/constants';
    import { formatDate, getLocalTime, lc } from '~/helpers/locale';
    import { onThemeChanged } from '~/helpers/theme';
    import { DailyData, Hourly, WeatherData } from '~/services/providers/weather';
    import { PROP_TO_UNIT, convertWeatherValueToUnit } from '~/services/weatherData';
    import { showError } from '~/utils/error';
    import { colors, fontScale, screenWidthDips } from '~/variables';

    const legendIconPaint = new Paint();
    legendIconPaint.textSize = 13;

    legendIconPaint.strokeWidth = 2;
    const legendPaint = new Paint();
    legendPaint.textSize = 13;
    const labelPaint = new Paint();
    labelPaint.textSize = 13;
    labelPaint.setTextAlign(Align.CENTER);
    const mFontMetricsBuffer = new FontMetrics();

    const LINE_WIDTH = 2;
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground, colorPrimary } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground, colorPrimary } = $colors);

    interface Item {
        weatherData: { weatherData: WeatherData; model: { id: string; name: string; shortName: string; color: string } }[];
        forecast: string;
        chartType: 'linechart' | 'scatterchart' | 'barchart';
        id: string;
        timestamp: number;
        hidden: string[];
    }
    export let item: Item & { startingSide: string };
    export let screenOrientation: string = null;
    let chartHeight;
    $: {
        chartHeight = !screenOrientation && !ApplicationSettings.getBoolean('charts_portrait_fullscreen', CHARTS_PORTRAIT_FULLSCREEN) ? screenWidthDips : undefined;
    }
    // $: console.log('item changed', (item?.weatherData?.[0]?.model));
    // export let startingSide;

    let chartView: NativeViewElementNode<CombinedChart>;
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
    let globalStartTimestamp = Number.MAX_SAFE_INTEGER;
    let maxDatalength = 0;
    let timezoneOffset;
    function updateLineChart(item: Item) {
        const key = item.id + item.forecast + item.timestamp;
        if (key === lastKey) {
            return;
        }
        try {
            const { weatherData, ...others } = item;
            lastKey = key;
            const chart = chartView?.nativeView;
            if (chart) {
                const xAxis = chart.xAxis;
                const leftAxis = chart.leftAxis;
                if (!chartInitialized) {
                    chartInitialized = true;

                    leftAxis.textColor = colorOnSurface;
                    chart.xAxis.textColor = colorOnSurface;
                    chart.minOffset = 0;
                    // chart.highlightFullBarEnabled = false;
                    chart.autoScaleMinMaxEnabled = true;
                    chart.clipDataToContent = true;
                    chart.pinchZoomEnabled = true;
                    chart.dragEnabled = true;
                    // chart.highlightsFilterByAxis = false;
                    chart.scaleXEnabled = true;
                    chart.scaleYEnabled = false;
                    // chart.highlightPerTapEnabled = true;
                    // chart.highlightPerDragEnabled = true;
                    chart.setExtraOffsets(0, 0, 0, 0);
                    xAxis.enabled = true;
                    xAxis.textSize = 10 * $fontScale;
                    xAxis.labelTextAlign = Align.CENTER;
                    xAxis.ensureLastLabel = true;
                    xAxis.position = XAxisPosition.BOTTOM;
                    xAxis.yOffset = 12;

                    leftAxis.spaceBottom = 5;
                    leftAxis.spaceTop = 5;
                } else {
                    chart.resetZoom();
                }

                leftAxis.gridColor = colorOnSurfaceVariant + '33';
                xAxis.gridColor = colorOnSurfaceVariant + '33';
                const newLegends = [];
                if (item.forecast === 'hourly') {
                    xAxis.forcedInterval = 1;

                    xAxis.valueFormatter = {
                        getAxisLabel: (value, axis) => {
                            const date = getLocalTime(globalStartTimestamp + value * 3600 * 1000, timezoneOffset);
                            // if (date.get('m') === 0) {
                            if (date.get('h') === 0) {
                                return date.format('ddd\nDD/MM');
                            } else if (date.get('h') % 4 === 0) {
                                return date.format('HH');
                            }
                            // }
                        }
                    };
                } else {
                    xAxis.forcedInterval = 24;
                    xAxis.valueFormatter = {
                        getAxisLabel: (value, axis) => formatDate(globalStartTimestamp + value * 3600 * 1000, 'DD/MM', timezoneOffset)
                    };
                }

                const gridLinePathEffect = new DashPathEffect([4, 8], 0);
                xAxis.customRenderer = {
                    drawGridLine(c: Canvas, axis, rect: RectF, x: any, y: any, axisValue: any, paint: Paint) {
                        const hours = getLocalTime(globalStartTimestamp + axisValue * 3600 * 1000).get('h');
                        if (hours % 4 === 0) {
                            if (hours === 0) {
                                paint.setPathEffect(null);
                            } else {
                                paint.setPathEffect(gridLinePathEffect);
                            }
                            c.drawLine(x, rect.bottom, x, rect.top, paint);
                        }
                    },
                    drawLabel(c: Canvas, axis, text, x, y, paint: Paint, anchor, angleDegrees) {
                        if (text) {
                            const lines = text.split('\n');
                            for (let index = 0; index < lines.length; index++) {
                                c.drawText(lines[index], x, y + index * paint.textSize, paint);
                            }
                        }
                    }
                };
                const chartType = item.chartType;
                const data = new CombinedData();
                maxDatalength = 0;
                let xAxisMaximum = -1;
                const dataSets = item.weatherData.map((wData) => {
                    const key = item.id;
                    const sourceData = item.forecast === 'hourly' ? wData.weatherData.hourly : wData.weatherData.daily.data;
                    const startTimestamp = sourceData[0]?.time;
                    if (timezoneOffset === undefined) {
                        timezoneOffset = sourceData[0]?.timezoneOffset;
                    }
                    const data = sourceData.map((d: DailyData | Hourly) => ({
                        ...d,
                        deltaHours: (d.time - startTimestamp) / (3600 * 1000),
                        [key]: convertWeatherValueToUnit(d, key, { round: false })[0]
                    }));
                    maxDatalength = Math.max(maxDatalength, data.length);
                    xAxisMaximum = Math.max(xAxisMaximum, data[data.length - 1].deltaHours);
                    globalStartTimestamp = Math.min(globalStartTimestamp, startTimestamp);
                    const color = wData.model.color;
                    const enabled = item.hidden.indexOf(wData.model.id) === -1;
                    newLegends.push({
                        name: wData.model.name,
                        shortName: wData.model.shortName,
                        id: wData.model.id,
                        enabled,
                        color
                    });
                    let set: BarLineScatterCandleBubbleDataSet<any>;
                    switch (chartType) {
                        case 'scatterchart': {
                            const scatterDataSet = (set = new ScatterDataSet(data, wData.model.id, 'deltaHours', key));
                            scatterDataSet.scatterShape = ScatterShape.CIRCLE;
                            scatterDataSet.drawIconsEnabled = enabled;
                            scatterDataSet.scatterShapeSize = enabled ? 4 : 0;
                            break;
                        }
                        case 'barchart': {
                            const barDataSet = (set = new BarDataSet(data, wData.model.id, 'deltaHours', key));
                            barDataSet.visible = enabled;
                            break;
                        }
                        case 'linechart':
                        default: {
                            {
                                const lineDataSet = (set = new LineDataSet(data, wData.model.id, 'deltaHours', key));
                                lineDataSet.lineWidth = enabled ? LINE_WIDTH : 0;
                                break;
                            }
                        }
                    }
                    set['modelId'] = wData.model.id;
                    set.color = color;
                    set.highlightColor = colorPrimary;
                    return set;
                });
                if (!screenOrientation && Application.orientation() !== 'landscape') {
                    chart.setScale(10 / (screenWidthDips / maxDatalength), 1);
                }
                xAxis.axisMinimum = -1.5;
                xAxis.axisMaximum = xAxisMaximum + 1.5;
                legends.splice(0, legends.length, ...newLegends);
                // DEV_LOG && console.log('legends', JSON.stringify(legends));
                switch (chartType) {
                    case 'scatterchart':
                        data.scatterData = new ScatterData(dataSets as ScatterDataSet[]);
                        break;
                    case 'barchart':
                        const barData = new BarData(dataSets as BarDataSet[]);
                        const nbDataSets = dataSets.length;
                        const groupSpace = 0.3 / nbDataSets;
                        const barSpace = 0.01; // x2 dataset
                        const barWidth = (1 - groupSpace - barSpace * nbDataSets) / nbDataSets;
                        // (0.45 + 0.02) * 2 + 0.06 = 1.00 -> interval per "group"
                        barData.barWidth = barWidth;
                        barData.groupBars(0, groupSpace, barSpace, true, true); // start at x = 0
                        // DEV_LOG && console.log('create barData', nbDataSets, barWidth, barSpace, groupSpace);
                        data.barData = barData;
                        break;
                    default:
                        data.lineData = new LineData(dataSets as LineDataSet[]);
                        break;
                }

                const limitLine = new LimitLine((Date.now() - globalStartTimestamp) / (3600 * 1000));
                limitLine.lineWidth = 2;
                limitLine.enableDashedLine(4, 2, 0);
                limitLine.lineColor = colorOnSurfaceVariant;
                xAxis.removeAllLimitLines();
                xAxis.addLimitLine(limitLine);

                chart.data = data;
                // DEV_LOG && console.log('set combined data');
                chart.data.notifyDataChanged();
                chart.notifyDataSetChanged();
            }
        } catch (error) {
            showError(error);
        }
    }
    $: if (chartView) {
        updateLineChart(item);
    }

    onThemeChanged(() => {
        const chart = chartView?.nativeView;
        if (chart) {
            const newColor = $colors.colorOnSurface;
            const leftAxis = chart.leftAxis;
            const xAxis = chart.xAxis;
            leftAxis.textColor = newColor;
            xAxis.textColor = newColor;

            leftAxis.gridColor = colorOnSurfaceVariant + '33';
            xAxis.gridColor = colorOnSurfaceVariant + '33';
            leftAxis.limitLines.forEach((l) => (l.lineColor = newColor));
            // chart.getLegend().textColor = (newColor);
            chart.invalidate();
        }
    });
    let canvasView;
    function redraw() {
        const chart = chartView?.nativeView;
        if (chartInitialized && chart) {
            const xAxis = chart.xAxis;
            const leftAxis = chart.leftAxis;
            leftAxis.textSize = 10 * $fontScale;
            xAxis.textSize = 10 * $fontScale;
            labelPaint.textSize = 10 * $fontScale;
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
                    const set = chart.data.getDataSetByLabel(legendItem.id, false);
                    switch (item.chartType) {
                        case 'scatterchart':
                            (set as ScatterDataSet).scatterShapeSize = enabled ? 4 : 0;
                            break;
                        case 'barchart':
                            (set as BarDataSet).visible = enabled;
                            break;
                        default:
                            // (set as LineDataSet).drawCirclesEnabled = enabled;
                            (set as LineDataSet).lineWidth = enabled ? LINE_WIDTH : 0;
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
    // let highlighted: any[] = [];
    function onChartHighlight({ object: chart, entry, highlight, highlights }: { object: CombinedChart; entry: Entry; highlight: Highlight; highlights: Highlight[] }) {
        // highlighted = highlights
        //     .sort((a, b) => a.dataSetIndex - b.dataSetIndex)
        //     .map((h) => {
        //         const dataSet = (chart.data[h.dataType] as ChartData<any, any>).getDataSetByIndex(h.dataSetIndex);
        //         return {
        //             entry: h.entry,
        //             x: h.x,
        //             y: h.y,
        //             xTouchPx: h.xTouchPx,
        //             yTouchPx: h.yTouchPx,
        //             modelName: dataSet['modelId'],
        //             color: dataSet.color,
        //             timestamp: globalStartTimestamp + h.x * 3600 * 1000
        //         };
        //     });
        // DEV_LOG && console.log('onChartHighlight', highlights.length, JSON.stringify(highlighted));
    }

    let chartNeedsZoomUpdate = false;
    function onOrientationChanged(event: OrientationChangedEventData) {
        const chart = chartView?.nativeElement;
        if (!chart) {
            return;
        }
        const isLandscape = event.newValue === 'landscape';
        chartHeight = !isLandscape && !ApplicationSettings.getBoolean('charts_portrait_fullscreen', CHARTS_PORTRAIT_FULLSCREEN) ? screenWidthDips : undefined;
        chartNeedsZoomUpdate = true;
    }
    function onLayoutChanged(event: EventData) {
        const chart = event.object as CombinedChart;
        chart.once('postDraw', () => {
            //use a timeout to ensure we are called after chart layout changed was called
            // setTimeout(() => {
            // DEV_LOG && console.log('onLayoutChanged', chartNeedsZoomUpdate, screenOrientation, Application.orientation());
            if (chartNeedsZoomUpdate) {
                chartNeedsZoomUpdate = false;
                chart.highlight(null);
                if (screenOrientation || Application.orientation() === 'landscape') {
                    chart.resetZoom();
                } else {
                    chart.setScale(10 / (screenWidthDips / maxDatalength), 1);
                }
                if (__IOS__) {
                    // On iOS calling setNeedsDisplay from drawRect does not seem to work so let s timeout
                    setTimeout(() => {
                        chart.invalidate();
                    }, 0);
                } else {
                    chart.invalidate();
                }
            }
            // }, 0);
        });
    }
    onMount(() => {
        Application.on(Application.orientationChangedEvent, onOrientationChanged);
    });
    onDestroy(() => {
        Application.off(Application.orientationChangedEvent, onOrientationChanged);
    });
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

        <combinedchart bind:this={chartView} height={chartHeight} row={1} verticalAlignment={chartHeight ? 'center' : 'stretch'} on:highlight={onChartHighlight} on:layoutChanged={onLayoutChanged} />
        <!-- <label
            backgroundColor={new Color(colorBackground).setAlpha(200)}
            borderRadius={10}
            horizontalAlignment="right"
            margin="0 10 25 0"
            row={1}
            textAlignment="right"
            verticalAlignment="bottom"
            visibility={highlighted && highlighted.length ? 'visible' : 'hidden'}>
            <cspan text={highlighted && highlighted.length ? dayjs(highlighted[0].timestamp).format('L LT') : null} />
            {#each highlighted as high}
                <cspan color={high.color} fontWeight="bold" text={'\n' + '-- '} />
                <cspan text={high.y + getUnit(item.id)} />
            {/each}
        </label> -->
    </gridlayout>
    <gridlayout prop:bottomDrawer backgroundColor={new Color(colorBackground).setAlpha(200)} columns="*" height={40} rows="*">
        <collectionview colWidth={150} height="40" items={legends} orientation="horizontal">
            <Template let:item>
                <canvasview rippleColor={item.color} on:draw={(event) => onDrawLegend(item, event)} on:tap={(event) => toggleLegend(item, event)} />
            </Template>
        </collectionview>
    </gridlayout>
</drawer>
