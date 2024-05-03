<script context="module" lang="ts">
    import { Align, LayoutAlignment, LinearGradient, Paint, Path, Rect, StaticLayout, Style, TileMode } from '@nativescript-community/ui-canvas';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { Color } from '@nativescript/core';
    import dayjs from 'dayjs';
    import WeatherIcon from '~/components/WeatherIcon.svelte';
    import { formatValueToUnit, formatWeatherValue } from '~/helpers/formatter';
    import { formatDate, formatTime } from '~/helpers/locale';
    import { getCanvas } from '~/helpers/sveltehelpers';
    import { Hourly } from '~/services/providers/weather';
    import { getWeatherDataTitle, weatherDataService } from '~/services/weatherData';
    import { generateGradient } from '~/utils/utils';
    import { colors, fontScale } from '~/variables';

    const textPaint = new Paint();
    textPaint.setTextAlign(Align.CENTER);
    const paint = new Paint();
    paint.setTextAlign(Align.CENTER);
    const pathPaint = new Paint();
    pathPaint.setStrokeWidth(5);
    pathPaint.setStyle(Style.STROKE);
    const curvePath = new Path();

    const oddColor = new Color(0.05 * 255, 120, 120, 120);

    let lastGradient: { min; max; gradient: LinearGradient };
</script>

<script lang="ts">
    $: ({ colorOnSurface, colorOnSurfaceVariant } = $colors);
    export let item: Hourly & {
        index: number;
        min: number;
        max: number;
        tempDelta: number;
        curveTempPoints: number[];
        odd: boolean;
    };
    export let animated: boolean = false;
    let canvasView;
    let precipitationHeight = 0;

    function redraw() {
        canvasView && canvasView.nativeView.invalidate();
    }
    $: {
        if (item.precipShowSnow) {
            precipitationHeight = item.snowfall > 1 ? Math.sqrt(item.snowfall / 10) : item.snowfall / 10;
        } else {
            precipitationHeight = item.precipAccumulation > 1 ? Math.sqrt(item.precipAccumulation) : item.precipAccumulation;
        }
        redraw();
    }
    const weatherIconSize = 40;
    function drawOnCanvas(event) {
        const endDay = dayjs().endOf('d').valueOf();
        const canvas = getCanvas(event.canvas); // simple trick to get typings
        const w = canvas.getWidth();
        const w2 = w / 2;
        const h = canvas.getHeight();
        textPaint.setFontWeight('normal');

        if (item.odd) {
            canvas.drawColor(oddColor);
        }
        let color;
        const precipProbability = item.precipProbability;
        if ((precipProbability === -1 || precipProbability > 0) && precipitationHeight > 0) {
            const precipTop = (0.5 + (1 - precipitationHeight / 5) / 2) * (h - 10);
            paint.setColor(item.precipColor);
            paint.setAlpha(precipProbability === -1 ? 125 : precipProbability * 2.55);
            canvas.drawRect(0, precipTop, w, h - 10, paint);
            if ((precipProbability === -1 || precipProbability > 10) && item.precipAccumulation >= 0.1) {
                textPaint.setTextSize(10 * $fontScale);
                textPaint.setColor(colorOnSurface);
                textPaint.setAlpha(150);
                if (precipProbability > 0) {
                    canvas.drawText(formatWeatherValue(item, 'precipProbability'), w2, h - 22 * $fontScale, textPaint);
                }
                canvas.drawText(formatValueToUnit(item.precipShowSnow ? item.snowfall : item.precipAccumulation, item.precipUnit), w2, h - 12 * $fontScale, textPaint);
            }
        }
        canvas.save();
        const iconDecale = 27 * $fontScale + weatherIconSize * $fontScale + 11 * $fontScale;
        const lineOffset = iconDecale + 11 * $fontScale + 13 * $fontScale + (11 * $fontScale + 4);
        const pHeight = h - lineOffset - (22 * $fontScale + 10 * $fontScale);

        canvas.translate(0, lineOffset);
        if (item.curveTempPoints) {
            if (!lastGradient || lastGradient.min !== item.min || lastGradient.max !== item.max) {
                lastGradient = generateGradient(5, item.min, item.max, pHeight + 33, 0);
            }
            pathPaint.setShader(lastGradient.gradient);
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
            const pWidth = w;
            const startX = (-5 * w) / 2;
            let lastPoint;
            const intensity = 0.2;
            points.forEach((p, i) => {
                const curXVal = startX + pWidth * i;
                const prevXVal = startX + pWidth * Math.max(i - 1, 0);
                const nextXVal = startX + pWidth * Math.min(i + 1, points.length - 1);
                const prevPrevXVal = startX + pWidth * Math.max(i - 2, 0);
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
        textPaint.setColor(colorOnSurfaceVariant);
        textPaint.setTextSize(13 * $fontScale);
        canvas.drawText(`${formatWeatherValue(item, 'temperature')}`, w2, pHeight * (1 - item.tempDelta) - 6 * $fontScale, textPaint);
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
            canvas.drawText(formatWeatherValue(item, 'cloudCeiling'), w2, top + 20 * $fontScale, textPaint);
            textPaint.setAlpha(255);
            paint.setAlpha(255);
        }
        // if (item.iso > 0) {
        //     const heightProb = 1 - item.iso / 8000;
        //     const top = 0.8 * (h - 30) * heightProb + 13;
        //     paint.setAlpha(128);
        //     paint.setColor(snowColor);
        //     paint.setStrokeWidth(2);
        //     canvas.drawLine(0, top, 5, top, paint);
        //     textPaint.setColor(snowColor);
        //     textPaint.setAlpha(128);
        //     textPaint.setTextSize(10 * $fontScale);
        //     textPaint.setTextAlign(Align.LEFT);
        //     canvas.drawText(formatValueToUnit(item.iso, UNITS.Distance), 10, top + 2 * $fontScale, textPaint);
        //     textPaint.setTextAlign(Align.CENTER);
        //     textPaint.setAlpha(255);
        //     paint.setAlpha(255);
        // }
        if (item.aqi && item.aqiColor) {
            paint.setColor(item.aqiColor);
            canvas.drawRect(0, 0, w, 5, paint);
            // paint.setColor(item.color);
            // canvas.drawRect(0, h - 5, w, h, paint);
            // } else {
        }
        paint.setColor(item.color);
        canvas.drawRect(0, h - 10, w, h, paint);

        textPaint.setFontWeight('bold');
        textPaint.setColor(colorOnSurface);
        textPaint.setTextSize(13 * $fontScale);
        canvas.drawText(formatTime(item.time), w2, 16 * $fontScale, textPaint);
        if (item.time > endDay) {
            textPaint.setTextSize(12 * $fontScale);
            canvas.drawText(formatDate(item.time, 'ddd'), w2, 28 * $fontScale, textPaint);
        }
        textPaint.setFontWeight('normal');

        const windSpeedData = weatherDataService.getItemData('windSpeed', item);

        let iconDeltaY = 0;
        if (windSpeedData) {
            windSpeedData.paint.setTextSize(11 * $fontScale);
            windSpeedData.paint.setColor(windSpeedData.color || colorOnSurface);
            canvas.drawText(`${windSpeedData.icon} ${windSpeedData.value} ${windSpeedData.subvalue}`, w2, iconDecale, windSpeedData.paint);
            iconDeltaY += 18;
        }
        const windGustData = weatherDataService.getItemData('windGust', item);
        if (windGustData) {
            textPaint.setTextSize(11 * $fontScale);
            textPaint.setColor(windGustData.textColor);
            const staticLayout = new StaticLayout(`${windGustData.value} ${windGustData.subvalue}`, textPaint, w, LayoutAlignment.ALIGN_NORMAL, 1, 0, false);

            canvas.save();
            canvas.translate(w2, iconDecale + 4 - 18 + iconDeltaY);
            if (windGustData.color) {
                const oldColor = textPaint.getColor();
                const width = staticLayout.getWidth();
                // this fixes a current issue with the Paint getDrawTextAttribs is set on Paint in getHeight
                // if we change the paint color to draw the rect
                // then if we do it too soon the paint getDrawTextAttribs is going to use that new
                // color and thus we loose the color set before for the text
                const height = staticLayout.getHeight();
                textPaint.setColor(windGustData.color);
                canvas.drawRoundRect(-width / 2 + 8, -1, width / 2 - 8, height - 0, 4, 4, textPaint);
                textPaint.setColor(oldColor);
            }

            staticLayout.draw(canvas);
            canvas.restore();
        }
    }
    function onTap() {
        let message = item.description;
        if (item.iso > 0) {
            message = (message ? message + '\n ' : '') + `${getWeatherDataTitle('iso')}: ${formatWeatherValue(item, 'iso')}`;
        }
        if (item.rainSnowLimit > 0) {
            message = (message ? message + ' /  ' : '') + `${getWeatherDataTitle('rainSnowLimit')}: ${formatWeatherValue(item, 'rainSnowLimit')}`;
        }
        if (message) {
            showSnack({ message });
        }
    }
</script>

<gridlayout on:tap={onTap}>
    <canvasview bind:this={canvasView} rowSpan={3} on:draw={drawOnCanvas} />
    <WeatherIcon {animated} iconData={[item.iconId, item.isDay]} isUserInteractionEnabled={false} marginTop={27 * $fontScale} size={weatherIconSize * $fontScale} verticalAlignment="top" />
</gridlayout>
