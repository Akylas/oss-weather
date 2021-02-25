import { Application } from '@nativescript/core';
import { Screen } from '@nativescript/core/platform';
import { ad } from '@nativescript/core/utils/utils';
import { writable } from 'svelte/store';
import CSSLoader from '~/variables.module.scss';

const locals = CSSLoader.locals;
// console.log('loading variables', locals);

export const primaryColor: string = locals.primaryColor;
export const accentColor: string = locals.accentColor;
export const darkColor: string = locals.darkColor;
export const backgroundColor: string = locals.backgroundColor;
export const latoFontFamily: string = locals.latoFontFamily;
export const wiFontFamily: string = locals.wiFontFamily;

export const mdiFontFamily: string = locals.mdiFontFamily;
export const forecastFontFamily: string = locals.forecastFontFamily;
export const actionBarHeight: number = parseFloat(locals.actionBarHeight);
export const statusBarHeight: number = parseFloat(locals.statusBarHeight);
export const actionBarButtonHeight: number = parseFloat(locals.actionBarButtonHeight);
export const screenHeightDips = Screen.mainScreen.heightDIPs;
export const screenWidthDips = Screen.mainScreen.widthDIPs;
export const screenScale = Screen.mainScreen.scale;
export let navigationBarHeight: number = parseFloat(locals.navigationBarHeight);

if (global.isAndroid) {
    const context: android.content.Context = ad.getApplicationContext();
    const hasPermanentMenuKey = android.view.ViewConfiguration.get(context).hasPermanentMenuKey();
    if (hasPermanentMenuKey) {
        navigationBarHeight = 0;
    }
} else {
    navigationBarHeight = 0;
}

export const sunnyColor = '#FFC82F';
export const nightColor = '#845987';
export const scatteredCloudyColor = '#cccccc';
export const cloudyColor = '#929292';
export const rainColor = '#4681C3';
export const snowColor = '#43b4e0';
export const textColor = writable('');
export const borderColor = writable('');
export const textLightColor = writable('');

export const subtitleColor = writable('');
export const iconColor = writable('');

export function updateThemeColors(theme: string, force = false) {
    // console.log('updateThemeColors', theme, force);
    try {
        if (!force) {
            theme = Application.systemAppearance();
            // console.log('systemAppearance', theme);
        }
    } catch(err) {
        console.error('updateThemeColors', err);
    }
    if (theme === 'dark') {
        textColor.set('#ffffff');
        textLightColor.set('#aaaaaa');
        borderColor.set('#55cccccc');
        subtitleColor.set('#aaaaaa');
        iconColor.set('#aaaaaa');
    } else {
        textColor.set('#000000');
        textLightColor.set('#444444');
        borderColor.set('#55cccccc');
        subtitleColor.set('#444444');
        iconColor.set('#444444');
    }
}

// updateThemeColors(theme, true);
