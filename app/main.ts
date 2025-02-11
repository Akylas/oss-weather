// (com as any).tns.Runtime.getCurrentRuntime().enableVerboseLogging();
// we need to use lat lon
import { install as installGestures } from '@nativescript-community/gesturehandler';
import { setGeoLocationKeys } from '@nativescript-community/gps';
import { installMixins as installUIMixins } from '@nativescript-community/systemui';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
import SwipeMenuElement from '@nativescript-community/ui-collectionview-swipemenu/svelte';
import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
import DrawerElement from '@nativescript-community/ui-drawer/svelte';
import { initialize } from '@nativescript-community/ui-image';
import { Label } from '@nativescript-community/ui-label';
import { install as installBottomSheets } from '@nativescript-community/ui-material-bottomsheet';
import { installMixins, themer } from '@nativescript-community/ui-material-core';
import { Application } from '@nativescript/core';
import { init as sharedInit } from '@shared/index';
import { startSentry } from '@shared/utils/sentry';
import { svelteNative } from 'svelte-native';
import { FrameElement, PageElement, registerElement, registerNativeViewElement } from 'svelte-native/dom';
import WeatherPage from '~/components/WeatherPage.svelte';
import { start as startThemeHelper } from '~/helpers/theme';

try {
    startSentry();
    setGeoLocationKeys('lat', 'lon', 'altitude');
    installGestures(true);
    overrideSpanAndFormattedString();
    installMixins();
    installUIMixins();
    installBottomSheets();
    initialize({ isDownsampleEnabled: true, useOkhttp: true } as any);

    registerElement('Frame', () => new FrameElement());
    registerElement('Page', () => new PageElement());
    registerNativeViewElement('AbsoluteLayout', () => require('@nativescript/core').AbsoluteLayout);
    registerNativeViewElement('scrollview', () => require('@nativescript/core').ScrollView);
    registerNativeViewElement('GridLayout', () => require('@nativescript/core').GridLayout);
    registerNativeViewElement('image', () => require('@nativescript/core').Image);
    // registerNativeViewElement('scrollview', () => NestedScrollView);
    registerNativeViewElement('StackLayout', () => require('@nativescript/core').StackLayout);
    registerNativeViewElement('slider', () => require('@nativescript-community/ui-material-slider').Slider, null, {}, { override: true });
    registerNativeViewElement('webview', () => require('@nativescript-community/ui-webview').AWebView);
    registerNativeViewElement('gesturerootview', () => require('@nativescript-community/gesturehandler').GestureRootView);

    registerNativeViewElement('span', () => require('@nativescript/core').Span);
    registerNativeViewElement('textview', () => require('@nativescript-community/ui-material-textview').TextView, null, {}, { override: true });
    registerNativeViewElement('textfield', () => require('@nativescript-community/ui-material-textfield').TextField, null, {}, { override: true });
    registerNativeViewElement('mdbutton', () => require('@nativescript-community/ui-material-button').Button);
    registerNativeViewElement('progress', () => require('@nativescript-community/ui-material-progress').Progress);
    registerNativeViewElement('Switch', () => require('@nativescript-community/ui-material-switch').Switch);
    registerNativeViewElement('label', () => Label as any, null, {}, { override: true });
    registerNativeViewElement('activityIndicator', () => require('@nativescript-community/ui-material-activityindicator').ActivityIndicator);
    registerNativeViewElement('linechart', () => require('@nativescript-community/ui-chart/charts/LineChart').LineChart);
    registerNativeViewElement('scatterchart', () => require('@nativescript-community/ui-chart/charts/ScatterChart').ScatterChart);
    registerNativeViewElement('combinedchart', () => require('@nativescript-community/ui-chart/charts/CombinedChart').CombinedChart);
    registerNativeViewElement('lottie', () => require('@nativescript-community/ui-lottie').LottieView);
    registerNativeViewElement('pullrefresh', () => require('@nativescript-community/ui-pulltorefresh').PullToRefresh);
    registerNativeViewElement('canvasview', () => require('@nativescript-community/ui-canvas').CanvasView);
    registerNativeViewElement('line', () => require('@nativescript-community/ui-canvas/shapes/line').default);
    registerNativeViewElement('rectangle', () => require('@nativescript-community/ui-canvas/shapes/rectangle').default);
    registerNativeViewElement('canvaslabel', () => require('@nativescript-community/ui-canvaslabel').CanvasLabel);
    registerNativeViewElement('cspan', () => require('@nativescript-community/ui-canvaslabel').Span);
    registerNativeViewElement('cgroup', () => require('@nativescript-community/ui-canvaslabel').Group);
    registerNativeViewElement('checkbox', () => require('@nativescript-community/ui-checkbox').CheckBox);
    registerNativeViewElement('zoomimage', () => require('@nativescript-community/ui-zoomimage').ZoomImg);
    DrawerElement.register();
    CollectionViewElement.register();
    SwipeMenuElement.register();
    if (PLAY_STORE_BUILD) {
        import('@shared/utils/inapp-purchase').then((r) => r.init());
    }

    // Trace.addCategories(DomTraceCategory);
    // Trace.addCategories(Trace.categories.NativeLifecycle);
    // Trace.addCategories(Trace.categories.Transition);
    // Trace.addCategories(ChartTraceCategory);
    // Trace.addCategories(CollectionViewTraceCategory);
    // Trace.enable();
    // on startup we need to ensure theme is loaded because of a mixin
    // on startup we need to say what we are using

    Application.on(Application.launchEvent, () => {
        startThemeHelper();
    });
    themer.createShape('round', {
        cornerFamily: 'rounded' as any,
        cornerSize: {
            value: 0.5,
            unit: '%'
        }
    });
    themer.createShape('none', {
        cornerFamily: 'rounded' as any,
        cornerSize: {
            value: 0,
            unit: '%'
        }
    });

    sharedInit();

    svelteNative(WeatherPage, {});
} catch (error) {
    console.error(error, error.stack);
}
