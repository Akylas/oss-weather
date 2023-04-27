<script context="module" lang="ts">
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { Align, Canvas, LayoutAlignment, Paint, StaticLayout } from '@nativescript-community/ui-canvas';
    import { ApplicationSettings, Color } from '@nativescript/core';
    import { createEventDispatcher } from 'svelte';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import { convertValueToUnit, formatValueToUnit, toImperialUnit, UNITS } from '~/helpers/formatter';
    import { formatDate } from '~/helpers/locale';
    import { appFontFamily, borderColor, imperial, mdiFontFamily, nightColor, rainColor, snowColor, textColor, textLightColor, wiFontFamily, fontScale } from '~/variables';

    let textPaint: Paint;
    let textIconPaint: Paint;
    let textIconSubPaint: Paint;
    let paint: Paint;
    let wiPaint: Paint;
    let mdiPaint: Paint;
    let appPaint: Paint;
</script>

<script lang="ts">
    export let item: any;
    let canvasView;
    let color: string | Color;
    let precipIcon: string;
    const dispatch = createEventDispatcher();

    if (!textPaint) {
        textPaint = new Paint();
        textIconPaint = new Paint();
        textIconPaint.setTextAlign(Align.CENTER);
        textIconSubPaint = new Paint();
        textIconSubPaint.setTextAlign(Align.CENTER);
        paint = new Paint();
        wiPaint = new Paint();
        wiPaint.setFontFamily(wiFontFamily);
        wiPaint.setTextAlign(Align.CENTER);
        appPaint = new Paint();
        appPaint.setFontFamily(appFontFamily);
        appPaint.setTextAlign(Align.CENTER);
        mdiPaint = new Paint();
        mdiPaint.setFontFamily(mdiFontFamily);
        mdiPaint.setTextAlign(Align.CENTER);
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

    function redraw() {
        canvasView && canvasView.nativeView.invalidate();
    }
    textColor.subscribe(redraw);
    fontScale.subscribe(redraw);

    $: {
        if (item) {
            redraw();
        }
    }

    function drawOnCanvas({ canvas }: { canvas: Canvas }) {
        const w = canvas.getWidth();
        const w2 = w / 2;
        const h = canvas.getHeight();
        paint.setColor(item.color);
        canvas.drawRect(w - 5, 0, w, h, paint);
        paint.setColor($borderColor);
        canvas.drawLine(0, h, w, h - 1, paint);

        // textPaint.setTextAlign(Align.LEFT);
        textPaint.setTextSize(22 * $fontScale);
        textPaint.setColor($textColor);
        canvas.drawText(formatDate(item.time, 'ddd'), 10, 26 * $fontScale, textPaint);
        textPaint.setColor($textLightColor);
        textPaint.setTextSize(15 * $fontScale);
        canvas.drawText(formatDate(item.time, 'DD/MM'), 10, 46 * $fontScale, textPaint);
        textPaint.setColor($textColor);

        let centeredItemsToDraw: {
            color?: string | Color;
            paint?: Paint;
            iconFontSize: number;
            icon: string;
            value: string | number;
            subvalue?: string;
        }[] = [];
        const iconFontSize = 20 * $fontScale;
        if (item.windSpeed) {
            centeredItemsToDraw.push({
                iconFontSize,
                paint: appPaint,
                icon: item.windIcon,
                value: convertValueToUnit(item.windSpeed, UNITS.Speed, $imperial)[0],
                subvalue: toImperialUnit(UNITS.Speed, $imperial)
            });
        }
        if ((item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: color,
                iconFontSize,
                icon: precipIcon,
                value: formatValueToUnit(item.precipAccumulation, UNITS.MM, $imperial),
                subvalue: item.precipProbability > 0 && Math.round(item.precipProbability * 100) + '%'
            });
        }
         if (item.cloudCover > 20) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: item.cloudColor,
                iconFontSize,
                icon: 'wi-cloud',
                value: Math.round(item.cloudCover) + '%',
                subvalue: item.cloudCeiling && formatValueToUnit(item.cloudCeiling, UNITS.Distance, $imperial)
            });
        }
        if (item.uvIndex > 0) {
            centeredItemsToDraw.push({
                paint: mdiPaint,
                color: item.uvIndexColor,
                iconFontSize: 24  * $fontScale,
                icon: 'mdi-weather-sunny-alert',
                value: Math.round(item.uvIndex)
            });
        }
        // centeredItemsToDraw.push({
        //     paint: wiPaint,
        //     color: nightColor,
        //     iconFontSize: 20,
        //     icon: item.moonIcon,
        //     value: l('moon')
        // });
        const count = centeredItemsToDraw.length;

        const iconsTop = 10 * $fontScale
        centeredItemsToDraw.forEach((c, index) => {
            let x = w / 2 - ((count - 1) / 2 - index) * 45 * $fontScale;
            const paint = c.paint || textIconPaint;
            paint.setTextSize(c.iconFontSize);
            paint.setColor(c.color || $textColor);
            if (c.icon) {
                canvas.drawText(c.icon, x, iconsTop + 20, paint);
            }
            if (c.value) {
                textIconSubPaint.setTextSize(12 * $fontScale);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.value + '', x, iconsTop + 20 + 19 * $fontScale, textIconSubPaint);
            }
            if (c.subvalue) {
                textIconSubPaint.setTextSize(9 * $fontScale);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.subvalue + '', x, iconsTop + 20 + 30 * $fontScale, textIconSubPaint);
            }
        });
        const nString = createNativeAttributedString(
            {
                spans: [
                    {
                        fontSize: 17 * $fontScale,
                        color: $textLightColor,
                        text: formatValueToUnit(item.temperatureMin, UNITS.Celcius, $imperial)
                    },
                    {
                        fontSize: 20 * $fontScale,
                        color: $textColor,
                        text: ' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius, $imperial)
                    }
                ]
            },
            null
        );
        canvas.save();
        // textPaint.setTextSize(20);
        // textPaint.setTextAlign(Align.LEFT);
        let staticLayout = new StaticLayout(nString, textPaint, w - 10, LayoutAlignment.ALIGN_OPPOSITE, 1, 0, true);
        // console.log('getDesiredWidth', StaticLayout.getDesiredWidth);
        // const width = StaticLayout.getDesiredWidth(nString, textPaint);
        canvas.translate(0, 5);
        staticLayout.draw(canvas);
        canvas.restore();

        if (item.windBeaufortIcon) {
            wiPaint.setColor($textColor);
            wiPaint.setTextSize(20);
            canvas.drawText(item.windBeaufortIcon, 50, h - 28 * $fontScale, wiPaint);
        }

        textPaint.setTextSize(13 * $fontScale);
        textPaint.setColor($textLightColor);
        canvas.drawText(item.description, 10, h - 10, textPaint);

        wiPaint.setColor(nightColor);
        wiPaint.setTextSize(20 * $fontScale);
        canvas.drawText(item.moonIcon, 18, h - 28 * $fontScale, wiPaint);
        // textPaint.setTextAlign(Align.RIGHT);
    }
</script>

<gridLayout height={100 * $fontScale}>
    <canvas bind:this={canvasView} on:draw={drawOnCanvas} />
    <WeatherIcon marginRight="10" marginTop={16 * ($fontScale)} horizontalAlignment="right" size={60 * ($fontScale)} icon={item.icon} on:tap={(event) => dispatch('tap', event)} />
</gridLayout>
