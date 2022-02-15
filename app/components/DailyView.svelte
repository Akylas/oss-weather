<script context="module" lang="ts">
    import { Align, LayoutAlignment, LinearGradient, Paint, Path, StaticLayout, Style, TileMode } from '@nativescript-community/ui-canvas';
    import { Canvas } from '@nativescript-community/ui-canvas';

    import { Color } from '@nativescript/core';
    import { convertTime, convertValueToUnit, formatValueToUnit, toImperialUnit, UNITS } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
    import { borderColor, imperial, nightColor, rainColor, snowColor, textColor, textLightColor, wiFontFamily } from '~/variables';
    import WeatherIcon from '~/components/WeatherIcon.svelte';

    let textPaint: Paint;
    let textIconPaint: Paint;
    let textIconSubPaint: Paint;
    let paint: Paint;
    let wiPaint: Paint;
</script>

<script lang="ts">
    import { createNativeAttributedString } from '@nativescript-community/text';

    export let item: any;
    let canvasView;
    let color: string | Color;
    let precipIcon: string;

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
        canvas.drawLine(0,h, w, h, paint);

        // textPaint.setTextAlign(Align.LEFT);
        textPaint.setTextSize(22);
        textPaint.setColor($textColor);
        canvas.drawText(convertTime(item.time, 'ddd '), 10, 26, textPaint);
        textPaint.setColor($textLightColor);
        textPaint.setTextSize(15);
        canvas.drawText(convertTime(item.time, 'DD/MM'), 10, 46, textPaint);

        if (item.windBeaufortIcon) {
            wiPaint.setTextSize(20);
            canvas.drawText(item.windBeaufortIcon, 10, 70, wiPaint);
        }

        let centeredItemsToDraw: {
            color?: string | Color;
            paint?: Paint;
            iconFontSize: number;
            icon: string;
            value: string | number;
            subvalue?: string;
        }[] = [
            {
                paint: undefined,
                iconFontSize: 26,
                icon: item.windIcon,
                value: convertValueToUnit(item.windSpeed, UNITS.Speed, $imperial)[0],
                subvalue: toImperialUnit(UNITS.Speed, $imperial)
            }
        ];
        if ((item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: color,
                iconFontSize: 20,
                icon: precipIcon,
                value: formatValueToUnit(Math.floor(item.precipAccumulation), UNITS.MM),
                subvalue: item.precipProbability > 0 && Math.round(item.precipProbability * 100) + '%'
            });
        } else if (item.cloudCover > 0) {
            centeredItemsToDraw.push({
                paint: wiPaint,
                color: item.cloudColor,
                iconFontSize: 20,
                icon: 'wi-cloud',
                value: Math.round(item.cloudCover) + '%',
                subvalue: item.cloudCeiling && formatValueToUnit(item.cloudCeiling, UNITS.Distance, $imperial)
            });
        }
        centeredItemsToDraw.push({
            paint: wiPaint,
            color: nightColor,
            iconFontSize: 20,
            icon: item.moonIcon,
            value: l('moon')
        });
        const count = centeredItemsToDraw.length;

        centeredItemsToDraw.forEach((c, index) => {
            let x = w / 2 - ((count - 1) / 2 - index) * 50;
            const paint = c.paint || textIconPaint;
            paint.setTextSize(c.iconFontSize);
            paint.setColor(c.color || $textColor);
            canvas.drawText(c.icon, x, 10 + 20, paint);
            if (c.value) {
                textIconSubPaint.setTextSize(12);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.value + '', x, 10 + 39, textIconSubPaint);
            }
            if (c.subvalue) {
                textIconSubPaint.setTextSize(9);
                textIconSubPaint.setColor(c.color || $textColor);
                canvas.drawText(c.subvalue + '', x, 10 + 50, textIconSubPaint);
            }
        });
        const nString = createNativeAttributedString(
            {
                spans: [
                    {
                        fontSize: 17,
                        color: $textLightColor,
                        text: formatValueToUnit(item.temperatureMin, UNITS.Celcius, $imperial)
                    },
                    {
                        fontSize: 20,
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

        textPaint.setTextSize(13);
        textPaint.setColor($textLightColor);
        canvas.drawText(item.description, 10, h - 13, textPaint);
        // textPaint.setTextAlign(Align.RIGHT);
    }
</script>

<gridLayout height={100}>
    <!-- <canvaslabel paddingRight={5}>
        <rectangle horizontalAlignment="right" fillColor={item.color} width={5} height="100%" translateX={5} />
        <cgroup id="time" fontSize={22} verticalAlignment="top" paddingLeft={10} paddingTop={5}>
            <cspan text={convertTime(item.time, 'ddd ')} textTransform="capitalize" />
            <cspan fontSize={15} color={$textLightColor} text={'\n' + convertTime(item.time, 'DD/MM')} />
        </cgroup>

        {#if item.windBeaufortIcon}
            <cspan id="windBeaufortIcon" fontSize={20} fontFamily={wiFontFamily} text={item.windBeaufortIcon} verticalAlignment="top" textAlignment="left" paddingLeft={10} paddingTop={50} />
        {/if}
        <cgroup id="wind" fontSize={12} verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft={-100} paddingTop={10}>
            <cspan fontSize={26} lineheight={28} text={item.windIcon} />
            <cspan text={'\n' + convertValueToUnit(item.windSpeed, UNITS.Speed, $imperial)[0]} />
            <cspan fontSize={9} text={'\n' + toImperialUnit(UNITS.Speed, $imperial)} />
        </cgroup>

        {#if (item.precipProbability === -1 || item.precipProbability > 0.1) && item.precipAccumulation >= 1}
            <cgroup id="precip" {color} fontSize={12} verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingTop={10}>
                <cspan fontSize={20} lineheight={28} fontFamily={wiFontFamily} text={precipIcon} />
                <cspan text={'\n' + formatValueToUnit(Math.floor(item.precipAccumulation), UNITS.MM)} />
                <cspan fontSize={9} text={item.precipProbability > 0 ? '\n' + Math.round(item.precipProbability * 100) + '%' : null} />
            </cgroup>
        {:else if item.cloudCover > 0}
            <cgroup id="cloud" paddingTop={10} fontSize={12} verticalAlignment="top" horizontalAlignment="center" textAlignment="center" color={item.cloudColor}>
                <cspan fontSize={20} lineheight={28} fontFamily={wiFontFamily} text="wi-cloud" />
                <cspan text={'\n' + Math.round(item.cloudCover) + '%'} />
                <cspan fontSize={9} text={item.cloudCeiling ? '\n' + formatValueToUnit(item.cloudCeiling, UNITS.Distance, $imperial) : null} />
            </cgroup>
        {/if}
        <cgroup id="moon" color={nightColor} fontSize={12} verticalAlignment="top" horizontalAlignment="center" textAlignment="center" paddingLeft={100} paddingTop={10}>
            <cspan fontSize={20} lineheight={28} fontFamily={wiFontFamily} text={item.moonIcon} />
            <cspan text={'\n' + l('moon')} />
        </cgroup>
        <cgroup id="temp" fontSize={20} verticalAlignment="top" textAlignment="right" paddingTop={5} paddingRight={5}>
            <cspan fontSize={17} color={$textLightColor} text={formatValueToUnit(item.temperatureMin, UNITS.Celcius, $imperial)} />
            <cspan text={' ' + formatValueToUnit(item.temperatureMax, UNITS.Celcius, $imperial)} />
        </cgroup>
        <cspan paddingLeft={10} paddingBottom={10} fontSize={13} color={$textLightColor} text={item.description} textTransform="capitalize" verticalAlignment="bottom" textAlignment="left" />

        <line color={$borderColor} startX="0%" startY="0" stopX="100%" stopY="0" strokewidth={1} />
    </canvaslabel> -->
    <canvas bind:this={canvasView} on:draw={drawOnCanvas} />
    <WeatherIcon marginRight="10" marginTop={16} horizontalAlignment="right" fontSize={60} icon={item.icon} />
</gridLayout>
