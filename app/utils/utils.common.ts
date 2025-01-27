import { LinearGradient, TileMode } from '@nativescript-community/ui-canvas';
import { Application, Color, Device, Frame, ImageSource, Utils } from '@nativescript/core';
import { Dayjs } from 'dayjs';
import { FavoriteLocation } from '~/helpers/favorites';
import { lc } from '~/helpers/locale';

export { restartApp, loadImageSync as loadImage } from '@akylas/nativescript-app-utils';

export const sdkVersion = parseInt(Device.sdkVersion, 10);

declare module '@nativescript/core/ui/frame' {
    interface Frame {
        _getRootFragmentManager(): androidx.fragment.app.FragmentManager;
    }
}
export async function pickDate(currentDate: Dayjs) {
    if (__ANDROID__) {
        return new Promise<number>((resolve, reject) => {
            const datePicker = com.google.android.material.datepicker.MaterialDatePicker.Builder.datePicker()
                .setTitleText(lc('pick_date'))
                .setSelection(new java.lang.Long(currentDate.valueOf()))
                .build();
            datePicker.addOnDismissListener(
                new android.content.DialogInterface.OnDismissListener({
                    onDismiss: () => {
                        resolve(datePicker.getSelection().longValue());
                    }
                })
            );
            const parentView = Frame.topmost() || Application.getRootView();
            datePicker.show(parentView._getRootFragmentManager(), 'datepicker');
        });
    }
}

const BRA_BOUNDS = [-4.855957, 41.310824, 9.645996, 51.124213];
export function isBRABounds(location: FavoriteLocation) {
    const coords = location.coord;
    DEV_LOG && console.log('isBRABounds', JSON.stringify(coords));
    return coords.lon >= BRA_BOUNDS[0] && coords.lon <= BRA_BOUNDS[2] && coords.lat >= BRA_BOUNDS[1] && coords.lat <= BRA_BOUNDS[3];
}
export function tempColor(t, min, max) {
    // Map the temperature to a 0-1 range
    let a = (t - min) / (max - min);
    a = a < 0 ? 0 : a > 1 ? 1 : a;

    // Scrunch the green/cyan range in the middle
    const sign = a < 0.5 ? -1 : 1;
    a = (sign * Math.pow(2 * Math.abs(a - 0.5), 0.35)) / 2 + 0.5;

    // Linear interpolation between the cold and hot
    const h0 = 259;
    const h1 = 12;
    const h = h0 * (1 - a) + h1 * a;
    // DEV_LOG && console.log('tempColor', t, min, max, h);
    return new Color(255, h, 75, 90, 'hsv');
}
export function generateGradient(nbColor, min, max, h, posOffset) {
    const tmin = -20;
    const tmax = 30;
    // const tmin = Math.min(min, -30);
    // const tmax = Math.max(max, 30);
    const colors = [];
    const positions = [];
    const posDelta = 1 / nbColor;
    const tempDelta = (max - min) / nbColor;
    for (let index = 0; index < nbColor; index++) {
        colors.push(tempColor(max - index * tempDelta, tmin, tmax));
        positions.push(posOffset + posDelta * index);
    }

    colors.push(tempColor(min, tmin, tmax));
    positions.push(posOffset + 1);
    // console.log('generateGradient', min, max, h, posOffset, colors, positions);
    return {
        min,
        max,
        height: h,
        gradient: new LinearGradient(0, 0, 0, h, colors, positions, TileMode.CLAMP)
    };
}

export function nearest(arr: number[], n: number) {
    let low = 0;
    let index = 0;
    while (n > arr[index + 1]) {
        low++;
        index++;
    }
    return [low, low < arr.length - 1 ? low + 1 : low];
}
export function getIndexedColor(value: number, indexes: number[], colors: string[], mix = false) {
    if (isNaN(value)) {
        return null;
    }
    const [low, high] = nearest(indexes, value);

    if (mix) {
        return Color.mix(new Color(colors[low]), new Color(colors[high]), ((value - indexes[low]) / (indexes[high] - indexes[low])) * 100).hex;
    } else {
        return colors[low];
    }
}
