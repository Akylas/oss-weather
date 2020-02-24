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
    import { l } from '~/helpers/locale';
    import { closeModal, goBack } from 'svelte-native';

    import { darkColor, primaryColor } from '~/variables';
    import { layout } from '@nativescript/core/utils/utils';
    // @ts-ignore
    import CActionBar from './CActionBar.svelte';
    // @ts-ignore
    import MapView from './MapView.svelte';
    // @ts-ignore

    let page;
    let collectionView;
    let textField;
    let loading = false;
    let searchResults = [];
    let searchAsTypeTimer;
    // let cityId = getNumber('cityId', -1);

    function focus() {
        console.log('focus', !!textField);
        textField && textField.nativeView.requestFocus();
        // alert('test')
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
            console.log('searchResults', JSON.stringify(searchResults.map(r => [r.name, r.sys.osm_key, r.sys.osm_value])));
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

    function close(item) {
        clearTimeout(searchAsTypeTimer);
        closeModal(item);
    }

    // onMount(() => {
    //     focus();
    // });
</script>

<frame>
    <page actionBarHidden="true">
        <gridLayout rows="auto,auto,*">
            <CActionBar title={l('search_city')} modalWindow={true}>
                <activityIndicator color="white" busy={loading} verticalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
            </CActionBar>
            <textfield bind:this={textField} row="1" hint="Search" placeholder="search" floating="false" returnKeyType="search" on:textChange={onTextChange} on:loaded={focus} />
            <collectionview row="2" rowHeight="110" items={searchResults}>
                <Template let:item>
                    <gridLayout rippleColor="#aaa" on:tap={() => close(item)} height="200" columns="130,*" padding="10">
                        <MapView focusPos={item.coord} />
                        <label col="1" paddingLeft="10" fontSize="18" verticalAlignment="center" text={item.name} />
                        <!-- <label fontSize="14" verticalAlignment="center" text={JSON.stringify(item.coord)} /> -->
                        <!-- <label fontSize="10" verticalAlignment="center" text={JSON.stringify(item.sys)} /> -->
                    </gridLayout>
                </Template>
            </collectionview>
        </gridLayout>
    </page>
</frame>
