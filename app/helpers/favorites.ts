import { ApplicationSettings, Observable, ObservableArray } from '@nativescript/core';
import { WeatherLocation, getTimezone } from '~/services/api';
import { prefs } from '~/services/preferences';
import { colors } from '~/variables';
import { get } from 'svelte/store';
import { globalObservable } from '@shared/utils/svelte/ui';
import PolygonLookup from 'polygon-lookup';

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
                timezoneOffset: NSTimeZone.alloc().initWithName(timezone).daylightSavingTimeOffsetForDate(new Date()) / 3600
            };
        }
    } else {
        return getTimezone(location);
    }
}
export const favorites: ObservableArray<WeatherLocation> = new ObservableArray(JSON.parse(ApplicationSettings.getString('favorites', '[]')).map((i) => ({ ...i, isFavorite: true })));
let favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);
if (!favorites.getItem(0).timezone) {
    Promise.all(
        favorites.map((f, index) => {
            if (!f.timezone) {
                return queryTimezone(f).then((timezonData) => {
                    Object.assign(f, timezonData);
                    favorites.setItem(index, f);
                });
            }
        })
    ).then(() => ApplicationSettings.setString('favorites', JSON.stringify(favorites)));
}

prefs.on('key:favorites', () => {
    favorites.splice(0, favorites.length, ...JSON.parse(ApplicationSettings.getString('favorites', '[]')));
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
    ApplicationSettings.setString('favorites', JSON.stringify(favorites));
    globalObservable.notify({ eventName: 'favorite', data: item });
    return item;
}
