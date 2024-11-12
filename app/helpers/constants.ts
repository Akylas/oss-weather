import { Screen } from '@nativescript/core';

export const DATA_VERSION = 1;

export const ALERT_OPTION_MAX_HEIGHT = Screen.mainScreen.heightDIPs * 0.47;

export const SETTINGS_LANGUAGE = 'language';
export const SETTINGS_IMPERIAL = 'imperial';
export const SETTINGS_COLOR_THEME = 'color_theme';
export const SETTINGS_DAILY_PAGE_HOURLY_CHART = 'daily_page_hourly_chart';
export const SETTINGS_MAIN_PAGE_HOURLY_CHART = 'main_page_hourly_chart';
export const SETTINGS_SWIPE_ACTION_BAR_PROVIDER = 'swipe_actionbar_provider';
export const SETTINGS_WEATHER_MAP_COLORS = 'weather_map_colors';
export const SETTINGS_WEATHER_MAP_ANIMATION_SPEED = 'weather_map_animation_speed';
export const SETTINGS_UNITS = 'units';
export const SETTINGS_METRIC_TEMP_DECIMAL = 'metric_temp_decimal';
export const SETTINGS_ALWAYS_SHOW_PRECIP_PROB = 'always_show_precip_prob';
export const SETTINGS_FEELS_LIKE_TEMPERATURES = 'feels_like_temperatures';
export const SETTINGS_SHOW_DAILY_IN_CURRENTLY = 'show_daily_in_currently';
export const SETTINGS_SHOW_CURRENT_DAY_DAILY = 'show_current_day_daily';
export const SETTINGS_WEATHER_DATA_LAYOUT = 'weather_data_layout';

export const DEFAULT_COLOR_THEME = 'default';

export const DAILY_PAGE_HOURLY_CHART = false;
export const MAIN_PAGE_HOURLY_CHART = false;
export const SWIPE_ACTION_BAR_PROVIDER = false;

export const ANIMATIONS_ENABLED = false;
export const CHARTS_LANDSCAPE = false;
export const CHARTS_PORTRAIT_FULLSCREEN = false;
export const DECIMAL_METRICS_TEMP = false;
export const SHOW_CURRENT_DAY_DAILY = false;
export const SHOW_DAILY_IN_CURRENTLY = false;
export const FEELS_LIKE_TEMPERATURE = false;
export const ALWAYS_SHOW_PRECIP_PROB = false;

export const WEATHER_DATA_LAYOUT = 'default';

export const NB_DAYS_FORECAST = 7;
export const NB_HOURS_FORECAST = 72;
export const NB_MINUTES_FORECAST = 60;

export const MIN_UV_INDEX = 1;

export const WEATHER_MAP_COLORS = 4;
export const WEATHER_MAP_ANIMATION_SPEED = 100;
export const WEATHER_MAP_COLOR_SCHEMES = [
    {
        value: 0,
        title: 'Black and White Value'
    },
    {
        value: 1,
        title: 'Original'
    },
    {
        value: 2,
        title: 'Universal Blue'
    },
    {
        value: 3,
        title: 'TITAN'
    },
    {
        value: 4,
        title: 'The Weather Channel'
    },
    // {
    //     value: 5,
    //     title: 'Meteored'
    // },
    {
        value: 6,
        title: 'NEXRAD Level-III'
    },
    {
        value: 7,
        title: 'RAINBOW @ SELEX-SI'
    },
    {
        value: 8,
        title: 'Dark Sky'
    }
];
