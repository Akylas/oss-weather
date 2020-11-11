import { DomTraceCategory, registerNativeViewElement } from 'svelte-native/dom';
import { startSentry } from '~/utils/sentry';
startSentry();

import { install } from '~/utils/logging';
install();

import { setMapPosKeys } from '@nativescript-community/ui-carto/core';
// we need to use lat lon
setMapPosKeys('lat', 'lon');
import { installMixins as installUIMixins } from '@nativescript-community/systemui';
installUIMixins();

import { install as installBottomSheets } from '@nativescript-community/ui-material-bottomsheet';
installBottomSheets();

import { Label } from '@nativescript-community/ui-label';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
overrideSpanAndFormattedString();

registerNativeViewElement('textfield', () => require('@nativescript-community/ui-material-textfield').TextField, null, {}, { override: true });
registerNativeViewElement('mdbutton', () => require('@nativescript-community/ui-material-button').Button);
registerNativeViewElement('label', () => Label as any);
registerNativeViewElement('activityIndicator', () => require('@nativescript-community/ui-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('@nativescript-community/ui-chart/charts/LineChart').LineChart);
registerNativeViewElement('cartomap', () => require('@nativescript-community/ui-carto/ui').CartoMap);
registerNativeViewElement('lottie', () => require('@akylas/nativescript-lottie').LottieView);
registerNativeViewElement('pullrefresh', () => require('@akylas/nativescript-pulltorefresh').PullToRefresh);
registerNativeViewElement('canvas', () => require('@nativescript-community/ui-canvas').CanvasView);
registerNativeViewElement('line', () => require('@nativescript-community/ui-canvas/shapes/line').default);
registerNativeViewElement('image', () => require('@nativescript-community/ui-image').Img);
registerNativeViewElement('canvaslabel', () => require('@nativescript-community/ui-canvaslabel').CanvasLabel);
registerNativeViewElement('cspan', () => require('@nativescript-community/ui-canvaslabel').Span);
registerNativeViewElement('cgroup', () => require('@nativescript-community/ui-canvaslabel').Group);

import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
CollectionViewElement.register();


// import {Trace} from '@nativescript/core';
// Trace.addCategories(DomTraceCategory);
// Trace.addCategories(Trace.categories.NativeLifecycle);
// Trace.addCategories(Trace.categories.Transition);
// Trace.addCategories(Trace.categories.concat(Trace.categories.All));
// Trace.enable();
// import { Application } from '@nativescript/core';
import { start } from '~/helpers/theme';
// on startup we need to ensure theme is loaded because of a mixin
// on startup we need to say what we are using
start();


import { installMixins, themer } from '@nativescript-community/ui-material-core';
installMixins();
if (global.isIOS) {
    const variables = require('~/variables');
    const primaryColor = variables.primaryColor;
    themer.setPrimaryColor(primaryColor);
    themer.setAccentColor(primaryColor);
}

import { svelteNative } from 'svelte-native';
import WeatherPage from './WeatherPage.svelte';
import { applyTheme, theme } from './helpers/theme';
import { getString } from '@nativescript/core/application-settings';
import { updateThemeColors } from './variables';
svelteNative(WeatherPage, {});
