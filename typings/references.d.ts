/// <reference path="../node_modules/@nativescript/types-ios/lib/ios/objc-x86_64/objc!LinkPresentation.d.ts" />
/// <reference path="../node_modules/@nativescript-community/ui-material-bottomsheet/bottomsheet.d.ts" />
/// <reference path="../node_modules/@nativescript-community/https/typings/okhttp3.d.ts" />

declare const ATMO_DEFAULT_KEY: string;
declare const OWM_DEFAULT_KEY: string;
declare const MF_DEFAULT_KEY: string;
declare const OWM_MY_KEY: string;
declare const DARK_SKY_KEY: string;
declare const CLIMA_CELL_DEFAULT_KEY: string;
declare const CLIMA_CELL_MY_KEY: string;
declare const DEFAULT_LOCATION: string;
declare const DEFAULT_PROVIDER: string;
declare const DEFAULT_PROVIDER_AQI: string;

interface LatLonKeys {
    lat: number;
    lon: number;
    altitude?: number;
}

declare namespace svelteNative.JSX {
    interface WebViewAttributes {
        'on:position'?: (args) => void;
    }
}
