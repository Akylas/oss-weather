import { WeatherProvider } from './weatherprovider';
import { MFProvider } from './mf';
import { OMProvider } from './om';
import { OWMProvider } from './owm';
import { AqiProviderType, ProviderType } from './weather';
import { ApplicationSettings } from '@nativescript/core';
import { prefs } from '../preferences';
import { createGlobalEventListener, globalObservable } from '~/utils/svelte/ui';
import { AirQualityProvider } from './airqualityprovider';
import { Provider } from './provider';
import { AtmoProvider } from './atmo';

export enum Providers {
    MeteoFrance = 'meteofrance',
    OpenWeather = 'openweathermap',
    OpenMeteo = 'openmeteo'
}

export enum AirQualityProviders {
    OpenMeteo = 'openmeteo',
    Atmo = 'atmo'
}

export const providers = Object.values(Providers);
export const api_providers = Object.values(AirQualityProviders);

let currentProvider: WeatherProvider;
let currentAirQualityProvider: AirQualityProvider;
prefs.on('key:provider', () => {
    const provider = setWeatherProvider(getProviderType());
    globalObservable.notify({ eventName: 'provider', data: provider });
});
prefs.on('key:aqi_provider', () => {
    const provider = setAirQualityProvider(getAqiProviderType());
    globalObservable.notify({ eventName: 'aqi_provider', data: provider });
});
export const onProviderChanged = createGlobalEventListener('provider');

export function getWeatherProvider(): WeatherProvider {
    DEV_LOG && console.log('getProvider', getProviderType(), !!currentProvider);
    if (!currentProvider) {
        setWeatherProvider(getProviderType());
    }
    return currentProvider;
}
export function getAqiProvider(): AirQualityProvider {
    DEV_LOG && console.log('getAqiProvider', getAqiProviderType());
    return getAqiProviderForType(getAqiProviderType());
}
export function getProviderType(): ProviderType {
    const requestedProviderType: ProviderType = (ApplicationSettings.getString('provider', DEFAULT_PROVIDER) || DEFAULT_PROVIDER) as ProviderType;
    return requestedProviderType;
}
export function getAqiProviderType(): AqiProviderType {
    const requestedProviderType: AqiProviderType = (ApplicationSettings.getString('provider_aqi', DEFAULT_PROVIDER) || DEFAULT_PROVIDER) as AqiProviderType;
    return requestedProviderType;
}

export function getProviderForType(newType: ProviderType): WeatherProvider {
    switch (newType) {
        case Providers.OpenWeather:
            return OWMProvider.getInstance();

        case Providers.MeteoFrance:
            return MFProvider.getInstance();
        case Providers.OpenMeteo:
        default:
            return OMProvider.getInstance();
    }
}
export function getAqiProviderForType(newType: AqiProviderType): AirQualityProvider {
    // switch (newType) {
    // case AirQualityProviders.Atmo:
    // return AtmoProvider.getInstance();
    // case AirQualityProviders.OpenMeteo:
    // default:
    return OMProvider.getInstance();
    // }
}

function setWeatherProvider(newType: ProviderType): WeatherProvider {
    currentProvider = getProviderForType(newType);
    return currentProvider;
}

function setAirQualityProvider(newType: AqiProviderType): AirQualityProvider {
    currentAirQualityProvider = getAqiProviderForType(newType);
    return currentAirQualityProvider;
}
