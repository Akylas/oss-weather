<script lang="ts">
    import { ApplicationSettings, Color, Utils } from '@nativescript/core';
    import { closeBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, geocodeAddress, networkService, prepareItems } from '~/services/api';
    import { colors } from '~/variables';
    import { l, lc } from '~/helpers/locale';
    import { getProvider, getProviderType } from '~/services/weatherproviderfactory';
    import { prefs } from '~/services/preferences';

    $: ({
        colorBackground,
    } = $colors);

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

<gridlayout class="weatherpage" height="100%" rows="auto,*">
    <CActionBar title={name}>
        <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
    </CActionBar>
    <label
                    backgroundColor={new Color(colorBackground).setAlpha(100).hex}
                    fontSize={10}
                    horizontalAlignment="right"
                    marginRight={6}
                    row={0}
                    text={lc('powered_by', l(`provider.${provider}`))}
                    verticalAlignment="top"
                />
    <WeatherComponent {items} row={1} {weatherLocation} />
</gridlayout>
