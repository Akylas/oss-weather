<script lang="ts">
    import { Color } from '@akylas/nativescript';
    import { createNativeAttributedString } from '@nativescript-community/text';
    import { Align, Canvas, LayoutAlignment, Paint, StaticLayout } from '@nativescript-community/ui-canvas';
    import dayjs from 'dayjs';
    import { CommonWeatherData } from '~/services/providers/weather';
    import { CommonData, WeatherProps, weatherDataService } from '~/services/weatherData';
    import { colors, fontScale } from '~/variables';
    import WeatherPage from './WeatherPage.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import { iconService } from '~/services/icon';
    import { formatTime } from '~/helpers/locale';
    import { closePopover } from '@nativescript-community/ui-popover/svelte';

    const labelPaint = new Paint();

    let { colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground, colorSurfaceContainer } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorOutline, colorBackground, colorSurfaceContainer } = $colors);
    export let item: CommonWeatherData;

    $: updateNativeTexts(item);
    let height;
    let iconsNativeString;
    let textNativeString;
    const animated = iconService.animated;

    let data: CommonData[];
    function updateNativeTexts(item: CommonWeatherData) {
        data = weatherDataService.getIconsData(item, [WeatherProps.windBeaufort], [WeatherProps.temperature], [WeatherProps.rainSnowLimit, WeatherProps.iso]);
        height = data.length * 19 * $fontScale;
        // iconsNativeString = createNativeAttributedString({
        //     spans: data
        //         .map((c) => [
        //             {
        //                 fontSize: c.iconFontSize * 0.7,
        //                 color: c.iconColor || c.color || colorOnSurface,
        //                 fontFamily: c.paint?.fontFamily,
        //                 text: c.icon + '\n'
        //             }
        //         ])
        //         .flat()
        // });
        // textNativeString = createNativeAttributedString({
        //     spans: data
        //         .map((c) =>
        //             [
        //                 c.value
        //                     ? {
        //                           fontSize: 12 * $fontScale,
        //                           //   verticalAlignment: 'center',
        //                           color: c.color || colorOnSurface,
        //                           text: c.value + (c.subvalue ? ' ' : '\n')
        //                       }
        //                     : undefined,
        //                 c.subvalue
        //                     ? {
        //                           fontSize: 9 * $fontScale,
        //                           color: c.color || colorOnSurface,
        //                           //   verticalAlignment: 'center',
        //                           text: c.subvalue + '\n'
        //                       }
        //                     : undefined
        //             ].filter((s) => !!s)
        //         )
        //         .flat() as any
        // });
    }

    function onDraw({ canvas }: { canvas: Canvas }) {
        const w = canvas.getWidth();
        const dx = 0;
        let dy = 0;

        const addedDy = 19;
        for (let index = 0; index < data.length; index++) {
            const c = data[index];
            const paint = c.paint || labelPaint;
            paint.color = c.iconColor || c.color || colorOnSurface;
            paint.textSize = c.iconFontSize * 0.8;
            paint.setTextAlign(Align.CENTER);
            canvas.drawText(c.icon || ' ', 10, dy + (addedDy - 2) * $fontScale, paint);

            const nativeText = createNativeAttributedString({
                spans: [
                    c.value
                        ? {
                              fontSize: 14 * $fontScale,
                              //   verticalAlignment: 'center',
                              color: c.color || colorOnSurface,
                              text: c.value + (c.subvalue ? ' ' : '\n')
                          }
                        : undefined,
                    c.subvalue
                        ? {
                              fontSize: 11 * $fontScale,
                              color: c.color || colorOnSurface,
                              //   verticalAlignment: 'center',
                              text: c.subvalue + '\n'
                          }
                        : undefined
                ].filter((s) => !!s)
            });
            canvas.save();
            const staticLayout = new StaticLayout(nativeText, labelPaint, w - 60 * $fontScale, LayoutAlignment.ALIGN_NORMAL, 1, 0, true);
            canvas.translate(30 * $fontScale, dy);
            // const staticLayout = new StaticLayout(dataNString, textPaint, lineWidth, columnIndex === 0 ? LayoutAlignment.ALIGN_OPPOSITE : LayoutAlignment.ALIGN_NORMAL, 1, 0, true);
            // canvas.translate(columnIndex === 0 ? w2 - lineWidth - 5 : w2 + 5, y + lineHeight / 2 - staticLayout.getHeight() / 2);
            staticLayout.draw(canvas);
            canvas.restore();

            dy += addedDy * $fontScale;
        }
    }
</script>

<gesturerootview columns="auto" rows="auto">
    <gridlayout
        backgroundColor={new Color(colorBackground).setAlpha(240)}
        borderColor={colorOutline}
        borderRadius={8}
        borderWidth={1}
        columns={`${100 * $fontScale},${50 * $fontScale}`}
        padding={5}
        rows={`auto,auto,${height}`}
        on:tap={() => closePopover()}>
        <WeatherIcon {animated} col={1} iconData={[item.iconId, item.isDay]} verticalAlignment="top" />
        <label colSpan={2} fontSize={14 * $fontScale} fontWeight="bold" text={formatTime(item.time, 'LT') + '\n' + formatTime(item.time, 'DD/MM')} />
        <label colSpan={2} fontSize={14 * $fontScale} marginBottom={10} row={1} text={item.description} />
        <!-- <label lineHeight={18 * $fontScale} row={1} text={iconsNativeString} textAlignment="center" verticalTextAlignment="center" /> -->
        <!-- <label col={1} lineHeight={18 * $fontScale} row={1} text={textNativeString} /> -->
        <canvasView colSpan={2} row={2} on:draw={onDraw} />
    </gridlayout>
</gesturerootview>
