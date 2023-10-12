import { WeatherProvider } from './weatherprovider';
import { MFProvider } from './mf';
import { OMProvider } from './om';
import { OWMProvider } from './owm';
import { getString } from '@nativescript/core/application-settings';

export function getProvider(): WeatherProvider {
    const requestedProviderType: ProviderType = getString('provider', DEFAULT_PROVIDER) as ProviderType;
    // eslint-disable-next-line prefer-const
    let [provider, providerType] = WeatherProvider.getInstance();
    if (requestedProviderType !== providerType) {
        provider = setProvider(requestedProviderType);
    }
    return provider;
}

function setProvider(newType: ProviderType): WeatherProvider {
    let provider: WeatherProvider;
    switch (newType) {
        case 'openweathermap':
            provider = new OWMProvider();
            break;

        case 'meteofrance':
            provider = new MFProvider();
            break;
        case 'openmeteo':
        default:
            provider = new OMProvider();
            break;
    }
    WeatherProvider.setInstance(provider, newType);
    return provider;
}
