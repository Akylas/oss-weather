<script context="module" lang="ts">
    import { ApplicationSettings, Page } from '@nativescript/core';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import HourlyView from './HourlyView.svelte';
    import { colors, fontScale, fonts, weatherDataLayout } from '~/variables';
    import { iconService, onIconAnimationsChanged } from '~/services/icon';
    import WeatherIcon from './WeatherIcon.svelte';
    import { Align, Canvas, Cap, LayoutAlignment, Paint, StaticLayout, Style } from '@nativescript-community/ui-canvas';
    import AstronomyView from '~/components/astronomy/AstronomyView.svelte';
    import { weatherDataService } from '~/services/weatherData';
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { POLLENS_POLLUTANTS_TITLES, formatWeatherValue } from '~/helpers/formatter';
    import { formatDate, formatTime, getLocalTime, lc } from '~/helpers/locale';
    import { WeatherLocation } from '~/services/api';
    import CActionBar from './common/CActionBar.svelte';
    import HourlyChartView from './HourlyChartView.svelte';
    import { DAILY_PAGE_HOURLY_CHART, SETTINGS_DAILY_PAGE_HOURLY_CHART } from '~/helpers/constants';
    import { CombinedChart } from '@nativescript-community/ui-chart';
    import { CommonWeatherData, Hourly } from '~/services/providers/weather';
    const weatherIconSize = 100;

    const textIconPaint = new Paint();
    textIconPaint.setTextAlign(Align.CENTER);
    const textPaint = new Paint();
    const pollensPollutantsIndicatorPaint = new Paint();
    const pollensPollutantsTitlePaint = new Paint();

    pollensPollutantsTitlePaint.fontWeight = 'bold';
    const pollensPollutantsSubtitlePaint = new Paint();
    // const arcPaint = new Paint();
    // arcPaint.style = Style.STROKE;
    // arcPaint.setTextAlign(Align.CENTER);
    // arcPaint.strokeCap = Cap.ROUND;
    const topViewHeight = 150;
</script>

<script lang="ts">
    const showHourlyChart = ApplicationSettings.getBoolean(SETTINGS_DAILY_PAGE_HOURLY_CHART, DAILY_PAGE_HOURLY_CHART);

    export let item: CommonWeatherData & { hourly: Hourly[] };
    export let location: WeatherLocation;
    export let weatherLocation: WeatherLocation;
    export let timezoneOffset;
    export let startTime = getLocalTime(undefined, timezoneOffset);
    let page: NativeViewElementNode<Page>;
    let animated = iconService.animated;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline } = $colors);

    onIconAnimationsChanged((event) => {
        animated = event.animated;
    });

    let canvasView;
    function redraw() {
        canvasView?.nativeView.invalidate();
    }
    fontScale.subscribe(redraw);
    function drawOnCanvas({ canvas }: { canvas: Canvas }) {
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const centeredItemsToDraw = weatherDataService.getIconsData(item, ['windBeaufort']);
        const w2 = w / 2;
        const iconsTop = (topViewHeight * $fontScale) / 2 - 5 * $fontScale;
        // canvas.translate(26, 0);
        switch ($weatherDataLayout) {
            case 'line': {
                textPaint.setTextAlign(Align.LEFT);
                textIconPaint.setTextAlign(Align.CENTER);
                const lineHeight = 20 * $fontScale;
                const lineWidth = 100 * $fontScale;
                const nbLines = Math.ceil(centeredItemsToDraw.length / 2);
                canvas.drawLine(w2, iconsTop, w2, iconsTop + lineHeight * nbLines, textIconPaint);
                for (let index = 0; index < nbLines - 1; index++) {
                    const y = iconsTop + lineHeight * (index + 1);
                    canvas.drawLine(w2 - lineWidth, y, w2 + lineWidth, y, textIconPaint);
                }
                const iconDelta = 20 * $fontScale;
                for (let index = 0; index < centeredItemsToDraw.length; index++) {
                    const columnIndex = index % 2;
                    const lineIndex = Math.floor(index / 2);
                    const y = iconsTop + lineHeight * lineIndex;
                    const c = centeredItemsToDraw[index];
                    const paint = c.paint || textIconPaint;
                    if (c.icon) {
                        // paint.setColor(c.color || colorOnSurface);
                        // canvas.drawText(c.icon, columnIndex === 0 ? w2 - 20 : w2 + 20, y + lineHeight + lineHeight / 2 - paint.textSize / 2, paint);
                        const dataNString = createNativeAttributedString(
                            {
                                spans: [
                                    {
                                        fontSize: c.iconFontSize,
                                        color: c.color || colorOnSurface,
                                        fontFamily: paint.fontFamily,
                                        text: c.icon
                                    }
                                ]
                            },
                            null
                        );
                        canvas.save();
                        const staticLayout = new StaticLayout(dataNString, textPaint, iconDelta, LayoutAlignment.ALIGN_CENTER, 1, 0, true);
                        // canvas.translate(columnIndex === 0 ? w2 - lineWidth : w2 + lineWidth  - staticLayout.getWidth(), y + lineHeight / 2 - staticLayout.getHeight() / 2);
                        canvas.translate(columnIndex === 0 ? w2 - lineWidth : w2 + 2, y + lineHeight / 2 - staticLayout.getHeight() / 2);
                        staticLayout.draw(canvas);
                        canvas.restore();
                    }
                    const dataNString = createNativeAttributedString(
                        {
                            spans: [
                                c.value
                                    ? {
                                          fontSize: 12 * $fontScale,
                                          color: c.color || colorOnSurface,
                                          text: c.value + ' '
                                      }
                                    : undefined,
                                c.subvalue
                                    ? {
                                          fontSize: 9 * $fontScale,
                                          color: c.color || colorOnSurface,
                                          text: c.subvalue + ' '
                                      }
                                    : undefined
                            ].filter((s) => !!s)
                        },
                        null
                    );
                    canvas.save();
                    const staticLayout = new StaticLayout(dataNString, textPaint, lineWidth, LayoutAlignment.ALIGN_NORMAL, 1, 0, true);
                    canvas.translate(iconDelta + (columnIndex === 0 ? w2 - lineWidth + 5 : w2 + 5), y + lineHeight / 2 - staticLayout.getHeight() / 2);
                    // const staticLayout = new StaticLayout(dataNString, textPaint, lineWidth, columnIndex === 0 ? LayoutAlignment.ALIGN_OPPOSITE : LayoutAlignment.ALIGN_NORMAL, 1, 0, true);
                    // canvas.translate(columnIndex === 0 ? w2 - lineWidth - 5 : w2 + 5, y + lineHeight / 2 - staticLayout.getHeight() / 2);
                    staticLayout.draw(canvas);
                    canvas.restore();
                }
                break;
            }
            default:
            case 'default': {
                const iconsLeft = 26;
                centeredItemsToDraw.forEach((c, index) => {
                    const x = index * 45 * $fontScale + iconsLeft;
                    const paint = c.paint || textIconPaint;
                    paint.textSize = c.iconFontSize;
                    paint.setColor(c.color || colorOnSurface);
                    if (c.customDraw) {
                        c.customDraw(canvas, $fontScale, textIconPaint, c, x, iconsTop + 20, 40);
                    } else {
                        if (c.icon) {
                            canvas.drawText(c.icon, x, iconsTop + 20, paint);
                        }
                        if (c.value) {
                            textIconPaint.textSize = 12 * $fontScale;
                            textIconPaint.setColor(c.color || colorOnSurface);
                            canvas.drawText(c.value + '', x, iconsTop + 20 + 19 * $fontScale, textIconPaint);
                        }
                        if (c.subvalue) {
                            textIconPaint.textSize = 9 * $fontScale;
                            textIconPaint.setColor(c.color || colorOnSurface);
                            canvas.drawText(c.subvalue + '', x, iconsTop + 20 + 30 * $fontScale, textIconPaint);
                        }
                    }
                });
                break;
            }
        }

        textPaint.setColor(colorOnSurface);
        textPaint.setTextAlign(Align.LEFT);
        // if (item.temperature) {
        //     textPaint.textSize = 36 * $fontScale;
        //     canvas.drawText(formatWeatherValue(item, 'temperature'), 10, 36 * $fontScale, textPaint);
        // }
        const nString = createNativeAttributedString({
            spans: [
                {
                    fontSize: 17 * $fontScale,
                    color: colorOnSurfaceVariant,
                    text: formatWeatherValue(item, 'temperatureMin')
                },
                {
                    fontSize: 20 * $fontScale,
                    color: colorOnSurface,
                    text: ' ' + formatWeatherValue(item, 'temperatureMax')
                }
            ]
        });
        canvas.save();
        const staticLayout = new StaticLayout(nString, textPaint, w - 10, LayoutAlignment.ALIGN_NORMAL, 1, 0, false);
        canvas.translate(10, 11 * $fontScale);
        staticLayout.draw(canvas);
        canvas.restore();

        // canvas.save();
        // canvas.translate(10, h - 8 - 14 * $fontScale);
        // textPaint.textSize = 14 * $fontScale;
        // staticLayout = new StaticLayout(
        //     createNativeAttributedString({
        //         spans: [
        //             {
        //                 color: '#ffa500',
        //                 fontFamily: $fonts.wi,
        //                 text: 'wi-sunrise '
        //             },
        //             {
        //                 text: formatTime(item.sunriseTime, undefined, item.timezoneOffset)
        //             },
        //             {
        //                 color: '#ff7200',
        //                 fontFamily: $fonts.wi,
        //                 text: '  wi-sunset '
        //             },
        //             {
        //                 text: formatTime(item.sunsetTime, undefined, item.timezoneOffset)
        //             }
        //         ]
        //     }),
        //     textPaint,
        //     w - 10,
        //     LayoutAlignment.ALIGN_NORMAL,
        //     1,
        //     0,
        //     false
        // );
        // staticLayout.draw(canvas);
        // canvas.restore();

        textPaint.setTextAlign(Align.RIGHT);
        textPaint.textSize = 20 * $fontScale;
        canvas.drawText(formatDate(item.time, 'dddd, LL'), w - 10, 30 * $fontScale, textPaint);
        textPaint.textSize = 14 * $fontScale;
        // canvas.drawText(`${lc('last_updated')}: ${formatLastUpdate(item.lastUpdate)}`, w - 10, h - 8, textPaint);

        textPaint.setColor(colorOutline);
        canvas.drawLine(0, h, w, h - 1, textPaint);
    }

    function onChartConfigure(chart: CombinedChart): void {
        chart.leftAxis.drawAxisLine = false;
        chart.leftAxis.drawGridLines = false;
        chart.leftAxis.drawLabels = false;
        chart.rightAxis.drawAxisLine = false;
        chart.rightAxis.drawGridLines = false;
        chart.rightAxis.drawLabels = false;
        chart.setExtraOffsets(0, 40, 0, 10);
    }

    function drawPollOnCanvas(polls, title: string, canvas: Canvas) {
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        let row, col, dx, dy, data;
        pollensPollutantsTitlePaint.textSize = 17 * $fontScale;
        pollensPollutantsTitlePaint.color = colorOnSurface;
        canvas.drawText(title, 20, 30 * $fontScale, pollensPollutantsTitlePaint);

        pollensPollutantsTitlePaint.textSize = 14 * $fontScale;
        pollensPollutantsSubtitlePaint.textSize = 12 * $fontScale;
        pollensPollutantsSubtitlePaint.color = colorOutline;
        Object.keys(polls).forEach((k, index) => {
            col = index % 2;
            row = Math.floor(index / 2);
            dx = (col * w) / 2 + 25;
            dy = row * 40 + 55;
            data = polls[k];
            pollensPollutantsIndicatorPaint.color = data.color;
            canvas.drawCircle(dx + 2, dy + 13, 4, pollensPollutantsIndicatorPaint);
            canvas.drawText(POLLENS_POLLUTANTS_TITLES[k], dx + 20, dy + 11, pollensPollutantsTitlePaint);
            canvas.drawText(data.value + ' ' + data.unit, dx + 20, dy + 26, pollensPollutantsSubtitlePaint);
        });
        canvas.drawLine(0, h - 1, w, h - 1, pollensPollutantsSubtitlePaint);
    }
    function drawPollutants({ canvas }: { canvas: Canvas }) {
        drawPollOnCanvas(item.pollutants, lc('pollutants'), canvas);
    }
    function drawPollens({ canvas }: { canvas: Canvas }) {
        drawPollOnCanvas(item.pollens, lc('pollens'), canvas);
    }
</script>

<page bind:this={page} actionBarHidden={true}>
    <scrollview>
        <gridlayout rows="auto,auto,auto,auto,auto,auto">
            <gridlayout columns="*,auto" height={topViewHeight} row={1}>
                <canvasview bind:this={canvasView} id="topweather" colSpan={2} paddingBottom={10} paddingLeft={10} paddingRight={10} on:draw={drawOnCanvas}> </canvasview>
                <WeatherIcon
                    {animated}
                    col={1}
                    horizontalAlignment="right"
                    iconData={[item.iconId, item.isDay]}
                    marginBottom={12}
                    size={weatherIconSize * (2 - $fontScale)}
                    verticalAlignment="bottom" />
            </gridlayout>
            ${#if item.hourly && item.hourly.length}
                {#if showHourlyChart}
                    <HourlyChartView
                        barWidth={1}
                        borderBottomColor={colorOutline}
                        borderBottomWidth={1}
                        fixedBarScale={false}
                        height={200}
                        hourly={item.hourly}
                        {onChartConfigure}
                        rightAxisSuggestedMaximum={8}
                        row={2}
                        showCurrentTimeLimitLine={false}
                        temperatureLineWidth={3}
                        visibility={item.hourly.length > 0 ? 'visible' : 'collapsed'} />
                {:else}
                    <HourlyView height={250} items={item.hourly} row={2} />
                {/if}
            {/if}

            {#if item.pollutants}
                <canvasview height={Math.ceil(Object.keys(item.pollutants).length / 2 + 1) * 40 * $fontScale} row={3} on:draw={drawPollutants} />
            {/if}
            {#if item.pollens}
                <canvasview height={Math.ceil(Object.keys(item.pollens).length / 2 + 1) * 40 * $fontScale} row={4} on:draw={drawPollens} />
            {/if}
            <AstronomyView {location} row={5} selectableDate={false} {startTime} {timezoneOffset} />

            <CActionBar title={weatherLocation && weatherLocation.name}></CActionBar>
        </gridlayout>
    </scrollview>
</page>
