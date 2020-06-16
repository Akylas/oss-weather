<script context="module">
    import { Align, Paint } from 'nativescript-canvas';
    import { screen } from '@nativescript/core/platform';

    const deviceHeight = Math.round(screen.mainScreen.heightDIPs);
    console.log('deviceHeight', deviceHeight);
    const textPaint = new Paint();
    textPaint.setAntiAlias(true);
    textPaint.setTextAlign(Align.CENTER);
    const paint = new Paint();
    paint.setAntiAlias(true);
    paint.setTextAlign(Align.CENTER);
</script>

<script>
    import dayjs from 'dayjs';
    import WeatherIcon from './WeatherIcon.svelte';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { colorFromTempC, colorForIcon, UNITS } from '~/helpers/formatter';
    import { mdiFontFamily, wiFontFamily, textLightColor } from '~/variables';
    import { getCanvas } from '~/helpers/sveltehelpers';
    import { buildHTMLString } from 'nativescript-htmllabel';
    import Theme from '@nativescript/theme';
    import {
        Canvas,
        Cap,
        Path,
        LinearGradient,
        RadialGradient,
        Rect,
        RectF,
        Style,
        TileMode,
        createRect,
        createRectF,
        DashPathEffect,
        StaticLayout,
        LayoutAlignment,
        PorterDuffXfermode,
        PorterDuffMode,
    } from 'nativescript-canvas';
    import { Color } from '@nativescript/core/color/color';

    export let item;
    let tempHeight = 0;
    let canvasView;
    let precipitationHeight = 0;
    const darkTheme = /dark/.test(Theme.getMode());
    const strTextColor = darkTheme ? 'white' : 'black';
    const textColor = new Color(strTextColor);
    $: {
        tempHeight = (((item.temperature - item.min) / (item.max - item.min)) * deviceHeight) / 20;
        precipitationHeight = item.precipIntensity * 10;
        canvasView && canvasView.nativeView.invalidate();
    }
    function drawOnCanvas(event) {
        const endDay = dayjs().endOf('d').valueOf();
        const canvas = getCanvas(event.canvas); // simple trick to get typings
        const w = canvas.getWidth();
        const w2 = w / 2;
        const h = canvas.getHeight();
        textPaint.setTextSize(14);
        textPaint.setColor(textColor);

        let color;
        if (item.precipProbability > 0 && precipitationHeight > 0) {
            const precipTop = (1 - precipitationHeight / 120) * h - 10;
            let color = new Color(item.precipColor);
            paint.setColor(color);
            paint.setAlpha(item.precipProbability * 255);
            canvas.drawRect(0, precipTop, w, h - 10, paint);
            if (item.precipProbability > 0.1 && item.precipIntensity >= 0.1) {
                textPaint.setTextSize(10);
                textPaint.setColor(textColor);
                textPaint.setAlpha(150);
                canvas.drawText(Math.round(item.precipProbability * 100) + '%', w2, h - 22, textPaint);
                canvas.drawText(formatValueToUnit(item.precipIntensity, UNITS.MM), w2, h - 12, textPaint);
            }
        }

        if (item.cloudCeiling > 0) {
            const heightProb = 1 - item.cloudCeiling / 6000;
            const top = 0.3 * (h - 30) * heightProb + 13;
            let color = new Color(item.cloudColor);
            paint.setColor(color);
            paint.setAlpha(item.cloudCover * heightProb * 150);
            canvas.drawRect(0, 0, w, top, paint);
            textPaint.setColor(color);
            textPaint.setTextSize(10);
            textPaint.setAlpha(item.cloudCover * heightProb * 255);
            canvas.drawText(formatValueToUnit(item.cloudCeiling, UNITS.Distance), w2, top + 10, textPaint);
        }
        paint.setAlpha(255);
        textPaint.setAlpha(255);
        color = new Color(item.color);
        paint.setColor(color);
        canvas.drawRect(0, h - 10, w, h, paint);

        textPaint.setColor(textColor);
        textPaint.setTextSize(14);
        canvas.drawText(` ${formatValueToUnit(item.temperature, UNITS.Celcius)}°`, w2, (1 - tempHeight / 100) * h - 70 - 0, textPaint);

        textPaint.setFontWeight('bold');
        let decale = 14;
            textPaint.setTextSize(14);
            canvas.drawText(convertTime(item.time, 'HH:mm'), w2, 16, textPaint);
        if (item.time > endDay) {
            textPaint.setTextSize(12);
            canvas.drawText(convertTime(item.time, 'ddd'), w2, 26, textPaint);
            decale += 10;
        }
        textPaint.setFontWeight('normal');
        textPaint.setTextSize(11);
        textPaint.setAlpha(180);
        canvas.drawText(`${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed)}`, w2, 16 + decale, textPaint);
        // console.log('drawn in ', Date.now() - startTime, item.index);
    }
</script>

<gridlayout height="100%" rows="40,*,30" backgroundColor={`rgba(120,120,120,${item.odd ? 0.05 : 0})`}>
    <!-- FIRST TECHNIQUE USING FULL CANVAS-->
    <canvas bind:this={canvasView} rowSpan="3" backgroundColor="transparent" on:draw={drawOnCanvas} />
    <WeatherIcon row="1" icon={item.icon} verticalAlignment="bottom" marginBottom={tempHeight + '%'} />
    <!-- SECOND TECHNIQUE USING HTML LABELS-->
    <!-- <label textAlignment="center" fontSize="16" fontWeight="bold" html={`<b>${convertTime(item.time, 'HH:mm')}</b><br><span style="font-size:12px;">${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed, {unitScale:1})}</span>`} />
    <label
        row="1"
        verticalAlignment="bottom"
        opacity={item.precipProbability}
        backgroundColor={item.precipColor}
        height={precipitationHeight + '%'}
        color="white"
        text={item.precipProbability > 0.1 && item.precipIntensity >= 0.1 ? formatValueToUnit(item.precipIntensity, UNITS.MM) : ''}
        textAlignment="center"
        verticalTextAlignment="bottom"
        fontSize="10" />
    <stacklayout row="1" verticalAlignment="bottom" marginBottom={tempHeight + '%'}>
        <label fontSize="14" marginTop="10" textAlignment="center" text={`${formatValueToUnit(item.temperature, UNITS.Celcius)}°`} />
        <WeatherIcon icon={item.icon} marginBottom="10" />
    </stacklayout>
    <absolutelayout row="2" backgroundColor={item.color} />  -->

</gridlayout>
