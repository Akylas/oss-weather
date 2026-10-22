import { lc } from '@nativescript-community/l';
import { TextFieldProperties } from '@nativescript-community/ui-textfield';
import { ApplicationSettings } from '@nativescript/core';
import { SETTINGS_WEATHER_MAP_SHOW_SNOW, WEATHER_MAP_SHOW_SNOW, getLayerTitle } from '~/services/providers/maptiler';

export const SETTINGS_WEATHER_MAP_SOURCE = 'weather_map_source';
export const SETTINGS_LIBREWXR_URL = 'weather_map_librewxr_url';
export const SETTINGS_LIBREWXR_COLORS = 'weather_map_librewxr_colors';
export const SETTINGS_LIBREWXR_LAYER = 'weather_map_librewxr_layer';

export const WEATHER_MAP_SOURCE = 'librewxr';
export const LIBREWXR_URL = 'https://api.librewxr.net';
export const LIBREWXR_COLORS = 7;
export const LIBREWXR_LAYER = 'radar';
export const LIBREWXR_LAYERS = ['radar', 'satellite', 'radar_satellite'];
export const LIBREWXR_COLOR_SCHEMES = [
    { value: 0, title: 'Black and White' },
    { value: 1, title: 'Rainviewer Original' },
    { value: 2, title: 'Universal Blue' },
    { value: 3, title: 'Titan' },
    { value: 4, title: 'The Weather Channel' },
    { value: 5, title: 'Meteored' },
    { value: 6, title: 'NEXRAD Level III' },
    { value: 7, title: 'Rainbow @ Selex SI' },
    { value: 8, title: 'Dark Sky' },
    { value: 9, title: 'Datameteo Valerio' },
    { value: 10, title: 'Viper HD' },
    { value: 11, title: 'MRMS CREF' },
    { value: 12, title: '33/40 Max Storm' },
    { value: 13, title: 'MetService NZ (Dark)' },
    { value: 14, title: 'Windy' }
];

export const WEATHER_MAP_SOURCES = [
    { value: 'librewxr', title: 'LibreWXR' },
    { value: 'maptiler', title: 'MapTiler' }
];

export function isLibreWXRSource() {
    return ApplicationSettings.getString(SETTINGS_WEATHER_MAP_SOURCE, WEATHER_MAP_SOURCE) !== 'maptiler';
}

export function getLibreWXRColorsTitle() {
    const colors = ApplicationSettings.getNumber(SETTINGS_LIBREWXR_COLORS, LIBREWXR_COLORS);
    return LIBREWXR_COLOR_SCHEMES.find((scheme) => scheme.value === colors)?.title;
}

export function getWeatherMapSourceSetting() {
    return {
        key: SETTINGS_WEATHER_MAP_SOURCE,
        id: 'setting',
        valueType: 'string',
        icon: 'mdi-radar',
        title: lc('weather_map_source'),
        currentValue: () => ApplicationSettings.getString(SETTINGS_WEATHER_MAP_SOURCE, WEATHER_MAP_SOURCE),
        values: WEATHER_MAP_SOURCES,
        description: () => WEATHER_MAP_SOURCES.find((source) => source.value === ApplicationSettings.getString(SETTINGS_WEATHER_MAP_SOURCE, WEATHER_MAP_SOURCE))?.title
    };
}

export function getLibreWXRSettings() {
    return [
        {
            type: 'prompt',
            icon: 'mdi-server',
            valueType: 'string',
            id: 'setting',
            key: SETTINGS_LIBREWXR_URL,
            default: () => ApplicationSettings.getString(SETTINGS_LIBREWXR_URL, LIBREWXR_URL),
            description: () => ApplicationSettings.getString(SETTINGS_LIBREWXR_URL, LIBREWXR_URL),
            title: lc('librewxr_server'),
            textFieldProperties: {
                keyboardType: 'url',
                autocapitalizationType: 'none',
                autocorrect: false
            } as TextFieldProperties
        },
        {
            key: SETTINGS_LIBREWXR_COLORS,
            id: 'setting',
            icon: 'mdi-palette',
            title: lc('weather_map_colors'),
            currentValue: () => ApplicationSettings.getNumber(SETTINGS_LIBREWXR_COLORS, LIBREWXR_COLORS),
            values: LIBREWXR_COLOR_SCHEMES,
            description: getLibreWXRColorsTitle
        },
        {
            key: SETTINGS_LIBREWXR_LAYER,
            id: 'setting',
            valueType: 'string',
            icon: 'mdi-layers',
            title: lc('weather_map_layer'),
            currentValue: () => ApplicationSettings.getString(SETTINGS_LIBREWXR_LAYER, LIBREWXR_LAYER),
            values: LIBREWXR_LAYERS.map((value) => ({
                value,
                title: getLayerTitle(value)
            })),
            description: () => getLayerTitle(ApplicationSettings.getString(SETTINGS_LIBREWXR_LAYER, LIBREWXR_LAYER))
        },
        {
            type: 'switch',
            icon: 'mdi-snowflake',
            id: SETTINGS_WEATHER_MAP_SHOW_SNOW,
            title: lc('show_snow'),
            value: ApplicationSettings.getBoolean(SETTINGS_WEATHER_MAP_SHOW_SNOW, WEATHER_MAP_SHOW_SNOW)
        }
    ];
}
