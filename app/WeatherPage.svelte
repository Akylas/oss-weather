<script>
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { screenHeightDips, screenScale } from '~/variables';
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
    import { showModal } from 'svelte-native';
    import { showSnack } from 'nativescript-material-snackbar';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { confirm, prompt } from 'nativescript-material-dialogs';
    import { clog } from '~/utils/logging';
    // import { networkService, getDarkSkyWeather, hasDSApiKey, setDSApiKey } from '~/services/api';
    import { networkService, getClimaCellWeather, hasCCApiKey, setCCApiKey, NetworkConnectionStateEvent, NetworkConnectionStateEventData } from '~/services/api';
    import { getNumber, getString, setNumber, setString } from '@nativescript/core/application-settings';
    import { openUrl } from '@nativescript/core/utils/utils';
    import { ObservableArray } from '@nativescript/core/data/observable-array';
    import { Page } from '@nativescript/core/ui/page';
    import { l } from '~/helpers/locale';
    import { setGeoLocationKeys } from 'nativescript-gps';
    import { request as requestPerm, Status as PermStatus, setDebug as setPermsDebug } from 'nativescript-perms';
    import { actionBarHeight, navigationBarHeight, statusBarHeight } from '~/variables';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { showBottomSheet } from '~/bottomsheet';
    import { prefs } from '~/services/preferences';
    import { onLanguageChanged } from '~/helpers/locale';
    import { android as androidApp } from '@nativescript/core/application';

    // @ts-ignore
    import CActionBar from './CActionBar.svelte';
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    // @ts-ignore
    import DailyView from './DailyView.svelte';
    // @ts-ignore
    import TopWeatherView from './TopWeatherView.svelte';
    // @ts-ignore
    import HourlyView from './HourlyView.svelte';
    // @ts-ignore
    // @ts-ignore
    import SelectLocationOnMap from './SelectLocationOnMap.svelte';
    // @ts-ignore
    import ActionSheet from './ActionSheet.svelte';

    setGeoLocationKeys('lat', 'lon', 'altitude');

    // let gps;

    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let weatherLocation = JSON.parse(getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let dsWeather = JSON.parse(getString('lastDsWeather', 'null'));

    let topHeight = Math.min(screenHeightDips - actionBarHeight - navigationBarHeight - statusBarHeight - 100, 500);
    let items = [];

    let screenHeightPixels = screenHeightDips * screenScale;
    // interface Option {
    //     icon: string;
    //     id: string;
    //     text: string;
    // }
    function showOptions() {
        showBottomSheet({
            parent: page,
            view: ActionSheet,
            props: {
                options: [
                    {
                        icon: 'mdi-refresh',
                        id: 'refresh',
                        text: l('refresh')
                    },
                    // {
                    //     icon: 'mdi-map',
                    //     id: 'select_on_map',
                    //     text: l('select_on_map')
                    // },
                    {
                        icon: 'mdi-settings',
                        id: 'preferences',
                        text: l('preferences')
                    }
                ]
            }
        }).then(result => {
            if (result) {
                switch (result.id) {
                    case 'preferences':
                        prefs.openSettings();
                        break;
                    case 'refresh':
                        refreshWeather();
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
        if (!networkService.connected) {
            showSnack({ message: l('no_network') });
            return;
        }
        loading = true;
        try {
            // dsWeather = await getDarkSkyWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
            dsWeather = await getClimaCellWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
            lastUpdate = Date.now();
            items = prepareItems();
            // setDay(0);
            setNumber('lastUpdate', lastUpdate);
            setString('lastDsWeather', JSON.stringify(dsWeather));
        } catch (err) {
            console.log(err);
            if (err.statusCode === 403) {
                // setDSApiKey(null);
                setCCApiKey(null);
                askForApiKey();
            } else {
                showError(err);
            }
        } finally {
            loading = false;
        }
    }

    function saveLocation(result) {
        const cityChanged = !weatherLocation || result.coord.lat !== weatherLocation.coord.lat || weatherLocation.coord.lon !== result.coord.lat;
        if (cityChanged) {
            weatherLocation = result;
            setString('weatherLocation', JSON.stringify(weatherLocation));
            refreshWeather();
        }
    }

    function prepareItems() {
        const newItems = [];
        const endOfHour = dayjs()
            // .add(46, 'h')
            .endOf('h')
            .valueOf();
        const endOfMinute = dayjs()
            // .add(46, 'h')
            .endOf('m')
            .valueOf();
        dsWeather.daily.data.forEach((d, index) => {
            if (index === 0) {
                let currentDaily = dsWeather.daily.data[index];
                const firstHourIndex = currentDaily.hourly.findIndex(h => h.time >= endOfHour);
                const firstMinuteIndex = dsWeather.minutely.data.findIndex(h => h.time >= endOfMinute);
                // hourlyItems = currentWeather.hourly.slice(firstHourIndex);
                // console.log('prepareItems', index, now, firstHourIndex, dsWeather.minutely);
                if (firstHourIndex > 1) {
                    currentDaily = Object.assign({}, currentDaily, currentDaily.hourly[firstHourIndex - 1]);
                }
                if (firstMinuteIndex > 1) {
                    currentDaily = Object.assign({}, currentDaily, dsWeather.minutely.data[firstMinuteIndex - 1]);
                } else {
                    currentDaily = Object.assign({}, currentDaily, dsWeather.currently);
                }
                // console.log('firstHourIndex', firstHourIndex, firstMinuteIndex, currentDaily);
                const hours = firstHourIndex >= 0 ? currentDaily.hourly.slice(firstHourIndex): [];
                let min = 10000;
                let max = -10000;
                hours.forEach(h=>{
                    if (h.temperature < min) {
                        min = h.temperature;
                    }
                    if (h.temperature > max) {
                        max = h.temperature;
                    }
                })
                newItems.push(
                    Object.assign(currentDaily, {
                        showHourly: false,
                        lastUpdate: lastUpdate,
                        hourly: hours.map((h, i)=>{
                            h.index = i;
                            h.min = min;
                            h.max = max;
                            h.odd = i % 2 === 0;
                            return h;
                        }) ,
                        minutely: firstMinuteIndex >= 0 ? dsWeather.minutely.data.slice(firstMinuteIndex) : [],
                        alerts: dsWeather.alerts
                    })
                );

                // newItems.push({
                //     icon: dsWeather.daily.icon,
                //     summary: dsWeather.daily.summary
                // });
            } else {
                const items = d.hourly;
                const sunriseTime = dayjs(d.sunriseTime)
                    .endOf('h')
                    .valueOf();
                newItems.push(
                    Object.assign(d, {
                        index: newItems.length,
                        scrollIndex: items.findIndex(h => h.time >= sunriseTime)
                    })
                );
            }
        });

        return newItems;
    }
    // function setDay(index) {
    //     const changed = index !== dayIndex;
    //     dayIndex = index;
    //     const nbDays = dsWeather.daily.data.length;
    //     currentWeather = dsWeather.daily.data[index];
    //     console.log('currentWeather', JSON.stringify(currentWeather));
    //     console.log('hourly', JSON.stringify(currentWeather.hourly));
    //     if (index === 0) {
    //         const now = dayjs()
    //             .endOf('h')
    //             .valueOf();
    //         const firstHourIndex = currentWeather.hourly.findIndex(h => h.time >= now);
    //         hourlyItems = currentWeather.hourly.slice(firstHourIndex);
    //         // console.log('setDay', index, now, firstHourIndex, hourlyItems.length);
    //         if (firstHourIndex > 0) {
    //             currentWeather = Object.assign({}, currentWeather, currentWeather.hourly[firstHourIndex - 1]);
    //         } else {
    //             currentWeather = Object.assign({}, currentWeather, dsWeather.currently);
    //         }
    //         scrollIndex = 0;
    //         // changed && setTimeout(() => collectionView.nativeView.scrollToIndex(0, false), 100);
    //     } else {
    //         const items = currentWeather.hourly;
    //         hourlyItems = items;
    //         const sunriseTime = dayjs(currentWeather.sunriseTime)
    //             .endOf('h')
    //             .valueOf();
    //         scrollIndex = items.findIndex(h => h.time >= sunriseTime);
    //         // console.log('setDay', index, sunriseTime, firstHourIndex, hourlyItems.length);

    //         // changed && setTimeout(() => collectionView.nativeView.scrollToIndex(firstHourIndex + 1, false), 100);
    //     }
    //     // nextDayData = index < nbDays - 1 ? dsWeather.daily.data[index + 1] : undefined;
    //     // prevDayData = index > 0 ? dsWeather.daily.data[index - 1] : undefined;
    //     console.log('hourlyItems', JSON.stringify(hourlyItems));
    //     updateLineChart();
    // }
    // function decrementDay() {
    //     setDay(dayIndex - 1);
    // }
    // function incrementDay() {
    //     setDay(dayIndex + 1);
    // }

    async function searchCity() {
        try {
            const SelectCity = require('./SelectCity.svelte').default;

            // throw new Error('test')
            const result = await showModal({ page: SelectCity, animated: true, fullscreen: true });
            if (result) {
                saveLocation(result);
            }
        } catch (err) {
            showError(err);
        }
    }
    async function searchOnMap() {
        try {
            const result = await showModal({ page: SelectLocationOnMap, animated: true, fullscreen: true, props: { focusPos: weatherLocation ? weatherLocation.coord : undefined } });
            clog('searchOnMap', result);
            if (result) {
                saveLocation(result);
            }
        } catch (err) {
            showError(err);
        }
    }

    // async function getLocationAndWeather() {
    //     const result = await confirm;
    //     // clog('getLocationAndWeather', networkService.connected);
    //     if (!networkService.connected) {
    //         showSnack({ view: page.nativeView, message: l('no_network') });
    //     }
    //     try {
    //         const permRes = await requestPerm('location');
    //         clog('permRes', permRes);
    //         if (permRes[0] !== 'authorized') {
    //             return alert(l('missing_location_perm'));
    //         }
    //         // clog('requesting location');
    //         loading = true;
    //         if (!gps) {
    //             gps = new GPS();
    //         }
    //         const location = await gps.getCurrentLocation<LatLonKeys>({ timeout: 30000 });
    //         if (location) {
    //             // clog('location', location);
    //             const cityRes = await getCityName(location);
    //             if (cityRes) {
    //                 saveLocation(cityRes);
    //             }
    //         }
    //     } catch (err) {
    //         showError(err);
    //         // refresh using last location?
    //         refreshWeather();
    //     } finally {
    //         loading = false;
    //     }
    // }

    let pullRefresh;

    async function refresh() {
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = true;
        }

        // if (hasDSApiKey()) {
        if (hasCCApiKey()) {
            await refreshWeather();
        }
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = false;
        }
    }

    function itemTemplateSelector(item, index, items) {
        // return index === 0 ? 'topView' : index === 1 ? 'info' : 'daily';
        return index === 0 ? 'topView' : 'daily';
    }

    function quitApp() {
        if (gVars.isIOS) {
            exit(0);
        } else {
            androidApp.startActivity.finish();
        }
    }
    async function askForApiKey() {
        try {
            const result = await prompt({
                title: l('api_key_required'),
                okButtonText: l('ok'),
                cancelable: false,
                neutralButtonText: l('open_website'),
                cancelButtonText: l('quit'),
                message: l('api_key_required_description'),
                textFieldProperties: {
                    hint: l('api_key')
                }
            });
            console.log('result', result);
            if (result.result === true) {
                if (result.text) {
                    setCCApiKey(result.text);
                    refresh();
                } else {
                    // for now we cant ignore the button click so let s tell the user we are going to close
                    const result = await confirm({
                        title: l('quit'),
                        okButtonText: l('ok'),
                        message: l('about_to_quit')
                    });
                    quitApp();
                }
            } else if (result.result === false) {
                const result = await confirm({
                    title: l('quit'),
                    okButtonText: l('ok'),
                    message: l('about_to_quit')
                });
                    quitApp();
            } else {
                openUrl('https://darksky.net/dev');
                quitApp();
            }

            return result;
        } catch (err) {
            console.log('error', err);
        }
    }
    onMount(async () => {
        const ccApiKey = getString('ccApiKey', CLIMA_CELL_KEY);
        // console.log('onMount', dsApiKey);
        if (!ccApiKey) {
            askForApiKey();
        }
        networkService.on(NetworkConnectionStateEvent, event => {
            if ((event.data.connected && !lastUpdate) || Date.now() - lastUpdate > 10 * 60 * 1000) {
                refresh();
            }
        });
        networkService.start(); // should send connection event and then refresh

        if (dsWeather) {
            items = prepareItems();
        }
    });
    let page;

    onLanguageChanged(lang => {
        console.log('refresh triggered by lang change');
        refresh();
    });
</script>

<page bind:this={page} actionBarHidden="true" id="home">
    <gridLayout rows="auto,*">
        <CActionBar title={weatherLocation && weatherLocation.name} row="0" colSpan="2">
            <button variant="flat" class="icon-btn" text="mdi-magnify" on:tap={searchCity} />
            <button variant="flat" class="icon-btn" text="mdi-dots-vertical" on:tap={showOptions} />
        </CActionBar>
        <pullrefresh bind:this={pullRefresh} row="1" on:refresh={refresh}>
            <collectionview {items} {itemTemplateSelector}>
                <Template key="topView" let:item>
                    <TopWeatherView {item} height={topHeight} />
                </Template>
                <Template key="info" let:item>
                    <gridLayout rows="auto" columns="auto,*" class="alertView" orientation="horizontal" verticalAlignment="center" paddingLeft="20">
                        <WeatherIcon col="0" verticalAlignment="middle" fontSize="50" icon={item.icon} />
                        <label col="1" fontSize="16" paddingLeft="4" verticalAlignment="middle" text={item.summary} maxLines="2" />
                    </gridLayout>
                </Template>
                <Template key="daily" let:item>
                    <DailyView {item} />
                </Template>
            </collectionview>
        </pullrefresh>
        <activityIndicator row="0" colSpan="3" busy={loading} verticalAlignment="center" horizontalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
    </gridLayout>
</page>
