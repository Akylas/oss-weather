import { Application, ApplicationSettings, Color, Observable, Utils } from '@nativescript/core';
import { getBoolean } from '@nativescript/core/application-settings';
import { Screen } from '@nativescript/core/platform';
import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
import CSSLoader from '~/variables.module.scss';

const locals = CSSLoader.locals;

export const globalObservable = new Observable();

const callbacks = {};
export function createGlobalEventListener(eventName: string) {
    return function (callback: Function, once = false) {
        callbacks[eventName] = callbacks[eventName] || {};
        let cleaned = false;

        function clean() {
            if (!cleaned) {
                cleaned = true;
                delete callbacks[eventName][callback];
                globalObservable.off(eventName, eventCallack);
            }
        }
        const eventCallack = (event) => {
            if (once) {
                clean();
            }
            if (Array.isArray(event.data)) {
                event.result = callback(...event.data);
            } else {
                event.result = callback(event.data);
            }
        };
        callbacks[eventName][callback] = eventCallack;
        globalObservable.on(eventName, eventCallack);

        onDestroy(() => {
            clean();
        });
        return clean;
    };
}

export const primaryColor = new Color(locals.primaryColor);
export const accentColor = new Color(locals.accentColor);
export const darkColor = new Color(locals.darkColor);
// export const backgroundColor: string = locals.backgroundColor;
// export const latoFontFamily: string = locals.latoFontFamily;
export const wiFontFamily: string = locals.wiFontFamily;

export const appFontFamily: string = locals.appFontFamily;
export const mdiFontFamily: string = locals.mdiFontFamily;
// export const forecastFontFamily: string = locals.forecastFontFamily;
export const actionBarHeight: number = parseFloat(locals.actionBarHeight);

let innerStatusBarHeight = 20;
export const statusBarHeight = writable(innerStatusBarHeight);

export const actionBarButtonHeight: number = parseFloat(locals.actionBarButtonHeight);
export const screenHeightDips = Screen.mainScreen.heightDIPs;
export const screenWidthDips = Screen.mainScreen.widthDIPs;
export const screenScale = Screen.mainScreen.scale;
export const navigationBarHeight = writable(0);

if (__ANDROID__) {
    const resources = Utils.android.getApplicationContext().getResources();
    const id = resources.getIdentifier('config_showNavigationBar', 'bool', 'android');
    let resourceId = resources.getIdentifier('navigation_bar_height', 'dimen', 'android');
    if (id > 0 && resourceId > 0) {
        navigationBarHeight.set(Utils.layout.toDeviceIndependentPixels(resources.getDimensionPixelSize(resourceId)));
    }
    resourceId = resources.getIdentifier('status_bar_height', 'dimen', 'android');
    if (id > 0 && resourceId > 0) {
        innerStatusBarHeight = Utils.layout.toDeviceIndependentPixels(resources.getDimensionPixelSize(resourceId));
        statusBarHeight.set(innerStatusBarHeight);
    }
} else {
    const onAppLaunch = function () {
        navigationBarHeight.set(Application.ios.window.safeAreaInsets.bottom);
        Application.off(Application.launchEvent, onAppLaunch);
    };
    Application.on(Application.launchEvent, onAppLaunch);
}

export const sunnyColor = new Color('#FFC930');
export const nightColor = new Color('#845987');
export const scatteredCloudyColor = new Color('#cccccc');
export const cloudyColor = new Color('#929292');
export const rainColor = new Color('#4681C3');
export const snowColor = new Color('#43b4e0');

export const textColor = writable('');
export const borderColor = writable('');
export const textLightColor = writable('');
export const backgroundColor = writable('');
export const lightBackgroundColor = writable('');
export const subtitleColor = writable('');
export const iconColor = writable('');

export const imperial = writable(ApplicationSettings.getBoolean('imperial', false));
export const fontScale = writable(ApplicationSettings.getNumber('fontscale', 1));

export const onImperialChanged = createGlobalEventListener('imperial');
// export function onImperialChanged(callback: (imperial) => void) {
//     const eventCallack = (event) => callback(event.data);
//     globalObservable.on('imperial', eventCallack);
//     const component = get_current_component();
//     if (component) {
//         component.$$.on_destroy.push(() => {
//             globalObservable.off('imperial', eventCallack);
//         });
//     }
// }

prefs.on('key:imperial', () => {
    const newValue = ApplicationSettings.getBoolean('imperial');
    imperial.set(newValue);
    globalObservable.notify({ eventName: 'imperial', data: newValue });
});
prefs.on('key:fontscale', () => {
    const newValue = ApplicationSettings.getNumber('fontscale');
    fontScale.set(newValue);
});

export function updateThemeColors(theme: string) {
    DEV_LOG && console.log('updateThemeColors', theme);
    if (theme === 'dark' || theme === 'black') {
        textColor.set('#ffffff');
        textLightColor.set('#aaaaaa');
        borderColor.set('#cccccc55');
        subtitleColor.set('#aaaaaa');
        iconColor.set('#aaaaaa');
        if (theme === 'black') {
            backgroundColor.set('#000000');
            lightBackgroundColor.set('#1c1c1e');
        } else {
            backgroundColor.set('#1c1c1e');
            lightBackgroundColor.set('#313135');
        }
    } else {
        backgroundColor.set('#ffffff');
        lightBackgroundColor.set('#E0E0E0');
        textColor.set('#000000');
        textLightColor.set('#444444');
        borderColor.set('#cccccc99');
        subtitleColor.set('#444444');
        iconColor.set('#444444');
    }
}

// updateThemeColors(theme, true);
