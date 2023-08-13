<script context="module" lang="ts">
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { Align, LayoutAlignment, LinearGradient, Paint, Path, StaticLayout, Style, TileMode } from '@nativescript-community/ui-canvas';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { Color } from '@nativescript/core';
    import dayjs from 'dayjs';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import { formatValueToUnit, UNITS } from '~/helpers/formatter';
    import { formatDate, formatTime } from '~/helpers/locale';
    import { getCanvas } from '~/helpers/sveltehelpers';
    import { appFontFamily, fontScale, imperial, subtitleColor, textColor, wiFontFamily } from '~/variables';

    const textPaint = new Paint();
    textPaint.setTextAlign(Align.CENTER);
    const appTextPaint = new Paint();
    appTextPaint.fontFamily = appFontFamily;
    appTextPaint.setTextAlign(Align.CENTER);
    const iconPaint = new Paint();
    iconPaint.fontFamily = wiFontFamily;
    iconPaint.setTextAlign(Align.CENTER);
    // appTextPaint.setFontWeight('normal');
    // appTextPaint.setAlpha(80);
    const paint = new Paint();
    paint.setTextAlign(Align.CENTER);
    const pathPaint = new Paint();
    pathPaint.setColor('blue');
    pathPaint.setStrokeWidth(5);
    pathPaint.setStyle(Style.STROKE);
    const curvePath = new Path();

    const oddColor = new Color(0.05 * 255, 120, 120, 120);

    function tempColor(t, min, max) {
        // Map the temperature to a 0-1 range
        var a = (t - min) / (max - min);
        a = a < 0 ? 0 : a > 1 ? 1 : a;

        // Scrunch the green/cyan range in the middle
        var sign = a < 0.5 ? -1 : 1;
        a = (sign * Math.pow(2 * Math.abs(a - 0.5), 0.35)) / 2 + 0.5;

        // Linear interpolation between the cold and hot
        var h0 = 259;
        var h1 = 12;
        var h = h0 * (1 - a) + h1 * a;
        return new Color(255, h, 75, 90, 'hsv');
    }

    let lastGradient: { min; max; gradient: LinearGradient };

    function generateGradient(nbColor, min, max, h, posOffset) {
        // console.log('generateGradient', min, max)
        const tmin = -20;
        const tmax = 30;
        // const tmin = Math.min(min, -30);
        // const tmax = Math.max(max, 30);
        let colors = [];
        let positions = [];
        const posDelta = 1 / nbColor;
        const tempDelta = (max - min) / nbColor;
        for (let index = 0; index < nbColor; index++) {
            colors.push(tempColor(max - index * tempDelta, tmin, tmax));
            positions.push(posOffset + posDelta * index);
        }
        return {
            min: min,
            max: max,
            gradient: new LinearGradient(0, 0, 0, h, colors, positions, TileMode.CLAMP)
        };
    }
</script>

<script lang="ts">
    export let item: Hourly & {
        index: number;
        min: number;
        max: number;
        tempDelta: number;
        curveTempPoints: number[];
        odd: boolean;
    };
    let canvasView;
    let precipitationHeight = 0;

    function redraw() {
        canvasView && canvasView.nativeView.invalidate();
    }
    $: {
        precipitationHeight = item.precipAccumulation > 1 ? Math.sqrt(item.precipAccumulation) : item.precipAccumulation;
        redraw();
    }
    textColor.subscribe(redraw);
    // fontScale.subscribe(redraw);
    let weatherIconSize = 40;
    function drawOnCanvas(event) {
        const endDay = dayjs().endOf('d').valueOf();
        const canvas = getCanvas(event.canvas); // simple trick to get typings
        const w = canvas.getWidth();
        const w2 = w / 2;
        const h = canvas.getHeight();
        // textPaint.setTextSize(14 * $fontScale);
        textPaint.setFontWeight('normal');

        if (item.odd) {
            canvas.drawColor(oddColor);
        }
        let color;
        const precipProbability = item.precipProbability;
        if ((precipProbability === -1 || precipProbability > 0) && precipitationHeight > 0) {
            const precipTop = (0.5 + (1 - precipitationHeight / 5)/2) * (h - 10);
            paint.setColor(item.precipColor);
            paint.setAlpha(precipProbability === -1 ? 125 : precipProbability * 2.55);
            canvas.drawRect(0, precipTop, w, h - 10, paint);
            if ((precipProbability === -1 || precipProbability > 10) && item.precipAccumulation >= 0.1) {
                textPaint.setTextSize(10 * $fontScale);
                textPaint.setColor($textColor);
                textPaint.setAlpha(150);
                if (precipProbability > 0) {
                    canvas.drawText(precipProbability + '%', w2, h - 22 * $fontScale, textPaint);
                }
                canvas.drawText(formatValueToUnit(item.precipAccumulation, UNITS.MM, $imperial), w2, h - 12 * $fontScale, textPaint);
            }
        }
        canvas.save();
        const iconDecale = 27 * $fontScale + weatherIconSize + (11 * $fontScale);
        const lineOffset = iconDecale + (11 * $fontScale) + 13 * $fontScale;
        const pHeight = h - lineOffset - (22 * $fontScale + 10 * $fontScale);

        canvas.translate(0, lineOffset);
        if (item.curveTempPoints) {
            if (!lastGradient || lastGradient.min !== item.min || lastGradient.max !== item.max) {
                lastGradient = generateGradient(5, item.min, item.max, pHeight + 33, 0);
            }
            pathPaint.setShader(lastGradient.gradient);
            // pathPaint.setStyle(Style.FILL_AND_STROKE)
            // canvas.drawRect(0, 0, w , pHeight, pathPaint);
            const points: number[] = item.curveTempPoints.slice();
            if (item.index === 0) {
                points.unshift(points[0], points[0], points[0]);
            } else if (item.index === 1) {
                points.unshift(points[0], points[0]);
            } else if (item.index === 2) {
                points.unshift(points[0]);
            } else if (points.length === 5) {
                points.push(points[points.length - 1]);
            } else if (points.length === 4) {
                points.push(points[points.length - 1], points[points.length - 1]);
            } else if (points.length === 3) {
                points.push(points[points.length - 1], points[points.length - 1], points[points.length - 1]);
            }
            curvePath.reset();
            let pWidth = w;
            let startX = (-5 * w) / 2;
            let lastPoint;
            const intensity = 0.2;
            points.forEach((p, i) => {
                let curXVal = startX + pWidth * i;
                let prevXVal = startX + pWidth * Math.max(i - 1, 0);
                let nextXVal = startX + pWidth * Math.min(i + 1, points.length - 1);
                let prevPrevXVal = startX + pWidth * Math.max(i - 2, 0);
                if (i === 0) {
                    curvePath.moveTo(startX, pHeight * (1 - p));
                } else {
                    const prevDx = (curXVal - prevPrevXVal) * intensity;
                    const prevDy = (pHeight * (1 - p) - pHeight * (1 - points[Math.max(i - 2, 0)])) * intensity;
                    const curDx = (nextXVal - prevXVal) * intensity;
                    const curDy = (pHeight * (1 - points[Math.min(i + 1, points.length - 1)]) - pHeight * (1 - lastPoint)) * intensity;

                    curvePath.cubicTo(prevXVal + prevDx, pHeight * (1 - lastPoint) + prevDy, curXVal - curDx, pHeight * (1 - p) - curDy, curXVal, pHeight * (1 - p));
                }
                lastPoint = p;
            });
            canvas.drawPath(curvePath, pathPaint);
        }
        textPaint.setColor($subtitleColor);
        textPaint.setTextSize(13 * $fontScale);
        canvas.drawText(`${formatValueToUnit(Math.round(item.temperature), UNITS.Celcius, $imperial)}`, w2, pHeight * (1 - item.tempDelta) - 6 * $fontScale, textPaint);
        canvas.restore();

        if (item.cloudCeiling > 0) {
            const heightProb = 1 - item.cloudCeiling / 6000;
            const top = 0.3 * (h - 30) * heightProb + 13;
            paint.setColor(item.cloudColor);
            paint.setAlpha((item.cloudCover / 100) * heightProb * 150);
            canvas.drawRect(0, 0, w, top, paint);
            textPaint.setColor(color);
            textPaint.setTextSize(10 * $fontScale);
            textPaint.setAlpha((item.cloudCover / 100) * heightProb * 255);
            canvas.drawText(formatValueToUnit(item.cloudCeiling, UNITS.Distance, $imperial), w2, top + 20 * $fontScale, textPaint);
        }
        // paint.setAlpha(255);
        // textPaint.setAlpha(255);
        paint.setColor(item.color);
        canvas.drawRect(0, h - 10, w, h, paint);

        textPaint.setFontWeight('bold');
        textPaint.setColor($textColor);
        textPaint.setTextSize(13 * $fontScale);
        canvas.drawText(formatTime(item.time), w2, 16 * $fontScale, textPaint);
        if (item.time > endDay) {
            textPaint.setTextSize(12 * $fontScale);
            canvas.drawText(formatDate(item.time, 'ddd'), w2, 28 * $fontScale, textPaint);
            // decale += 10;
        }
        textPaint.setFontWeight('normal');
        // textPaint.setTextSize(11 * $fontScale);
        // textPaint.setAlpha(180);
        const subTextSize = 11 * $fontScale;
        if (item.windSpeed) {
            appTextPaint.setTextSize(subTextSize);
            appTextPaint.setColor($textColor);
            canvas.drawText(`${item.windIcon} ${formatValueToUnit(item.windSpeed, UNITS.Speed, $imperial)}`, w2, iconDecale, appTextPaint);
        }
        if (item.windGust && (item.windSpeed || item.windGust > 2* item.windSpeed)) {
            textPaint.setTextSize(subTextSize);
            // iconPaint.setTextSize(subTextSize);
            // appTextPaint.setColor('#ff0353');
            textPaint.setColor('#ff0353');

        //     const nString = createNativeAttributedString({
        //     spans: [
        //         // {
        //         //     fontFamily:wiFontFamily,
        //         //     text: 'wi-strong-wind'
        //         // },
        //         {
        //             text: formatValueToUnit(item.windGust, UNITS.Speed, $imperial)
        //         }
        //     ]
        // });
        // canvas.save();
        // const staticLayout = new StaticLayout(nString, textPaint, w, LayoutAlignment.ALIGN_CENTER, 1, 0, false);
        // canvas.translate(0, iconDecale);
        // staticLayout.draw(canvas);
        // canvas.restore();
            // canvas.drawText('wi-strong-wind', w2, iconDecale + subTextSize + 2, iconPaint);
            canvas.drawText(formatValueToUnit(item.windGust, UNITS.Speed, $imperial), w2, iconDecale + subTextSize + 2, textPaint);
        }
        // console.log('drawn in ', Date.now() - startTime, item.index);
    }
    function onTap() {
        if (item.description) {
            showSnack({ message: item.description });
        }
    }
</script>

<gridlayout on:tap={onTap}>
    <canvas bind:this={canvasView} rowSpan={3} on:draw={drawOnCanvas} />
    <WeatherIcon icon={item.icon} verticalAlignment="top" marginTop={27 * $fontScale} size={weatherIconSize} />
</gridlayout>
