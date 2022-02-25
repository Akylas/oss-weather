<script lang="ts">
    import { getFromLocation } from '@nativescript-community/geocoding';
    import { Application } from '@nativescript/core';
    import { closeBottomSheet } from '~/bottomsheet';
    import CActionBar from '~/components/CActionBar.svelte';
    import { getOWMWeather, networkService, prepareItems } from '~/services/api';
    import WeatherComponent from '~/components/WeatherComponent.svelte';

    let items = [];
    let loading = false;
    export let weatherLocation: {
        coord: {
            lat: number;
            lon: number;
        };
        name?: string;
    };
    export let name;
    networkService.start(); // ensure it is started

    async function geocodeAddress() {
        try {
            const results = await getFromLocation(weatherLocation.coord.lat, weatherLocation.coord.lon, 10);
            if (DEV_LOG) {
                console.error('found addresses', results);
            }
            if (results?.length > 0) {
                name = results[0].locality;
            }
        } catch (error) {
            console.error('geocodeAddress error:', error);
        }
    }

    async function refresh(weatherLocation) {
        loading = true;
        try {
            const data = await getOWMWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
            DEV_LOG && console.log('refresh', name, typeof name, weatherLocation);
            if (!name) {
                name = weatherLocation.coord.lat.toFixed(2) + ',' + weatherLocation.coord.lon.toFixed(2);
                geocodeAddress();
            }
            items = prepareItems(data, Date.now());
        } catch (err) {
            android.widget.Toast.makeText(Application.android.context, err.toString(), android.widget.Toast.LENGTH_LONG);
            closeBottomSheet();
        } finally {
            loading = false;
        }
    }
    $: refresh(weatherLocation);
</script>

<gridlayout rows="auto,*" class="weatherpage">
    <CActionBar title={name}>
        <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
    </CActionBar>
    <WeatherComponent row={1} {items} customComp />
</gridlayout>
