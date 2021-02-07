<script lang="ts">
    import { Application } from '@nativescript/core';
    import { closeBottomSheet } from './bottomsheet';
    import CActionBar from './CActionBar.svelte';
    import { getOWMWeather, networkService, prepareItems } from './services/api';
    import WeatherComponent from './WeatherComponent.svelte';

    let items = [];
    let loading = false;
    export let weatherLocation;
    networkService.start(); // ensure it is started

    async function refresh(weatherLocation) {
        loading = true;
        try {
            const data = await getOWMWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
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
    <CActionBar title={weatherLocation && weatherLocation.name}>
        <activityIndicator busy={loading} verticalAlignment="middle" visibily={loading ? 'visible' : 'collapsed'} />
    </CActionBar>
    <WeatherComponent row="1" {items} customComp />
</gridlayout>
