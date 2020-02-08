import { DomTraceCategory, registerElement, registerNativeViewElement } from 'svelte-native/dom';
import { startSentry } from '~/utils/sentry';

// import { setMapPosKeys } from 'nativescript-carto/core';
// we need to use lat lon
// setMapPosKeys('lat', 'lon');
// import { installMixins as installUIMixins } from 'nativescript-systemui';
// installUIMixins();

registerNativeViewElement('textfield', () => require('nativescript-material-textfield').TextField);
// registerNativeViewElement('button', () => require('nativescript-material-button').Button);
// registerNativeViewElement('label', () => require('nativescript-htmllabel').Label);
// registerNativeViewElement('activityIndicator', () => require('nativescript-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('nativescript-chart/charts/LineChart').default);

import CollectionViewElement from './collectionview';
CollectionViewElement.register();
// registerElement('collectionview', () => new CollectionViewElement());

import { addCategories, enable } from 'tns-core-modules/trace';
addCategories(DomTraceCategory);
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

import Theme from '@nativescript/theme';
Theme.setMode(Theme.Dark); // Or Theme.Light
if (gVars.isAndroid) {
    androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES);
}
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
import App from './App.svelte';
import App2 from './App2.svelte';
svelteNative(App, {});
