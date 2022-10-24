/// <reference path="./node_modules/@nativescript/types-android/lib/android-32.d.ts" />
/// <reference path="./node_modules/@nativescript/core/global-types.d.ts" />
/// <reference path="./node_modules/@nativescript-community/ui-material-bottomsheet/bottomsheet.d.ts" />

declare const SUPPORTED_LOCALES: string[];
declare const DEFAULT_LOCALE: string;
declare const DEFAULT_THEME: string;
declare const TNS_ENV: string;
declare const DEV_LOG: boolean;
declare const TEST_LOG: boolean;
declare const NO_CONSOLE: boolean;
declare const PRODUCTION: boolean;
declare const SENTRY_DSN: string;
declare const SENTRY_PREFIX: string;
declare const OWM_DEFAULT_KEY: string;
declare const MF_DEFAULT_KEY: string;
declare const OWM_MY_KEY: string;
declare const DARK_SKY_KEY: string;
declare const CLIMA_CELL_DEFAULT_KEY: string;
declare const CLIMA_CELL_MY_KEY: string;
declare const DEFAULT_LOCATION: string;
declare const GIT_URL: string;
declare const STORE_LINK: string;
declare const STORE_REVIEW_LINK: string;
declare const __APP_ID__: string;
declare const __APP_VERSION__: string;
declare const __APP_BUILD_NUMBER__: string;
// declare const process: { env: any };

// Augment the NodeJS global type with our own extensions

declare const gVars: {
    sentry: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    platform: string;
};

interface LatLonKeys {
    lat: number;
    lon: number;
    altitude?: number;
}
// declare module '*.svelte' {
//     export default SvelteComponent;
// }
declare module '*.scss' {
    // const content: any;

    // export default content;
    // export function toString(): string
    export const locals;
    // export const i
}
namespace svelteNative.JSX {
    interface ViewAttributes {
        rippleColor?: Color | string;
        verticalAlignment?: string;
        dynamicElevationOffset?: string | number;
        elevation?: string | number;
    }
    export interface ButtonAttributes {
        variant?: string;
        shape?: string;
    }
    export interface SpanAttributes {
        verticalAlignment?: string;
        verticalTextAlignment?: string;
    }
    export interface SliderAttributes {
        stepSize?: number;
    }
    export interface LabelAttributes {
        autoFontSize?: boolean;
        verticalTextAlignment?: string;
        maxLines?: number;
        minFontSize?: number;
        maxFontSize?: number;
        lineBreak?: string;
        html?: string;
    }
}
