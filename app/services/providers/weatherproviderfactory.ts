import { ApplicationSettings } from '@nativescript/core';
import { createGlobalEventListener, globalObservable } from '@shared/utils/svelte/ui';
import { prefs } from '../preferences';
import { AirQualityProvider } from './airqualityprovider';
import { MFProvider } from './mf';
import { OMProvider, OpenMeteoModels } from './om';
import { OWMProvider } from './owm';
import { AccuWeatherAQIProvider, AccuWeatherProvider } from './accuweather';
import { AqiProviderType, ProviderType } from './weather';
import { WeatherProvider } from './weatherprovider';
import { AtmoProvider } from './atmo';
import { SETTINGS_PROVIDER, SETTINGS_PROVIDER_AQI } from '~/helpers/constants';

export enum Providers {
    MeteoFrance = 'meteofrance',
    OpenWeather = 'openweathermap',
    OpenMeteo = 'openmeteo',
    AccuWeather = 'accuweather'
}

export enum AirQualityProviders {
    OpenMeteo = 'openmeteo',
    Atmo = 'atmo',
    AccuWeather = 'accuweather'
}

export const providers = Object.values(Providers);
export const aqi_providers = Object.values(AirQualityProviders);

let currentProvider: WeatherProvider;
let currentAirQualityProvider: AirQualityProvider;
prefs.on(`key:${SETTINGS_PROVIDER}`, () => {
    const provider = setWeatherProvider(getProviderType());
    globalObservable.notify({ eventName: SETTINGS_PROVIDER, data: provider });
});
prefs.on(`key:${SETTINGS_PROVIDER_AQI}`, () => {
    const provider = setAirQualityProvider(getAqiProviderType());
    globalObservable.notify({ eventName: SETTINGS_PROVIDER_AQI, data: provider });
});
export const onProviderChanged = createGlobalEventListener(SETTINGS_PROVIDER);
export const onAQIProviderChanged = createGlobalEventListener(SETTINGS_PROVIDER_AQI);

export function getWeatherProvider(provider?: ProviderType): WeatherProvider {
    if (provider) {
        return getProviderForType(provider);
    }
    if (!currentProvider) {
        setWeatherProvider(getProviderType());
    }
    return currentProvider;
}
export function getAqiProvider(provider?: AqiProviderType): AirQualityProvider {
    return getAqiProviderForType(provider || getAqiProviderType());
}
export function getProviderType(): ProviderType {
    const requestedProviderType: ProviderType = (ApplicationSettings.getString(SETTINGS_PROVIDER, DEFAULT_PROVIDER) || DEFAULT_PROVIDER) as ProviderType;
    return requestedProviderType;
}
export function getAqiProviderType(): AqiProviderType {
    const requestedProviderType: AqiProviderType = (ApplicationSettings.getString(SETTINGS_PROVIDER_AQI, DEFAULT_PROVIDER) || DEFAULT_PROVIDER) as AqiProviderType;
    return requestedProviderType;
}

interface ProvidersMap {
    [Providers.OpenWeather]: typeof OWMProvider;
    [Providers.MeteoFrance]: typeof MFProvider;
    [Providers.AccuWeather]: typeof AccuWeatherProvider;
    [Providers.OpenMeteo]: typeof OMProvider;
}
const ProvidersClassMap: ProvidersMap = {
    [Providers.OpenWeather]: OWMProvider,
    [Providers.MeteoFrance]: MFProvider,
    [Providers.AccuWeather]: AccuWeatherProvider,
    [Providers.OpenMeteo]: OMProvider
};

export function getProviderForType(newType: ProviderType): WeatherProvider {
    return ProvidersClassMap[newType].getInstance();
}
export function getProviderClass(provider: ProviderType) {
    return ProvidersClassMap[provider];
}
export function getProviderSettins(provider: ProviderType): any[] {
    return getProviderClass(provider).getSettings();
}
export function providerRequiresApiKey(provider: ProviderType) {
    return getProviderClass(provider).requiresApiKey();
}
export function getAqiProviderForType(newType: AqiProviderType): AirQualityProvider {
    switch (newType) {
        case AirQualityProviders.Atmo:
            return AtmoProvider.getInstance();

        case AirQualityProviders.AccuWeather:
            return AccuWeatherAQIProvider.getInstance();

        case AirQualityProviders.OpenMeteo:
        default:
            return OMProvider.getInstance();
    }
}

function setWeatherProvider(newType: ProviderType): WeatherProvider {
    currentProvider = getProviderForType(newType);
    return currentProvider;
}

function setAirQualityProvider(newType: AqiProviderType): AirQualityProvider {
    currentAirQualityProvider = getAqiProviderForType(newType);
    return currentAirQualityProvider;
}
