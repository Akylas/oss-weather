import { locals } from '~/variables.module.scss';
import { screen } from '@nativescript/core/platform';
import { ad } from '@nativescript/core/utils/utils';
import { prefs } from '~/services/preferences';

console.log('loading variables', locals);

export const primaryColor: string = locals.primaryColor;
export const glassesColor: string = locals.glassesColor;
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
export const screenHeightDips = screen.mainScreen.heightDIPs;
export const screenWidthDips = screen.mainScreen.widthDIPs;
export let navigationBarHeight: number = parseFloat(locals.navigationBarHeight);

if (gVars.isAndroid) {
    const context: android.content.Context = ad.getApplicationContext();
    const hasPermanentMenuKey = android.view.ViewConfiguration.get(context).hasPermanentMenuKey();
    if (hasPermanentMenuKey) {
        navigationBarHeight = 0;
    }
} else {
    navigationBarHeight = 0;
}

export let textColor;
export let textLightColor;

let theme;
function updateThemeColors() {
    theme = prefs.getValue('theme', 'dark') ;
    if (theme === 'light') {
        textColor = '#000000';
        textLightColor = '#444444';
    } else {
        textColor = '#ffffff';
        textLightColor = '#aaaaaa';
    }
}

updateThemeColors();
prefs.on('key:theme', updateThemeColors);
