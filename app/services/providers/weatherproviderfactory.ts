import { WeatherProvider } from './weatherprovider';
import { MFProvider } from './mf';
import { OMProvider } from './om';
import { OWMProvider } from './owm';
import { ProviderType } from './weather';
import { ApplicationSettings } from '@akylas/nativescript';
import { prefs } from '../preferences';
import { createGlobalEventListener, globalObservable } from '~/utils/svelte/ui';

export enum Providers {
    MeteoFrance = 'meteofrance',
    OpenWeather = 'openweathermap',
    OpenMeteo = 'openmeteo'
}

export const providers = Object.values(Providers);

let currentProvider: WeatherProvider;
prefs.on('key:provider', () => {
    const provider = setProvider(getProviderType());
    globalObservable.notify({ eventName: 'provider', data: provider });
});
export const onProviderChanged = createGlobalEventListener('provider');

export function getProvider(): WeatherProvider {
    DEV_LOG && console.log('getProvider', getProviderType(), !!currentProvider);
    if (!currentProvider) {
        setProvider(getProviderType());
    }
    // const requestedProviderType = getProviderType();
    // eslint-disable-next-line prefer-const
    // let [provider, providerType] = WeatherProvider.getInstance();
    // if (requestedProviderType !== providerType) {
    //     provider = setProvider(requestedProviderType);
    // }
    // return provider;
    return currentProvider;
}
export function getProviderType(): ProviderType {
    const requestedProviderType: ProviderType = (ApplicationSettings.getString('provider', DEFAULT_PROVIDER) || DEFAULT_PROVIDER) as ProviderType;
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

function setProvider(newType: ProviderType): WeatherProvider {
    currentProvider = getProviderForType(newType);
    return currentProvider;
}
