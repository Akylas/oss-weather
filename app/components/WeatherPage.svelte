<script lang="ts">
    import { GPS } from '@nativescript-community/gps';
    import { request } from '@nativescript-community/perms';
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
    import CActionBar from '~/components/common/CActionBar.svelte';
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
    import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { actionBarButtonHeight, colors, fontScale, fonts } from '~/variables';
    import { globalObservable } from '~/utils/svelte/ui';
    import { showPopoverMenu } from '~/utils/ui';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { WeatherData } from '~/services/weather';
    import ListItemAutoSize from './common/ListItemAutoSize.svelte';

    $: ({
        colorBackground,
        colorOnSurfaceVariant,
        colorSurface
    } = $colors);

    let gps: GPS;
    let loading = false;
    let lastUpdate = ApplicationSettings.getNumber('lastUpdate', -1);
    let provider = getProviderType();
    let weatherLocation: FavoriteLocation = JSON.parse(ApplicationSettings.getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let weatherData: WeatherData = JSON.parse(ApplicationSettings.getString('lastWeatherData', 'null'));

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
                },
                {
                    icon: 'mdi-format-size',
                    id: 'font-scale',
                    name: lc('font_scale')
                },
                // {
                //     icon: 'mdi-information-outline',
                //     id: 'about',
                //     text: l('about')
                // }
            ];
            if (weatherLocation) {
                options.push(
                    {
                        icon: 'mdi-refresh',
                        id: 'refresh',
                        name: l('refresh')
                    }
                );
                // if (OWMProvider.hasOWMApiKey()) {
                    options.push(
                    {
                        icon: 'mdi-map',
                        id: 'map',
                        name: l('map')
                    });
                // }
            }
            await showPopoverMenu({
                options,
                anchor: event.object,
                vertPos: VerticalPosition.BELOW,
                props: {
                    width:220,
                    autoSizeListItem:true,
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
                        await openWeatherMap();
                        break;
                    case 'refresh':
                        await refreshWeather();
                        break;
                    case 'gps_location':
                        await getLocationAndWeather();
                        break;
                    // case 'about':
                    //     const About = require('~/components/About.svelte').default;
                    //     navigate({ page: About });
                    //     break;

                    case 'font-scale':
                        const FontSizeSettingScreen = require('~/components/FontSizeSettingScreen.svelte').default;
                        navigate({ page: FontSizeSettingScreen });
                        break;
                }
            }
        } catch (error) {
            showError(error);
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
            navigate({ page: WeatherMapPage, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
        } catch (error) {
            showError(error);
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
            const AlertView = (await import('~/components/common/AlertView.svelte')).default;
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

    const onTap = throttle(async function (event) {
        try {
            const AstronomyView = (await import('~/components/astronomy/AstronomyView.svelte')).default;
            const parent = Frame.topmost() || Application.getRootView();
            await showBottomSheet({
                parent,
                view: AstronomyView,
                // peekHeight: 300,
                props: {
                    location: weatherLocation,
                    startTime: dayjs(event.time)
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
                // translateX: side === 'right' ? -delta : delta,
                opacity: progress * 0.1
            },
            deleteBtn: {
                backgroundColor: progress >= 0.6 ? 'red' : colorSurface,
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
        gestureEnabled={true}
        gestureHandlerOptions={{
            minDist: 60,
            failOffsetYStart: -20,
            failOffsetYEnd: 20
        }}
        leftSwipeDistance={50}
        waitFor={[15644]}
        on:close={onDrawerStartClose}
        on:start={onDrawerStartClose}
    >
        <gridlayout rows="auto,*" prop:mainContent>
            {#if !networkConnected && !weatherData}
                <label horizontalAlignment="center" row={1} text={l('no_network').toUpperCase()} verticalAlignment="middle" />
            {:else if weatherLocation}
                <pullrefresh bind:this={pullRefresh} row={1} on:refresh={refresh}>
                    <WeatherComponent {items} {weatherLocation} on:tap={onTap} />
                </pullrefresh>
                <label
                    backgroundColor={new Color(colorBackground).setAlpha(100).hex}
                    fontSize={10}
                    horizontalAlignment="right"
                    marginRight={6}
                    row="1"
                    text={lc('powered_by', l(`provider.${provider}`))}
                    verticalAlignment="bottom"
                />
            {:else}
                <stacklayout columns="auto" horizontalAlignment="center" row={1} verticalAlignment="middle">
                    <label marginBottom={20} text={$sl('no_location_desc')} textAlignment="center" textWrap={true}/>
                    <mdbutton margin="4 0 4 0" textAlignment="center" variant="outline" verticalTextAlignment="center" on:tap={getLocationAndWeather} android:paddingTop={6}>
                        <cspan fontFamily={$fonts.mdi} fontSize={20 * $fontScale} text="mdi-crosshairs-gps" verticalAlignment="middle" />
                        <cspan text={' ' + $sl('my_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                    <mdbutton margin="4 0 4 0" textAlignment="center" variant="outline" verticalTextAlignment="center" on:tap={searchCity} android:paddingTop={6}>
                        <cspan fontFamily={$fonts.mdi} fontSize={20 * $fontScale} text="mdi-magnify" verticalAlignment="middle" />
                        <cspan text={' ' + $sl('search_location').toUpperCase()} verticalAlignment="middle" />
                    </mdbutton>
                </stacklayout>
            {/if}
            <CActionBar onMenuIcon={toggleDrawer} showMenuIcon title={weatherLocation && weatherLocation.name}>
                <mdbutton
                    slot="left"
                    class="actionBarButton"
                    col={1}
                    color={favoriteIconColor(weatherLocation)}
                    rippleColor="#EFB644"
                    text={favoriteIcon(weatherLocation)}
                    variant="text"
                    verticalAlignment="middle"
                    visibility={weatherLocation ? 'visible' : 'collapsed'}
                    on:tap={() => toggleItemFavorite(weatherLocation)}
                />
                <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} width={$actionBarButtonHeight} />
                <mdbutton
                    class="actionBarButton"
                    color="#EFB644"
                    rippleColor="#EFB644"
                    text="mdi-alert"
                    variant="text"
                    verticalAlignment="middle"
                    visibility={!loading && weatherData?.alerts?.length > 0 ? 'visible' : 'collapsed'}
                    on:tap={() => showAlerts()}
                />
                <mdbutton class="actionBarButton" text="mdi-magnify" variant="text" verticalAlignment="middle" on:tap={searchCity} />

                <mdbutton id="menu_button" class="actionBarButton" text="mdi-dots-vertical" variant="text" verticalAlignment="middle" on:tap={showOptions} />
            </CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={lc('favorites')} />
            <collectionview bind:this={favoriteCollectionView} id="favorite" itemIdGenerator={(_item, index) => index} items={favorites} row={1}>
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
                        gestureTag={15644}
                        leftSwipeDistance="300"
                        openAnimationDuration={100}
                        startingSide={item.startingSide}
                        translationFunction={swipeMenuTranslationFunction}
                    >
                    <ListItemAutoSize prop:mainContent backgroundColor={colorBackground} subtitle={(item.sys.state || item.sys.country) + (item.sys.state?('\n' + item.sys.country):'') } title={item.name} on:tap={() => saveLocation(item)}/>
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
                                class="icon-btn"
                                backgroundColor="red"
                                color="white"
                                height="100%"
                                shape="none"
                                text="mdi-trash-can"
                                textAlignment="center"
                                variant="text"
                                verticalTextAlignment="middle"
                                width="100"
                                on:tap={toggleFavorite(item)}
                            />
                        <!-- </stacklayout> -->
                    </swipemenu>
                </Template>
            </collectionview>
        </gridlayout>
    </drawer>
</page>
