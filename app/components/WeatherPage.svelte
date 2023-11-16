<script lang="ts">
    import { GPS } from '@nativescript-community/gps';
    import { request as requestPerm } from '@nativescript-community/perms';
    import { CollectionViewWithSwipeMenu } from '@nativescript-community/ui-collectionview-swipemenu';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { confirm } from '@nativescript-community/ui-material-dialogs';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { Color, CoreTypes, EventData, Frame, Page } from '@nativescript/core';
    import { Application, ApplicationSettings } from '@nativescript/core';
    import { throttle } from '@nativescript/core/utils';
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { navigate, showModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { NativeElementNode, NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/CActionBar.svelte';
    import SelectCity from '~/components/SelectCity.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import WeatherMapPage from '~/components/WeatherMapPage.svelte';
    import { FavoriteLocation, favoriteIcon, favoriteIconColor, favorites, getFavoriteKey, toggleFavorite } from '~/helpers/favorites';
    import { l, lc, onLanguageChanged, sl } from '~/helpers/locale';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, WeatherLocation, geocodeAddress, networkService, prepareItems } from '~/services/api';
    import { OWMProvider } from '~/services/owm';
    import { prefs } from '~/services/preferences';
    import { getProvider, getProviderType } from '~/services/weatherproviderfactory';
    import { alert, showError } from '~/utils/error';
    import { showBottomSheet } from '~/utils/svelte/bottomsheet';
    import { actionBarButtonHeight, lightBackgroundColor, globalObservable, mdiFontFamily, textLightColor, backgroundColor } from '~/variables';

    let gps: GPS;
    let loading = false;
    let lastUpdate = ApplicationSettings.getNumber('lastUpdate', -1);
    let provider = getProviderType();
    let weatherLocation: FavoriteLocation = JSON.parse(ApplicationSettings.getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData: WeatherData = JSON.parse(ApplicationSettings.getString('lastWeatherData', 'null'));

    let items = [];

    let desiredAccuracy = __ANDROID__ ? CoreTypes.Accuracy.high : kCLLocationAccuracyBestForNavigation;
    let timeout = 20000;
    let minimumUpdateTime = 1000; // Should update every 1 second according ;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let page: NativeViewElementNode<Page>;
    async function showOptions() {
        try {
            const ActionSheet = (await import('~/components/ActionSheet.svelte')).default;
            const options = [
                {
                    icon: 'mdi-crosshairs-gps',
                    id: 'gps_location',
                    text: l('gps_location')
                },
                {
                    icon: 'mdi-cogs',
                    id: 'preferences',
                    text: l('preferences')
                },
                {
                    icon: 'mdi-format-size',
                    id: 'font-scale',
                    text: lc('font_scale')
                },
                {
                    icon: 'mdi-information-outline',
                    id: 'about',
                    text: l('about')
                }
            ];
            if (weatherLocation) {
                options.push(
                    {
                        icon: 'mdi-refresh',
                        id: 'refresh',
                        text: l('refresh')
                    }
                );
                if (OWMProvider.hasOWMApiKey()) {
                    options.push(
                    {
                        icon: 'mdi-map',
                        id: 'map',
                        text: l('map')
                    })
                }
            }
            const result: { icon: string; id: string; text: string } = await showBottomSheet({
                parent: page,
                view: ActionSheet,
                props: {
                    options
                }
            });
            if (result) {
                switch (result.id) {
                    case 'preferences':
                        await prefs.openSettings();
                        break;
                    case 'map':
                        await openWeatherMap();
                        break;
                    case 'refresh':
                        await refreshWeather();
                        break;
                    case 'gps_location':
                        await getLocationAndWeather();
                        break;
                    case 'about':
                        const About = require('~/components/About.svelte').default;
                        navigate({ page: About });
                        break;

                    case 'font-scale':
                        const FontSizeSettingScreen = require('~/components/FontSizeSettingScreen.svelte').default;
                        navigate({ page: FontSizeSettingScreen });
                        break;
                }
            }
            console.log('action done');
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
            weatherData = await getProvider().getWeather(weatherLocation);
            if (weatherData) {
                // console.log(JSON.stringify(weatherData))
                lastUpdate = Date.now();
                await updateView();
            }
        } catch (err) {
            if (err.statusCode === 403) {
                if (provider === 'openweathermap') {
                    await import('~/services/owm');
                    OWMProvider.setOWMApiKey(null);
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
        items = prepareItems(weatherLocation, weatherData, lastUpdate);
        ApplicationSettings.setNumber('lastUpdate', lastUpdate);
        ApplicationSettings.setString('lastWeatherData', JSON.stringify(weatherData));
    }

    function saveLocation(result: WeatherLocation) {
        const cityChanged = !weatherLocation || result.coord.lat !== weatherLocation.coord.lat || weatherLocation.coord.lon !== result.coord.lat;
        if (cityChanged) {
            weatherLocation = result;
            ApplicationSettings.setString('weatherLocation', JSON.stringify(weatherLocation));
            refreshWeather();
        }
        drawer?.close();
    }

    async function searchCity() {
        try {
            // TODO: for now we dont lazy load SelectCity
            // it would crash in production because imported toggleFavorite would be undefined ...
            const result: WeatherLocation = await showModal({ page: SelectCity, animated: true, fullscreen: true });
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
            if (Array.isArray(result) && result[0] !== 'authorized') {
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
        const result: boolean = await showBottomSheet({
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
            if (!OWMProvider.hasOWMApiKey() && weatherLocation) {
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
            items = prepareItems(weatherLocation, weatherData, lastUpdate);
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
            await showBottomSheet({
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
        try {
            provider = getProviderType();
            refresh();
        } catch (error) {
            showError(error);
        }
    });

    const onTap = throttle(async function (item) {
        try {
            const AstronomyView = (await import('~/components/AstronomyView.svelte')).default;
            const parent = Frame.topmost() || Application.getRootView();
            await showBottomSheet({
                parent,
                view: AstronomyView,
                // peekHeight: 300,
                props: {
                    location: weatherLocation,
                    startTime: dayjs(item.detail.time)
                }
            });
        } catch (err) {
            showError(err);
        }
    });

    let drawer: DrawerElement;
    let favoriteCollectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
    function toggleDrawer() {
        drawer?.toggle();
    }

    function toggleItemFavorite(item: FavoriteLocation) {
        weatherLocation = toggleFavorite(item);
    }
    globalObservable.on('favorite', (item: EventData & { data: FavoriteLocation }) => {
        if (weatherLocation && getFavoriteKey(item.data) === getFavoriteKey(weatherLocation)) {
            weatherLocation.isFavorite = item.data.isFavorite;
            weatherLocation = weatherLocation;
            ApplicationSettings.setString('weatherLocation', JSON.stringify(weatherLocation));
        }
    });
    function drawerTranslationFunction(side, width, value, delta, progress) {
        const result = {
            mainContent: {
                translateX: side === 'right' ? -delta : delta
            },
            backDrop: {
                translateX: side === 'right' ? -delta : delta,
                opacity: progress * 0.1
            },
            deleteBtn: {
                backgroundColor: progress >= 0.6 ? 'red' : $lightBackgroundColor,
                color: progress >= 0.6 ? 'white' : 'red'
            }
        } as any;

        return result;
    }
    function onDrawerStartClose() {
        favoriteCollectionView.nativeElement?.closeCurrentMenu();
    }
</script>

<page bind:this={page} actionBarHidden={true}>
    <drawer
        bind:this={drawer}
        leftSwipeDistance={50}
        gestureHandlerOptions={{
            minDist: 60,
            failOffsetYStart: -20,
            failOffsetYEnd: 20
        }}
        gestureEnabled={true}
        waitFor={[15644]}
        on:close={onDrawerStartClose}
        on:start={onDrawerStartClose}
    >
        <gridlayout rows="auto,*" prop:mainContent>
            {#if !networkConnected && !weatherData}
                <label row={1} horizontalAlignment="center" verticalAlignment="middle" text={l('no_network').toUpperCase()} />
            {:else if weatherLocation}
                <pullrefresh bind:this={pullRefresh} row={1} on:refresh={refresh}>
                    <WeatherComponent {weatherLocation} {items} on:tap={onTap} />
                </pullrefresh>
                <label
                    row="1"
                    fontSize={10}
                    backgroundColor={new Color($backgroundColor).setAlpha(100).hex}
                    text={lc('powered_by', l(`provider.${provider}`))}
                    verticalAlignment="bottom"
                    horizontalAlignment="right"
                    marginRight={6}
                />
            {:else}
                <gridlayout row={1} rows="auto,auto,auto,auto,60" horizontalAlignment="center" verticalAlignment="middle" columns="auto">
                    <label text={$sl('no_location_desc')} textAlignment="center" marginBottom={20} />
                    <mdbutton row={1} margin="4 0 4 0" variant="outline" on:tap={getLocationAndWeather} textAlignment="center" verticalTextAlignment="center" android:paddingTop={6}>
                        <span fontSize={20} fontFamily={mdiFontFamily} text="mdi-crosshairs-gps" verticalAlignment="middle" />
                        <span text={$sl('my_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                    <mdbutton row={2} margin="4 0 4 0" variant="outline" on:tap={searchCity} textAlignment="center" android:paddingTop={6} verticalTextAlignment="center">
                        <span fontSize={20} fontFamily={mdiFontFamily} text="mdi-magnify" verticalAlignment="middle" />
                        <span text={$sl('search_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                </gridlayout>
            {/if}
            <CActionBar showMenuIcon title={weatherLocation && weatherLocation.name} onMenuIcon={toggleDrawer}>
                <mdbutton
                    slot="left"
                    visibility={weatherLocation ? 'visible' : 'collapsed'}
                    col={1}
                    variant="text"
                    class="icon-btn"
                    marginRight={4}
                    width={30}
                    height={30}
                    color={favoriteIconColor(weatherLocation)}
                    rippleColor="#EFB644"
                    on:tap={() => toggleItemFavorite(weatherLocation)}
                    text={favoriteIcon(weatherLocation)}
                    verticalAlignment="middle"
                />
                <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} width={actionBarButtonHeight} height={actionBarButtonHeight} />
                <mdbutton
                    visibility={!loading && weatherData?.alerts?.length > 0 ? 'visible' : 'collapsed'}
                    variant="text"
                    class="icon-btn"
                    color="#EFB644"
                    rippleColor="#EFB644"
                    verticalAlignment="middle"
                    on:tap={() => showAlerts()}
                    text="mdi-alert"
                />
                <mdbutton variant="text" class="icon-btn" verticalAlignment="middle" text="mdi-magnify" on:tap={searchCity} />

                <mdbutton id="menu_button" variant="text" class="icon-btn" verticalAlignment="middle" text="mdi-dots-vertical" on:tap={showOptions} />
            </CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*" width="300">
            <label text={lc('favorites')} margin="20 20 20 20" class="actionBarTitle" />
            <collectionview id="favorite" bind:this={favoriteCollectionView} row={1} rowHeight={80} items={favorites} itemIdGenerator={(_item, index) => index}>
                <Template let:item>
                    <swipemenu
                        leftSwipeDistance="300"
                        startingSide={item.startingSide}
                        translationFunction={drawerTranslationFunction}
                        openAnimationDuration={100}
                        closeAnimationDuration={100}
                        gestureTag={15644}
                        gestureHandlerOptions={{
                            activeOffsetXStart: item.startingSide ? -10 : -Number.MAX_SAFE_INTEGER,
                            failOffsetXStart: item.startingSide ? Number.MIN_SAFE_INTEGER : 0,
                            // activeOffsetXEnd: 10,
                            failOffsetYStart: -40,
                            failOffsetYEnd: 40,
                            minDist: 50
                        }}
                    >
                        <gridlayout prop:mainContent rows="*,auto,auto,*" rippleColor="#aaa" on:tap={() => saveLocation(item)} columns="*,auto" padding="10 10 10 30" class="drawer">
                            <label row={1} fontSize={18} text={item.name} maxLines={1} lineBreak="end" />
                            <label row={2} fontSize={14} color={$textLightColor}>
                                <span text={item.sys.state || item.sys.country} />
                                <span visibility={item.sys.state ? 'visible' : 'hidden'} text={'\n' + item.sys.country} />
                            </label>
                        </gridlayout>
                        <stacklayout prop:leftDrawer orientation="horizontal" width={100}>
                            <mdbutton
                                id="deleteBtn"
                                variant="text"
                                class="icon-btn"
                                width="100"
                                height="100%"
                                text="mdi-trash-can"
                                color="white"
                                backgroundColor="red"
                                textAlignment="center"
                                shape="none"
                                verticalTextAlignment="middle"
                                on:tap={toggleFavorite(item)}
                            />
                        </stacklayout>
                    </swipemenu>
                </Template>
            </collectionview>
        </gridlayout>
    </drawer>
</page>
