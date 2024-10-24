import { AppUtilsAndroid } from '@akylas/nativescript-app-utils';
import { themer } from '@nativescript-community/ui-material-core';
import { Application, ApplicationSettings, Color, Frame, Page, Screen, Utils } from '@nativescript/core';
import { getCurrentFontScale } from '@nativescript/core/accessibility/font-scale';
import { createGlobalEventListener, globalObservable } from '@shared/utils/svelte/ui';
import { get, writable } from 'svelte/store';
import { DECIMAL_METRICS_TEMP, SETTINGS_IMPERIAL, SETTINGS_UNITS, WEATHER_DATA_LAYOUT } from '~/helpers/constants';
import { getRealTheme } from '~/helpers/theme';
import { DEFAULT_IMPERIAL_UINTS, DEFAULT_METRIC_UINTS } from '~/helpers/units';
import { prefs } from '~/services/preferences';

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
export const windowInset = writable({ top: 0, left: 0, right: 0, bottom: 0 });
export const actionBarButtonHeight = writable(0);
export const actionBarHeight = writable(0);
export const screenHeightDips = Screen.mainScreen.heightDIPs;
export const screenWidthDips = Screen.mainScreen.widthDIPs;

export const systemFontScale = writable(1);

export const iconColor = new Color('#FFC82F');
export const sunnyColor = new Color('#FFC930');
// export const nightColor = new Color('#845987');
export const scatteredCloudyColor = new Color('#aaa');
export const cloudyColor = new Color('#929292');
export const rainColor = new Color('#4681C3');
export const snowColor = new Color('#43b4e0');

export let imperialUnits = ApplicationSettings.getBoolean(SETTINGS_IMPERIAL, false);
export let metricDecimalTemp = ApplicationSettings.getBoolean('metric_temp_decimal', DECIMAL_METRICS_TEMP);
export const weatherDataLayout = writable(ApplicationSettings.getString('weather_data_layout', WEATHER_DATA_LAYOUT));
export const imperial = writable(imperialUnits);
let storedFontScale = ApplicationSettings.getNumber('fontscale', 1);
export const fontScale = writable(storedFontScale);
export const isRTL = writable(false);

export const onUnitsChanged = createGlobalEventListener(SETTINGS_UNITS);
export const onFontScaleChanged = createGlobalEventListener('fontscale');
export function onSettingsChanged(key: string, callback) {
    return createGlobalEventListener(key)(callback);
}

function getUintSettingsData() {
    const defaultData = imperialUnits ? DEFAULT_IMPERIAL_UINTS : DEFAULT_METRIC_UINTS;
    const unitsSettingsStr = ApplicationSettings.getString(SETTINGS_UNITS);

    const newData = JSON.parse(unitsSettingsStr || JSON.stringify(defaultData));
    Object.keys(defaultData).forEach((k) => {
        if (!newData[k]) {
            newData[k] = defaultData[k];
        }
    });
    // ApplicationSettings.setString(SETTINGS_UNITS, JSON.stringify(newData));
    DEV_LOG && console.log('getUintSettingsData', newData);
    return newData;
}
export const unitsSettings = getUintSettingsData();
export const unitsSettingsStore = writable(unitsSettings);

function updateUnits() {
    Object.assign(unitsSettings, getUintSettingsData());
    unitsSettingsStore.set(unitsSettings);
    DEV_LOG && console.log('updateUnits', unitsSettings);

    globalObservable.notify({ eventName: SETTINGS_UNITS, data: unitsSettings });
}
prefs.on(`key:${SETTINGS_IMPERIAL}`, () => {
    imperialUnits = ApplicationSettings.getBoolean(SETTINGS_IMPERIAL);
    imperial.set(imperialUnits);
    DEV_LOG && console.log('key:imperial', imperialUnits);
    ApplicationSettings.remove(SETTINGS_UNITS);
    updateUnits();
});
prefs.on(`key:${SETTINGS_UNITS}`, () => {
    DEV_LOG && console.warn('key:units', imperialUnits);
    updateUnits();
});
prefs.on('key:metric_temp_decimal', () => {
    metricDecimalTemp = ApplicationSettings.getBoolean('metric_temp_decimal', DECIMAL_METRICS_TEMP);
    DEV_LOG && console.log('key:metric_temp_decimal', imperialUnits, metricDecimalTemp);
    // we notify imperial to update ui
    globalObservable.notify({ eventName: SETTINGS_IMPERIAL, data: imperialUnits });
});
prefs.on('key:weather_data_layout', () => {
    weatherDataLayout.set(ApplicationSettings.getString('weather_data_layout', WEATHER_DATA_LAYOUT));
    DEV_LOG && console.log('key:weather_data_layout', weatherDataLayout);
    // we notify imperial to update ui
    globalObservable.notify({ eventName: 'weather_data_layout', data: weatherDataLayout });
});
prefs.on('key:feels_like_temperatures', () => {
    globalObservable.notify({ eventName: 'feels_like_temperatures', data: ApplicationSettings.getBoolean('feels_like_temperatures') });
});
prefs.on('key:show_current_day_daily', () => {
    globalObservable.notify({ eventName: 'show_current_day_daily', data: ApplicationSettings.getBoolean('show_current_day_daily') });
});
prefs.on('key:fontscale', () => {
    storedFontScale = ApplicationSettings.getNumber('fontscale', 1);
    if (storedFontScale === 1) {
        fontScale.set(get(systemFontScale));
    } else {
        fontScale.set(storedFontScale);
    }
    globalObservable.notify({ eventName: 'fontscale', data: get(fontScale) });
});

function updateSystemFontScale(value) {
    value = value || 1; // forbid 0
    systemFontScale.set(value);
    // console.log('updateSystemFontScale', value, storedFontScale);
    if (storedFontScale === 1) {
        fontScale.set(value);
    }
    globalObservable.notify({ eventName: 'fontscale', data: get(fontScale) });
}

function getRootViewStyle() {
    let rootView = Application.getRootView();
    if (rootView?.parent) {
        rootView = rootView.parent as any;
    }
    return rootView?.style;
}

if (__ANDROID__) {
    Application.android.on(Application.android.activityCreateEvent, (event) => {
        AppUtilsAndroid.prepareActivity(event.activity);
    });
    Page.on('shownModally', function (event) {
        AppUtilsAndroid.prepareWindow(event.object['_dialogFragment'].getDialog().getWindow());
    });
    Frame.on('shownModally', function (event) {
        AppUtilsAndroid.prepareWindow(event.object['_dialogFragment'].getDialog().getWindow());
    });
}
let initRootViewCalled = false;
export function onInitRootViewFromEvent() {
    onInitRootView();
}
export function onInitRootView(force = false) {
    DEV_LOG && console.log('onInitRootView', force, initRootViewCalled);
    if (!force && initRootViewCalled) {
        return;
    }
    // we need a timeout to read rootView css variable. not 100% sure why yet
    if (__ANDROID__) {
        // setTimeout(() => {
        const rootViewStyle = getRootViewStyle();
        const rootView = Application.getRootView();
        DEV_LOG && console.log('onInitRootView', rootView);
        if (rootView) {
            AppUtilsAndroid.listenForWindowInsets((inset) => {
                windowInset.set({
                    top: Utils.layout.toDeviceIndependentPixels(inset[0]),
                    bottom: Utils.layout.toDeviceIndependentPixels(Math.max(inset[1], inset[4])),
                    left: Utils.layout.toDeviceIndependentPixels(inset[2]),
                    right: Utils.layout.toDeviceIndependentPixels(inset[3])
                });
            });
        }
        fonts.set({ mdi: rootViewStyle.getCssVariable('--mdiFontFamily'), app: rootViewStyle.getCssVariable('--appFontFamily'), wi: rootViewStyle.getCssVariable('--wiFontFamily') });

        const context = Utils.android.getApplicationContext();

        const resources = context.getResources();
        updateSystemFontScale(resources.getConfiguration().fontScale);
        isRTL.set(resources.getConfiguration().getLayoutDirection() === 1);

        // ActionBar
        // resourceId = resources.getIdentifier('status_bar_height', 'dimen', 'android');
        let nActionBarHeight = Utils.layout.toDeviceIndependentPixels(AppUtilsAndroid.getDimensionFromInt(context, 16843499 /* actionBarSize */));
        // let nActionBarHeight = 0;
        // if (resourceId > 0) {
        //     nActionBarHeight = Utils.layout.toDeviceIndependentPixels(resources.getDimensionPixelSize(resourceId));
        // }
        if (nActionBarHeight > 0) {
            actionBarHeight.set(nActionBarHeight);
            rootViewStyle?.setUnscopedCssVariable('--actionBarHeight', nActionBarHeight + '');
        } else {
            nActionBarHeight = parseFloat(rootViewStyle.getCssVariable('--actionBarHeight'));
            actionBarHeight.set(nActionBarHeight);
        }
        const nActionBarButtonHeight = nActionBarHeight - 10;
        actionBarButtonHeight.set(nActionBarButtonHeight);
        rootViewStyle?.setUnscopedCssVariable('--actionBarButtonHeight', nActionBarButtonHeight + '');
        DEV_LOG && console.log('actionBarHeight', nActionBarHeight);
    }

    if (__IOS__) {
        const rootView = Application.getRootView();
        initRootViewCalled = !!rootView;
        const rootViewStyle = rootView?.style;
        DEV_LOG && console.log('initRootView', rootView);
        fonts.set({ mdi: rootViewStyle.getCssVariable('--mdiFontFamily'), app: rootViewStyle.getCssVariable('--appFontFamily'), wi: rootViewStyle.getCssVariable('--wiFontFamily') });
        // DEV_LOG && console.log('fonts', get(fonts));
        updateSystemFontScale(getCurrentFontScale());
        Application.on(Application.fontScaleChangedEvent, (event) => updateSystemFontScale(event.newValue));
        actionBarHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarHeight')));
        actionBarButtonHeight.set(parseFloat(rootViewStyle.getCssVariable('--actionBarButtonHeight')));
        updateIOSWindowInset();
    }
    updateThemeColors(getRealTheme());
    // DEV_LOG && console.log('initRootView', get(navigationBarHeight), get(statusBarHeight), get(actionBarHeight), get(actionBarButtonHeight), get(fonts));
    Application.off(Application.initRootViewEvent, onInitRootViewFromEvent);
    // getRealThemeAndUpdateColors();
}

function updateIOSWindowInset() {
    if (__IOS__) {
        setTimeout(() => {
            const safeAreaInsets = Application.getRootView().nativeViewProtected.safeAreaInsets;
            windowInset.set({
                left: Utils.layout.round(Utils.layout.toDevicePixels(safeAreaInsets.left)),
                top: Utils.layout.round(Utils.layout.toDevicePixels(safeAreaInsets.top)),
                right: Utils.layout.round(Utils.layout.toDevicePixels(safeAreaInsets.right)),
                bottom: Utils.layout.round(Utils.layout.toDevicePixels(safeAreaInsets.bottom))
            });
            DEV_LOG && console.log('updateIOSWindowInset', get(windowInset));
        }, 0);
    }
}
function onOrientationChanged() {
    if (__ANDROID__) {
        const rootViewStyle = getRootViewStyle();
        const context = Utils.android.getApplicationContext();

        const nActionBarHeight = Utils.layout.toDeviceIndependentPixels(AppUtilsAndroid.getDimensionFromInt(context, 16843499 /* actionBarSize */));
        if (nActionBarHeight > 0) {
            actionBarHeight.set(nActionBarHeight);
            rootViewStyle?.setUnscopedCssVariable('--actionBarHeight', nActionBarHeight + '');
        }
        const nActionBarButtonHeight = nActionBarHeight - 10;
        actionBarButtonHeight.set(nActionBarButtonHeight);
        rootViewStyle?.setUnscopedCssVariable('--actionBarButtonHeight', nActionBarButtonHeight + '');
    } else {
        updateIOSWindowInset();
    }
}
Application.on(Application.initRootViewEvent, onInitRootViewFromEvent);
Application.on(Application.orientationChangedEvent, onOrientationChanged);
if (__ANDROID__) {
    Application.android.on(Application.android.activityStartedEvent, () => {
        const resources = Utils.android.getApplicationContext().getResources();
        isRTL.set(resources.getConfiguration().getLayoutDirection() === 1);
    });
}

let lastThemeColor: string;
export function updateThemeColors(theme: string, force = false) {
    DEV_LOG && console.log('updateThemeColors', theme);
    let rootView = Application.getRootView();
    if (rootView?.parent) {
        rootView = rootView.parent as any;
    }
    const rootViewStyle = rootView?.style;
    if (!rootViewStyle || !theme) {
        return;
    }
    // if (!force && lastThemeColor === theme) {
    //     return;
    // }
    lastThemeColor = theme;
    const currentColors = get(colors);
    // rootViewStyle?.setUnscopedCssVariable('--systemFontScale', systemFontScale + '');
    if (__ANDROID__) {
        const activity = Application.android.startActivity;
        // we also update system font scale so that our UI updates correcly
        updateSystemFontScale(Utils.android.getApplicationContext().getResources().getConfiguration().fontScale);
        Object.keys(currentColors).forEach((c) => {
            if (c.endsWith('Disabled')) {
                return;
            }
            if (c === 'colorBackground') {
                currentColors.colorBackground = new Color(AppUtilsAndroid.getColorFromInt(activity, 16842801)).hex;
            } else if (c === 'popupMenuBackground') {
                currentColors.popupMenuBackground = new Color(AppUtilsAndroid.getColorFromInt(activity, 16843126)).hex;
            } else {
                currentColors[c] = new Color(AppUtilsAndroid.getColorFromName(activity, c)).hex;
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
