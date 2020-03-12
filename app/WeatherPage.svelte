<script>
    import { NativeViewElementNode } from 'svelte-native-akylas/dom';
    import { screenHeightDips, screenWidthDips, screenScale } from '~/variables';
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
    import { navigate, showModal } from 'svelte-native';
    import { showSnack } from 'nativescript-material-snackbar';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { action, alert, confirm, prompt } from 'nativescript-material-dialogs';
    import { clog, DEV_LOG } from '~/utils/logging';
    import { getCityName, networkService, getDarkSkyWeather, hasDSApiKey, setDSApiKey } from '~/services/api';
    import { getNumber, getString, remove as removeSetting, setBoolean, setNumber, setString } from '@nativescript/core/application-settings';
    import { openUrl } from '@nativescript/core/utils/utils';
    import { ObservableArray } from '@nativescript/core/data/observable-array';
    import { Page } from '@nativescript/core/ui/page';
    import { l } from '~/helpers/locale';
    import { GenericGeoLocation, GPS, LocationMonitor, Options as GeolocationOptions, setGeoLocationKeys, setMockEnabled } from 'nativescript-gps';
    import { request as requestPerm, Status as PermStatus, setDebug as setPermsDebug } from 'nativescript-perms';
    import { actionBarHeight, darkColor, navigationBarHeight, primaryColor, statusBarHeight } from '~/variables';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';
    import { showBottomSheet } from '~/bottomsheet';
    import { prefs } from '~/services/preferences';
    import { onLanguageChanged } from '~/helpers/locale';
    import { android as androidApp, ios as iosApp } from '@nativescript/core/application';

    // import LineChart from 'nativescript-chart/charts/LineChart';
    // import { LineDataSet, Mode } from 'nativescript-chart/data/LineDataSet';
    // import { LineData } from 'nativescript-chart/data/LineData';
    // import { LinearGradient, RadialGradient, TileMode } from 'nativescript-canvas';

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
    import SelectCity from './SelectCity.svelte';
    // @ts-ignore
    import SelectLocationOnMap from './SelectLocationOnMap.svelte';
    // @ts-ignore
    import ActionSheet from './ActionSheet.svelte';

    setGeoLocationKeys('lat', 'lon', 'altitude');

    // let gps;
    let page;
    let lineChart;
    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let weatherLocation = JSON.parse(getString('weatherLocation', DEFAULT_LOCATION || 'null'));
    let dsWeather = JSON.parse(getString('lastDsWeather', 'null'));

    let topHeight = screenHeightDips - actionBarHeight - navigationBarHeight - statusBarHeight;
    let items;

    let screenHeightPixels = screenHeightDips * screenScale;

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
        if (!weatherLocation) {
            return;
        }
        if (!networkService.connected) {
            showSnack({ message: l('no_network') });
        }
        loading = true;
        try {
            dsWeather = await getDarkSkyWeather(weatherLocation.coord.lat, weatherLocation.coord.lon);
            lastUpdate = Date.now();
            items = prepareItems();
            // setDay(0);
            setNumber('lastUpdate', lastUpdate);
            setString('lastDsWeather', JSON.stringify(dsWeather));
        } catch (err) {
            console.log(err);
            if (err.statusCode === 403) {
                setDSApiKey(null);
                askForApiKey();
            } else {
                showError(err);
            }
        } finally {
            loading = false;
        }
    }

    function saveLocation(result) {
        const cityChanged = !weatherLocation || (result.coord.lat !== weatherLocation.coord.lat || weatherLocation.coord.lon !== result.coord.lat);
        if (cityChanged) {
            weatherLocation = result;
            setString('weatherLocation', JSON.stringify(weatherLocation));
            refreshWeather();
        }
    }

    function prepareItems() {
        // console.log('prepareItems', dsWeather);
        const newItems = new ObservableArray([]);
        dsWeather.daily.data.forEach((d, index) => {
            if (index === 0) {
                const now = dayjs()
                    .endOf('h')
                    .valueOf();
                let currentWeather = dsWeather.daily.data[index];
                const firstHourIndex = currentWeather.hourly.findIndex(h => h.time >= now);
                // hourlyItems = currentWeather.hourly.slice(firstHourIndex);
                // console.log('prepareItems', index, now, firstHourIndex);
                if (firstHourIndex > 0) {
                    currentWeather = Object.assign({}, currentWeather, currentWeather.hourly[firstHourIndex - 1]);
                } else {
                    currentWeather = Object.assign({}, currentWeather, dsWeather.currently);
                }
                newItems.push(
                    Object.assign(currentWeather, {
                        showHourly: false,
                        lastUpdate: lastUpdate,
                        hourly: currentWeather.hourly.slice(firstHourIndex),
                        minutely: dsWeather.minutely,
                        alerts: dsWeather.alerts
                    })
                );

                newItems.push({
                    icon: dsWeather.daily.icon,
                    summary: dsWeather.daily.summary
                });
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
    // function updateLineChart() {
    //     const chart = lineChart.nativeView;
    //     if (chart) {
    //         if (!chartInitialized) {
    //             chartInitialized = true;
    //             chart.setAutoScaleMinMaxEnabled(true);
    //             chart.getLegend().setEnabled(false);
    //             chart.getXAxis().setEnabled(false);
    //             chart.getAxisLeft().setEnabled(false);
    //             chart.getAxisRight().setEnabled(false);
    //             chart.setMinOffset(0);
    //             chart.setExtraTopOffset(10);
    //             // chart.setLogEnabled(true);
    //         }
    //         if (!chartSet) {
    //             chartSet = new LineDataSet(currentWeather.hourly, 'temperature', 'time', 'temperature');
    //             chartSet.setColor('white');
    //             chartSet.setLineWidth(3);
    //             chartSet.setDrawIcons(false);
    //             chartSet.setDrawValues(false);
    //             chartSet.setDrawFilled(true);
    //             // chartSet.setFillAlpha(255);
    //             // chartSet.setFillColor('white');
    //             chartSet.setFillShader(new LinearGradient(0, 0, 0, 150, '#44ffffff', '#00ffffff', TileMode.CLAMP));
    //             chartSet.setValueTextColors(['white']);
    //             chartSet.setValueFormatter({
    //                 getFormattedValue(value, entry) {
    //                     return formatValueToUnit(value, UNITS.Celcius);
    //                 }
    //             });
    //             chartSet.setMode(Mode.CUBIC_BEZIER);
    //             chart.setData(new LineData([chartSet]));
    //         } else {
    //             chartSet.setValues(currentWeather.hourly);
    //             chart.getData().notifyDataChanged();
    //             chart.notifyDataSetChanged();
    //         }
    //         // chart.getXAxis().setAxisMinimum(false);
    //     }
    // }

    async function searchCity() {
        try {
            const result = await showModal({ page: SelectCity, animated: true, fullscreen: true });
            clog('searchCity', result);
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

    async function refresh(args) {
        clog('refresh', weatherLocation);
        if (!hasDSApiKey()) {
            return;
        }
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = true;
        }
        if (weatherLocation) {
            // try {
            await refreshWeather();
            // }catch(err) {
            //     if (err.statusCode === 403) {
            //         askForApiKey();
            //     }
            // } finally {
            if (pullRefresh) {
                pullRefresh.nativeView.refreshing = false;
            }
            // }
        }
    }

    function itemTemplateSelector(item, index, items) {
        return index === 0 ? 'topView' : index === 1 ? 'info' : 'daily';
    }

    // function onDailyLongPress(item) {
    //     const index = item.index;
    //     // console.log('onDailyLongPress', index, item.index, item.scrollIndex);
    //     if (index) {
    //         item.showHourly = !item.showHourly;
    //         items.setItem(index, item);
    //     }
    // }
    async function askForApiKey() {
        try {
            const result = await prompt({
                title: l('api_key_required'),
                okButtonText: l('ok'),
                cancelable: false,
                neutralButtonText: l('open_website'),
                cancelButtonText: l('quit'),
                message: l('api_key_required_description')
            });
            console.log('result', result);
            if (result.result === true) {
                if (result.text) {
                    setDSApiKey(result.text);
                    refresh();
                }
            } else if (result.result === false) {
                if (gVars.isIOS) {
                    exit(0);
                } else {
                    androidApp.startActivity.finish();
                }
            } else {
                openUrl('https://darksky.net/dev');
                if (gVars.isIOS) {
                    exit(0);
                } else {
                    androidApp.startActivity.finish();
                }
            }

            return result;
        } catch (err) {
            console.log('error', err);
        }
    }
    onMount(async () => {
        const dsApiKey = getString('dsApiKey', DARK_SKY_KEY);
        // console.log('onMount', dsApiKey);
        if (!dsApiKey) {
            askForApiKey();
        }
        networkService.on('connection', (event) => {
            if ((event.connected && !lastUpdate) || Date.now() - lastUpdate > 10 * 60 * 1000) {
                refresh();
            }
        });
        networkService.start(); // should send connection event and then refresh

        if (dsWeather) {
            items = prepareItems();
        }
    });

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
            <collectionview {items} {itemTemplateSelector} extraLayoutSpace={screenHeightPixels*2}>
                <Template key="topView" let:item>
                    <TopWeatherView {item} height={topHeight} />
                </Template>
                <Template key="info" let:item>
                    <gridLayout columns="auto,*" class="alertView" orientation="horizontal" verticalAlignment="center" paddingLeft="20">
                        <WeatherIcon col="0" verticalAlignment="middle" fontSize="50" icon={item.icon} />
                        <label col="1" fontSize="16" paddingLeft="4" verticalAlignment="middle" text={item.summary} />
                    </gridLayout>
                </Template>
                <Template key="daily" let:item>
                    <DailyView {item} />
                </Template>
            </collectionview>
        </pullrefresh>

        <!-- </gridLayout> -->
        <!-- <scrollview row="1">
            <gridlayout row="1" height={bottomHeight + (gVars.isAndroid ? 70 : 115)} rows="*,200,200">
                <linechart row="1" bind:this={lineChart} verticalAlignment="bottom" height="200" />
                <HourlyView items={hourlyItems} {scrollIndex} />
            </gridlayout>
        </scrollview> -->

        <!-- {#if prevDayData}
            <stacklayout rowSpan="2" elevation="2" width="60" height="60" horizontalAlignment="left" verticalAlignment="center" borderRadius="6" backgroundColor="#333" on:tap={decrementDay}>
                <WeatherIcon icon={prevDayData.icon} verticalAlignment="center" />
            </stacklayout>
        {/if}
        {#if nextDayData}
            <stacklayout rowSpan="2" elevation="2" width="60" height="60" horizontalAlignment="right" verticalAlignment="center" borderRadius="6" backgroundColor="#333" on:tap={incrementDay}>
                <WeatherIcon icon={nextDayData.icon} verticalAlignment="center" />
            </stacklayout>
        {/if} -->
        <activityIndicator row="0" colSpan="3" busy={loading} verticalAlignment="center" horizontalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
    </gridLayout>
</page>
