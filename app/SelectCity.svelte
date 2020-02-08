<script>
    /// <reference path="../references.d.ts" />

    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { action, alert, confirm, prompt } from 'nativescript-material-dialogs';
    import { clog, DEV_LOG } from '~/utils/logging';
    import { photonSearch } from '~/services/api';
    import { Page } from '@nativescript/core/ui/page';
    import { localize as l } from '~/helpers/formatter';
    import { closeModal, goBack } from 'svelte-native';

    import { darkColor, primaryColor } from '~/variables';
    import { layout } from '@nativescript/core/utils/utils';
    // @ts-ignore
    import CActionBar from './CActionBar.svelte';
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    // @ts-ignore

    let page;
    let collectionView;
    let textField;
    let loading = false;
    let searchResults = [];
    let searchAsTypeTimer;
    // let cityId = getNumber('cityId', -1);

    function saveLocation(result) {
        const lastLat = getNumber('cityLat', -1);
        const lastLon = getNumber('cityLon', -1);
        // console.log('saveLocation', lastCityId, result);
        const cityChanged = result.coord.lat !== lastLat || result.coord.lon !== lastLon;
        if (cityChanged) {
            const cityName = result.name;
            const country = result.sys ? result.sys.country : undefined;
            // cityId = result.id;
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

    function focus() {
        // textField.requestFocus();
    }
    function unfocus() {
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
        // if (gVars.isAndroid) {
        //     textField.nativeViewProtected.clearFocus();
        // }
        // textField.dismissSoftInput();
    }
    let hasFocus = false;
    let currentSearchText;
    function onFocus(e) {
        // clog('onFocus');
        hasFocus = true;
        if (currentSearchText && searchResultsCount === 0) {
            searchCity(this.currentSearchText);
        }
    }
    function onBlur(e) {
        // clog('onBlur');
        hasFocus = false;
    }
    function onTextChange(e) {
        const query = e.value;
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
        if (query && query.length > 2) {
            searchAsTypeTimer = setTimeout(() => {
                searchAsTypeTimer = null;
                searchCity(query);
            }, 500);
        } else if (currentSearchText && currentSearchText.length > 2) {
            unfocus();
        }
        currentSearchText = query;
    }

    async function searchCity(query) {
        try {
            loading = true;
            searchResults = await photonSearch(query);
            console.log('searchResults', searchResults);
            // let selectedCity;
            // if (cities.length > 0) {
            //     const resultAction = await action(l('select'), l('cancel'), cities.map(c => c.name));
            //     if (resultAction) {
            //         selectedCity = cities.find(c => c.name === resultAction);
            //     }
            // } else {
            //     selectedCity = cities[0];
            // }
            // if (selectedCity) {
            //     saveLocation(selectedCity);
            // }
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        focus();
    });
</script>

<page xmlns="tns" class="page" actionBarHidden={true} bind:this={page} statusBarStyle="dark" navigationBarColor="black" statusBarColor="#424242" backgroundColor="#424242">
    <gridLayout rows="auto,auto,*">
        <CActionBar title={l('search_city')} modalWindow={true} />
        <textfield row="1" bind:this={textField} hint="Search" placeholder="search" returnKeyType="search" on:focus={onFocus} on:blur={onBlur} on:textChange={onTextChange} />
        <collectionview row="2" rowHeight="90" bind:this={collectionView} items={searchResults}>
            <Template let:item>
                <stackLayout rippleColor="white" on:tap={closeModal(item)}>
                    <label fontSize="18" verticalAlignment="center" text={item.name} />
                    <label fontSize="14" verticalAlignment="center" text={JSON.stringify(item.coord)} />
                    <label fontSize="10" verticalAlignment="center" text={JSON.stringify(item.sys)} />
                </stackLayout>
            </Template>
        </collectionview>
    </gridLayout>
</page>
