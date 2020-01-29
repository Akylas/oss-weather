<script>
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { showModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { showSnack } from 'nativescript-material-snackbar';
    import { formatValueToUnit, convertTime, titlecase, kelvinToCelsius } from '~/helpers/formatter';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { action, alert, prompt } from 'nativescript-material-dialogs';
    import { clog, DEV_LOG } from '~/utils/logging';
    import { fetchOWM, getCityName, getForecast, findCitiesByName, networkService } from '~/services/api';
    // import { CityWeather } from '~/services/owm';
    import { getNumber, getString, remove as removeSetting, setBoolean, setNumber, setString } from '@nativescript/core/application-settings';
    import { Page } from '@nativescript/core/ui/page';
    import { ObservableArray } from '@nativescript/core/data/observable-array';
    import { localize as l } from 'nativescript-localize';
    import { GenericGeoLocation, GPS, LocationMonitor, Options as GeolocationOptions, setGeoLocationKeys, setMockEnabled } from 'nativescript-gps';
    import { request as requestPerm, Status as PermStatus, setDebug as setPermsDebug } from 'nativescript-perms';
    import { darkColor, primaryColor } from '~/variables';
    import { colorFromTempC } from '~/helpers/formatter';

    import CActionBar from './CActionBar.svelte';
    import WeatherIcon from './WeatherIcon.svelte';
    import WeatherListItem from './WeatherListItem.svelte';

    let gps = new GPS();
    gps.debug = DEV_LOG;
    setPermsDebug(DEV_LOG);
    setGeoLocationKeys('lat', 'lon', 'altitude');
    // removeSetting('cityId');
    // removeSetting('city');
    let page;
    let selectedTab = 0;
    let loading = false;
    let lastUpdate = getNumber('lastUpdate', -1);
    let cityId = getNumber('cityId', -1);
    let city = getString('city', null);
    let todayWeather;
    let forecast;
    let uvIndex = -1;

    let tempColor;
    let frontAlpha = 255;

    // let items = new ObservableArray([{ cityId, city }]);

    let longTermWeather = [];
    let longTermTodayWeather = [];
    let longTermTomorrowWeather = [];

    // async function preloadWeather() {}
    // async function preloadUVIndex() {}
    async function updateLastUpdateTime() {}

    async function getTodayUVIndex() {
        uvIndex = await fetchOWM('uvi', todayWeather.coord);
        // new TodayUVITask(this, this, progressDialog).execute("coords", latitude, longitude);
    }

    async function getTodayWeather() {
        todayWeather = await fetchOWM('weather', { id: cityId });

        const rain = todayWeather.rain ? todayWeather.rain['3h'] || todayWeather.rain['1h'] || 0 : 0;
        const snow = todayWeather.snow ? todayWeather.snow['3h'] || todayWeather.snow['1h'] || 0 : 0;

        const fallPHour = rain > 0 ? rain : snow;
        const fallDesc = formatValueToUnit(rain > 0 ? rain : snow, 'mm');
        frontAlpha = (fallPHour / 50) * 255;
        tempColor = colorFromTempC(kelvinToCelsius(todayWeather.main.temp));
        // clog('todayWeather', JSON.stringify(todayWeather));
    }

    async function getLongTermWeather() {
        const result = await getForecast(cityId);
        const now = dayjs().startOf('d');
        const tomorrow = now.add(1, 'd');
        const later = tomorrow.add(1, 'd');

        const todayWeather = [];
        const tomorrowWeather = [];
        const weather = [];
        // clog('forecast', JSON.stringify(result));
        result.list.forEach(result => {
            const date = dayjs(result.dt * 1000);
            const rain = result.rain ? result.rain['3h'] || result.rain['1h'] || 0 : 0;
            const snow = result.snow ? result.snow['3h'] || result.snow['1h'] || 0 : 0;
            const weatherData = {
                date: date,
                temp: formatValueToUnit(result.main.temp, 'celcius'),
                tempC: kelvinToCelsius(result.main.temp),
                feels_like: formatValueToUnit(result.main.feels_like, 'celcius'),
                pressure: formatValueToUnit(result.main.pressure, 'hPa'),
                humidity: result.main.humidity + '%',
                desc: titlecase(result.weather[0].description),
                id: result.weather[0].id,
                icon: result.weather[0].icon,
                windSpeed: formatValueToUnit(result.wind.speed, 'km/h'),
                windDeg: result.wind.deg,
                fallPHour: rain > 0 ? rain : snow,
                fallDesc: formatValueToUnit(rain > 0 ? rain : snow, 'mm')
            };
            if (date.isBefore(tomorrow)) {
                (weatherData.time = convertTime(date, 'HH:mm')), todayWeather.push(weatherData);
            } else if (date.isBefore(later)) {
                (weatherData.time = convertTime(date, 'HH:mm')), tomorrowWeather.push(weatherData);
            } else {
                (weatherData.time = convertTime(date, 'dddd MMM D HH:mm')), weather.push(weatherData);
            }
        });
        longTermTodayWeather = todayWeather;
        longTermTomorrowWeather = tomorrowWeather;
        longTermWeather = weather;
        // clog('longTermTodayWeather', longTermTodayWeather.map(d => d.icon));
        // clog('longTermTomorrowWeather', longTermTomorrowWeather.map(d => d.icon));
        // clog('longTermWeather', longTermWeather.map(d => d.icon));
    }

    function shouldUpdate() {
        // const lastUpdate = PreferenceManager.getDefaultSharedPreferences(this).getLong("lastUpdate", -1);
        // const cityChanged = PreferenceManager.getDefaultSharedPreferences(this).getBoolean("cityChanged", false);
        // Update if never checked or last update is longer ago than specified threshold
        // return cityChanged || lastUpdate < 0 || (Calendar.getInstance().getTimeInMillis() - lastUpdate) > NO_UPDATE_REQUIRED_THRESHOLD;
    }

    async function refreshWeather() {
        if (!networkService.connected) {
            showSnack({ view: page.nativeView, message: l('no_network') });
        }
        // clog('refreshWeather');
        loading = true;
        try {
            await getTodayWeather();
            await getLongTermWeather();
            await getTodayUVIndex();
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    function selectTemplate(item, index, items) {
        return index === 0 ? 'top' : 'weather';
    }

    function saveLocation(result) {
        const lastCityId = getNumber('cityId', -1);
        // console.log('saveLocation', lastCityId, result);
        const cityChanged = result.id !== lastCityId;
        if (cityChanged) {
            const cityName = result.name;
            const country = result.sys ? result.sys.country : undefined;
            cityId = result.id;
            city = cityName + (country ? `, ${country}` : '');
            setNumber('cityId', cityId);
            setString('cityLocation', `${result.coord.lat},${result.coord.lon}`);
            setString('city', city);
            refreshWeather();
        }
    }

    async function searchCity() {
        clog('searchCity');
        try {
            const result = await prompt({
                title: l('search_city'),
                // message: lc('change_glasses_name'),
                okButtonText: l('ok'),
                cancelButtonText: l('cancel'),
                autoFocus: true,
                textFieldProperties: {
                    marginLeft: 10,
                    marginRight: 10,
                    hint: l('name')
                }
            });
            clog('prompt city done ', result.result, result.text);
            if (result && !!result.result && result.text.length > 0) {
                const cities = await findCitiesByName(result.text);
                let selectedCity;
                if (cities.length > 0) {
                    const resultAction = await action(l('select'), l('cancel'), cities.map(c => c.name));
                    if (resultAction) {
                        selectedCity = cities.find(c => c.name === resultAction);
                    }
                } else {
                    selectedCity = cities[0];
                }
                if (selectedCity) {
                    saveLocation(selectedCity);
                }
            }
        } catch (err) {
            showError(err);
        }
    }

    async function getLocationAndWeather() {
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
            const location = await gps.getCurrentLocation({ timeout: 30000 });
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
        clog('refresh', cityId);
        if (cityId === -1) {
            getLocationAndWeather();
        } else {
            refreshWeather();
        }
    }

    onMount(() => {
        // clog('onMount', cityId);
        // preloadWeather();
        // preloadUVIndex();
        networkService.on('connection', refresh);
        networkService.start(); // should send connection event and then refresh
        // refresh();
        // updateLastUpdateTime();
    });

    // $: console.log('selectedTab', selectedTab);
</script>

<page xmlns="tns" class="page" actionBarHidden={true} bind:this={page} statusBarStyle="light" navigationBarColor={primaryColor} statusBarColor="#424242">
    <!-- <gridLayout> -->
    <!-- <scrollView> -->
    <gridLayout rows="200,*" backgroundColor="#424242">
        <!-- <CActionBar title="{city}">
            <button variant="flat" class="icon-btn" text="mdi-magnify"/>
            <button variant="flat" class="icon-btn" text="mdi-dots-vertical"  />
        </CActionBar>  -->
        <!-- <listView height="100%" {items} itemTemplateSelector={selectTemplate} backgroundColor="transparent"> -->
        <!-- <Template key="top" let:item> -->
        <gridLayout row="0" rows="auto,*" columns="*,auto">
            <CActionBar title={city} row="0" colSpan="2" backgroundColor="#424242">
                <button variant="flat" class="icon-btn" text="mdi-refresh" on:tap={refresh} />
                <button variant="flat" class="icon-btn" text="mdi-magnify" on:tap={searchCity} />
                <button variant="flat" class="icon-btn" text="mdi-dots-vertical" />
            </CActionBar>
            {#if todayWeather}
                <label row="1" fontSize="30" text={formatValueToUnit(todayWeather.main.temp, 'celcius')} color={tempColor} verticalAlignment="top" horizontalAlignment="left" />
                <label row="1" fontSize="14" verticalAlignment="center">
                    <span text="{l('min')}: {formatValueToUnit(todayWeather.main.temp_min, 'celcius')}{'\n'}" />
                    <span text="{l('max')}: {formatValueToUnit(todayWeather.main.temp_max, 'celcius')}{'\n'}" />
                </label>
                <WeatherIcon row="1" col="1" fontSize="120" style="vertical-alignment: center;" icon={todayWeather.weather[0].icon} {frontAlpha} />
            {/if}
        </gridLayout>

        <stackLayout row="1" backgroundColor="black">
            <tabs bind:selectedIndex={selectedTab}>
                <tabStrip backgroundColor="#424242" color="white" highlightColor="white">
                    <tabStripItem>
                        <label text={l('today')} />
                    </tabStripItem>
                    <tabStripItem>
                        <label text={l('tomorrow')} />
                    </tabStripItem>
                    <tabStripItem>
                        <label text={l('later')} />
                    </tabStripItem>
                </tabStrip>

                <tabContentItem>
                    <listView height="100%" rowHeight={120} items={longTermTodayWeather} backgroundColor="black">
                        <Template let:item>
                            <WeatherListItem {item} />
                        </Template>
                    </listView>
                </tabContentItem>
                <tabContentItem>
                    <listView height="100%" rowHeight={120} items={longTermTomorrowWeather} backgroundColor="black">
                        <Template let:item>
                            <WeatherListItem {item} />
                        </Template>
                    </listView>
                </tabContentItem>
                <tabContentItem>
                    <listView height="100%" rowHeight="120" items={longTermWeather} backgroundColor="black">
                        <Template let:item>
                            <WeatherListItem {item} />
                        </Template>
                    </listView>
                </tabContentItem>
            </tabs>
        </stackLayout>
        <activityIndicator row="0" busy={loading} verticalAlignment="center" horizontalAlignment="center" visibility={loading ? 'visible' : 'collapse'} />
    </gridLayout>
    <!-- </scrollView> -->
    <!-- </gridLayout> -->
    >
</page>
