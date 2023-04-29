import { Frame } from '@nativescript/core';
import * as app from '@nativescript/core/application';
import { knownFolders } from '@nativescript/core/file-system';
import { Dayjs } from 'dayjs';
import { lc } from '~/helpers/locale';

export function getDataFolder() {
    let dataFolder;
    if (__ANDROID__) {
        const checkExternalMedia = function () {
            let mExternalStorageAvailable = false;
            let mExternalStorageWriteable = false;
            const state = android.os.Environment.getExternalStorageState();

            if (android.os.Environment.MEDIA_MOUNTED === state) {
                // Can read and write the media
                mExternalStorageAvailable = mExternalStorageWriteable = true;
            } else if (android.os.Environment.MEDIA_MOUNTED_READ_ONLY === state) {
                // Can only read the media
                mExternalStorageAvailable = true;
                mExternalStorageWriteable = false;
            } else {
                // Can't read or write
                mExternalStorageAvailable = mExternalStorageWriteable = false;
            }
            return mExternalStorageWriteable;
        };
        if (checkExternalMedia()) {
            const dirs = (app.android.startActivity as android.app.Activity).getExternalFilesDirs(null);
            dataFolder = dirs[dirs.length - 1]?.getAbsolutePath();
        }
    }
    if (!dataFolder) {
        dataFolder = knownFolders.documents().path;
    }
    return dataFolder;
}
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
            const parentView = Frame.topmost() || app.getRootView();
            datePicker.show(parentView._getRootFragmentManager(), 'datepicker');
        });
    }
}
