import { WeatherProvider } from './weatherprovider';
import { MFProvider } from './mf';
import { OMProvider } from './om';
import { OWMProvider } from './owm';
import { ProviderType } from './weather';
import { ApplicationSettings } from '@akylas/nativescript';
import { prefs } from '../preferences';

export const providers = ['meteofrance', 'openweathermap', 'openmeteo'] as const;

let currentProvider: WeatherProvider;
prefs.on('key:provider', () => {
    setProvider(getProviderType());
});

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
        case 'openweathermap':
            return OWMProvider.getInstance();

        case 'meteofrance':
            return MFProvider.getInstance();
        case 'openmeteo':
        default:
            return OMProvider.getInstance();
    }
}

function setProvider(newType: ProviderType): WeatherProvider {
    currentProvider = getProviderForType(newType);
    return currentProvider;
}
