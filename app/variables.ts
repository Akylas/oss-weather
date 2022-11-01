import { Application, Color, Observable } from '@nativescript/core';
import { getBoolean } from '@nativescript/core/application-settings';
import { Screen } from '@nativescript/core/platform';
import { ad } from '@nativescript/core/utils/utils';
import { get_current_component } from 'svelte/internal';
import { writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
import CSSLoader from '~/variables.module.scss';

const locals = CSSLoader.locals;

export const globalObservable = new Observable();

export function createGlobalEventListener(eventName: string) {
    return function (callback) {
        const eventCallack = (event) => callback(event.data);
        globalObservable.on(eventName, eventCallack);
        const component = get_current_component();
        if (component) {
            component.$$.on_destroy.push(() => {
                globalObservable.off(eventName, eventCallack);
            });
        }
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
export const statusBarHeight: number = parseFloat(locals.statusBarHeight);
export const actionBarButtonHeight: number = parseFloat(locals.actionBarButtonHeight);
export const screenHeightDips = Screen.mainScreen.heightDIPs;
export const screenWidthDips = Screen.mainScreen.widthDIPs;
export const screenScale = Screen.mainScreen.scale;
export let navigationBarHeight: number = parseFloat(locals.navigationBarHeight);

if (__ANDROID__) {
    const context: android.content.Context = ad.getApplicationContext();
    const hasPermanentMenuKey = android.view.ViewConfiguration.get(context).hasPermanentMenuKey();
    if (hasPermanentMenuKey) {
        navigationBarHeight = 0;
    }
} else {
    navigationBarHeight = 0;
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
export const subtitleColor = writable('');
export const iconColor = writable('');

export const imperial = writable(getBoolean('imperial', false));

export function onImperialChanged(callback: (imperial) => void) {
    const eventCallack = (event) => callback(event.data);
    globalObservable.on('imperial', eventCallack);
    const component = get_current_component();
    if (component) {
        component.$$.on_destroy.push(() => {
            globalObservable.off('imperial', eventCallack);
        });
    }
}

prefs.on('key:imperial', () => {
    const newImperial = getBoolean('imperial');
    imperial.set(newImperial);
    globalObservable.notify({ eventName: 'imperial', data: newImperial });
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
        } else {
            backgroundColor.set('#1c1c1e');
        }
    } else {
        backgroundColor.set('#ffffff');
        textColor.set('#000000');
        textLightColor.set('#444444');
        borderColor.set('#cccccc99');
        subtitleColor.set('#444444');
        iconColor.set('#444444');
    }
}

// updateThemeColors(theme, true);
