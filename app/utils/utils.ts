import { Application, Device, Frame } from '@nativescript/core';
import { Dayjs } from 'dayjs';
import { FavoriteLocation } from '~/helpers/favorites';
import { lc } from '~/helpers/locale';
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
    DEV_LOG && console.log('isBRABounds', coords);
    return coords.lon >= BRA_BOUNDS[0] && coords.lon <= BRA_BOUNDS[2] && coords.lat >= BRA_BOUNDS[1] && coords.lat <= BRA_BOUNDS[3];
}
