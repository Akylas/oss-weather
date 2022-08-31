// (com as any).tns.Runtime.getCurrentRuntime().enableVerboseLogging();
// we need to use lat lon
import { installMixins as installUIMixins } from '@nativescript-community/systemui';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
import { Label } from '@nativescript-community/ui-label';
import { install as installBottomSheets } from '@nativescript-community/ui-material-bottomsheet';
import { installMixins, themer } from '@nativescript-community/ui-material-core';
import { ScrollView, Trace } from '@nativescript/core';
import { svelteNative } from 'svelte-native';
import { FrameElement, NativeElementPropType, PageElement, registerElement, registerNativeViewElement } from 'svelte-native/dom';
import WeatherPage from '~/components/WeatherPage.svelte';
// import { Application } from '@nativescript/core';
import { start as startThemeHelper } from '~/helpers/theme';
// import { startSentry } from '~/utils/sentry';
// import { install } from '~/utils/logging';
import './app.scss';

// startSentry();
overrideSpanAndFormattedString();
installMixins();
installUIMixins();
installBottomSheets();

class NestedScrollView extends ScrollView {
    createNativeView() {
        if (__ANDROID__) {
            return new androidx.core.widget.NestedScrollView(this._context);
        }
        return super.createNativeView();
    }
}
registerElement('Frame', () => new FrameElement());
registerElement('Page', () => new PageElement());
registerNativeViewElement('AbsoluteLayout', () => require('@nativescript/core').AbsoluteLayout);
registerNativeViewElement('GridLayout', () => require('@nativescript/core').GridLayout);
registerNativeViewElement('image', () => require('@nativescript/core').Image);
registerNativeViewElement('ScrollView', () => NestedScrollView);
registerNativeViewElement('StackLayout', () => require('@nativescript/core').StackLayout);
// registerNativeViewElement('FlexboxLayout', () => require('@nativescript/core').FlexboxLayout);
// registerNativeViewElement('Switch', () => require('@nativescript/core').Switch);
registerNativeViewElement('textfield', () => require('@nativescript-community/ui-material-textfield').TextField, null, {}, { override: true });
registerNativeViewElement('WebView', () => require('@nativescript/core').WebView);

// registerNativeViewElement('mdtextfield', () => TextField, null, {}, { override: true });
// registerNativeViewElement(
//     'formattedstring',
//     () => require('@nativescript-community/text').LightFormattedString,
//     'formattedText',
//     {
//         spans: NativeElementPropType.ObservableArray
//     },
//     { override: true }
// );

//using 'spans' property breaks span(not cspan!) added without formattedstring
registerNativeViewElement('span', () => require('@nativescript/core').Span, 'spans');
registerNativeViewElement('textfield', () => require('@nativescript-community/ui-material-textfield').TextField, null, {}, { override: true });
registerNativeViewElement('mdbutton', () => require('@nativescript-community/ui-material-button').Button);
registerNativeViewElement('label', () => Label as any, null, {}, { override: true });
registerNativeViewElement('activityIndicator', () => require('@nativescript-community/ui-material-activityindicator').ActivityIndicator);
registerNativeViewElement('lineChart', () => require('@nativescript-community/ui-chart/charts/LineChart').LineChart);
registerNativeViewElement('lottie', () => require('@nativescript-community/ui-lottie').LottieView);
registerNativeViewElement('pullrefresh', () => require('@nativescript-community/ui-pulltorefresh').PullToRefresh);
registerNativeViewElement('canvas', () => require('@nativescript-community/ui-canvas').CanvasView);
// registerNativeViewElement('line', () => require('@nativescript-community/ui-canvas/shapes/line').default);
// registerNativeViewElement('rectangle', () => require('@nativescript-community/ui-canvas/shapes/rectangle').default);
// registerNativeViewElement('image', () => require('@nativescript-community/ui-image').Img, null, {}, { override: true });
registerNativeViewElement('canvaslabel', () => require('@nativescript-community/ui-canvaslabel').CanvasLabel);
registerNativeViewElement('cspan', () => require('@nativescript-community/ui-canvaslabel').Span);
registerNativeViewElement('cgroup', () => require('@nativescript-community/ui-canvaslabel').Group);

CollectionViewElement.register();

// Trace.addCategories(DomTraceCategory);
// Trace.addCategories(Trace.categories.NativeLifecycle);
// Trace.addCategories(Trace.categories.Transition);
// Trace.addCategories(Trace.categories.Animation);
// Trace.addCategories(Trace.categories.All);
// Trace.enable();
// on startup we need to ensure theme is loaded because of a mixin
// on startup we need to say what we are using
startThemeHelper();
if (__IOS__) {
    const variables = require('~/variables');
    const primaryColor = variables.primaryColor;
    themer.setPrimaryColor(primaryColor);
    themer.setAccentColor(primaryColor);
}
if (__ANDROID__) {
    (global as any).setInterval = (handler, timeout, ...args) => {
        timeout += 0;
        const invoke = () => handler(...args);
        const zoneBound = zonedCallback(invoke);
        return (global as any).__setInterval(() => {
            zoneBound();
        }, timeout || 0);
    };
    (global as any).clearInterval = (global as any).__clearInterval;
    (global as any).setTimeout = (handler, timeout, ...args) => {
        timeout += 0;
        const invoke = () => handler(...args);
        const zoneBound = zonedCallback(invoke);
        return (global as any).__setTimeout(() => {
            zoneBound();
        }, timeout || 0);
    };

    (global as any).clearTimeout = (global as any).__clearTimeout;
}

themer.createShape('round', {
    cornerFamily: 'rounded' as any,
    cornerSize: {
        value: 0.5,
        unit: '%'
    }
});

//@ts-ignore
svelteNative(WeatherPage, {});
