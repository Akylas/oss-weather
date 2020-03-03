<script>
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

    import { darkColor, primaryColor, textLightColor } from '~/variables';
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

    function focus() {
        textField && textField.nativeView.requestFocus();
        // alert('test')
    }
    function unfocus() {
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
    }
    let hasFocus = false;
    let currentSearchText;
    function onFocus(e) {
        hasFocus = true;
        if (currentSearchText && searchResultsCount === 0) {
            searchCity(this.currentSearchText);
        }
    }
    function onBlur(e) {
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
            // console.log('searchResults', JSON.stringify(searchResults));
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

<frame backgroundColor="transparent">
    <page actionBarHidden="true">
        <gridLayout rows="auto,auto,*">
            <CActionBar title={l('search_city')} modalWindow={true}>
                <activityIndicator color="white" busy={loading} verticalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
            </CActionBar>
            <textfield bind:this={textField} row="1" hint="Search" placeholder="search" floating="false" returnKeyType="search" on:textChange={onTextChange} on:loaded={focus} />
            <collectionview row="2" rowHeight="110" items={searchResults}>
                <Template let:item>
                    <gridLayout rippleColor="#aaa" on:tap={() => close(item)} columns="130,*" padding="10">
                        <MapView focusPos={item.coord} />
                        <gridLayout col="1" paddingLeft="10" verticalAlignment="center" rows="auto,auto,auto">
                            <label fontSize="18" text={item.name} />
                            <label row="1" color={textLightColor} fontSize="14" text={item.sys.state || item.sys.country} />
                            <label row="2" color={textLightColor} fontSize="14" text={item.sys.state ? item.sys.country : ''} />
                        </gridLayout>
                        <!-- <label fontSize="10" verticalAlignment="center" text={JSON.stringify(item.sys)} /> -->
                    </gridLayout>
                </Template>
            </collectionview>
        </gridLayout>
    </page>
</frame>
