<script lang="ts">
    import { ApplicationSettings, Color, Utils } from '@nativescript/core';
    import { closeBottomSheet } from '~/utils/svelte/bottomsheet';
    import CActionBar from '~/components/CActionBar.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, geocodeAddress, networkService, prepareItems } from '~/services/api';
    import { backgroundColor } from '~/variables';
    import { l, lc } from '~/helpers/locale';
    import { getProvider, getProviderType } from '~/services/weatherproviderfactory';
    import { prefs } from '~/services/preferences';

    let items = [];
    let loading = false;
    export let weatherLocation: WeatherLocation;
    export let name;
    networkService.start(); // ensure it is started

    async function refresh(location: WeatherLocation = weatherLocation) {
        loading = true;
        try {
            const data = await getProvider().getWeather(location);
            DEV_LOG && console.log('refresh', name, typeof name, location);
            if (!name || !location.sys.city) {
                try {
                    const r = await geocodeAddress(location.coord);
                    if (!location.sys) {
                        location.sys = r.sys;
                    }
                    if (!name) {
                        name = location.name = location.sys.name = r.name;
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            if (!name) {
                name = location.coord.lat.toFixed(2) + ',' + location.coord.lon.toFixed(2);
            }
            items = prepareItems(location, data, Date.now());
        } catch (err) {
            android.widget.Toast.makeText(Utils.android.getApplicationContext(), err.toString(), android.widget.Toast.LENGTH_LONG);
            closeBottomSheet();
        } finally {
            loading = false;
        }
    }
    $: refresh(weatherLocation);
    let provider = getProviderType();

    prefs.on('key:provider', (event) => {
        provider = getProviderType();
        refresh();
    });
</script>

<gridlayout rows="auto,*" class="weatherpage" height="100%">
    <CActionBar title={name}>
        <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
    </CActionBar>
    <label
                    row={0}
                    fontSize={10}
                    backgroundColor={new Color($backgroundColor).setAlpha(100).hex}
                    text={lc('powered_by', l(`provider.${provider}`))}
                    verticalAlignment="top"
                    horizontalAlignment="right"
                    marginRight={6}
                />
    <WeatherComponent row={1} {items} {weatherLocation} />
</gridlayout>
