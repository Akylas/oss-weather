import { ApplicationSettings } from '@akylas/nativescript';
import { WeatherLocation, request } from '../api';
import { AirQualityProvider } from './airqualityprovider';
import { prefs } from '../preferences';
import dayjs from 'dayjs';

export class AtmoProvider extends AirQualityProvider {
    static id = 'atmo';
    id = AtmoProvider.id;
    static apiKey = AtmoProvider.readApiKeySetting();

    name = 'ATMO Auvergne-Rhône-Alpes';
    privacyPolicyUrl = 'https://www.atmo-auvergnerhonealpes.fr/article/politique-de-confidentialite';

    static readApiKeySetting() {
        let key = ApplicationSettings.getString('atmoApiKey', ATMO_DEFAULT_KEY);
        if (!key || key?.length === 0) {
            ApplicationSettings.remove('atmoApiKey');
            key = ATMO_DEFAULT_KEY;
        }
        return key?.trim();
    }
    private async fetch<T = any>(weatherLocation: WeatherLocation) {
        return request<T>({
            url: 'https://api.atmo-aura.fr/air2go/v3/point?with_list=true',
            method: 'GET',
            queryParams: {
                api_token: AtmoProvider.apiKey,
                x: weatherLocation.coord.lon,
                y: weatherLocation.coord.lat,
                datetime_echeance: dayjs().add(1, 'd').format('[YYYYescape] YYYY-MM-DDTHH:mm:ssZ[Z]') // Tomorrow because it gives access to D-1 and D+1
            },
            headers: {
                'Cache-Control': `max-age=${60 * 5}`
            }
        });
    }
    async getAirQuality(weatherLocation: WeatherLocation, options?: { model?: string; warnings?: boolean; minutely?: boolean; hourly?: boolean; current?: boolean; forceModel?: boolean }) {
        const result = await this.fetch(weatherLocation);
        DEV_LOG && console.log('getAirQuality', JSON.stringify(result));
        return null;
    }
}

prefs.on('key:atmoApiKey', (event) => {
    AtmoProvider.apiKey = AtmoProvider.readApiKeySetting();
});
