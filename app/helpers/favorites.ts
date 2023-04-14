import { ApplicationSettings, Observable, ObservableArray } from '@nativescript/core';
import { WeatherLocation } from '~/services/api';
import { prefs } from '~/services/preferences';
import { globalObservable, iconColor } from '~/variables';
import { get } from 'svelte/store';

export interface FavoriteLocation extends WeatherLocation {
    isFavorite?: boolean;
}
export const favorites: ObservableArray<WeatherLocation> = new ObservableArray(JSON.parse(ApplicationSettings.getString('favorites', '[]')));
let favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);
console.log('favorites', favorites.length, favoritesKeys);

prefs.on('key:favorites', () => {
    favorites.splice(0, favorites.length, ...JSON.parse(ApplicationSettings.getString('favorites', '[]')));
    favoritesKeys = favorites.map((f) => `${f.coord.lat};${f.coord.lon}`);
});

export function isFavorite(item: WeatherLocation) {
    const key = getFavoriteKey(item);
    return favoritesKeys.indexOf(key) !== -1;
}
export function favoriteIconColor(item: FavoriteLocation) {
    return item.isFavorite ? '#EFB644' : get(iconColor);
}

export function favoriteIcon(item: FavoriteLocation) {
    return item.isFavorite ? 'mdi-star' : 'mdi-star-outline';
}

function getFavoriteKey(item: WeatherLocation) {
    return `${item.coord.lat};${item.coord.lon}`;
}

export function toggleFavorite(item: FavoriteLocation) {
    if (item.isFavorite) {
        const key = getFavoriteKey(item);
        const index = favoritesKeys.indexOf(key);
        if (index > -1) {
            favorites.splice(index, 1);
            favoritesKeys.splice(index, 1);
        }
    } else {
        const { isFavorite, ...toSave } = item;
        favorites.push(toSave);
        favoritesKeys.push(getFavoriteKey(item));
    }
    item.isFavorite = !item.isFavorite;
    ApplicationSettings.setString('favorites', JSON.stringify(favorites));
    globalObservable.notify({ eventName: 'favorite', data: item });
    return item;
}
