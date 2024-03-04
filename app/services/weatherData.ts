import { Align, Paint } from '@nativescript-community/ui-canvas';
import { ApplicationSettings, Color, Observable } from '@nativescript/core';
import { get } from 'svelte/store';
import { MIN_UV_INDEX } from '~/helpers/constants';
import { UNITS, convertValueToUnit, formatValueToUnit, toImperialUnit } from '~/helpers/formatter';
import { l, lc } from '~/helpers/locale';
import { CommonWeatherData } from '~/services/providers/weather';
import { fontScale, fonts, nightColor, rainColor, snowColor } from '~/variables';
import { prefs } from './preferences';
import { createGlobalEventListener, globalObservable } from '~/utils/svelte/ui';

export const AVAILABLE_WEATHER_DATA = ['windSpeed', 'precipAccumulation', 'cloudCover', 'uvIndex', 'windGust', 'moon', 'windBeaufort'];

export const onWeatherDataChanged = createGlobalEventListener('weatherData');

const wiPaint = new Paint();
wiPaint.setTextAlign(Align.CENTER);
const mdiPaint = new Paint();
mdiPaint.setTextAlign(Align.CENTER);
const appPaint = new Paint();
appPaint.setTextAlign(Align.CENTER);

fonts.subscribe((data) => {
    if (data.wi?.length) {
        wiPaint.setFontFamily(data.wi);
        mdiPaint.setFontFamily(data.mdi);
        appPaint.setFontFamily(data.app);
    }
});

const WEATHER_DATA_ICONS = {
    moon: (item: CommonWeatherData) => item.moonIcon,
    cloudCover: 'wi-cloud',
    windGust: 'wi-strong-wind',
    uvIndex: 'mdi-weather-sunny-alert',
    windBeaufort: (item: CommonWeatherData) => item.windBeaufortIcon,
    windSpeed: (item: CommonWeatherData) => item.windIcon,
    precipAccumulation: (item: CommonWeatherData) => item.precipIcon
};
export function getWeatherDataTitle(key: string) {
    switch (key) {
        case 'moon':
            return lc('moon');
        case 'windSpeed':
            return lc('wind_speed');
        case 'precipAccumulation':
            return lc('precipitation');
        case 'cloudCover':
            return lc('cloud_cover');
        case 'uvIndex':
            return lc('uv_index');
        case 'windGust':
            return lc('wind_gust');
        case 'windBeaufort':
            return lc('wind_beaufort');
        default:
            break;
    }
}
const ICONS_SIZE_FACTOR = {
    uvIndex: 1.2
};

export interface CommonData {
    color?: string | Color;
    paint?: Paint;
    iconFontSize?: number;
    icon?: string;
    value?: string | number;
    subvalue?: string;
}
export interface CommonDataOptions {
    id: string;
    icon: string | ((item: CommonWeatherData) => string);
    iconFactor: number;
    // getData: (options: CommonDataOptions, item: CommonWeatherData) => any;
}

export class DataService extends Observable {
    currentWeatherDataOptions: { [k: string]: CommonDataOptions };
    minUVIndexToShow = MIN_UV_INDEX;
    constructor() {
        super();
        this.load();

        const setminUVIndexToShow = () => {
            this.minUVIndexToShow = ApplicationSettings.getNumber('min_uv_index', MIN_UV_INDEX);
        };
        setminUVIndexToShow();
        prefs.on('key:common_data', this.load, this);
        prefs.on('key:min_uv_index', setminUVIndexToShow);
    }
    currentWeatherData: string[] = [];

    updateCurrentWeatherData(data, save = true) {
        this.currentWeatherData = data;
        this.currentWeatherDataOptions = data.reduce((acc, key) => {
            acc[key] = {
                id: key,
                icon: WEATHER_DATA_ICONS[key],
                iconFactor: ICONS_SIZE_FACTOR[key] ?? 1
                // getData: this.getItemData
            };
            return acc;
        }, {});
        if (save) {
            ApplicationSettings.setString('common_data', JSON.stringify(data));
            globalObservable.notify({ eventName: 'weatherData', data });
        }
    }
    load() {
        this.updateCurrentWeatherData(
            JSON.parse(ApplicationSettings.getString('common_data', '["windSpeed", "precipAccumulation", "cloudCover", "uvIndex", "windGust", "windBeaufort", "moon"]')),
            false
        );
    }

    getIconsData(item: CommonWeatherData, filter = []) {
        let keys = Object.keys(this.currentWeatherDataOptions);
        if (filter.length) {
            keys = keys.filter((k) => filter.indexOf(k) === -1);
        }
        return keys
            .map((k) => {
                const options = this.currentWeatherDataOptions[k];
                return this.getItemData(k, item, options);
            })
            .filter((d) => !!d);
    }

    getItemData(key: string, item: CommonWeatherData, options = this.currentWeatherDataOptions[key]): CommonData {
        if (!options) {
            return null;
        }
        let icon: string = options.icon as any;
        if (typeof icon === 'function') {
            icon = (icon as Function)(item);
        }
        const iconFontSize = 20 * get(fontScale) * options.iconFactor;
        switch (key) {
            case 'windSpeed':
                if (item.windSpeed) {
                    return {
                        iconFontSize,
                        paint: appPaint,
                        icon,
                        value: convertValueToUnit(item.windSpeed, UNITS.Speed)[0],
                        subvalue: toImperialUnit(UNITS.Speed)
                    };
                }
                return null;
            case 'precipAccumulation':
                if ((item.precipProbability === -1 || item.precipProbability > 10) && item.precipAccumulation >= 1) {
                    let color, precipIcon;
                    if (item && item.icon.startsWith('13')) {
                        color = snowColor;
                        precipIcon = 'wi-snowflake-cold';
                    } else {
                        color = rainColor;
                        precipIcon = 'wi-raindrop';
                    }
                    return {
                        paint: wiPaint,
                        color,
                        iconFontSize,
                        icon: precipIcon,
                        value: formatValueToUnit(item.precipAccumulation, item.precipUnit),
                        subvalue: item.precipProbability > 0 && item.precipProbability + '%'
                    };
                } else {
                    return null;
                }
            case 'cloudCover':
                if (item.cloudCover > 20) {
                    return {
                        paint: wiPaint,
                        color: item.cloudColor,
                        iconFontSize,
                        icon,
                        value: Math.round(item.cloudCover) + '%',
                        subvalue: item.cloudCeiling && formatValueToUnit(item.cloudCeiling, UNITS.Distance)
                    };
                }
                return null;
            case 'uvIndex':
                if (item.uvIndex >= this.minUVIndexToShow) {
                    return {
                        paint: mdiPaint,
                        color: item.uvIndexColor,
                        iconFontSize,
                        icon,
                        value: Math.round(item.uvIndex) + ''
                    };
                }
                return null;
            case 'windGust':
                if (item.windGust && (!item.windSpeed || (item.windGust > 30 && item.windGust > 2 * item.windSpeed))) {
                    return {
                        iconFontSize,
                        paint: wiPaint,
                        color: item.windGust > 80 ? '#ff0353' : '#FFBC03',
                        icon,
                        value: convertValueToUnit(item.windGust, UNITS.Speed)[0],
                        subvalue: toImperialUnit(UNITS.Speed)
                    };
                }
                return null;

            case 'moon':
                return {
                    paint: wiPaint,
                    color: nightColor,
                    iconFontSize,
                    icon,
                    value: l('moon')
                };
            case 'windBeaufort':
                if (item.windBeaufortIcon) {
                    return {
                        paint: wiPaint,
                        iconFontSize,
                        icon
                    };
                }
                return null;
            default:
                break;
        }
    }
}
export const weatherDataService = new DataService();
