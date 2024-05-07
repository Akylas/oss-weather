<script lang="ts">
    import { GPS } from '@nativescript-community/gps';
    import { getFile } from '@nativescript-community/https';
    import { request } from '@nativescript-community/perms';
    import { CollectionViewWithSwipeMenu } from '@nativescript-community/ui-collectionview-swipemenu';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { confirm } from '@nativescript-community/ui-material-dialogs';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { Application, ApplicationSettings, Color, CoreTypes, EventData, File, Frame, Page, Screen, knownFolders, path } from '@nativescript/core';
    import { openFile, throttle } from '@nativescript/core/utils';
    import dayjs from 'dayjs';
    import type { FeatureCollection, MultiPolygon } from 'geojson';
    import { onDestroy, onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
    import type { NativeElementNode, NativeViewElementNode } from 'svelte-native/dom';
    import SelectCity from '~/components/SelectCity.svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { FavoriteLocation, favoriteIcon, favoriteIconColor, favorites, getFavoriteKey, toggleFavorite } from '~/helpers/favorites';
    import { getLocalTime, l, lc, onLanguageChanged, sl, slc } from '~/helpers/locale';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, WeatherLocation, geocodeAddress, getTimezone, networkService, prepareItems } from '~/services/api';
    import { onIconPackChanged } from '~/services/icon';
    import { OWMProvider } from '~/services/providers/owm';
    import { WeatherData } from '~/services/providers/weather';
    import { getAqiProvider, getProvider, getProviderType, onProviderChanged, providers } from '~/services/providers/weatherproviderfactory';
    import { DEFAULT_COMMON_WEATHER_DATA, WeatherProps, mergeWeatherData, onWeatherDataChanged } from '~/services/weatherData';
    import { alert, showError } from '~/utils/error';
    import { globalObservable, navigate, showModal } from '~/utils/svelte/ui';
    import { hideLoading, isLandscape, showLoading, showPopoverMenu } from '~/utils/ui';
    import { isBRABounds } from '~/utils/utils';
    import { actionBarButtonHeight, actionBarHeight, colors, fontScale, fonts, onSettingsChanged, systemFontScale } from '~/variables';
    import ListItemAutoSize from './common/ListItemAutoSize.svelte';
    import { DATA_VERSION } from '~/helpers/constants';

    $: ({ colorBackground, colorOnSurfaceVariant, colorSurface, colorError, colorOnError } = $colors);

    let gps: GPS;
    let loading = false;
    let lastUpdate = ApplicationSettings.getNumber('lastUpdate', -1);
    let provider = getProviderType();
    let weatherLocation: FavoriteLocation = JSON.parse(ApplicationSettings.getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData: WeatherData = JSON.parse(ApplicationSettings.getString('lastWeatherData', 'null'));
    const data_version = ApplicationSettings.getNumber('data_version', -1);
    if (data_version !== DATA_VERSION) {
        ApplicationSettings.setNumber('data_version', DATA_VERSION);
        weatherData = null;
    }

    let items = [];

    const desiredAccuracy = __ANDROID__ ? CoreTypes.Accuracy.high : kCLLocationAccuracyBestForNavigation;
    const timeout = 20000;
    const minimumUpdateTime = 1000; // Should update every 1 second according ;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let page: NativeViewElementNode<Page>;
    async function showOptions(event) {
        try {
            const options = [
                {
                    icon: 'mdi-crosshairs-gps',
                    id: 'gps_location',
                    name: l('gps_location')
                },
                {
                    icon: 'mdi-cogs',
                    id: 'preferences',
                    name: l('preferences')
                }
                // {
                //     icon: 'mdi-information-outline',
                //     id: 'about',
                //     text: l('about')
                // }
            ] as any;
            if (weatherLocation) {
                options.push(
                    ...[
                        {
                            icon: 'mdi-refresh',
                            id: 'refresh',
                            name: l('refresh')
                        },
                        {
                            icon: 'mdi-chart-bar',
                            id: 'compare',
                            name: l('compare_models')
                        },
                        {
                            icon: 'mdi-chart-areaspline',
                            id: 'chart',
                            name: l('chart')
                        },
                        {
                            icon: 'mdi-map',
                            id: 'map',
                            name: l('map')
                        },
                        {
                            icon: 'mb',
                            iconFontSize: 16,
                            id: 'meteo_blue',
                            name: 'meteoblue'
                        }
                    ]
                );
                if (isBRABounds(weatherLocation)) {
                    options.push({
                        icon: 'mdi-snowflake-alert',
                        id: 'bra',
                        name: l('bra')
                    });
                }
            }
            await showPopoverMenu({
                options,
                anchor: event.object,
                vertPos: VerticalPosition.BELOW,
                props: {
                    width: 220 * $systemFontScale,
                    maxHeight: Screen.mainScreen.heightDIPs - $actionBarHeight
                    // autoSizeListItem: true
                },
                onLongPress: async (item, event, close) => {
                    try {
                        if (item) {
                            switch (item.id) {
                                case 'bra':
                                    const franceGeoJSON = JSON.parse(
                                        await File.fromPath(path.join(knownFolders.currentApp().path, 'assets/meteofrance/massifs.geojson')).readText()
                                    ) as FeatureCollection<MultiPolygon>;
                                    const options = franceGeoJSON.features
                                        .map((feature) => ({
                                            name: feature.properties.title as string,
                                            subtitle: `${feature.properties.Departemen} (${feature.properties.mountain})`,
                                            id: feature.properties.code
                                        }))
                                        .sort((a, b) => a.name.localeCompare(b.name));
                                    await close();
                                    const OptionSelect = (await import('~/components/common/OptionSelect.svelte')).default;
                                    DEV_LOG && console.log('options', options);
                                    const result = await showBottomSheet({
                                        parent: null,
                                        view: OptionSelect,
                                        peekHeight: 400,
                                        // skipCollapsedState: isLandscape(),
                                        ignoreTopSafeArea: true,
                                        props: {
                                            options,
                                            rowHeight: 58,
                                            height: 400
                                        }
                                    });
                                    if (result) {
                                        showLoading();
                                        const pdfFile = await getFile(`https://www.meteo-montagne.com/pdf/massif_${result.id}.pdf`);
                                        DEV_LOG && console.log('massifId', result.id, pdfFile.path);
                                        openFile(pdfFile.path);
                                    }
                            }
                        }
                    } catch (error) {
                        showError(error);
                    } finally {
                        hideLoading();
                    }
                },
                onClose: async (item) => {
                    try {
                        if (item) {
                            switch (item.id) {
                                case 'preferences':
                                    const Settings = (await import('~/components/settings/Settings.svelte')).default;
                                    navigate({ page: Settings });
                                    break;
                                case 'map':
                                    const WeatherMapPage = (await import('~/components/WeatherMapPage.svelte')).default;
                                    navigate({ page: WeatherMapPage, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
                                    break;
                                case 'compare':
                                    const CompareWeather = (await import('~/components/compare/CompareWeatherSingle.svelte')).default;
                                    navigate({ page: CompareWeather, props: { weatherLocation } });
                                    break;
                                case 'chart':
                                    const HourlyChart = (await import('~/components/HourlyChart.svelte')).default;
                                    navigate({ page: HourlyChart, props: { weatherLocation, weatherData } });
                                    break;
                                case 'refresh':
                                    await refreshWeather();
                                    break;
                                case 'gps_location':
                                    await getLocationAndWeather();
                                    break;
                                case 'meteo_blue':
                                    const MeteoBlue = (await import('~/components/MeteoBlue.svelte')).default;
                                    navigate({ page: MeteoBlue, props: { weatherLocation } });
                                    break;
                                // case 'about':
                                //     const About = require('~/components/About.svelte').default;
                                //     navigate({ page: About });
                                //     break;
                                case 'bra':
                                    const franceGeoJSON = JSON.parse(
                                        await File.fromPath(path.join(knownFolders.currentApp().path, 'assets/meteofrance/massifs.geojson')).readText()
                                    ) as FeatureCollection<MultiPolygon>;
                                    const classifyPoint = require('robust-point-in-polygon');
                                    const coord = [weatherLocation.coord.lon, weatherLocation.coord.lat];
                                    let massifId = -1;
                                    franceGeoJSON.features.some((feature) => {
                                        const result = classifyPoint(feature.geometry.coordinates[0][0], coord);
                                        if (result <= 0) {
                                            massifId = feature.properties.code;
                                            return true;
                                        }
                                    });
                                    if (massifId !== -1) {
                                        showLoading();
                                        const result = await getFile(`https://www.meteo-montagne.com/pdf/massif_${massifId}.pdf`);
                                        DEV_LOG && console.log('massifId', massifId, result.path);
                                        openFile(result.path);
                                    }
                                    break;
                            }
                        }
                    } catch (error) {
                        showError(error);
                    } finally {
                        hideLoading();
                    }
                }
            });
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
            const usedWeatherData = ApplicationSettings.getString('common_data', DEFAULT_COMMON_WEATHER_DATA);
            let timezoneData;
            [weatherData, timezoneData] = await Promise.all([
                getProvider().getWeather(weatherLocation),
                !!weatherLocation.timezone ? Promise.resolve(undefined) : getTimezone(weatherLocation).catch((err) => console.error(err))
            ]);
            if (timezoneData) {
                Object.assign(weatherLocation, timezoneData);
                ApplicationSettings.setString('weatherLocation', JSON.stringify(weatherLocation));
            }
            if (weatherData) {
                if (usedWeatherData.indexOf(WeatherProps.aqi) !== -1) {
                    const aqiData = await getAqiProvider().getAirQuality(weatherLocation);
                    if (aqiData) {
                        mergeWeatherData(weatherData, aqiData);
                    }
                }
                lastUpdate = weatherData.time;
                await updateView();
            }
        } catch (err) {
            if (err.statusCode === 403) {
                if (provider === 'openweathermap') {
                    await import('~/services/providers/owm');
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
        if (weatherLocation && weatherData) {
            items = prepareItems(weatherLocation, weatherData, lastUpdate);
            ApplicationSettings.setNumber('lastUpdate', lastUpdate);
            ApplicationSettings.setString('lastWeatherData', JSON.stringify(weatherData));
        }
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
    async function getLocationAndWeather() {
        try {
            const result = await request('location');
            if (Array.isArray(result) && result[0] !== 'authorized') {
                return alert(l('missing_location_perm'));
            }
            if (!gps) {
                gps = new GPS();
            }
            if (!gps.isEnabled()) {
                if (__IOS__) {
                    throw new Error(lc('gps_off'));
                } else {
                    const r = await confirm({
                        title: lc('gps_off'),
                        okButtonText: lc('settings'),
                        cancelButtonText: lc('close')
                    });
                    if (r) {
                        await gps.openGPSSettings();
                    }
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
        } catch (error) {
            showError(error);
        } finally {
            loading = false;
        }
    }
    async function onPullToRefresh() {
        try {
            if (pullRefresh) {
                pullRefresh.nativeView.refreshing = false;
            }
            loading = true;
            const refreshLocationOnPull = ApplicationSettings.getBoolean('refresh_location_on_pull', false);
            if (refreshLocationOnPull) {
                await getLocationAndWeather();
            } else {
                await refreshWeather();
            }
        } catch (error) {
            showError(error);
        } finally {
            loading = false;
        }
    }

    async function askForApiKey() {
        try {
            const ApiKeysBottomSheet = (await import('~/components/APIKeysBottomSheet.svelte')).default;
            const result: boolean = await showBottomSheet({
                parent: page,
                peekHeight: 400,
                // skipCollapsedState: isLandscape(),
                view: ApiKeysBottomSheet,
                dismissOnBackgroundTap: true,
                dismissOnDraggingDownSheet: true
            });
            if (result) {
                refreshWeather();
            }
        } catch (error) {
            showError(error);
        }
    }
    function onOrientationChanged(event) {
        page.nativeElement.checkStatusBarVisibility();
    }
    onMount(async () => {
        if (__IOS__) {
            Application.on(Application.orientationChangedEvent, onOrientationChanged);
        }
        if (provider === 'openweathermap') {
            if (!OWMProvider.hasOWMApiKey() && weatherLocation) {
                // wait a bit
                setTimeout(() => askForApiKey(), 1000);
            }
        }

        networkService.on(NetworkConnectionStateEvent, (event: NetworkConnectionStateEventData) => {
            try {
                if (networkConnected !== event.data.connected) {
                    networkConnected = event.data.connected;
                    if ((event.data.connected && !lastUpdate) || Date.now() - lastUpdate > 10 * 60 * 1000) {
                        refreshWeather();
                    }
                } else {
                    updateView();
                }
            } catch (error) {
                showError(error);
            }
        });
        networkService.start(); // should send connection event and then refresh

        if (weatherData) {
            items = prepareItems(weatherLocation, weatherData, lastUpdate);
        } else if (weatherLocation) {
            refreshWeather();
        }
    });
    onDestroy(() => {
        if (__IOS__) {
            Application.off(Application.orientationChangedEvent, onOrientationChanged);
        }
    });

    onLanguageChanged((lang) => {
        DEV_LOG && console.log('refresh triggered by lang change');
        try {
            refreshWeather();
        } catch (error) {
            showError(error);
        }
    });

    onWeatherDataChanged(updateView);
    onIconPackChanged(updateView);
    onSettingsChanged('feels_like_temperatures', refreshWeather);
    onSettingsChanged('show_current_day_daily', updateView);
    onSettingsChanged('show_daily_in_currently', updateView);

    async function showAlerts() {
        if (!weatherData.alerts) {
            return;
        }
        DEV_LOG && console.log('showAlerts', weatherData.alerts);
        try {
            const AlertView = (await import('~/components/common/AlertView.svelte')).default;
            await showBottomSheet({
                parent: page,
                view: AlertView,
                peekHeight: 400,
                // skipCollapsedState: isLandscape(),
                trackingScrollView: 'scrollView',
                props: {
                    alerts: weatherData.alerts
                }
            });
        } catch (err) {
            showError(err);
        }
    }
    onProviderChanged((event) => {
        try {
            provider = getProviderType();
            DEV_LOG && console.log('provider changed', provider);
            refreshWeather();
        } catch (error) {
            showError(error);
        }
    });

    const onTap = throttle(async function (event) {
        try {
            const AstronomyView = (await import('~/components/astronomy/AstronomyView.svelte')).default;
            const parent = Frame.topmost() || Application.getRootView();
            DEV_LOG && console.log('showAstronomyView', event.time, event.timezoneOffset);
            await showBottomSheet({
                parent,
                view: AstronomyView,
                peekHeight: 400,
                // skipCollapsedState: isLandscape(),
                props: {
                    location: weatherLocation,
                    timezoneOffset: event.timezoneOffset,
                    // startTime: getLocalTime(event.time, event.timezoneOffset)
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
    function swipeMenuTranslationFunction(side, width, value, delta, progress) {
        const result = {
            mainContent: {
                translateX: side === 'right' ? -delta : delta
            },
            backDrop: {
                translateX: side === 'right' ? -delta : delta,
                opacity: progress * 0.1
            },
            deleteBtn: {
                backgroundColor: progress >= 0.6 ? colorError : colorSurface,
                color: progress >= 0.6 ? colorOnError : colorError
            }
        } as any;

        return result;
    }
    let drawerOpened = false;
    function onDrawerStart() {
        drawerOpened = true;
    }

    function onDrawerClose() {
        drawerOpened = false;
        favoriteCollectionView.nativeElement?.closeCurrentMenu();
    }

    function onSwipe(e) {
        const currentProviderIndex = providers.indexOf(provider);
        let newIndex = currentProviderIndex + (e.direction === 1 ? -1 : 1);
        if (newIndex < 0) {
            newIndex += providers.length;
        }
        const newProvider = providers[newIndex % providers.length];
        ApplicationSettings.setString('provider', newProvider);
    }
</script>

<page bind:this={page} actionBarHidden={true}>
    <drawer
        bind:this={drawer}
        gestureHandlerOptions={{
            minDist: 50,
            failOffsetYStart: -40,
            failOffsetYEnd: 40
        }}
        leftSwipeDistance={50}
        on:close={onDrawerClose}
        on:start={onDrawerStart}>
        <gridlayout rows="auto,*" prop:mainContent>
            {#if !networkConnected && !weatherData}
                <label horizontalAlignment="center" row={1} text={l('no_network').toUpperCase()} verticalAlignment="middle" />
            {:else if weatherLocation}
                <pullrefresh bind:this={pullRefresh} row={1} on:refresh={onPullToRefresh}>
                    <WeatherComponent {items} {weatherLocation} on:tap={onTap} />
                </pullrefresh>
                <label
                    backgroundColor={new Color(colorBackground).setAlpha(100).hex}
                    fontSize={10}
                    horizontalAlignment="right"
                    marginRight={6}
                    row="1"
                    text={$slc('powered_by', l(`provider.${provider}`))}
                    verticalAlignment="bottom" />
            {:else}
                <stacklayout columns="auto" horizontalAlignment="center" paddingLeft={20} paddingRight={20} row={1} verticalAlignment="middle">
                    <label fontSize={16} marginBottom={20} text={$sl('no_location_desc')} textAlignment="center" textWrap={true} />
                    <mdbutton id="location" margin="4 0 4 0" textAlignment="center" variant="outline" verticalTextAlignment="center" on:tap={getLocationAndWeather} android:paddingTop={2}>
                        <cspan fontFamily={$fonts.mdi} fontSize={20 * $fontScale} text="mdi-crosshairs-gps" verticalAlignment="middle" />
                        <cspan text={' ' + $sl('my_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                    <mdbutton id="search" margin="4 0 4 0" textAlignment="center" variant="outline" verticalTextAlignment="center" on:tap={searchCity} android:paddingTop={2}>
                        <cspan fontFamily={$fonts.mdi} fontSize={20 * $fontScale} text="mdi-magnify" verticalAlignment="middle" />
                        <cspan text={' ' + $sl('search_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                </stacklayout>
            {/if}
            <CActionBar onMenuIcon={toggleDrawer} showMenuIcon title={weatherLocation && weatherLocation.name} on:swipe={onSwipe}>
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
                <mdbutton
                    class="actionBarButton"
                    color="#EFB644"
                    rippleColor="#EFB644"
                    text="mdi-alert"
                    variant="text"
                    verticalAlignment="middle"
                    visibility={!loading && weatherData?.alerts?.length > 0 ? 'visible' : 'collapse'}
                    on:tap={() => showAlerts()} />
                <mdbutton class="actionBarButton" text="mdi-magnify" variant="text" verticalAlignment="middle" on:tap={searchCity} />

                <mdbutton id="menu_button" class="actionBarButton" text="mdi-dots-vertical" variant="text" verticalAlignment="middle" on:tap={showOptions} />
            </CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={$slc('favorites')} />
            <collectionview bind:this={favoriteCollectionView} id="favorite" items={favorites} row={1}>
                <Template let:item>
                    <swipemenu
                        closeAnimationDuration={100}
                        gestureHandlerOptions={{
                            activeOffsetXStart: item.startingSide ? -10 : -Number.MAX_SAFE_INTEGER,
                            failOffsetXStart: item.startingSide ? Number.MIN_SAFE_INTEGER : 0,
                            failOffsetYStart: -40,
                            failOffsetYEnd: 40,
                            minDist: 50
                        }}
                        leftSwipeDistance="300"
                        openAnimationDuration={100}
                        startingSide={item.startingSide}
                        translationFunction={swipeMenuTranslationFunction}>
                        <ListItemAutoSize
                            prop:mainContent
                            backgroundColor={colorBackground}
                            subtitle={(item.sys.state || item.sys.country) + (item.sys.state ? '\n' + item.sys.country : '')}
                            title={item.name}
                            on:tap={() => saveLocation(item)} />
                        <!-- <gridlayout prop:mainContent class="drawer" columns="*,auto" padding="10 10 10 30" rippleColor="#aaa" rows="*,auto,auto,*" on:tap={() => saveLocation(item)}>

                            <label fontSize={17} lineBreak="end" maxLines={1} row={1} text={item.name} />
                            <label color={colorOnSurfaceVariant} fontSize={13} row={2}>
                                <cspan text={item.sys.state || item.sys.country} />
                                <cspan text={'\n' + item.sys.country} visibility={item.sys.state ? 'visible' : 'hidden'} />
                            </label>
                        </gridlayout> -->
                        <!-- <stacklayout prop:leftDrawer orientation="horizontal" width={100} backgroundColor="blue" height="100"> -->
                        <mdbutton
                            prop:leftDrawer
                            id="deleteBtn"
                            backgroundColor={colorError}
                            color={colorOnError}
                            fontFamily={$fonts.mdi}
                            fontSize={24}
                            rippleColor={colorOnError}
                            shape="none"
                            text="mdi-trash-can"
                            textAlignment="center"
                            variant="text"
                            verticalTextAlignment="middle"
                            width="100"
                            on:tap={toggleFavorite(item)} />
                        <!-- </stacklayout> -->
                    </swipemenu>
                </Template>
            </collectionview>
        </gridlayout>
    </drawer>
</page>
