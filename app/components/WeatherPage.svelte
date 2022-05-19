<script lang="ts">
    import { GPS, setGeoLocationKeys } from '@nativescript-community/gps';
    import { request as requestPerm } from '@nativescript-community/perms';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { Color, CoreTypes, Page } from '@nativescript/core';
    import { alert as mdAlert, confirm } from '@nativescript-community/ui-material-dialogs';
    import { getNumber, getString, setNumber, setString } from '@nativescript/core/application-settings';
    import { onMount } from 'svelte';
    import { navigate, showModal } from 'svelte-native';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { showBottomSheet } from '~/bottomsheet';
    import { sl, slc, l, lc, onLanguageChanged } from '~/helpers/locale';
    import { geocodeAddress, NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService, prepareItems, WeatherLocation } from '~/services/api';
    import { prefs } from '~/services/preferences';
    import { alert, showError } from '~/utils/error';
    import { backgroundColor, mdiFontFamily } from '~/variables';
    import CActionBar from '~/components/CActionBar.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import WeatherMapPage from '~/components/WeatherMapPage.svelte';

    setGeoLocationKeys('lat', 'lon', 'altitude');

    let gps: GPS;
    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let provider: 'meteofrance' | 'openweathermap' = getString('provider', 'meteofrance') as any;
    if (!provider || provider.length === 0) {
        provider = 'openweathermap';
    }
    let weatherLocation: WeatherLocation = JSON.parse(getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData: WeatherData = JSON.parse(getString('lastWeatherData', 'null'));

    let items = [];

    //@ts-ignore
    let desiredAccuracy = __ANDROID__ ? CoreTypes.Accuracy.high : kCLLocationAccuracyBestForNavigation;
    let timeout = 20000;
    let minimumUpdateTime = 1000; // Should update every 1 second according ;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let page: NativeViewElementNode<Page>;
    async function showOptions() {
        try {
            const ActionSheet = (await import('~/components/ActionSheet.svelte')).default;
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
                    case 'about':
                        const About = require('~/components/About.svelte').default;
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
            console.log('refreshWeather', `"${provider}"`);
            if (provider === 'openweathermap') {
                const providerModule = await import('~/services/owm');
                weatherData = await providerModule.getOWMWeather(weatherLocation);
            } else if (provider === 'meteofrance') {
                const providerModule = await import('~/services/mf');
                weatherData = await providerModule.getMFWeather(weatherLocation);
            }
            if (weatherData) {
                lastUpdate = Date.now();
                await updateView();
            }
        } catch (err) {
            if (err.statusCode === 403) {
                if (provider === 'openweathermap') {
                    const providerModule = await import('~/services/owm');
                    providerModule.setOWMApiKey(null);
                    askForApiKey();
                }
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

    function saveLocation(result: WeatherLocation) {
        const cityChanged = !weatherLocation || result.coord.lat !== weatherLocation.coord.lat || weatherLocation.coord.lon !== result.coord.lat;
        if (cityChanged) {
            weatherLocation = result;
            setString('weatherLocation', JSON.stringify(weatherLocation));
            refreshWeather();
        }
    }

    async function searchCity() {
        try {
            const SelectCity = (await import('~/components/SelectCity.svelte')).default;
            const result = await showModal<WeatherLocation>({ page: SelectCity, animated: true, fullscreen: true });
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
            if (!gps) {
                gps = new GPS();
            }
            if (!gps.isEnabled()) {
                const r = await confirm({
                    title: lc('gps_off'),
                    okButtonText: lc('settings'),
                    cancelButtonText: lc('close')
                });
                if (__ANDROID__ && r) {
                    await gps.openGPSSettings();
                }
            }
            if (gps.isEnabled()) {
                loading = true;
                const location = await gps.getCurrentLocation<LatLonKeys>({ desiredAccuracy, minimumUpdateTime, timeout });
                if (location) {
                    const result = await geocodeAddress(location);
                    saveLocation(result);
                }
            }
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    async function refresh() {
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
        const ApiKeysBottomSheet = (await import('~/components/APIKeysBottomSheet.svelte')).default;
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
        if (provider === 'openweathermap') {
            const owmApiKey = getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY);
            if ((!owmApiKey || owmApiKey === OWM_DEFAULT_KEY) && weatherLocation) {
                // wait a bit
                setTimeout(() => askForApiKey(), 1000);
            }
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
        DEV_LOG && console.log('refresh triggered by lang change');
        refresh();
    });

    async function showAlerts() {
        if (!weatherData.alerts) {
            return;
        }
        DEV_LOG && console.log('showAlerts', weatherData.alerts);
        try {
            const AlertView = (await import('~/components/AlertView.svelte')).default;
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
    prefs.on('key:provider', (event) => {
        provider = getString('provider') as any;
        refresh();
    });
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
            <label
                row="1"
                fontSize={10}
                backgroundColor={new Color($backgroundColor).setAlpha(100).hex}
                text={lc('powered_by', l(`provider.${provider}`))}
                verticalAlignment="bottom"
                horizontalAlignment="right"
            />
        {:else}
            <gridlayout id="teststack" row={1} rows="auto,auto,auto,auto,60" horizontalAlignment="center" verticalAlignment="center" columns="auto">
                <label text={$sl('no_location_desc')} textAlignment="center" marginBottom={20} />
                <mdbutton row={1} margin="4 0 4 0" variant="outline" on:tap={getLocationAndWeather} textAlignment="center" verticalTextAlignment="center" android:paddingTop={6}>
                    <cspan fontSize={20} fontFamily={mdiFontFamily} text="mdi-crosshairs-gps" verticalAlignment="center" />
                    <cspan text={$sl('my_location').toUpperCase()} verticalAlignment="center" />
                </mdbutton>
                <mdbutton row={2} margin="4 0 4 0" variant="outline" on:tap={searchCity} textAlignment="center" android:paddingTop={6} verticalTextAlignment="center">
                    <!-- <formattedstring> -->
                    <cspan fontSize={20} fontFamily={mdiFontFamily} text="mdi-magnify" verticalAlignment="center" />
                    <cspan text={$sl('search_location').toUpperCase()} verticalAlignment="center" />
                    <!-- </formattedstring> -->
                </mdbutton>
            </gridlayout>
        {/if}
    </gridlayout>
</page>
