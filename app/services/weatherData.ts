import { Align, Paint } from '@nativescript-community/ui-canvas';
import { ApplicationSettings, Color, Observable } from '@nativescript/core';
import { get } from 'svelte/store';
import { MIN_UV_INDEX } from '~/helpers/constants';
import { convertWeatherValueToUnit, formatValueToUnit, formatWeatherValue } from '~/helpers/formatter';
import { l, lc } from '~/helpers/locale';
import { CommonWeatherData } from '~/services/providers/weather';
import { createGlobalEventListener, globalObservable } from '~/utils/svelte/ui';
import { fontScale, fonts, nightColor } from '~/variables';
import { prefs } from './preferences';

export enum WeatherProps {
    precipAccumulation = 'precipAccumulation',
    precipProbability = 'precipProbability',
    cloudCover = 'cloudCover',
    uvIndex = 'uvIndex',
    windGust = 'windGust',
    moon = 'moon',
    windBeaufort = 'windBeaufort',
    temperature = 'temperature',
    temperatureMin = 'temperatureMin',
    temperatureMax = 'temperatureMax',
    snowDepth = 'snowDepth',
    snowfall = 'snowfall',
    iso = 'iso',
    iconId = 'iconId',
    windSpeed = 'windSpeed',
    windBearing = 'windBearing',
    rainSnowLimit = 'rainSnowLimit'
}

export const AVAILABLE_WEATHER_DATA = [
    WeatherProps.windSpeed,
    WeatherProps.precipAccumulation,
    WeatherProps.cloudCover,
    WeatherProps.uvIndex,
    WeatherProps.windGust,
    WeatherProps.moon,
    WeatherProps.snowDepth,
    WeatherProps.windBeaufort
];
export const AVAILABLE_COMPARE_WEATHER_DATA = [
    WeatherProps.precipProbability,
    WeatherProps.windBearing,
    WeatherProps.windSpeed,
    WeatherProps.precipAccumulation,
    WeatherProps.cloudCover,
    WeatherProps.uvIndex,
    WeatherProps.windGust,
    WeatherProps.temperature,
    WeatherProps.temperatureMin,
    WeatherProps.temperatureMax,
    WeatherProps.snowDepth,
    WeatherProps.snowfall,
    WeatherProps.iconId,
    WeatherProps.iso,
    WeatherProps.rainSnowLimit
];

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
    [WeatherProps.moon]: (item: CommonWeatherData) => item.moonIcon,
    [WeatherProps.iconId]: 'mdi-theme-light-dark',
    [WeatherProps.cloudCover]: 'wi-cloud',
    [WeatherProps.windGust]: 'wi-strong-wind',
    [WeatherProps.uvIndex]: 'mdi-weather-sunny-alert',
    [WeatherProps.windBeaufort]: (item: CommonWeatherData) => item.windBeaufortIcon,
    [WeatherProps.windSpeed]: (item: CommonWeatherData) => item.windIcon,
    [WeatherProps.precipAccumulation]: (item: CommonWeatherData) => item.precipIcon
};

const WEATHER_DATA_TITLES = {
    [WeatherProps.iconId]: lc('weather_condition'),
    [WeatherProps.moon]: lc('moon'),
    [WeatherProps.cloudCover]: lc('cloud_cover'),
    [WeatherProps.windGust]: lc('wind_gust'),
    [WeatherProps.uvIndex]: lc('uv_index'),
    [WeatherProps.windBeaufort]: lc('wind_beaufort'),
    [WeatherProps.windSpeed]: lc('wind_speed'),
    [WeatherProps.rainSnowLimit]: lc('rain_snow_limit'),
    [WeatherProps.iso]: lc('freezing_level'),
    [WeatherProps.precipAccumulation]: lc('precipitation')
};

export function getWeatherDataIcon(key: string) {
    let icon = WEATHER_DATA_ICONS[key];
    if (typeof icon === 'function') {
        icon = icon({ [key]: 0 });
    }
    return icon;
}
export function getWeatherDataTitle(key: string) {
    return WEATHER_DATA_TITLES[key] || key;
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
            case WeatherProps.windSpeed:
                if (item.windSpeed) {
                    const data = convertWeatherValueToUnit(item, 'windSpeed');
                    return {
                        iconFontSize,
                        paint: appPaint,
                        icon,
                        value: data[0],
                        subvalue: data[1]
                    };
                }
                return null;
            case WeatherProps.precipAccumulation:
                if ((item.precipProbability === -1 || item.precipProbability > 10) && item.precipAccumulation >= 1) {
                    return {
                        paint: item.precipFontUseApp ? appPaint : wiPaint,
                        color: item.precipColor,
                        iconFontSize,
                        icon: item.precipIcon,
                        value: formatValueToUnit(item.precipAccumulation, item.precipUnit),
                        subvalue: item.precipProbability > 0 && formatWeatherValue(item, 'precipProbability')
                    };
                } else {
                    return null;
                }
            case WeatherProps.cloudCover:
                if (item.cloudCover > 20) {
                    return {
                        paint: wiPaint,
                        color: item.cloudColor,
                        iconFontSize,
                        icon,
                        value: formatWeatherValue(item, 'cloudCover'),
                        subvalue: item.cloudCeiling && formatWeatherValue(item, 'cloudCeiling')
                    };
                }
                return null;
            case WeatherProps.uvIndex:
                if (item.uvIndex >= this.minUVIndexToShow) {
                    return {
                        paint: mdiPaint,
                        color: item.uvIndexColor,
                        iconFontSize,
                        icon,
                        value: formatWeatherValue(item, 'uvIndex')
                    };
                }
                return null;
            case WeatherProps.windGust:
                if (item.windGust && (!item.windSpeed || (item.windGust > 30 && item.windGust > 2 * item.windSpeed))) {
                    const data = convertWeatherValueToUnit(item, 'windGust');
                    return {
                        iconFontSize,
                        paint: wiPaint,
                        color: item.windGust > 80 ? '#ff0353' : '#FFBC03',
                        icon,
                        value: data[0],
                        subvalue: data[1]
                    };
                }
                return null;

            case WeatherProps.moon:
                return {
                    paint: wiPaint,
                    color: nightColor,
                    iconFontSize,
                    icon,
                    value: l('moon')
                };
            case WeatherProps.windBeaufort:
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
