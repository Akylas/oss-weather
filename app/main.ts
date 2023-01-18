// (com as any).tns.Runtime.getCurrentRuntime().enableVerboseLogging();
// we need to use lat lon
import { installMixins as installUIMixins } from '@nativescript-community/systemui';
import { overrideSpanAndFormattedString } from '@nativescript-community/text';
import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
import { Label } from '@nativescript-community/ui-label';
import { install as installBottomSheets } from '@nativescript-community/ui-material-bottomsheet';
import { install as installGestures } from '@nativescript-community/gesturehandler';
import { installMixins, themer } from '@nativescript-community/ui-material-core';
import { Application, ScrollView, Trace } from '@nativescript/core';
import { aliasTagName, globalRegister, makeListView, makeTemplateReceiver, makeView, registerElement } from 'dominative';
import WeatherPage from '~/components/WeatherPage.svelte';
// import { Application } from '@nativescript/core';
import { start as startThemeHelper } from '~/helpers/theme';
// import { startSentry } from '~/utils/sentry';
import './app.scss';
import { Event } from 'undom-ng';

Event.prototype.initCustomEvent = Event.prototype.initEvent;

// startSentry();
// installGestures(true);
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
globalRegister(global);
aliasTagName((tag) => tag.toLowerCase());
registerElement('absolutelayout', require('@nativescript/core').AbsoluteLayout);
registerElement('gridlayout', require('@nativescript/core').GridLayout);
registerElement('image', require('@nativescript/core').Image);
registerElement('scrollview', NestedScrollView as any);
registerElement('stacklayout', require('@nativescript/core').StackLayout);
registerElement('WebView', require('@nativescript/core').WebView);

registerElement('label', require('@nativescript-community/ui-label').Label);
registerElement('span', require('@nativescript/core').Span);
registerElement('textfield', require('@nativescript-community/ui-material-textfield').TextField);
registerElement('mdbutton', require('@nativescript-community/ui-material-button').Button);
registerElement('activityindicator', require('@nativescript-community/ui-material-activityindicator').ActivityIndicator);
registerElement('linechart', require('@nativescript-community/ui-chart/charts/LineChart').LineChart);
registerElement('rectangle', makeView(require('@nativescript-community/ui-canvas/shapes').Rectangle, { force: true }));
registerElement('lottie', require('@nativescript-community/ui-lottie').LottieView);
registerElement('pulltorefresh', require('@nativescript-community/ui-pulltorefresh').PullToRefresh);
registerElement('canvas', require('@nativescript-community/ui-canvas').CanvasView);
registerElement('canvaslabel', require('@nativescript-community/ui-canvaslabel').CanvasLabel);
registerElement('cspan', makeView(require('@nativescript-community/ui-canvaslabel').Span, { force: true }));
registerElement('cgroup', makeView(require('@nativescript-community/ui-canvaslabel').Group, { force: true }));
registerElement(
    'collectionview',
    makeListView(require('@nativescript-community/ui-collectionview').CollectionView, {
        force: true
    })
);
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

themer.createShape('round', {
    cornerFamily: 'rounded' as any,
    cornerSize: {
        value: 0.5,
        unit: '%'
    }
});

//@ts-ignore
const app = new WeatherPage({ target: document });
//@ts-ignore
Application.run({ create: () => app.$$.root });
