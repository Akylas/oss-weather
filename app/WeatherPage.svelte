<script lang="ts">
    import { PullToRefresh } from '@akylas/nativescript-pulltorefresh';
    import { GPS, setGeoLocationKeys } from '@nativescript-community/gps';
    import { request as requestPerm } from '@nativescript-community/perms';
    import { login } from '@nativescript-community/ui-material-dialogs';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { TextField } from '@nativescript-community/ui-material-textfield';
    import { Application, Page } from '@nativescript/core';
    import { getNumber, getString, setNumber, setString } from '@nativescript/core/application-settings';
    import { Accuracy } from '@nativescript/core/ui/enums/enums';
    import { onMount } from 'svelte';
    import { navigate, showModal } from 'svelte-native';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { showBottomSheet } from '~/bottomsheet';
    import { l, lc, onLanguageChanged } from '~/helpers/locale';
    import { getOWMWeather, hasOWMApiKey, NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService, prepareItems, setCCApiKey, setOWMApiKey } from '~/services/api';
    import { prefs } from '~/services/preferences';
    import { alert, showError } from '~/utils/error';
    import { actionBarHeight, mdiFontFamily, navigationBarHeight, screenHeightDips, screenScale, statusBarHeight } from '~/variables';
    import ActionSheet from './ActionSheet.svelte';
    import AlertView from './AlertView.svelte';
    import ApiKeysBottomSheet from './APIKeysBottomSheet.svelte';
    import CActionBar from './CActionBar.svelte';
    import SelectLocationOnMap from './SelectLocationOnMap.svelte';
    import { Sentry } from './utils/sentry';
    import WeatherComponent from './WeatherComponent.svelte';
    import WeatherMapPage from './WeatherMapPage.svelte';

    setGeoLocationKeys('lat', 'lon', 'altitude');

    const mailRegexp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    let gps: GPS;
    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let weatherLocation = JSON.parse(getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData = JSON.parse(getString('lastWeatherData', 'null'));

    let topHeight = Math.max(Math.min(screenHeightDips - actionBarHeight - navigationBarHeight - statusBarHeight - 100, 500), 400);
    let items = [];

    let desiredAccuracy = global.isAndroid ? Accuracy.high : kCLLocationAccuracyBestForNavigation;
    let timeout = 20000;
    let minimumUpdateTime = 1000; // Should update every 1 second according ;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let page: NativeViewElementNode<Page>;
    function showOptions() {
        showBottomSheet({
            parent: page,
            view: ActionSheet,
            props: {
                options: [
                    {
                        icon: 'mdi-refresh',
                        id: 'refresh',
                        text: l('refresh'),
                    },
                    // {
                    //     icon: 'mdi-map',
                    //     id: 'select_on_map',
                    //     text: l('select_on_map')
                    // },
                    {
                        icon: 'mdi-cogs',
                        id: 'preferences',
                        text: l('preferences'),
                    },
                    {
                        icon: 'mdi-crosshairs-gps',
                        id: 'gps_location',
                        text: l('gps_location'),
                    },
                    {
                        icon: 'mdi-information-outline',
                        id: 'about',
                        text: l('about'),
                    },
                    {
                        icon: 'mdi-bug',
                        id: 'send_bug_report',
                        text: l('send_bug_report'),
                    },
                ],
            },
        }).then((result: { icon: string; id: string; text: string }) => {
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
                    case 'send_bug_report':
                        sendBugReport();
                        break;
                    case 'about':
                        const About = require('./About.svelte').default;
                        showModal({ page: About, animated: true, fullscreen: true });
                        break;
                }
            }
        });
    }

    async function refreshWeather() {
        // console.log('refreshWeather', networkService.connected, weatherLocation);
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
                // setDSApiKey(null);
                setOWMApiKey(null);
                setCCApiKey(null);
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
        // console.log('items', items);
        // setDay(0);
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
            const SelectCity = require('./SelectCity.svelte').default;

            const result = await showModal({ page: SelectCity, animated: true, fullscreen: true });
            if (result) {
                saveLocation(result);
            }
        } catch (err) {
            showError(err);
        }
    }
    async function openWeatherMap() {
        navigate({ page: WeatherMapPage, transition: { name: 'fade', duration: 200 }, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
    }
    async function searchOnMap() {
        try {
            const result = await showModal({ page: SelectLocationOnMap, animated: true, fullscreen: true, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
            if (result) {
                saveLocation(result);
            }
        } catch (err) {
            showError(err);
        }
    }
    async function getLocationAndWeather() {
        try {
            const permRes = await requestPerm('location');
            if (permRes[0] !== 'authorized') {
                return alert(l('missing_location_perm'));
            }
            loading = true;
            if (!gps) {
                gps = new GPS();
                // gps.debug = true;
            }
            const location = await gps.getCurrentLocation<LatLonKeys>({ desiredAccuracy, minimumUpdateTime, timeout });
            if (location) {
                // console.log('location', location);
                saveLocation({
                    name: location.lat.toFixed(2) + ',' + location.lon.toFixed(2),
                    coord: location,
                });
            }
        } catch (err) {
            showError(err);
            // refresh using last location?
        } finally {
            loading = false;
        }
    }

    async function refresh() {
        if (!hasOWMApiKey()) {
            // alert(l('missing_api_key'));
            return;
        }
        if (!weatherLocation) {
            showSnack({ message: l('no_location_set') });
            return;
        }
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = true;
        }

        // if (hasDSApiKey()) {
        await refreshWeather();
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = false;
        }
    }

    function quitApp() {
        if (global.isIOS) {
            exit(0);
        } else {
            Application.android.startActivity.finish();
        }
    }
    async function askForApiKey() {
        const result = await showBottomSheet({
            parent: page,
            view: ApiKeysBottomSheet,
            dismissOnBackgroundTap: true,
            dismissOnDraggingDownSheet: true,
        });
        if (result) {
            refresh();
        }
    }
    onMount(async () => {
        const ccApiKey = getString('ccApiKey', CLIMA_CELL_MY_KEY || CLIMA_CELL_DEFAULT_KEY);
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
    // function onCanvasLabelClicked(e) {
    //     console.log('onCanvasLabelClicked', e.object);
    //     e.object.redraw();
    // }

    async function showAlerts() {
        if(!weatherData.alerts) {
            return;
        }
        try {
            console.log('showAlerts', weatherData.alerts);
            showBottomSheet({
                parent: page,
                view: AlertView,
                trackingScrollView: 'scrollView',
                props: {
                    alerts: weatherData.alerts,
                },
            });
        } catch (err) {
            showError(err);
        }
    }

    async function sendBugReport() {
        const result = await login({
            title: lc('send_bug_report'),
            message: lc('send_bug_report_desc'),
            okButtonText: l('send'),
            cancelButtonText: l('cancel'),
            autoFocus: true,
            usernameTextFieldProperties: {
                marginLeft: 10,
                marginRight: 10,
                autocapitalizationType: 'none',
                keyboardType: 'email',
                autocorrect: false,
                error: lc('email_required'),
                hint: lc('email'),
            },
            passwordTextFieldProperties: {
                marginLeft: 10,
                marginRight: 10,
                error: lc('please_describe_error'),
                secure: false,
                hint: lc('description'),
            },
            beforeShow: (options, usernameTextField: TextField, passwordTextField: TextField) => {
                usernameTextField.on('textChange', (e: any) => {
                    const text = e.value;
                    if (!text) {
                        usernameTextField.error = lc('email_required');
                    } else if (!mailRegexp.test(text)) {
                        usernameTextField.error = lc('non_valid_email');
                    } else {
                        usernameTextField.error = null;
                    }
                });
                passwordTextField.on('textChange', (e: any) => {
                    const text = e.value;
                    if (!text) {
                        passwordTextField.error = lc('description_required');
                    } else {
                        passwordTextField.error = null;
                    }
                });
            },
        });
        if (result.result) {
            if (!result.userName || !mailRegexp.test(result.userName)) {
                showError(new Error(lc('email_required')));
                return;
            }
            if (!result.password || result.password.length === 0) {
                showError(new Error(lc('description_required')));
                return;
            }
            Sentry.withScope((scope) => {
                scope.setUser({ email: result.userName });
                Sentry.captureMessage(result.password);
                alert(l('bug_report_sent'));
            });
        }
    }
</script>

<page bind:this={page} actionBarHidden="true" id="home">
    <gridlayout rows="auto,*">
        <CActionBar title={weatherLocation && weatherLocation.name}>
            <activityIndicator busy={loading} verticalAlignment="middle" visibily={loading ? 'visible' : 'collapsed'} />
            <mdbutton
                visibility={weatherData && weatherData.alerts && weatherData.alerts.length > 0 ? 'visible' : 'collapsed'}
                variant="text"
                class="icon-btn"
                color="red"
                rippleColor="red"
                borderColor="red"
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
            <label row="1" horizontalAlignment="center" verticalAlignment="center" text={l('no_network').toUpperCase()} />
        {:else if weatherLocation}
            <pullrefresh bind:this={pullRefresh} row="1" on:refresh={refresh}>
                <WeatherComponent {items} />
            </pullrefresh>
        {:else}
            <gridlayout id="teststack" row="1" rows="auto,auto,auto,auto,60" horizontalAlignment="center" verticalAlignment="center" columns="auto">
                <label :text={l('no_location_desc')} />
                <mdbutton row="1" margin="4 0 4 0" padding="4" variant="outline" on:tap={getLocationAndWeather}>
                    <formattedString>
                        <span fontSize="20" verticalTextAlignment="center" fontFamily={mdiFontFamily} text="mdi-crosshairs-gps" />
                        <span text={l('my_location').toUpperCase()} />
                    </formattedString>
                </mdbutton>
                <mdbutton row="2" margin="4 0 4 0" padding="4" variant="outline" on:tap={searchCity}>
                    <formattedString>
                        <span fontSize="20" verticalTextAlignment="center" fontFamily={mdiFontFamily} text="mdi-magnify" />
                        <span text={l('search_location').toUpperCase()} />
                    </formattedString>
                </mdbutton>
            </gridlayout>
        {/if}
    </gridlayout>
</page>
