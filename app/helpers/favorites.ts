import { ApplicationSettings, Observable, ObservableArray } from '@nativescript/core';
import { WeatherLocation } from '~/services/api';
import { prefs } from '~/services/preferences';
import { colors } from '~/variables';
import { get } from 'svelte/store';
import { globalObservable } from '@shared/utils/svelte/ui';

export interface FavoriteLocation extends WeatherLocation {
    isFavorite?: boolean;
    startingSide?: string;
}
export const favorites: ObservableArray<WeatherLocation> = new ObservableArray(JSON.parse(ApplicationSettings.getString('favorites', '[]')).map((i) => ({ ...i, isFavorite: true })));
let favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);

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

export function toggleFavorite(item: FavoriteLocation) {
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
        item.isFavorite = true;
        favorites.push(toSave);
        favoritesKeys.push(getFavoriteKey(item));
    }
    delete item.startingSide; //for swipemenu
    ApplicationSettings.setString('favorites', JSON.stringify(favorites));
    globalObservable.notify({ eventName: 'favorite', data: item });
    return item;
}
