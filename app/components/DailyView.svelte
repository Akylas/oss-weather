<script context="module" lang="ts">
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { Align, Canvas, LayoutAlignment, Paint, StaticLayout } from '@nativescript-community/ui-canvas';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import { UNITS, formatValueToUnit } from '~/helpers/formatter';
    import { formatDate } from '~/helpers/locale';
    import { weatherDataService } from '~/services/weatherData';
    import { DailyData } from '~/services/providers/weather';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { colors, fontScale } from '~/variables';

    let textPaint: Paint;
    let textIconPaint: Paint;
    let textIconSubPaint: Paint;
    let paint: Paint;
</script>

<script lang="ts">
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline } = $colors);

    export let item: DailyData;
    let canvasView;
    const dispatch = createEventDispatcher();

    if (!textPaint) {
        textPaint = new Paint();
        textIconPaint = new Paint();
        textIconPaint.setTextAlign(Align.CENTER);
        textIconSubPaint = new Paint();
        textIconSubPaint.setTextAlign(Align.CENTER);
        paint = new Paint();
    }

    function redraw() {
        canvasView && canvasView.nativeView.invalidate();
    }

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
        paint.setColor(colorOutline);
        canvas.drawLine(0, h, w, h - 1, paint);

        // textPaint.setTextAlign(Align.LEFT);
        textPaint.setTextSize(22 * $fontScale);
        textPaint.setColor(colorOnSurface);
        canvas.drawText(formatDate(item.time, 'ddd'), 10, 26 * $fontScale, textPaint);
        textPaint.setColor(colorOnSurfaceVariant);
        textPaint.setTextSize(15 * $fontScale);
        canvas.drawText(formatDate(item.time, 'DD/MM'), 10, 46 * $fontScale, textPaint);
        textPaint.setColor(colorOnSurface);

        const centeredItemsToDraw = weatherDataService.getIconsData(item, ['moon', 'windBeaufort']);
        // centeredItemsToDraw.push({
        //     paint: wiPaint,
        //     color: nightColor,
        //     iconFontSize: 20,
        //     icon: item.moonIcon,
        //     value: l('moon')
        // });
        // const count = centeredItemsToDraw.length;
        const count = Math.max(4, centeredItemsToDraw.length);

        const iconsTop = 10 * $fontScale;
        centeredItemsToDraw.forEach((c, index) => {
            const x = w / 2 - ((count - 1) / 2 - index) * 45 * $fontScale;
            const paint = c.paint || textIconPaint;
            paint.setTextSize(c.iconFontSize);
            paint.setColor(c.color || colorOnSurface);
            if (c.icon) {
                canvas.drawText(c.icon, x, iconsTop + 20, paint);
            }
            if (c.value) {
                textIconSubPaint.setTextSize(12 * $fontScale);
                textIconSubPaint.setColor(c.color || colorOnSurface);
                canvas.drawText(c.value + '', x, iconsTop + 20 + 19 * $fontScale, textIconSubPaint);
            }
            if (c.subvalue) {
                textIconSubPaint.setTextSize(9 * $fontScale);
                textIconSubPaint.setColor(c.color || colorOnSurface);
                canvas.drawText(c.subvalue + '', x, iconsTop + 20 + 30 * $fontScale, textIconSubPaint);
            }
        });
        const nString = createNativeAttributedString(
            {
                spans: [
                    {
                        fontSize: 17 * $fontScale,
                        color: colorOnSurfaceVariant,
                        text: formatValueToUnit(item.temperatureMin, UNITS.Celcius)
                    },
                    {
                        fontSize: 20 * $fontScale,
                        color: colorOnSurface,
                        text: ' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius)
                    }
                ]
            },
            null
        );
        canvas.save();
        // textPaint.setTextSize(20);
        // textPaint.setTextAlign(Align.LEFT);
        const staticLayout = new StaticLayout(nString, textPaint, w - 10, LayoutAlignment.ALIGN_OPPOSITE, 1, 0, true);
        // console.log('getDesiredWidth', StaticLayout.getDesiredWidth);
        // const width = StaticLayout.getDesiredWidth(nString, textPaint);
        canvas.translate(0, 5);
        staticLayout.draw(canvas);
        canvas.restore();

        const windBeaufortData = weatherDataService.getItemData('windBeaufort', item);
        if (windBeaufortData) {
            windBeaufortData.paint.setColor(windBeaufortData.color || colorOnSurface);
            windBeaufortData.paint.setTextSize(windBeaufortData.iconFontSize);
            canvas.drawText(item.windBeaufortIcon, 50, h - 1.4 * windBeaufortData.iconFontSize, windBeaufortData.paint);
        }

        textPaint.setTextSize(13 * $fontScale);
        textPaint.setColor(colorOnSurfaceVariant);
        canvas.drawText(item.description, 10, h - 10, textPaint);

        const moonData = weatherDataService.getItemData('moon', item);
        if (moonData) {
            moonData.paint.setColor(moonData.color);
            moonData.paint.setTextSize(moonData.iconFontSize);
            canvas.drawText(moonData.icon, 18, h - 1.4 * moonData.iconFontSize, moonData.paint);
        }
    }
</script>

<canvasview bind:this={canvasView} height={100 * $fontScale} on:draw={drawOnCanvas}>
    <WeatherIcon horizontalAlignment="right" iconData={[item.iconId, item.isDay]} marginRight="10" marginTop={16 * $fontScale} size={60 * $fontScale} on:tap={(event) => dispatch('tap', event)} />
</canvasview>
