<script lang="ts">
    import { ObservableArray, TextField } from '@nativescript/core';
    import { closeModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/CActionBar.svelte';
    import type { FavoriteLocation } from '~/helpers/favorites';
    import { favoriteIcon, favoriteIconColor, isFavorite, toggleFavorite } from '~/helpers/favorites';
    import { lc } from '~/helpers/locale';
    import { photonSearch } from '~/services/api';
    import { showError } from '~/utils/error';
    import { textLightColor } from '~/variables';

    let textField: NativeViewElementNode<TextField>;
    let loading = false;
    let searchResults: ObservableArray<FavoriteLocation> = new ObservableArray();
    let searchAsTypeTimer: NodeJS.Timeout;
    let currentSearchText: string;

    function focus() {
        textField && textField.nativeView.requestFocus();
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
            searchResults = new ObservableArray((await photonSearch(query)).map((s) => ({ ...s, isFavorite: isFavorite(s) })));
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

    function close(item: FavoriteLocation) {
        clearSearchTimeout();
        closeModal(item);
    }
    let firstLayout = true;
    function onLayoutChange(e) {
        if (firstLayout) {
            firstLayout = false;
            // we need to wait a bit before requesting focus or the keyboard wont show on android
            setTimeout(() => {
                focus();
            }, 100);
        }
    }
    function toggleItemFavorite(item: FavoriteLocation) {
        try {
            item = toggleFavorite(item);
            const index = searchResults.findIndex((s) => s.coord.lat === item.coord.lat && s.coord.lon === item.coord.lon);
            if (index > -1) {
                searchResults.setItem(index, item);
            }
        } catch (error) {
            showError(error);
        }
    }
</script>

<!-- <frame backgroundColor="transparent"> -->
<page actionBarHidden={true} on:layoutChanged={onLayoutChange}>
    <gridlayout rows="auto,auto,*">
        <CActionBar title={lc('search_city')} modalWindow>
            <activityIndicator busy={loading} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapsed'} />
        </CActionBar>
        <textfield bind:this={textField} row={1} hint={lc('search')} floating="false" returnKeyType="search" on:textChange={onTextChange} />
        <collectionview row={2} rowHeight={80} items={searchResults}>
            <Template let:item>
                <gridlayout col={1} paddingLeft={10} verticalAlignment="middle" rows="auto,*" rippleColor="#aaa" on:tap={() => close(item)} columns="*,auto" padding="10">
                    <label fontSize={18} text={item.name} maxLines={1} lineBreak="end" />
                    <label row={1} fontSize={14} color={$textLightColor}>
                        <span text={item.sys.state || item.sys.country} />
                        <span visibility={item.sys.postcode ? 'visible' : 'hidden'} text={' (' + item.sys.postcode + ')'} />
                        <span visibility={item.sys.state ? 'visible' : 'hidden'} text={'\n' + item.sys.country} />
                    </label>
                    <mdbutton
                        col={1}
                        rowSpan={2}
                        variant="text"
                        class="icon-btn"
                        color={favoriteIconColor(item)}
                        rippleColor="#EFB644"
                        on:tap={() => toggleItemFavorite(item)}
                        text={favoriteIcon(item)}
                    />
                </gridlayout>
            </Template>
        </collectionview>
    </gridlayout>
</page>
<!-- </frame> -->
