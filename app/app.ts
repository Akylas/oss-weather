import { registerNativeViewElement } from 'svelte-native/dom';
import { startSentry } from '~/utils/sentry';

import { setMapPosKeys } from 'nativescript-carto/core';
// we need to use lat lon
setMapPosKeys('lat', 'lon');
import { installMixins as installUIMixins } from 'nativescript-systemui';
installUIMixins();

registerNativeViewElement('button', () => require('nativescript-material-button').Button);
registerNativeViewElement('label', () => require('nativescript-htmllabel').Label);
registerNativeViewElement('activityIndicator', () => require('nativescript-material-activityindicator').ActivityIndicator);

console.log('about to start sentry');
startSentry();
console.log('start sentry done ');

if (gVars.isIOS) {
    const variables = require('~/variables');
    const primaryColor = variables.primaryColor;
    const themer = require('nativescript-material-core').themer;
    themer.setPrimaryColor(primaryColor);
    themer.setAccentColor(primaryColor);
}

// class Path {
//     path_;
//     constructor() {
//         this.path_ = CGPathCreateMutable();
//         CGPathMoveToPoint(this.path_, null, 0, 0);
//     }

//     lineTo(x, y) {
//         CGPathAddLineToPoint(this.path_, null, x, y);
//     }
// }

// const count = 400;
// const point = new Path();
// console.time('perf');

// for (let x = 0; x < count; x++) {
//     for (let y = 0; y < count; y++) {
//         point.lineTo(x, y);
//     }
// }

// console.timeEnd('perf');

import { svelteNative } from 'svelte-native';
import App from './App.svelte';
svelteNative(App, {});
