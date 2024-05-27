import { Application, Utils } from '@nativescript/core';

export * from './utils.common';

export function restartApp() {
    com.akylas.weather.Utils.restartApp(Utils.android.getApplicationContext(), Application.android.startActivity);
}
