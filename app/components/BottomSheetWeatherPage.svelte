<script lang="ts">
    import { Utils } from '@nativescript/core';
    import { getString } from '@nativescript/core/application-settings';
    import { closeBottomSheet } from '~/utils/svelte/bottomsheet';
    import CActionBar from '~/components/CActionBar.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, geocodeAddress, networkService, prepareItems } from '~/services/api';

    let items = [];
    let loading = false;
    export let weatherLocation: WeatherLocation;
    export let name;
    networkService.start(); // ensure it is started

    async function refresh(weatherLocation) {
        loading = true;
        try {
            const provider: 'meteofrance' | 'openweathermap' = getString('provider', 'openweathermap') as any;
            let data: WeatherData;
            if (provider === 'openweathermap') {
                const providerModule = await import('~/services/owm');
                data = await providerModule.getOWMWeather(weatherLocation);
            } else if (provider === 'meteofrance') {
                const providerModule = await import('~/services/mf');
                data = await providerModule.getMFWeather(weatherLocation);
            }
            DEV_LOG && console.log('refresh', name, typeof name, weatherLocation);
            if (!name) {
                name = weatherLocation.coord.lat.toFixed(2) + ',' + weatherLocation.coord.lon.toFixed(2);
                geocodeAddress(weatherLocation.coord).then((r) => {
                    name = r.name;
                });
            }
            items = prepareItems(data, Date.now());
        } catch (err) {
            android.widget.Toast.makeText(Utils.android.getApplicationContext(), err.toString(), android.widget.Toast.LENGTH_LONG);
            closeBottomSheet();
        } finally {
            loading = false;
        }
    }
    $: refresh(weatherLocation);
</script>

<gridlayout rows="auto,*" class="weatherpage" height="100%">
    <CActionBar title={name}>
        <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
    </CActionBar>
    <WeatherComponent row={1} {items} {weatherLocation}/>
</gridlayout>
