/// <reference path="./node_modules/@nativescript/types-ios/lib/ios.d.ts" />
/// <reference path="./node_modules/@nativescript/types-android/lib/android-26.d.ts" />
/// <reference path="./node_modules/@nativescript/core/global-types.d.ts" />
/// <reference path="./node_modules/@nativescript-community/ui-material-bottomsheet/bottomsheet.d.ts" />


declare const SUPPORTED_LOCALES: string[];
declare const TNS_ENV: string;
declare const LOG_LEVEL: string;
declare const TEST_LOGS: boolean;
declare const NO_CONSOLE: boolean;
declare const PRODUCTION: boolean;
declare const SENTRY_DSN: string;
declare const SENTRY_PREFIX: string;
declare const OWM_DEFAULT_KEY: string;
declare const OWM_MY_KEY: string;
declare const DARK_SKY_KEY: string;
declare const CLIMA_CELL_DEFAULT_KEY: string;
declare const CLIMA_CELL_MY_KEY: string;
declare const DEFAULT_LOCATION: string;
declare const GIT_URL: string;
declare const STORE_LINK: string;
declare const STORE_REVIEW_LINK: string;
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
declare module '*.scss';
// declare module '*.svelte' {
//     export default SvelteComponent;
// }
declare namespace com {
    export namespace akylas {
        export namespace weather {
            export class NightModeApplication extends globalAndroid.app.Application {}
        }
    }
}
