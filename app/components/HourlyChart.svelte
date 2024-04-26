<script context="module" lang="ts">
    import { Align, Canvas, DashPathEffect, FontMetrics, LinearGradient, Paint, Rect, RectF } from '@nativescript-community/ui-canvas';
    import { CombinedChart } from '@nativescript-community/ui-chart';
    import { ScatterShape } from '@nativescript-community/ui-chart/charts/ScatterChart';
    import { LimitLine } from '@nativescript-community/ui-chart/components/LimitLine';
    import { XAxisPosition } from '@nativescript-community/ui-chart/components/XAxis';
    import { CombinedData } from '@nativescript-community/ui-chart/data/CombinedData';
    import { LineData } from '@nativescript-community/ui-chart/data/LineData';
    import { LineDataSet, Mode } from '@nativescript-community/ui-chart/data/LineDataSet';
    import { ScatterData } from '@nativescript-community/ui-chart/data/ScatterData';
    import { ScatterDataSet } from '@nativescript-community/ui-chart/data/ScatterDataSet';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { Application, ApplicationSettings, Color, EventData, ImageSource, ObservableArray, OrientationChangedEventData } from '@nativescript/core';
    import dayjs from 'dayjs';
    import { Template } from 'svelte-native/components';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import { convertWeatherValueToUnit, toImperialUnit, windIcon } from '~/helpers/formatter';
    import { lc } from '~/helpers/locale';
    import { onThemeChanged } from '~/helpers/theme';
    import { CommonWeatherData, DailyData, Hourly, WeatherData } from '~/services/providers/weather';
    import { showError } from '~/utils/error';
    import { colors, fontScale, screenWidthDips, sunnyColor } from '~/variables';

    import { AxisDependency } from '@nativescript-community/ui-chart/components/YAxis';
    import { BarData } from '@nativescript-community/ui-chart/data/BarData';
    import { BarDataSet } from '@nativescript-community/ui-chart/data/BarDataSet';
    import { NavigatedData, Page } from '@nativescript/core';
    import { onDestroy, onMount } from 'svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { l } from '~/helpers/locale';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService } from '~/services/api';
    import { iconService } from '~/services/icon';
    import { UNITS, WeatherProps, appPaint, getWeatherDataColor, getWeatherDataTitle } from '~/services/weatherData';
    import { generateGradient, loadImage, tempColor } from '~/utils/utils';
    import { actionBarButtonHeight } from '~/variables';
    import { CHARTS_LANDSCAPE, CHARTS_PORTRAIT_FULLSCREEN } from '~/helpers/constants';

    const legendIconPaint = new Paint();
    legendIconPaint.textSize = 13;

    legendIconPaint.strokeWidth = 2;
    const legendPaint = new Paint();
    legendPaint.textSize = 13;
    const labelPaint = new Paint();
    labelPaint.textSize = 13;
    labelPaint.setTextAlign(Align.CENTER);

    const bitmapPaint = new Paint();
    bitmapPaint.setAntiAlias(true);
    // bitmapPaint.setFilterBitmap(true);
    // bitmapPaint.setDither(true);

    const mFontMetricsBuffer = new FontMetrics();

    const LINE_WIDTH = 2;

    const CHART_TYPE = {
        [WeatherProps.precipAccumulation]: 'barchart',
        // [WeatherProps.windSpeed]: 'scatterchart',
        // [WeatherProps.windGust]: 'scatterchart',
        [WeatherProps.cloudCover]: 'scatterchart',
        [WeatherProps.windBearing]: 'scatterchart'
    };

    const textBounds = new Rect(0, 0, 0, 0);
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground } = $colors);

    export let weatherLocation: FavoriteLocation;
    export let weatherData: WeatherData;
    export let forecast = 'hourly';
    export let dataToShow = [
        WeatherProps.iconId,
        WeatherProps.windSpeed,
        WeatherProps.temperature,
        // WeatherProps.temperatureMin,
        // WeatherProps.temperatureMax,
        WeatherProps.precipAccumulation
        // WeatherProps.cloudCover
    ];

    let page: NativeViewElementNode<Page>;
    // let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    const loading = false;
    const screenOrientation = ApplicationSettings.getBoolean('charts_landscape', CHARTS_LANDSCAPE) ? 'landscape' : undefined;
    let chartHeight = !screenOrientation && !ApplicationSettings.getBoolean('charts_portrait_fullscreen', CHARTS_PORTRAIT_FULLSCREEN) ? screenWidthDips : undefined;
    let chartView: NativeViewElementNode<CombinedChart>;
    const combinedChartData = new CombinedData();
    let drawer: DrawerElement;
    let chartInitialized = false;
    const hidden: string[] = [];
    const legends = new ObservableArray([]);

    let iconCache: { [k: string]: ImageSource } = {};
    function getIcon(iconId, isDay): ImageSource {
        const realIcon = iconService.getIcon(iconId, isDay, false);
        let icon = iconCache[realIcon];
        if (icon) {
            return icon;
        }
        icon = iconCache[realIcon] = loadImage(`${iconService.iconSetFolderPath}/images/${realIcon}.png`, { resizeThreshold: 80 });
        return icon;
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

    onMount(async () => {
        Application.on(Application.orientationChangedEvent, onOrientationChanged);

        networkService.on(NetworkConnectionStateEvent, (event: NetworkConnectionStateEventData) => {
            try {
                if (networkConnected !== event.data.connected) {
                    networkConnected = event.data.connected;
                }
            } catch (error) {
                showError(error);
            }
        });
        networkConnected = networkService.connected;
    });
    onDestroy(() => {
        Application.off(Application.orientationChangedEvent, onOrientationChanged);
        if (__ANDROID__) {
            Object.values(iconCache).forEach((item) => (item.android as android.graphics.Bitmap)?.recycle());
            iconCache = null;
        }
    });

    function onNavigatedTo(args: NavigatedData): void {
        updateLineChart();
    }

    let temperatureData: { min: number; max: number };
    let maxDatalength = 0;
    function updateLineChart() {
        try {
            const chart = chartView?.nativeView;
            if (chart) {
                chart.maxVisibleValueCount = 10000;
                const xAxis = chart.xAxis;
                const leftAxis = chart.leftAxis;
                const rightAxis = chart.rightAxis;
                if (!chartInitialized) {
                    chartInitialized = true;
                    rightAxis.enabled = true;
                    rightAxis.drawGridLines = false;
                    leftAxis.textColor = rightAxis.textColor = xAxis.textColor = colorOnSurface;
                    leftAxis.gridColor = rightAxis.gridColor = xAxis.gridColor = colorOnSurfaceVariant + '33';
                    chart.minOffset = -100;
                    chart.clipValuesToContent = false;
                    chart.setExtraOffsets(0, 30, 0, 0);
                    // chart.autoScaleMinMaxEnabled = true;
                    // chart.setBorderWidth(1);
                    // chart.drawBorders = false;
                    // chart.borderColor = colorOnSurface;
                    chart.highlightsFilterByAxis = false;
                    chart.pinchZoomEnabled = true;
                    chart.dragEnabled = true;
                    chart.scaleXEnabled = true;
                    chart.scaleYEnabled = false;
                    xAxis.enabled = true;
                    xAxis.textSize = 10 * $fontScale;
                    xAxis.labelTextAlign = Align.CENTER;
                    xAxis.ensureLastLabel = true;
                    xAxis.position = XAxisPosition.BOTTOM;
                    xAxis.yOffset = 12;
                    xAxis.axisMinimum = -1.5;
                    // rightAxis.drawGridLines = false;

                    leftAxis.spaceBottom = rightAxis.spaceBottom = 5;
                    leftAxis.spaceTop = rightAxis.spaceTop = 5;
                    chart.data = combinedChartData;
                    let lastIconX: number;
                    chart.customRenderer = {
                        drawIcon(canvas: Canvas, chart: CombinedChart, dataSet, dataSetIndex, entry, entryIndex, icon: any, x: number, y: number) {
                            if (dataSet.label === WeatherProps.iconId) {
                                const imageSource = icon as ImageSource;
                                const iconSize = 30;
                                const date = dayjs(startTimestamp + entry['deltaHours'] * 3600 * 1000);
                                // if (date.get('m') === 0) {
                                if (x - lastIconX > iconSize || date.get('h') % Math.round(4 / chart.scaleX) === 0) {
                                    const drawOffsetX = x - iconSize / 2;
                                    const drawOffsetY = 0;
                                    canvas.drawBitmap(
                                        imageSource,
                                        new Rect(0, 0, imageSource.width, imageSource.height),
                                        new Rect(drawOffsetX, drawOffsetY, drawOffsetX + iconSize, drawOffsetY + iconSize),
                                        null
                                    );
                                }
                                lastIconX = x;

                                // canvas.save();
                                // canvas.scale(0.5, 0.5, x, y);
                                // canvas.drawBitmap(icon, drawOffsetX, drawOffsetY, null);
                                // canvas.restore();
                            } else if (dataSet.label === WeatherProps.windSpeed) {
                                const drawOffsetY = 45;
                                appPaint.color = dataSet.color;
                                appPaint.setTextSize(12);
                                canvas.drawText(icon as string, x, drawOffsetY, appPaint);
                            }
                        },
                        drawValue(c: Canvas, chart, dataSet, dataSetIndex: number, entry, entryIndex: number, valueText: string, x: number, y: number, color: string | Color, paint: Paint) {
                            const yProperty = dataSet.yProperty;
                            if (entryIndex !== 0 && entryIndex < dataSet.entryCount - 1) {
                                const value = entry[yProperty];
                                const prevValue = dataSet.getEntryForIndex(entryIndex - 1)[yProperty];
                                const nextValue = dataSet.getEntryForIndex(entryIndex + 1)[yProperty];
                                // DEV_LOG && console.log('test', value, prevValue, nextValue);
                                if (prevValue !== value && !(prevValue < value && value < nextValue) && !(prevValue > value && value > nextValue)) {
                                    // if (yProperty === WeatherProps.temperature) {
                                    //     const entryTempColor = tempColor(value, temperatureData.min, temperatureData.max);
                                    //     paint.setColor(color);
                                    //     paint.getTextBounds(valueText, 0, valueText.length, textBounds);
                                    //     const height = textBounds.height();
                                    //     const width = textBounds.width();
                                    //     const deltaY = -height - 2;
                                    //     paint.setColor(entryTempColor);
                                    //     paint.setAlpha(210);
                                    //     c.drawRoundRect(x + (-width / 2 - 4), y + deltaY, x + (width / 2 + 4), y + deltaY + (height + 5), 4, 4, paint);
                                    //     paint.setAlpha(255);
                                    //     paint.setColor(color);
                                    //     c.drawText(valueText, x, y, paint);
                                    // } else {
                                    paint.setColor(color);
                                    c.drawText(valueText, x, y, paint);
                                    // }
                                }
                            }
                        },
                        drawBar(c: Canvas, e, dataSet, left: number, top: number, right: number, bottom: number, paint: Paint) {
                            if (e.precipColor) {
                                paint.color = e.precipColor;
                            }
                            c.drawRect(left, top, right, bottom, paint);
                        }
                    };
                }

                const newLegends = [];
                const lineDataSets: LineDataSet[] = [];
                const scatterDataSets: ScatterDataSet[] = [];
                const barDataSets: BarDataSet[] = [];

                const sourceData = weatherData.hourly;
                const startTimestamp = sourceData[0].time;

                const limitLine = new LimitLine((Date.now() - startTimestamp) / (3600 * 1000));
                limitLine.lineWidth = 2;
                limitLine.enableDashedLine(4, 2, 0);
                limitLine.lineColor = colorOnSurfaceVariant;
                xAxis.removeAllLimitLines();
                xAxis.addLimitLine(limitLine);

                // if (forecast === 'hourly') {
                xAxis.forcedInterval = 1;

                xAxis.valueFormatter = {
                    getAxisLabel: (value, axis) => {
                        const date = dayjs(startTimestamp + value * 3600 * 1000);
                        // if (date.get('m') === 0) {
                        if (date.get('h') === 0) {
                            return date.format('ddd\nDD/MM');
                        } else if (date.get('h') % 4 === 0) {
                            return date.format('HH');
                        }
                        // }
                    }
                };
                // } else {
                //     xAxis.forcedInterval = 24 * 3600 * 1000;
                //     chart.setExtraOffsets(0, 0, 15, 0);
                //     xAxis.valueFormatter=({
                //         getAxisLabel: (value, axis) => formatDate(startTimestamp + value * 3600 * 1000, 'DD/MM')
                //     });
                // }
                const gridLinePathEffect = new DashPathEffect([4, 8], 0);
                xAxis.customRenderer = {
                    drawGridLine(c: Canvas, axis, rect: RectF, x: any, y: any, axisValue: any, paint: Paint) {
                        const hours = dayjs(startTimestamp + axisValue * 3600 * 1000).get('h');
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
                let tempMin = Number.MAX_SAFE_INTEGER;
                let tempMax = Number.MIN_SAFE_INTEGER;
                const data = sourceData.map((d: DailyData | Hourly, index) => {
                    const result = { ...d, deltaHours: (d.time - startTimestamp) / (3600 * 1000) };
                    dataToShow.forEach((k) => {
                        if (result.hasOwnProperty(k)) {
                            if (k === WeatherProps.iconId) {
                                result['iconFake'] = 1;
                            } else if (k === WeatherProps.precipAccumulation) {
                                result[k] = convertWeatherValueToUnit(d, k, { round: false })[0] * 10;
                            } else if (k === WeatherProps.temperature) {
                                result[k] = convertWeatherValueToUnit(d, k, { round: false })[0];
                                tempMin = Math.min(tempMin, result[k]);
                                tempMax = Math.max(tempMin, result[k]);
                            } else {
                                result[k] = convertWeatherValueToUnit(d, k, { round: false })[0];
                            }
                        }
                    });
                    return result;
                });
                maxDatalength = data.length;
                if (dataToShow.indexOf(WeatherProps.temperature) !== -1) {
                    temperatureData = { min: tempMin, max: tempMax };
                }
                xAxis.axisMaximum = data[data.length - 1].deltaHours + 1.5;
                // const lastTimestamp = data[data.length - 1].time;
                // weatherData.daily.data.forEach((d) => {
                //     const index = data.findIndex((h) => h.time === d.time);
                //     if (index >= 0) {
                //         const result = data[index];
                //         Object.keys(d).forEach((k) => {
                //             if (dataToShow.indexOf(k) !== -1) {
                //                 if (k === WeatherProps.iconId) {
                //                     result['iconFake'] = 1;
                //                 } else if (k === WeatherProps.precipAccumulation) {
                //                     result[k] = convertWeatherValueToUnit(d, k, { round: false })[0] * 10;
                //                 } else {
                //                     result[k] = convertWeatherValueToUnit(d, k, { round: false })[0];
                //                 }
                //             }
                //         });
                //     } else if (d.time > lastTimestamp) {
                //         const time = dayjs.utc(d.time).startOf('d').valueOf();
                //         const result = { ...d, time, timedeltaHours: (time - startTimestamp) / (3600 * 1000) };
                //         dataToShow.forEach((k) => {
                //             if (result.hasOwnProperty(k)) {
                //                 if (k === WeatherProps.iconId) {
                //                     result['iconFake'] = 1;
                //                 } else if (k === WeatherProps.precipAccumulation) {
                //                     result[k] = convertWeatherValueToUnit(d, k, { round: false })[0] * 10;
                //                 } else {
                //                     result[k] = convertWeatherValueToUnit(d, k, { round: false })[0];
                //                 }
                //             }
                //         });
                //         data.push(result);
                //     }
                //     DEV_LOG && console.log('daily', d.time, index, lastTimestamp);
                // });
                if (!screenOrientation && Application.orientation() !== 'landscape') {
                    chart.setScale(10 / (screenWidthDips / maxDatalength), 1);
                }
                dataToShow.forEach((key) => {
                    const chartType = CHART_TYPE[key];
                    // if (data[0][key] === undefined) {
                    //     return;
                    // }
                    const enabled = hidden.indexOf(key) === -1;
                    const color = getWeatherDataColor(key);
                    const hasCustomColor = !!color;
                    const setColor = color || colorOnSurface;
                    newLegends.push({
                        name: getWeatherDataTitle(key),
                        shortName: getWeatherDataTitle(key),
                        id: key,
                        enabled,
                        color
                    });
                    switch (chartType) {
                        case 'scatterchart': {
                            const set = new ScatterDataSet(data, key, 'deltaHours', key);
                            // set['modelId'] = wData.model.id;
                            set.scatterShape = ScatterShape.CIRCLE;
                            set.visible = enabled;
                            // set.drawIconsEnabled=(enabled);
                            set.scatterShapeSize = 4;
                            // set.scatterShapeSize=(enabled ? 4 : 0);
                            set.color = setColor;
                            set['hasValueTextColor'] = hasCustomColor;
                            // set.fillColor=(color);
                            scatterDataSets.push(set);
                            break;
                        }
                        case 'barchart': {
                            const set = new BarDataSet(data, key, 'deltaHours', key);
                            set.visible = enabled;
                            set.color = setColor;
                            set['hasValueTextColor'] = hasCustomColor;
                            // set.axisDependency = AxisDependency.RIGHT
                            // set.fillColor=(color);
                            barDataSets.push(set);
                            break;
                        }
                        case 'linechart':
                        default: {
                            const set = new LineDataSet(data, key, 'deltaHours', key === WeatherProps.iconId ? 'iconFake' : key);
                            set.color = setColor;
                            set['hasValueTextColor'] = hasCustomColor;
                            switch (key) {
                                case WeatherProps.windSpeed:
                                    // set.drawValuesEnabled = true;
                                    // set.valueTextColor = color;
                                    // set.valueTextSize = 10;
                                    // set.valueFormatter = {
                                    //     getFormattedValue(value: number, entry?: CommonWeatherData) {
                                    //         return convertWeatherValueToUnit(entry, WeatherProps.windSpeed).join('');
                                    //     }
                                    // } as any;
                                    set.getEntryIcon = function (entry) {
                                        return windIcon(entry.windBearing);
                                    };
                                    set.drawIconsEnabled = true;
                                    break;
                                case WeatherProps.temperature:
                                    if (lastGradient) {
                                        set.shader = lastGradient.gradient;
                                    }
                                    set.mode = Mode.CUBIC_BEZIER;
                                    // set.cubicIntensity = 0.4;
                                    set.drawValuesEnabled = true;
                                    set.valueTextColor = colorOnSurface;
                                    set.valueTextSize = 10;
                                    set.valueFormatter = {
                                        getFormattedValue(value: number, entry?: CommonWeatherData) {
                                            return Math.round(value) + toImperialUnit(UNITS.Celcius);
                                        }
                                    } as any;
                                    break;

                                case WeatherProps.iconId:
                                    set.lineWidth = 0;
                                    set.axisDependency = AxisDependency.RIGHT;
                                    set.getEntryIcon = function (entry) {
                                        return getIcon(entry.iconId, entry.isDay);
                                    };
                                    set.drawIconsEnabled = true;
                                    break;

                                default:
                                    set.drawCirclesEnabled = enabled;
                                    set.circleRadius = LINE_WIDTH;
                                    set.lineWidth = LINE_WIDTH;
                                    break;
                            }
                            // set.drawValuesEnabled=(true);
                            // set.fillColor=(color);
                            lineDataSets.push(set);
                            break;
                        }
                    }
                });
                legends.splice(0, legends.length, ...newLegends);
                // DEV_LOG && console.log('legends', JSON.stringify(legends));
                if (lineDataSets.length) {
                    combinedChartData.data = new LineData(lineDataSets);
                } else {
                    combinedChartData.lineData = null;
                }
                if (scatterDataSets.length) {
                    combinedChartData.data = new ScatterData(scatterDataSets);
                } else {
                    combinedChartData.scatterData = null;
                }
                if (barDataSets.length) {
                    const barData = new BarData(barDataSets);
                    barData.barWidth = 0.8;
                    barData.fixedBarScale = true;
                    combinedChartData.data = barData;
                } else {
                    combinedChartData.barData = null;
                }
                chart.data = combinedChartData;
            }
        } catch (error) {
            showError(error);
        }
    }
    $: if (chartView) {
        updateLineChart();
    }

    onThemeChanged(() => {
        const chart = chartView?.nativeView;
        if (chart) {
            const newColor = $colors.colorOnSurface;
            // DEV_LOG && console.log('onThemeChanged', !!chart, colorOnSurface, newColor);
            const leftAxis = chart.leftAxis;
            const rightAxis = chart.rightAxis;
            const xAxis = chart.xAxis;
            leftAxis.textColor = rightAxis.textColor = xAxis.textColor = newColor;

            xAxis.gridColor = leftAxis.gridColor = rightAxis.gridColor = colorOnSurfaceVariant + '33';
            leftAxis.limitLines.forEach((l) => (l.lineColor = newColor));
            const dataSets = chart.data.dataSets;
            dataSets.forEach((d) => {
                if (d.drawValuesEnabled) {
                    d.valueTextColor = newColor;
                }
            });
            // chart.getLegend().textColor = (newColor);
            chart.invalidate();
        }
    });
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
        legendIconPaint.color = color || colorOnSurface;
        legendPaint.color = color || colorOnSurface;
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
            const hiddenIndex = hidden.indexOf(legendItem.id);
            if (hiddenIndex >= 0 && legendItem.enabled) {
                hidden.splice(hiddenIndex, 1);
            } else if (hiddenIndex === -1 && !legendItem.enabled) {
                hidden.push(legendItem.id);
            }
            if (index >= 0) {
                const chart = chartView?.nativeView;
                if (chart) {
                    const enabled = legendItem.enabled;
                    const set = chart.data.getDataSetByLabel(legendItem.id, false);
                    set.visible = enabled;
                    // switch (legendItem.chartType) {
                    //     case 'scatterchart':
                    //         (set as ScatterDataSet).scatterShapeSize=(enabled ? 4 : 0);
                    //         break;
                    //     default:
                    //         (set as LineDataSet).drawCircles=(enabled);
                    //         (set as LineDataSet).lineWidth = (enabled ? LINE_WIDTH : 0);
                    //         break;
                    // }
                    chart.invalidate();
                }
                legends.setItem(index, legendItem);
            }
        } catch (error) {
            showError(error);
        }
    }
    let lastGradient: { min; max; gradient: LinearGradient };
    function onLayoutChanged(event: EventData) {
        const chart = event.object as CombinedChart;
        DEV_LOG && console.log('onLayoutChanged', chart.getMeasuredHeight(), (event.object as CombinedChart).viewPortHandler.contentRect.height(), temperatureData);
        if (temperatureData && (!lastGradient || lastGradient.min !== temperatureData.min || lastGradient.max !== temperatureData.max)) {
            lastGradient = generateGradient(5, temperatureData.min, temperatureData.max, chart.viewPortHandler.contentRect.height(), 0);
            const dataSet = chart.lineData.getDataSetByLabel(WeatherProps.temperature, false);
            if (dataSet) {
                dataSet.shader = lastGradient.gradient;
            }
        }
        //use a timeout to ensure we are called after chart layout changed was called
        setTimeout(() => {
            if (chartNeedsZoomUpdate) {
                chartNeedsZoomUpdate = false;
                if (screenOrientation || Application.orientation() === 'landscape') {
                    chart.resetZoom();
                } else {
                    chart.setScale(10 / (screenWidthDips / maxDatalength), 1);
                }
                chart.highlight(null);
                chart.invalidate();
            }
        }, 2);
    }
</script>

<page bind:this={page} id="comparesingle" actionBarHidden={true} {screenOrientation} on:navigatedTo={onNavigatedTo}>
    <gridlayout rows="auto,*" prop:mainContent>
        {#if !networkConnected && !weatherData}
            <label horizontalAlignment="center" row={1} text={l('no_network').toUpperCase()} verticalAlignment="middle" />
        {:else}
            <drawer
                bind:this={drawer}
                bottomDrawerMode="over"
                bottomSwipeDistance={200}
                closeAnimationDuration={100}
                gestureEnabled={false}
                openAnimationDuration={100}
                row={1}
                translationFunction={swipeMenuTranslationFunction}
                {...$$restProps}>
                <gridlayout prop:mainContent rows="auto,*">
                    <!-- <label class="sectionHeader" paddingTop={10} text={`${item.id} ${getUnit(item.id) || ''} (${lc(item.forecast)})`} /> -->

                    <combinedchart bind:this={chartView} height={chartHeight} row={1} verticalAlignment={chartHeight ? 'center' : 'stretch'} on:layoutChanged={onLayoutChanged} />
                </gridlayout>
                <gridlayout prop:bottomDrawer backgroundColor={new Color(colorBackground).setAlpha(200)} columns="*" height={40} rows="*">
                    <collectionview colWidth={150} height="40" items={legends} orientation="horizontal">
                        <Template let:item>
                            <canvasview rippleColor={item.color || colorOnSurface} on:draw={(event) => onDrawLegend(item, event)} on:tap={(event) => toggleLegend(item, event)} />
                        </Template>
                    </collectionview>
                </gridlayout>
            </drawer>
        {/if}
        <CActionBar showMenuIcon titleProps={{ visibility: 'visible' }}>
            <span slot="subtitle" text={weatherLocation && weatherLocation.name} />
            <span slot="subtitle2" color={colorOutline} fontSize={12} text={'\n' + lc(forecast)} />
            <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapse'} width={$actionBarButtonHeight} />
            <mdbutton class="actionBarButton" text="mdi-format-list-bulleted-square" variant="text" on:tap={() => drawer.toggle()} />
        </CActionBar>
    </gridlayout>
</page>
