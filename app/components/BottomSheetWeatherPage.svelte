<script lang="ts">
    import { ApplicationSettings, Color, Utils } from '@nativescript/core';
    import { closeBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, geocodeAddress, networkService, prepareItems } from '~/services/api';
    import { actionBarButtonHeight, colors } from '~/variables';
    import { l, lc } from '~/helpers/locale';
    import { getProvider, getProviderType, onProviderChanged, providers } from '~/services/providers/weatherproviderfactory';
    import { prefs } from '~/services/preferences';
    import { onDestroy, onMount } from 'svelte';
    import { FavoriteLocation, favoriteIcon, favoriteIconColor, toggleFavorite } from '~/helpers/favorites';

    let { colorBackground } = $colors;
    $: ({ colorBackground } = $colors);

    let items = [];
    let loading = false;
    export let weatherLocation: WeatherLocation;
    export let name;
    networkService.start(); // ensure it is started
    DEV_LOG && console.log('BottomSheetWeatherPage');
    async function refresh(location: WeatherLocation = weatherLocation) {
        if (loading) {
            return;
        }
        loading = true;
        try {
            const data = await getProvider().getWeather(location);
            DEV_LOG && console.log('BottomSheet', 'refresh',loading, JSON.stringify(location));
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
    let provider = getProviderType();

    onMount(() => {
        DEV_LOG && console.log('BottomSheet', 'onMount`');
        refresh(weatherLocation);
    });

    onProviderChanged((event) => {
        DEV_LOG && console.log('BottomSheet', 'onProviderChanged');
        provider = getProviderType();
        refresh();
    });

    function onSwipe(e) {
        const currentProviderIndex = providers.indexOf(provider);
        let newIndex = currentProviderIndex + (e.direction === 1 ? -1 : 1);
        if (newIndex < 0) {
            newIndex += providers.length;
        }
        const newProvider = providers[newIndex % providers.length];
        ApplicationSettings.setString('provider', newProvider);
    }
    function toggleItemFavorite(item: FavoriteLocation) {
        weatherLocation = toggleFavorite(item);
    }
</script>

<gesturerootview class="weatherpage" height="100%" rows="auto,*">
    <CActionBar title={name} on:swipe={onSwipe}>
        <mdbutton
            slot="left"
            class="actionBarButton"
            col={1}
            color={favoriteIconColor(weatherLocation)}
            rippleColor="#EFB644"
            text={favoriteIcon(weatherLocation)}
            variant="text"
            verticalAlignment="middle"
            visibility={weatherLocation ? 'visible' : 'collapse'}
            on:tap={() => toggleItemFavorite(weatherLocation)} />
        <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapse'} width={$actionBarButtonHeight} />
    </CActionBar>
    <label
        backgroundColor={new Color(colorBackground).setAlpha(100).hex}
        fontSize={10}
        horizontalAlignment="right"
        marginRight={6}
        row={0}
        text={lc('powered_by', l(`provider.${provider}`))}
        verticalAlignment="top" />
    <WeatherComponent {items} row={1} {weatherLocation} />
</gesturerootview>
