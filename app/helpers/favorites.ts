import { ApplicationSettings, Observable, ObservableArray } from '@nativescript/core';
import { WeatherLocation, getTimezone } from '~/services/api';
import { prefs } from '~/services/preferences';
import { colors } from '~/variables';
import { get } from 'svelte/store';
import { globalObservable } from '@shared/utils/svelte/ui';
import PolygonLookup from 'polygon-lookup';
import { AqiProviderType, ProviderType } from '~/services/providers/weather';
import { SETTINGS_FAVORITES } from './constants';

export const EVENT_FAVORITE = 'favorite'

export interface FavoriteLocation extends WeatherLocation {
    isFavorite?: boolean;
    startingSide?: string;
}

let timezoneLookUp: PolygonLookup;
export async function queryTimezone(location: FavoriteLocation, force = false) {
    if (!force && location.timezone) {
        return;
    }
    if (!timezoneLookUp) {
        timezoneLookUp = new PolygonLookup(require('~/timezone/timezonedb.json'));
    }
    const result = timezoneLookUp.search(location.coord.lon, location.coord.lat);
    const timezone = result?.properties.tzid;

    if (timezone) {
        if (__ANDROID__) {
            const nTimezone = java.util.TimeZone.getTimeZone(timezone);
            return {
                timezone,
                timezoneOffset: nTimezone.getOffset(Date.now()) / 3600000
            };
        } else {
            return {
                timezone,
                timezoneOffset: NSTimeZone.alloc().initWithName(timezone).secondsFromGMTForDate(new Date()) / 3600
            };
        }
    } else {
        return getTimezone(location);
    }
}
export const favorites: ObservableArray<WeatherLocation> = new ObservableArray(JSON.parse(ApplicationSettings.getString(SETTINGS_FAVORITES, '[]')).map((i) => ({ ...i, isFavorite: true })));

favorites.on('change', (e) => {
    // DEV_LOG && console.log('on favorites changed1');
    ApplicationSettings.setString(SETTINGS_FAVORITES, JSON.stringify(favorites));
});
let favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);
if (favorites.length && !favorites.getItem(0).timezone) {
    Promise.all(
        favorites.map((f, index) => {
            if (!f.timezone) {
                return queryTimezone(f).then((timezonData) => {
                    Object.assign(f, timezonData);
                    favorites.setItem(index, f);
                });
            }
        })
    ).then(() => ApplicationSettings.setString(SETTINGS_FAVORITES, JSON.stringify(favorites)));
}

prefs.on(`key:${SETTINGS_FAVORITES}`, () => {
    favorites.splice(0, favorites.length, ...JSON.parse(ApplicationSettings.getString(SETTINGS_FAVORITES, '[]')));
    favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);
});

export function isFavorite(item: WeatherLocation) {
    if (item) {
        const key = getFavoriteKey(item);
        return favoritesKeys.indexOf(key) !== -1;
    }
    return false;
}
export function favoriteIconColor(item: FavoriteLocation) {
    if (item) {
        return item.isFavorite ? '#EFB644' : get(colors).colorOnSurfaceVariant;
    }
}
export function saveFavorite(item: FavoriteLocation) {}

export function favoriteIcon(item: FavoriteLocation) {
    if (item) {
        return item.isFavorite ? 'mdi-star' : 'mdi-star-outline';
    }
}

export function getFavoriteKey(item: WeatherLocation) {
    if (item) {
        return `${item.coord.lat};${item.coord.lon}`;
    }
}

export async function setFavoriteProvider(item: FavoriteLocation, provider: ProviderType) {
    const key = getFavoriteKey(item);
    const index = favoritesKeys.indexOf(key);
    if (index !== -1) {
        item.provider = provider;
        DEV_LOG && console.log('setFavoriteProvider', provider, JSON.stringify(item));
        favorites.setItem(index, item);
        globalObservable.notify({ eventName: EVENT_FAVORITE, data: item });
    }
}
export async function renameFavorite(item: FavoriteLocation, name: string) {
    const key = getFavoriteKey(item);
    const index = favoritesKeys.indexOf(key);
    if (index !== -1) {
        item.name = name;
        favorites.setItem(index, item);
        globalObservable.notify({ eventName: EVENT_FAVORITE, data: item, needsWeatherRefresh: false });
    }
}
export async function setFavoriteAqiProvider(item: FavoriteLocation, provider: AqiProviderType) {
    const key = getFavoriteKey(item);
    const index = favoritesKeys.indexOf(key);
    if (index !== -1) {
        item.providerAqi = provider;
        favorites.setItem(index, item);
        globalObservable.notify({ eventName: EVENT_FAVORITE, data: item });
    }
}
export async function toggleFavorite(item: FavoriteLocation) {
    if (isFavorite(item)) {
        const key = getFavoriteKey(item);
        item.isFavorite = false;
        const index = favoritesKeys.indexOf(key);
        if (index !== -1) {
            favorites.splice(index, 1);
            favoritesKeys.splice(index, 1);
        }
    } else {
        const { isFavorite, startingSide, ...toSave } = item;
        // if (!item.timezone) {
        try {
            const timezonData = await queryTimezone(item, true);
            if (timezonData) {
                Object.assign(toSave, timezonData);
            }
        } catch (error) {}
        // }
        item.isFavorite = true;
        favorites.push(toSave);
        favoritesKeys.push(getFavoriteKey(item));
    }
    delete item.startingSide; //for swipemenu
    globalObservable.notify({ eventName: EVENT_FAVORITE, data: item });
    return item;
}
