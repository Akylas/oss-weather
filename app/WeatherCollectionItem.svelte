<script context="module" lang="ts">
    import { Align, Paint } from '@nativescript-community/ui-canvas';
    import { Screen } from '@nativescript/core/platform';
    import dayjs from 'dayjs';
    import { convertTime, formatValueToUnit, UNITS } from '~/helpers/formatter';
    import { getCanvas } from '~/helpers/sveltehelpers';
    import { latoFontFamily, textColor } from '~/variables';
    import WeatherIcon from './WeatherIcon.svelte';

    const deviceHeight = Math.round(Screen.mainScreen.heightDIPs);
    const textPaint = new Paint();
    textPaint.setFontFamily(latoFontFamily);
    textPaint.setAntiAlias(true);
    textPaint.setTextAlign(Align.CENTER);
    const paint = new Paint();
    paint.setAntiAlias(true);
    paint.setTextAlign(Align.CENTER);
</script>

<script lang="ts">
    export let item;
    let tempHeight = 0;
    let canvasView;
    let precipitationHeight = 0;

    function redraw() {
        canvasView && canvasView.nativeView.invalidate();
    }
    $: {
        tempHeight = (((item.temperature - item.min) / (item.max - item.min)) * deviceHeight) / 20;
        precipitationHeight = item.precipIntensity * 10;
        redraw();
    }
    textColor.subscribe(redraw);
    function drawOnCanvas(event) {
        const endDay = dayjs().endOf('d').valueOf();
        const canvas = getCanvas(event.canvas); // simple trick to get typings
        const w = canvas.getWidth();
        const w2 = w / 2;
        const h = canvas.getHeight();
        textPaint.setTextSize(14);
        textPaint.setColor($textColor);

        let color;
        const precipProbability = item.precipProbability;
        if ((precipProbability === -1 || precipProbability > 0) && precipitationHeight > 0) {
            const precipTop = (1 - precipitationHeight / 120) * h - 10;
            paint.setColor(item.precipColor);
            paint.setAlpha(precipProbability === -1 ? 125 : precipProbability * 255);
            canvas.drawRect(0, precipTop, w, h - 10, paint);
            if ((precipProbability === -1 || precipProbability > 0.1) && item.precipIntensity >= 0.1) {
                textPaint.setTextSize(10);
                textPaint.setColor($textColor);
                textPaint.setAlpha(150);
                if (precipProbability > 0) {
                    canvas.drawText(Math.round(precipProbability * 100) + '%', w2, h - 22, textPaint);
                }
                canvas.drawText(formatValueToUnit(item.precipIntensity, UNITS.MM), w2, h - 12, textPaint);
            }
        }

        if (item.cloudCeiling > 0) {
            const heightProb = 1 - item.cloudCeiling / 6000;
            const top = 0.3 * (h - 30) * heightProb + 13;
            paint.setColor(item.cloudColor);
            paint.setAlpha(item.cloudCover * heightProb * 150);
            canvas.drawRect(0, 0, w, top, paint);
            textPaint.setColor(color);
            textPaint.setTextSize(10);
            textPaint.setAlpha(item.cloudCover * heightProb * 255);
            canvas.drawText(formatValueToUnit(item.cloudCeiling, UNITS.Distance), w2, top + 10, textPaint);
        }
        paint.setAlpha(255);
        textPaint.setAlpha(255);
        paint.setColor(item.color);
        canvas.drawRect(0, h - 10, w, h, paint);

        textPaint.setColor($textColor);
        textPaint.setTextSize(14);
        canvas.drawText(` ${formatValueToUnit(item.temperature, UNITS.Celcius)}°`, w2, (1 - tempHeight / 100) * h - 70, textPaint);

        textPaint.setFontWeight('bold');
        let decale = 14;
        textPaint.setTextSize(14);
        canvas.drawText(convertTime(item.time, 'HH:mm'), w2, 16, textPaint);
        if (item.time > endDay) {
            textPaint.setTextSize(12);
            canvas.drawText(convertTime(item.time, 'ddd'), w2, 28, textPaint);
            decale += 10;
        }
        textPaint.setFontWeight('normal');
        textPaint.setTextSize(11);
        textPaint.setAlpha(180);
        canvas.drawText(`${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed)}`, w2, 16 + decale, textPaint);
        // console.log('drawn in ', Date.now() - startTime, item.index);
    }
</script>

<gridlayout height="100%" rows="40,*,30" backgroundColor={item.odd ? `rgba(120,120,120,0.05)` : undefined}>
    <canvas bind:this={canvasView} rowSpan="3" on:draw={drawOnCanvas} />
    <WeatherIcon row="1" icon={item.icon} verticalAlignment="bottom" marginBottom={tempHeight + '%'} />
</gridlayout>
