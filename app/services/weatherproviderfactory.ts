import { WeatherProvider } from './weatherprovider';
import { MFProvider } from './mf';
import { OMProvider } from './om';
import { OWMProvider } from './owm';
import { getString } from '@nativescript/core/application-settings';


export function getProvider(): WeatherProvider {
    const providerString: 'meteofrance' | 'openweathermap' | 'openmeteo' = getString('provider', 'meteofrance') as any;
    let provider: WeatherProvider;
    switch(providerString) {
        case 'openmeteo':
            provider = new OMProvider(); 
            break;

        case 'openweathermap':
            provider = new OWMProvider(); 
            break;

        case 'meteofrance':
            provider = new MFProvider(); 
            break;
    }
    return provider;
}
