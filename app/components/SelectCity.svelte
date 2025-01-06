<script lang="ts">
    import { ObservableArray, TextField } from '@nativescript/core';
    import { showError } from '@shared/utils/showError';
    import { closeModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import type { FavoriteLocation } from '~/helpers/favorites';
    import { favoriteIcon, favoriteIconColor, isFavorite, toggleFavorite } from '~/helpers/favorites';
    import { getLocationName } from '~/helpers/formatter';
    import { lc } from '~/helpers/locale';
    import { photonSearch } from '~/services/api';
    import { actionBarButtonHeight, colors, windowInset } from '~/variables';
    import ListItemAutoSize from './common/ListItemAutoSize.svelte';

    // let { colorOnSurfaceVariant } = $colors;
    // $: ({ colorOnSurfaceVariant } = $colors);

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
                searchCity();
            }, 500);
        } else if (currentSearchText && currentSearchText.length > 2) {
            unfocus();
        }
        currentSearchText = query;
    }

    async function searchCity() {
        try {
            clearSearchTimeout();
            if (!currentSearchText) {
                return;
            }
            loading = true;
            searchResults = new ObservableArray((await photonSearch(currentSearchText)).map((s) => ({ ...s, isFavorite: isFavorite(s) })));
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
    async function toggleItemFavorite(item: FavoriteLocation) {
        try {
            item = await toggleFavorite(item);
            const index = searchResults.findIndex((s) => s.coord.lat === item.coord.lat && s.coord.lon === item.coord.lon);
            if (index > -1) {
                searchResults.setItem(index, item);
            }
        } catch (error) {
            showError(error);
        }
    }

    function getItem(item) {
        const data = [];
        if (item.sys.state) {
            data.push(item.sys.state);
        }
        if (item.sys.country) {
            data.push(item.sys.country);
        }
        return {
            title: getLocationName(item),
            subtitle: data.join('\n')
        };
    }
</script>

<!-- <frame backgroundColor="transparent"> -->
<page actionBarHidden={true}>
    <gridlayout paddingLeft={$windowInset.left} paddingRight={$windowInset.right} rows="auto,auto,*" on:layoutChanged={onLayoutChange}>
        <CActionBar modalWindow title={lc('search_city')}>
            <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapse'} width={$actionBarButtonHeight} />
        </CActionBar>
        <textfield bind:this={textField} floating="false" hint={lc('search')} returnKeyType="search" row={1} on:textChange={onTextChange} on:returnPress={searchCity} />
        <collectionview items={searchResults} paddingBottom={$windowInset.bottom} row={2}>
            <Template let:item>
                <ListItemAutoSize disableCss={false} item={getItem(item)} on:tap={() => close(item)}>
                    <mdbutton
                        class="icon-btn"
                        col={2}
                        color={favoriteIconColor(item)}
                        rippleColor="#EFB644"
                        text={favoriteIcon(item)}
                        variant="text"
                        verticalAlignment="top"
                        on:tap={() => toggleItemFavorite(item)} />
                </ListItemAutoSize>
                <!-- <gridlayout col={1} columns="*,auto" padding="10" paddingLeft={10} rippleColor="#aaa" rows="auto,*" verticalAlignment="middle" on:tap={() => close(item)}>
                    <label fontSize={18} lineBreak="end" maxLines={1} text={item.name} />
                    <label color={colorOnSurfaceVariant} fontSize={14} row={1}>
                        <cspan text={item.sys.state || item.sys.country} />
                        <cspan text={' (' + item.sys.postcode + ')'} visibility={item.sys.postcode ? 'visible' : 'hidden'} />
                        <cspan text={'\n' + item.sys.country} visibility={item.sys.state ? 'visible' : 'hidden'} />
                    </label>
                </gridlayout> -->
            </Template>
        </collectionview>
    </gridlayout>
</page>
<!-- </frame> -->
