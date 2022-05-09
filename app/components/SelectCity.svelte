<script lang="ts">
    import { Page,TextField } from '@nativescript/core';
    import { closeModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/CActionBar.svelte';
    import { lc } from '~/helpers/locale';
    import { photonSearch, WeatherLocation } from '~/services/api';
    import { showError } from '~/utils/error';
    import { textColor,textLightColor } from '~/variables';

    let textField: NativeViewElementNode<TextField>;
    let loading = false;
    let searchResults: WeatherLocation[] = [];
    let searchAsTypeTimer: NodeJS.Timeout;
    let currentSearchText: string;

    function focus() {
        textField && textField.nativeView.requestFocus();
        // alert('test')
    }
    function unfocus() {
        clearSearchTimeout();
    }
    function onTextChange(e) {
        const query = e.value;
        clearSearchTimeout();

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
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    function clearSearchTimeout() {
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
    }

    function close(item) {
        clearSearchTimeout();
        closeModal(item);
    }
    // onMount(() => {
    //     focus();
    // });
    function onNavigatingTo(e) {
        // console.log('onNavigatingTo', page && page.nativeView, e.object);
    }
</script>

<frame backgroundColor="transparent">
    <page actionBarHidden={true} on:navigatingTo={onNavigatingTo}>
        <gridLayout rows="auto,auto,*">
            <CActionBar title={lc('search_city')} modalWindow>
                <activityIndicator busy={loading} verticalAlignment="center" visibility={loading ? 'visible' : 'collapsed'} />
            </CActionBar>
            <textfield bind:this={textField} row={1} hint={lc('search')} floating="false" returnKeyType="search" on:textChange={onTextChange} on:loaded={focus} color={$textColor} />
            <collectionview row={2} rowHeight={80} items={searchResults}>
                <Template let:item>
                    <gridLayout rippleColor="#aaa" on:tap={() => close(item)} columns="*" padding="10">
                        <gridLayout col={1} paddingLeft={10} verticalAlignment="center" rows="auto,auto,auto">
                            <label fontSize={18} text={item.name} />
                            <label row={1} color={$textLightColor} fontSize={14} text={item.sys.state || item.sys.country} />
                            <label row={2} color={$textLightColor} fontSize={14} text={item.sys.state ? item.sys.country : ''} />
                        </gridLayout>
                        <!-- <label fontSize={10} verticalAlignment="center" text={JSON.stringify(item.sys)} /> -->
                    </gridLayout>
                </Template>
            </collectionview>
        </gridLayout>
    </page>
</frame>
