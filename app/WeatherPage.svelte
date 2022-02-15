<script lang="ts">
    import { GPS, setGeoLocationKeys } from '@nativescript-community/gps';
    import { request as requestPerm } from '@nativescript-community/perms';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { CoreTypes, Page } from '@nativescript/core';
    import { getNumber, getString, setNumber, setString } from '@nativescript/core/application-settings';
    import { onMount } from 'svelte';
    import { navigate, showModal } from 'svelte-native';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { showBottomSheet } from '~/bottomsheet';
    import { l, onLanguageChanged } from '~/helpers/locale';
    import { getOWMWeather, hasOWMApiKey, NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService, prepareItems, setOWMApiKey } from '~/services/api';
    import { prefs } from '~/services/preferences';
    import { alert, showError } from '~/utils/error';
    import { mdiFontFamily } from '~/variables';
    import ActionSheet from '~/ActionSheet.svelte';
    import AlertView from '~/AlertView.svelte';
    import ApiKeysBottomSheet from '~/APIKeysBottomSheet.svelte';
    import CActionBar from '~/CActionBar.svelte';
    import { toggleTheme } from '~/helpers/theme';
    import WeatherComponent from '~/WeatherComponent.svelte';
    import WeatherMapPage from '~/WeatherMapPage.svelte';

    setGeoLocationKeys('lat', 'lon', 'altitude');

    let gps: GPS;
    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let weatherLocation: {
        coord: {
            lat: number;
            lon: number;
        };
        name?: string;
    } = JSON.parse(getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData = JSON.parse(getString('lastWeatherData', 'null'));

    let items = [];

    let desiredAccuracy = global.isAndroid ? CoreTypes.Accuracy.high : kCLLocationAccuracyBestForNavigation;
    let timeout = 20000;
    let minimumUpdateTime = 1000; // Should update every 1 second according ;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let page: NativeViewElementNode<Page>;
    async function showOptions() {
        try {
            const result: { icon: string; id: string; text: string } = await showBottomSheet({
                parent: page,
                view: ActionSheet,
                props: {
                    options: [
                        {
                            icon: 'mdi-refresh',
                            id: 'refresh',
                            text: l('refresh')
                        },
                        {
                            icon: 'mdi-cogs',
                            id: 'preferences',
                            text: l('preferences')
                        },
                        {
                            icon: 'mdi-crosshairs-gps',
                            id: 'gps_location',
                            text: l('gps_location')
                        },
                        {
                            icon: 'mdi-information-outline',
                            id: 'about',
                            text: l('about')
                        }
                    ]
                }
            });
            if (result) {
                switch (result.id) {
                    case 'preferences':
                        prefs.openSettings();
                        // toggleTheme();
                        break;
                    case 'refresh':
                        refreshWeather();
                        break;
                    case 'gps_location':
                        getLocationAndWeather();
                        break;
                    case 'dark_mode':
                        toggleTheme();
                        break;
                    case 'about':
                        const About = require('~/About.svelte').default;
                        navigate({ page: About });
                        break;
                }
            }
        } catch (error) {
            showError(error);
        }
    }

    async function refreshWeather() {
        if (!weatherLocation) {
            showSnack({ message: l('no_location_set') });
            return;
        }
        if (!networkConnected) {
            showSnack({ message: l('no_network') });
            return;
        }
        loading = true;
        try {
            weatherData = await getOWMWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
            lastUpdate = Date.now();
            await updateView();
        } catch (err) {
            console.log(err);
            if (err.statusCode === 403) {
                setOWMApiKey(null);
                askForApiKey();
            } else {
                showError(err);
            }
        } finally {
            loading = false;
        }
    }

    async function updateView() {
        items = prepareItems(weatherData, lastUpdate);
        setNumber('lastUpdate', lastUpdate);
        setString('lastWeatherData', JSON.stringify(weatherData));
    }

    function saveLocation(result) {
        const cityChanged = !weatherLocation || result.coord.lat !== weatherLocation.coord.lat || weatherLocation.coord.lon !== result.coord.lat;
        if (cityChanged) {
            weatherLocation = result;
            setString('weatherLocation', JSON.stringify(weatherLocation));
            refreshWeather();
        }
    }

    async function searchCity() {
        try {
            const SelectCity = require('~/SelectCity.svelte').default;

            const result = await showModal({ page: SelectCity, animated: true, fullscreen: true });
            if (result) {
                saveLocation(result);
            }
        } catch (err) {
            showError(err);
        }
    }
    async function openWeatherMap() {
        try {
            await navigate({ page: WeatherMapPage, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
        } catch (error) {
            showError(error);
        }
    }
    async function getLocationAndWeather() {
        try {
            const result = await requestPerm('location');
            if ((Array.isArray(result) && result[0] !== 'authorized') || Object.keys(result).some((s) => result[s] !== 'authorized')) {
                return alert(l('missing_location_perm'));
            }
            loading = true;
            if (!gps) {
                gps = new GPS();
            }
            const location = await gps.getCurrentLocation<LatLonKeys>({ desiredAccuracy, minimumUpdateTime, timeout });
            if (location) {
                saveLocation({
                    name: location.lat.toFixed(2) + ',' + location.lon.toFixed(2),
                    coord: location
                });
            }
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    async function refresh() {
        if (!hasOWMApiKey()) {
            return;
        }
        if (!weatherLocation) {
            showSnack({ message: l('no_location_set') });
            return;
        }
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = true;
        }

        await refreshWeather();
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = false;
        }
    }

    async function askForApiKey() {
        const result = await showBottomSheet({
            parent: page,
            view: ApiKeysBottomSheet,
            dismissOnBackgroundTap: true,
            dismissOnDraggingDownSheet: true
        });
        if (result) {
            refresh();
        }
    }
    onMount(async () => {
        const owmApiKey = getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY);
        if ((!owmApiKey || owmApiKey === OWM_DEFAULT_KEY) && weatherLocation) {
            // wait a bit
            setTimeout(() => askForApiKey(), 1000);
        }
        networkService.on(NetworkConnectionStateEvent, (event: NetworkConnectionStateEventData) => {
            if (networkConnected !== event.data.connected) {
                networkConnected = event.data.connected;
                if ((event.data.connected && !lastUpdate) || Date.now() - lastUpdate > 10 * 60 * 1000) {
                    refresh();
                }
            } else {
                updateView();
            }
        });
        networkService.start(); // should send connection event and then refresh

        if (weatherData) {
            items = prepareItems(weatherData, lastUpdate);
        }
    });

    onLanguageChanged((lang) => {
        console.log('refresh triggered by lang change');
        refresh();
    });

    async function showAlerts() {
        if (!weatherData.alerts) {
            return;
        }
        try {
            showBottomSheet({
                parent: page,
                view: AlertView,
                trackingScrollView: 'scrollView',
                props: {
                    alerts: weatherData.alerts
                }
            });
        } catch (err) {
            showError(err);
        }
    }
</script>

<page bind:this={page} actionBarHidden={true} id="home">
    <gridlayout rows="auto,*">
        <CActionBar title={weatherLocation && weatherLocation.name}>
            <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
            <mdbutton
                visibility={weatherData && weatherData.alerts && weatherData.alerts.length > 0 ? 'visible' : 'collapsed'}
                variant="text"
                class="icon-btn"
                color="#EFB644"
                rippleColor="#EFB644"
                horizontalAlignment="left"
                on:tap={() => showAlerts()}
                text="mdi-alert"
            />
            {#if weatherLocation}
                <mdbutton variant="text" class="icon-btn" verticalAlignment="middle" text="mdi-map" on:tap={openWeatherMap} />
            {/if}
            <mdbutton variant="text" class="icon-btn" verticalAlignment="middle" text="mdi-magnify" on:tap={searchCity} />
            <mdbutton variant="text" class="icon-btn" verticalAlignment="middle" text="mdi-dots-vertical" on:tap={showOptions} />
        </CActionBar>
        {#if !networkConnected && !weatherData}
            <label row={1} horizontalAlignment="center" verticalAlignment="center" text={l('no_network').toUpperCase()} />
        {:else if weatherLocation}
            <pullrefresh bind:this={pullRefresh} row={1} on:refresh={refresh}>
                <WeatherComponent {items} />
            </pullrefresh>
        {:else}
            <gridlayout id="teststack" row={1} rows="auto,auto,auto,auto,60" horizontalAlignment="center" verticalAlignment="center" columns="auto">
                <label text={l('no_location_desc')} textAlignment="center" marginBottom={20} />
                <mdbutton row={1} margin="4 0 4 0" padding="4" variant="outline" on:tap={getLocationAndWeather} verticalTextAlignment="center">
                    <cspan fontSize={20} fontFamily={mdiFontFamily} text="mdi-crosshairs-gps" />
                    <cspan text={l('my_location').toUpperCase()} />
                </mdbutton>
                <mdbutton row={2} margin="4 0 4 0" padding="4" variant="outline" on:tap={searchCity} verticalTextAlignment="center">
                    <cspan fontSize={20} fontFamily={mdiFontFamily} text="mdi-magnify" />
                    <cspan text={l('search_location').toUpperCase()} />
                </mdbutton>
            </gridlayout>
        {/if}
    </gridlayout>
</page>
