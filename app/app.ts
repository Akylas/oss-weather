import { DomTraceCategory, registerNativeViewElement } from 'svelte-native/dom';
import { startSentry } from '~/utils/sentry';
import { device } from '@nativescript/core/platform';

import { setMapPosKeys } from 'nativescript-carto/core';
// we need to use lat lon
setMapPosKeys('lat', 'lon');
import { installMixins as installUIMixins } from 'nativescript-systemui';
installUIMixins();

import { install as installBottomSheets } from 'nativescript-material-bottomsheet';
installBottomSheets();

import { Label, enableIOSDTCoreText } from 'nativescript-htmllabel';
enableIOSDTCoreText();


registerNativeViewElement('textfield', () => require('nativescript-material-textfield').TextField, null, {}, { override: true });
registerNativeViewElement('button', () => require('nativescript-material-button').Button);
registerNativeViewElement('label', () => Label);
registerNativeViewElement('activityIndicator', () => require('nativescript-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('nativescript-chart/charts/LineChart').default);
registerNativeViewElement('cartomap', () => require('nativescript-carto/ui').CartoMap);
registerNativeViewElement('lottie', () => require('nativescript-akylas-lottie').LottieView);
registerNativeViewElement('pullrefresh', () => require('nativescript-akylas-pulltorefresh').PullToRefresh);
registerNativeViewElement('canvas', () => require('nativescript-canvas').CanvasView);
registerNativeViewElement('canvaslabel', () => require('nativescript-canvaslabel').CanvasLabel);
registerNativeViewElement('cspan', () => require('nativescript-canvaslabel').Span);
registerNativeViewElement('cgroup', () => require('nativescript-canvaslabel').Group);
import CollectionViewElement from 'nativescript-collectionview/svelte';
CollectionViewElement.register();
startSentry();


// import {addCategories, enable} from '@nativescript/core/trace';
// addCategories(DomTraceCategory);
// enable();

import { prefs } from '~/services/preferences';
import { getString } from '@nativescript/core/application-settings';
import Theme from '@nativescript/theme';
import { android as androidApp, ios as iosApp, on as onApp, systemAppearance } from '@nativescript/core/application';

type Themes = 'auto' | 'light' | 'dark' | 'black';
const ThemeBlack = 'ns-black';
function applyTheme(theme: Themes) {
    const AppCompatDelegate = gVars.isAndroid ? androidx.appcompat.app.AppCompatDelegate : undefined;
    const window = gVars.isIOS ? iosApp.window : undefined;
    switch (theme) {
        case 'auto':
            Theme.setMode(Theme.Auto);
            if (gVars.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Unspecified;
            }
            break;
        case 'light':
            Theme.setMode(Theme.Light);
            if (gVars.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Light;
            }
            break;
        case 'dark':
            Theme.setMode(Theme.Dark);
            if (gVars.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
        case 'black':
            Theme.setMode(ThemeBlack);
            if (gVars.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
    }
}
let theme: Themes;
if (gVars.isIOS) {
    const sdkVersion = device.sdkVersion;
    if (parseFloat(sdkVersion) >= 13) {
        theme = getString('theme', 'dark') as Themes;
    } else {
        theme = 'light';
    }
} else {
    theme = getString('theme', 'dark') as Themes;
}

// on startup we need to say what we are using
console.log('applying app theme', theme);
onApp('launch', () => {
    applyTheme(theme);
});
prefs.on('key:theme', () => {
    const newTheme = getString('theme') as Themes;
    // on pref change we are updating
    if (newTheme === theme) {
        return;
    }
    console.log('theme change', theme, newTheme);
    theme = newTheme;
    applyTheme(newTheme);
    if (gVars.isAndroid) {
        // we recreate the activity to get the change
        const activity = androidApp.startActivity as androidx.appcompat.app.AppCompatActivity;
        activity.recreate();
    }
});

import { installMixins, themer } from 'nativescript-material-core';
installMixins();
if (gVars.isIOS) {
    const variables = require('~/variables');
    const primaryColor = variables.primaryColor;
    themer.setPrimaryColor(primaryColor);
    themer.setAccentColor(primaryColor);
}

import { svelteNative } from 'svelte-native';
import WeatherPage from './WeatherPage.svelte';
svelteNative(WeatherPage, {});
