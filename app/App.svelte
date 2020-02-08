<script>
    import { screenHeightDips, screenWidthDips } from '~/variables';
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { showModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { showSnack } from 'nativescript-material-snackbar';
    import { formatValueToUnit, convertTime, titlecase } from '~/helpers/formatter';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { action, alert, confirm, prompt } from 'nativescript-material-dialogs';
    import { clog, DEV_LOG } from '~/utils/logging';
    import { getCityName, findCitiesByName, networkService, getDarkSkyWeather } from '~/services/api';
    import { getNumber, getString, remove as removeSetting, setBoolean, setNumber, setString } from '@nativescript/core/application-settings';
    import { ObservableArray } from '@nativescript/core/data/observable-array';
    import { Page } from '@nativescript/core/ui/page';
    import { localize as l } from '~/helpers/formatter';
    import { GenericGeoLocation, GPS, LocationMonitor, Options as GeolocationOptions, setGeoLocationKeys, setMockEnabled } from 'nativescript-gps';
    import { request as requestPerm, Status as PermStatus, setDebug as setPermsDebug } from 'nativescript-perms';
    import { darkColor, primaryColor } from '~/variables';
    import { colorFromTempC, UNITS } from '~/helpers/formatter';

    import LineChart from 'nativescript-chart/charts/LineChart';
    import { LineDataSet, Mode } from 'nativescript-chart/data/LineDataSet';
    import { LineData } from 'nativescript-chart/data/LineData';
    import { LinearGradient, RadialGradient, TileMode } from 'nativescript-canvas';

    import { layout } from '@nativescript/core/utils/utils';
    // @ts-ignore
    import CActionBar from './CActionBar.svelte';
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    // @ts-ignore
    // import WeatherListItem from './WeatherListItem.svelte';
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import TopWeatherView from './TopWeatherView.svelte';
    // @ts-ignore
    import SelectCity from './SelectCity.svelte';
    setGeoLocationKeys('lat', 'lon', 'altitude');

    let gps;
    let page;
    let collectionView;
    let lineChart;
    let loading = false;
    let citylat = getNumber('cityLat', -1);
    let citylon = getNumber('cityLon', -1);
    let lastUpdate = getNumber('lastUpdate', -1);
    let city = getString('city', null);
    let dayIndex = 0;
    let dsWeather = JSON.parse(getString('lastDsWeather', 'null'));
    let currentWeather;
    let topViewHeight = 200;
    let currentViewTop = 0;
    let translationMaxOffset = 0;
    let viewHeight = 0;
    const topHeight = 0.4 * screenHeightDips;
    const bottomHeight = screenHeightDips - topHeight - 44;

    let nextDayData;
    let prevDayData;
    let hourlyItems = [];

    function onLayoutChange(event) {
        viewHeight = Math.round(layout.toDeviceIndependentPixels(event.object.getMeasuredHeight()));
        translationMaxOffset = viewHeight;
    }


    async function refreshWeather() {
        if (!networkService.connected) {
            showSnack({ view: page.nativeView, message: l('no_network') });
        }
        loading = true;
        try {
            dsWeather = await getDarkSkyWeather(citylat, citylon);
            setDay(0);
            lastUpdate = Date.now();
            setNumber('lastUpdate', lastUpdate);
            setString('lastDsWeather', JSON.stringify(dsWeather));
        } catch (err) {
            showError(err);
        } finally {
            console.log('hide loading');
            loading = false;
        }
    }

    function saveLocation(result) {
        const lastLat = getNumber('cityLat', -1);
        const lastLon = getNumber('cityLon', -1);
        const cityChanged = result.coord.lat !== lastLat || result.coord.lon !== lastLon;
        if (cityChanged) {
            const cityName = result.name;
            const country = result.sys ? result.sys.country : undefined;
            city = cityName + (country ? `, ${country}` : '');
            citylat = result.coord.lat;
            citylon = result.coord.lon;
            // setNumber('cityId', cityId);
            setNumber('cityLat', citylat);
            setNumber('cityLon', citylon);
            setString('city', city);
            refreshWeather();
        }
    }
    function setDay(index) {
        const changed = index !== dayIndex;
        dayIndex = index;
        const nbDays = dsWeather.daily.data.length;
        currentWeather = dsWeather.daily.data[index];
        console.log('currentWeather', JSON.stringify(currentWeather));
        console.log('hourly', JSON.stringify(currentWeather.hourly));
        if (index === 0) {
            const now = dayjs()
                .endOf('h')
                .valueOf();
            const firstHourIndex = currentWeather.hourly.findIndex(h => h.time >= now);
            hourlyItems = currentWeather.hourly.slice(firstHourIndex);
            // console.log('setDay', index, now, firstHourIndex, hourlyItems.length);
            if (firstHourIndex > 0) {
                currentWeather = Object.assign({}, currentWeather, currentWeather.hourly[firstHourIndex - 1]);
            } else {
                currentWeather = Object.assign({}, currentWeather, dsWeather.currently);
            }
            // changed && setTimeout(() => collectionView.nativeView.scrollToIndex(0, false), 100);
        } else {
            const items = currentWeather.hourly;
            hourlyItems = items;
            const sunriseTime = dayjs(currentWeather.sunriseTime)
                .startOf('h')
                .valueOf();
            const firstHourIndex = items.findIndex(h => h.time >= sunriseTime);
            // console.log('setDay', index, sunriseTime, firstHourIndex, hourlyItems.length);

            // changed && setTimeout(() => collectionView.nativeView.scrollToIndex(firstHourIndex + 1, false), 100);
        }
        nextDayData = index < nbDays - 1 ? dsWeather.daily.data[index + 1] : undefined;
        prevDayData = index > 0 ? dsWeather.daily.data[index - 1] : undefined;
        console.log('hourlyItems', JSON.stringify(hourlyItems));
        updateLineChart();
    }
    function decrementDay() {
        setDay(dayIndex - 1);
    }
    function incrementDay() {
        setDay(dayIndex + 1);
    }
    let chartInitialized = false;
    let chartSet;
    function updateLineChart() {
        const chart = lineChart.nativeView;
        if (chart) {
            if (!chartInitialized) {
                chartInitialized = true;
                chart.setAutoScaleMinMaxEnabled(true);
                chart.getLegend().setEnabled(false);
                chart.getXAxis().setEnabled(false);
                chart.getAxisLeft().setEnabled(false);
                chart.getAxisRight().setEnabled(false);
                chart.setMinOffset(0);
                chart.setExtraTopOffset(10);
                // chart.setLogEnabled(true);
            }
            if (!chartSet) {
                chartSet = new LineDataSet(currentWeather.hourly, 'temperature', 'time', 'temperature');
                chartSet.setColor('white');
                chartSet.setLineWidth(3);
                chartSet.setDrawIcons(false);
                chartSet.setDrawValues(false);
                chartSet.setDrawFilled(true);
                // chartSet.setFillAlpha(255);
                // chartSet.setFillColor('white');
                chartSet.setFillShader(new LinearGradient(0, 0, 0, 150, '#44ffffff', '#00ffffff', TileMode.CLAMP));
                chartSet.setValueTextColors(['white']);
                chartSet.setValueFormatter({
                    getFormattedValue(value, entry) {
                        return formatValueToUnit(value, UNITS.Celcius);
                    }
                });
                chartSet.setMode(Mode.CUBIC_BEZIER);
                chart.setData(new LineData([chartSet]));
            } else {
                chartSet.setValues(hourlyItems);
                chart.getData().notifyDataChanged();
                chart.notifyDataSetChanged();
            }
        }
    }

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

    async function getLocationAndWeather() {
        const result = await confirm;
        // clog('getLocationAndWeather', networkService.connected);
        if (!networkService.connected) {
            showSnack({ view: page.nativeView, message: l('no_network') });
        }
        try {
            const permRes = await requestPerm('location');
            clog('permRes', permRes);
            if (permRes[0] !== 'authorized') {
                return alert(l('missing_location_perm'));
            }
            // clog('requesting location');
            loading = true;
            if (!gps) {
                gps = new GPS();
            }
            const location = await gps.getCurrentLocation<LatLonKeys>({ timeout: 30000 });
            if (location) {
                // clog('location', location);
                const cityRes = await getCityName(location);
                if (cityRes) {
                    saveLocation(cityRes);
                }
            }
        } catch (err) {
            showError(err);
            // refresh using last location?
            refreshWeather();
        } finally {
            loading = false;
        }
    }

    function refresh() {
        clog('refresh', citylat, citylon);
        if (citylat === -1 && citylon === -1) {
            // getLocationAndWeather();
        } else {
            refreshWeather();
        }
    }

    onMount(() => {
        networkService.on('connection', () => {
            if (Date.now() - lastUpdate > 10 * 60 * 1000) {
                refresh();
            }
        });
        networkService.start(); // should send connection event and then refresh

        if (dsWeather) {
            setDay(0);
        }
    });
</script>

<page class="page" actionBarHidden={true} bind:this={page} statusBarStyle="dark" navigationBarColor="black" statusBarColor="#424242" backgroundColor="#222">
    <gridLayout rows="{topHeight},*">
        <gridLayout rows="auto,*" columns="*,auto" padding="10" backgroundColor="#424242">
            <CActionBar title={city} row="0" colSpan="2" backgroundColor="#424242">
                <button variant="flat" class="icon-btn" text="mdi-refresh" on:tap={refresh} />
                <button variant="flat" class="icon-btn" text="mdi-magnify" on:tap={searchCity} />
                <button variant="flat" class="icon-btn" text="mdi-dots-vertical" />
            </CActionBar>
            {#if currentWeather}
                <TopWeatherView {currentWeather} {lastUpdate}/>
            {/if}
        </gridLayout>
        <!-- <scrollview row="1"> -->
            <gridlayout row="1" height={bottomHeight + 70} rows="*,200,200">
                <linechart row="1" bind:this={lineChart} verticalAlignment="bottom" height="200" />
                <collectionview
                    row="2"
                    verticalAlignment="bottom"
                    rowHeight="80"
                    height="200"
                    items={hourlyItems}>
                    <Template let:item>
                        <WeatherCollectionItem {item}/>
                    </Template>
                </collectionview>
            </gridlayout>
        <!-- </scrollview> -->

        {#if prevDayData}
            <stacklayout rowSpan="2" elevation="2" width="60" height="60" horizontalAlignment="left" verticalAlignment="center" borderRadius="6" backgroundColor="#333" on:tap={decrementDay}>
                <WeatherIcon icon={prevDayData.icon} verticalAlignment="center" />
            </stacklayout>
        {/if}
        {#if nextDayData}
            <stacklayout rowSpan="2" elevation="2" width="60" height="60" horizontalAlignment="right" verticalAlignment="center" borderRadius="6" backgroundColor="#333" on:tap={incrementDay}>
                <WeatherIcon icon={nextDayData.icon} verticalAlignment="center" />
            </stacklayout>
        {/if}

        {#if loading}
        <activityIndicator row="0" colSpan="3" busy={loading} verticalAlignment="center" horizontalAlignment="center"  />
        {/if}
    </gridLayout>
</page>
