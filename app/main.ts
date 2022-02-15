// (com as any).tns.Runtime.getCurrentRuntime().enableVerboseLogging();
import { DomTraceCategory, FrameElement, NativeElementPropType, PageElement, registerElement, registerNativeViewElement } from 'svelte-native/dom';
// import { startSentry } from '~/utils/sentry';
// import { install } from '~/utils/logging';
// startSentry();
// install();
import './app.scss';

import { overrideSpanAndFormattedString } from '@nativescript-community/text';
overrideSpanAndFormattedString();

// we need to use lat lon
import { installMixins as installUIMixins } from '@nativescript-community/systemui';
installUIMixins();

import { install as installBottomSheets } from '@nativescript-community/ui-material-bottomsheet';
installBottomSheets();

import { Label } from '@nativescript-community/ui-label';
registerElement('Frame', () => new FrameElement());
registerElement('Page', () => new PageElement());
registerNativeViewElement('AbsoluteLayout', () => require('@nativescript/core').AbsoluteLayout);
registerNativeViewElement('GridLayout', () => require('@nativescript/core').GridLayout);
registerNativeViewElement('image', () => require('@nativescript/core').Image);
registerNativeViewElement('ScrollView', () => require('@nativescript/core').ScrollView);
registerNativeViewElement('StackLayout', () => require('@nativescript/core').StackLayout);
// registerNativeViewElement('FlexboxLayout', () => require('@nativescript/core').FlexboxLayout);
registerNativeViewElement('Switch', () => require('@nativescript/core').Switch);
registerNativeViewElement('TextField', () => require('@nativescript/core').TextField);
registerNativeViewElement('WebView', () => require('@nativescript/core').WebView);

// registerNativeViewElement('mdtextfield', () => TextField, null, {}, { override: true });
registerNativeViewElement(
    'formattedstring',
    () => require('@nativescript-community/text').LightFormattedString,
    'formattedText',
    {
        spans: NativeElementPropType.ObservableArray
    },
    { override: true }
);
// registerNativeViewElement('FormattedString', () => require('@nativescript/core').FormattedString, 'formattedText', {
//     spans: NativeElementPropType.ObservableArray
// });
registerNativeViewElement('Span', () => require('@nativescript/core').Span, 'spans');
registerNativeViewElement('textfield', () => require('@nativescript-community/ui-material-textfield').TextField, null, {}, { override: true });
registerNativeViewElement('mdbutton', () => require('@nativescript-community/ui-material-button').Button);
registerNativeViewElement('label', () => Label as any, null, {}, { override: true });
registerNativeViewElement('activityIndicator', () => require('@nativescript-community/ui-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('@nativescript-community/ui-chart/charts/LineChart').LineChart);
registerNativeViewElement('lottie', () => require('@nativescript-community/ui-lottie').LottieView);
registerNativeViewElement('pullrefresh', () => require('@nativescript-community/ui-pulltorefresh').PullToRefresh);
registerNativeViewElement('canvas', () => require('@nativescript-community/ui-canvas').CanvasView);
registerNativeViewElement('line', () => require('@nativescript-community/ui-canvas/shapes/line').default);
registerNativeViewElement('rectangle', () => require('@nativescript-community/ui-canvas/shapes/rectangle').default);
// registerNativeViewElement('image', () => require('@nativescript-community/ui-image').Img, null, {}, { override: true });
registerNativeViewElement('canvaslabel', () => require('@nativescript-community/ui-canvaslabel').CanvasLabel);
registerNativeViewElement('cspan', () => require('@nativescript-community/ui-canvaslabel').Span);
registerNativeViewElement('cgroup', () => require('@nativescript-community/ui-canvaslabel').Group);

import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
CollectionViewElement.register();

// import { Trace } from '@nativescript/core';
// Trace.addCategories(DomTraceCategory);
// Trace.addCategories(Trace.categories.NativeLifecycle);
// Trace.addCategories(Trace.categories.Transition);
// Trace.addCategories(Trace.categories.Animation);
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

themer.createShape('round', {
    cornerFamily: 'rounded' as any,
    cornerSize: {
        value: 0.5,
        unit: '%'
    }
});

import { svelteNative } from 'svelte-native';
import WeatherPage from './components/WeatherPage.svelte';
svelteNative(WeatherPage, {});
