/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!Foundation.d.ts" />
/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!CoreLocation.d.ts" />
/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!CoreFoundation.d.ts" />
/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!ObjectiveC.d.ts" />
/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!UIKit.d.ts" />
/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!LinkPresentation.d.ts" />
/// <reference path="../node_modules/@nativescript/types-android/lib/android-32.d.ts" />
/// <reference path="../node_modules/@nativescript/core/global-types.d.ts" />
/// <reference path="../node_modules/@nativescript-community/ui-material-bottomsheet/bottomsheet.d.ts" />
/// <reference path="../node_modules/@nativescript-community/https/typings/okhttp3.d.ts" />

declare const SUPPORTED_LOCALES: string[];
declare const SUPPORTED_COLOR_THEMES: string[];
declare const DEFAULT_LOCALE: string;
declare const DEFAULT_THEME: string;
declare const TNS_ENV: string;
declare const DEV_LOG: boolean;
declare const TEST_LOG: boolean;
declare const NO_CONSOLE: boolean;
declare const PRODUCTION: boolean;
declare const SENTRY_ENABLED: boolean;
declare const SENTRY_DSN: string;
declare const SENTRY_PREFIX: string;
declare const ATMO_DEFAULT_KEY: string;
declare const OWM_DEFAULT_KEY: string;
declare const MF_DEFAULT_KEY: string;
declare const OWM_MY_KEY: string;
declare const DARK_SKY_KEY: string;
declare const CLIMA_CELL_DEFAULT_KEY: string;
declare const CLIMA_CELL_MY_KEY: string;
declare const DEFAULT_LOCATION: string;
declare const GIT_URL: string;
declare const STORE_LINK: string;
declare const PLAY_STORE_BUILD: boolean;
declare const STORE_REVIEW_LINK: string;
declare const SPONSOR_URL: string;
declare const __APP_ID__: string;
declare const __APP_VERSION__: string;
declare const __APP_BUILD_NUMBER__: string;
declare const DEFAULT_PROVIDER: string;

interface LatLonKeys {
    lat: number;
    lon: number;
    altitude?: number;
}
