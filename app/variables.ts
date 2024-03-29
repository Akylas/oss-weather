import { isSimulator } from '@nativescript-community/extendedinfo';
import { Application, ApplicationSettings, Color, Observable, Screen, Utils } from '@nativescript/core';
import { get, writable } from 'svelte/store';
import { themer } from '@nativescript-community/ui-material-core';
import { onDestroy } from 'svelte';
import { getRealTheme, theme } from './helpers/theme';
import { prefs } from './services/preferences';
import { createGlobalEventListener, globalObservable } from './utils/svelte/ui';
import { getCurrentFontScale } from '@nativescript/core/accessibility/font-scale';

export const colors = writable({
    colorPrimary: '',
    colorOnPrimary: '',
    colorPrimaryContainer: '',
    colorOnPrimaryContainer: '',
    colorSecondary: '',
    colorOnSecondary: '',
    colorSecondaryContainer: '',
    colorOnSecondaryContainer: '',
    colorTertiary: '',
    colorOnTertiary: '',
    colorTertiaryContainer: '',
    colorOnTertiaryContainer: '',
    colorError: '',
    colorOnError: '',
    colorErrorContainer: '',
    colorOnErrorContainer: '',
    colorOutline: '',
    colorOutlineVariant: '',
    colorBackground: '',
    colorOnBackground: '',
    colorSurface: '',
    colorOnSurface: '',
    colorSurfaceVariant: '',
    colorOnSurfaceVariant: '',
    colorOnSurfaceVariant2: '',
    colorSurfaceInverse: '',
    colorOnSurfaceInverse: '',
    colorPrimaryInverse: '',
    colorSurfaceContainer: '',
    colorSurfaceBright: '',
    colorSurfaceDim: '',
    colorSurfaceContainerLow: '',
    colorSurfaceContainerLowest: '',
    colorSurfaceContainerHigh: '',
    colorSurfaceContainerHighest: '',
    colorWidgetBackground: '',
    colorOnSurfaceDisabled: '',
    popupMenuBackground: ''
});
export const fonts = writable({
    mdi: '',
    wi: '',
    app: ''
});
let innerStatusBarHeight = 20;
export const statusBarHeight = writable(innerStatusBarHeight);
export const actionBarButtonHeight = writable(0);
export const actionBarHeight = writable(0);
export const screenHeightDips = Screen.mainScreen.heightDIPs;
export const screenWidthDips = Screen.mainScreen.widthDIPs;
export const navigationBarHeight = writable(0);

export let globalMarginTop = 0;
export const systemFontScale = writable(1);

export const iconColor = new Color('#FFC82F');
export const sunnyColor = new Color('#FFC930');
export const nightColor = new Color('#845987');
export const scatteredCloudyColor = new Color('#cccccc');
export const cloudyColor = new Color('#929292');
export const rainColor = new Color('#4681C3');
export const snowColor = new Color('#43b4e0');

export let imperialUnits = ApplicationSettings.getBoolean('imperial', false);
export let metricDecimalTemp = ApplicationSettings.getBoolean('metric_temp_decimal', false);
export const imperial = writable(imperialUnits);
let storedFontScale = ApplicationSettings.getNumber('fontscale', 1);
export const fontScale = writable(storedFontScale || get(systemFontScale));
export const isRTL = writable(false);

export const onImperialChanged = createGlobalEventListener('imperial');

prefs.on('key:imperial', () => {
    imperialUnits = ApplicationSettings.getBoolean('imperial');
    imperial.set(imperialUnits);
    DEV_LOG && console.log('key:imperial', imperialUnits);
    globalObservable.notify({ eventName: 'imperial', data: imperialUnits });
});
prefs.on('key:metric_temp_decimal', () => {
    DEV_LOG && console.log('key:metric_temp_decimal', imperialUnits);
    metricDecimalTemp = ApplicationSettings.getBoolean('metric_temp_decimal');
    // we notify imperial to update ui
    globalObservable.notify({ eventName: 'imperial', data: imperialUnits });
});
prefs.on('key:fontscale', () => {
    storedFontScale = ApplicationSettings.getNumber('fontscale');
    if (storedFontScale === 1) {
        fontScale.set(get(systemFontScale));
    } else {
        fontScale.set(storedFontScale);
    }
});

function updateSystemFontScale(value) {
    systemFontScale.set(value);
    // console.log('updateSystemFontScale', value, storedFontScale);
    if (storedFontScale === 1) {
        fontScale.set(value);
    }
}

const onInitRootView = function () {
    // we need a timeout to read rootView css variable. not 100% sure why yet
    if (__ANDROID__) {
        // setTimeout(() => {
        const rootView = Application.getRootView();

        const rootViewStyle = rootView?.style;
        fonts.set({ mdi: rootViewStyle.getCssVariable('--mdiFontFamily'), app: rootViewStyle.getCssVariable('--appFontFamily'), wi: rootViewStyle.getCssVariable('--wiFontFamily') });
        actionBarHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarHeight')));
        actionBarButtonHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarButtonHeight')));
        const activity = Application.android.startActivity;
        const nUtils = com.akylas.weather.Utils;
        const nActionBarHeight = nUtils.getDimensionFromInt(activity, 16843499);
        if (nActionBarHeight > 0) {
            actionBarHeight.set(Utils.layout.toDeviceIndependentPixels(nActionBarHeight));
        }
        const resources = Utils.android.getApplicationContext().getResources();
        updateSystemFontScale(resources.getConfiguration().fontScale);
        const id = resources.getIdentifier('config_showNavigationBar', 'bool', 'android');
        let resourceId = resources.getIdentifier('navigation_bar_height', 'dimen', 'android');
        if (id > 0 && resourceId > 0 && (resources.getBoolean(id) || (!PRODUCTION && isSimulator()))) {
            navigationBarHeight.set(Utils.layout.toDeviceIndependentPixels(resources.getDimensionPixelSize(resourceId)));
        }
        isRTL.set(resources.getConfiguration().getLayoutDirection() === 1);
        resourceId = resources.getIdentifier('status_bar_height', 'dimen', 'android');
        if (id > 0 && resourceId > 0) {
            innerStatusBarHeight = Utils.layout.toDeviceIndependentPixels(resources.getDimensionPixelSize(resourceId));
            statusBarHeight.set(innerStatusBarHeight);
        }
        globalMarginTop = innerStatusBarHeight;
        // }, 0);
    }

    if (__IOS__) {
        const rootView = Application.getRootView();
        const rootViewStyle = rootView?.style;
        DEV_LOG && console.log('initRootView', rootView);
        fonts.set({ mdi: rootViewStyle.getCssVariable('--mdiFontFamily'), app: rootViewStyle.getCssVariable('--appFontFamily'), wi: rootViewStyle.getCssVariable('--wiFontFamily') });
        // DEV_LOG && console.log('fonts', get(fonts));
        updateSystemFontScale(getCurrentFontScale());
        Application.on(Application.fontScaleChangedEvent, (event) => updateSystemFontScale(event.newValue));
        DEV_LOG && console.log('getCurrentFontScale', getCurrentFontScale());
        actionBarHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarHeight')));
        actionBarButtonHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarButtonHeight')));
        navigationBarHeight.set(Application.ios.window.safeAreaInsets.bottom);
    }
    updateThemeColors(getRealTheme());
    // DEV_LOG && console.log('initRootView', get(navigationBarHeight), get(statusBarHeight), get(actionBarHeight), get(actionBarButtonHeight), get(fonts));
    Application.off(Application.initRootViewEvent, onInitRootView);
    // getRealThemeAndUpdateColors();
};
Application.on(Application.initRootViewEvent, onInitRootView);
Application.on('activity_started', () => {
    if (__ANDROID__) {
        const resources = Utils.android.getApplicationContext().getResources();
        isRTL.set(resources.getConfiguration().getLayoutDirection() === 1);
    }
});


export function updateThemeColors(theme: string) {
    DEV_LOG && console.log('updateThemeColors', theme);
    const currentColors = get(colors);
    let rootView = Application.getRootView();
    if (rootView?.parent) {
        rootView = rootView.parent as any;
    }
    const rootViewStyle = rootView?.style;
    if (!rootViewStyle) {
        return;
    }
    // rootViewStyle?.setUnscopedCssVariable('--systemFontScale', systemFontScale + '');
    if (__ANDROID__) {
        const nUtils = com.akylas.weather.Utils;
        const activity = Application.android.startActivity;
        // we also update system font scale so that our UI updates correcly
        updateSystemFontScale(Utils.android.getApplicationContext().getResources().getConfiguration().fontScale);
        Object.keys(currentColors).forEach((c) => {
            if (c.endsWith('Disabled')) {
                return;
            }
            if (c === 'colorBackground') {
                currentColors.colorBackground = new Color(nUtils.getColorFromInt(activity, 16842801)).hex;
            } else if (c === 'popupMenuBackground') {
                currentColors.popupMenuBackground = new Color(nUtils.getColorFromInt(activity, 16843126)).hex;
            } else {
                currentColors[c] = new Color(nUtils.getColorFromName(activity, c)).hex;
            }
        });
    } else {
        Object.keys(currentColors).forEach((c) => {
            currentColors[c] = rootViewStyle.getCssVariable('--' + c);
        });
        if (theme === 'dark' || theme === 'black') {
            currentColors.colorPrimary = '#FFC82F';
            currentColors.colorOnPrimary = '#3F2E00';
            currentColors.colorPrimaryContainer = '#5A4300';
            currentColors.colorOnPrimaryContainer = '#FFDF98';
            currentColors.colorSecondary = '#D7C5A0';
            currentColors.colorOnSecondary = '#3A2F15';
            currentColors.colorSecondaryContainer = '#52452A';
            currentColors.colorOnSecondaryContainer = '#F4E0BB';
            currentColors.colorBackground = theme === 'black' ? '#000000' : '#1E1B16';
            currentColors.colorOnBackground = '#E9E1D9';
            currentColors.colorSurface = '#1E1B16';
            currentColors.colorOnSurface = '#E9E1D9';
            currentColors.colorSurfaceInverse = '#FFFBFF';
            currentColors.colorOnSurfaceInverse = '#1E1B16';
            currentColors.colorOutline = '#999080';
            currentColors.colorOutlineVariant = '#4D4639';
            currentColors.colorSurfaceVariant = '#4D4639';
            currentColors.colorOnSurfaceVariant = '#D0C5B4';
            currentColors.colorSurfaceContainer = theme === 'black' ? '#000000' : '#1E1B16';
        } else {
            currentColors.colorPrimary = '#FFC82F';
            currentColors.colorOnPrimary = '#3F2E00';
            currentColors.colorPrimaryContainer = '#FFDF98';
            currentColors.colorOnPrimaryContainer = '#251A00';
            currentColors.colorSecondary = '#6A5D3F';
            currentColors.colorOnSecondary = '#FFFFFF';
            currentColors.colorSecondaryContainer = '#F4E0BB';
            currentColors.colorOnSecondaryContainer = '#241A04';
            currentColors.colorBackground = '#FFFBFF';
            currentColors.colorOnBackground = '#1E1B16';
            currentColors.colorSurface = '#FFFBFF';
            currentColors.colorOnSurface = '#1E1B16';
            currentColors.colorSurfaceInverse = '#1E1B16';
            currentColors.colorOnSurfaceInverse = '#E9E1D9';
            currentColors.colorOutline = '#7E7667';
            currentColors.colorOutlineVariant = '#D0C5B4';
            currentColors.colorSurfaceVariant = '#ECE1CF';
            currentColors.colorOnSurfaceVariant = '#4D4639';
            currentColors.colorSurfaceContainer = '#FFFBFF';
        }
        themer.setPrimaryColor(currentColors.colorPrimary);
        themer.setOnPrimaryColor(currentColors.colorOnPrimary);
        themer.setPrimaryColor(currentColors.colorPrimary);
        themer.setSecondaryColor(currentColors.colorSecondary);
        themer.setSurfaceColor(currentColors.colorSurface);
        themer.setOnSurfaceColor(currentColors.colorOnSurface);
    }

    currentColors.colorWidgetBackground = new Color(currentColors.colorSurfaceContainer).setAlpha(230).hex;
    currentColors.colorOnSurfaceDisabled = new Color(currentColors.colorOnSurface).setAlpha(50).hex;

    if (theme === 'black') {
        currentColors.colorBackground = '#000000';
    }

    if (theme === 'dark') {
        currentColors.colorSurfaceContainerHigh = new Color(currentColors.colorSurfaceContainer).lighten(3).hex;
        currentColors.colorSurfaceContainerHighest = new Color(currentColors.colorSurfaceContainer).lighten(6).hex;
    } else {
        currentColors.colorSurfaceContainerHigh = new Color(currentColors.colorSurfaceContainer).darken(3).hex;
        currentColors.colorSurfaceContainerHighest = new Color(currentColors.colorSurfaceContainer).darken(6).hex;
    }
    currentColors.colorOnSurfaceVariant2 = new Color(currentColors.colorOnSurfaceVariant).setAlpha(170).hex;
    Object.keys(currentColors).forEach((c) => {
        rootViewStyle?.setUnscopedCssVariable('--' + c, currentColors[c]);
    });
    colors.set(currentColors);

    Application.notify({ eventName: 'colorsChange', colors: currentColors });
    DEV_LOG && console.log('changed colors', rootView, JSON.stringify(currentColors));
    rootView?._onCssStateChange();
    const rootModalViews = rootView?._getRootModalViews();
    rootModalViews.forEach((rootModalView) => rootModalView._onCssStateChange());
}
