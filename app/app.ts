import { registerNativeViewElement } from 'svelte-native/dom';
import { startSentry } from '~/utils/sentry';

import { setMapPosKeys } from 'nativescript-carto/core';
// we need to use lat lon
setMapPosKeys('lat', 'lon');
import { installMixins as installUIMixins } from 'nativescript-systemui';
installUIMixins();

import { install as installBottomSheets } from 'nativescript-material-bottomsheet';
installBottomSheets();

registerNativeViewElement('textfield', () => require('nativescript-material-textfield').TextField);
registerNativeViewElement('button', () => require('nativescript-material-button').Button);
registerNativeViewElement('label', () => require('nativescript-htmllabel').Label);
registerNativeViewElement('activityIndicator', () => require('nativescript-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('nativescript-chart/charts/LineChart').default);
registerNativeViewElement('cartomap', () => require('nativescript-carto/ui').CartoMap);
registerNativeViewElement('lottie', () => require('nativescript-akylas-lottie').LottieView);
registerNativeViewElement('pullrefresh', () => require('nativescript-akylas-pulltorefresh').PullToRefresh);

import CollectionViewElement from './collectionview';
CollectionViewElement.register();
// registerElement('collectionview', () => new CollectionViewElement());

// import { addCategories, enable } from 'tns-core-modules/trace';
// addCategories(DomTraceCategory);
// enable();

// import { ScrollView } from '@nativescript/core/ui/scroll-view';

// if (gVars.isAndroid) {
//     class NestedScrollView extends ScrollView {
//         createNativeView() {
//             return new androidx.core.widget.NestedScrollView(this._context);
//         }
//     }
//     registerNativeViewElement('nestedScrollView', () => NestedScrollView);
// } else {
//     registerNativeViewElement('nestedScrollView', () => ScrollView);
// }

startSentry();

import { prefs } from '~/services/preferences';
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

// theme = 'light';
theme = prefs.getValue('theme', 'dark') || 'dark';
// on startup we need to say what we are using
console.log('applying app theme', theme);
onApp('launch', () => {
    applyTheme(theme);
});
prefs.on('key:theme', () => {
    const newTheme = prefs.getValue('theme') as Themes;
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

// if (gVars.isIOS) {
//     class Path {
//         path_;
//         constructor() {
//             this.path_ = CGPathCreateMutable();
//             CGPathMoveToPoint(this.path_, null, 0, 0);
//         }

//         lineTo(x, y) {
//             CGPathAddLineToPoint(this.path_, null, x, y);
//         }
//     }

//     const count = 400;
//     const point = new Path();
//     console.time('perf');
//     for (let x = 0; x < count; x++) {
//         for (let y = 0; y < count; y++) {
//             point.lineTo(x, y);
//         }
//     }
//     console.timeEnd('perf');
// }

import { svelteNative } from 'svelte-native';
import WeatherPage from './WeatherPage.svelte';
svelteNative(WeatherPage, {});
