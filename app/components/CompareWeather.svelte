<script lang="ts">
    import { CollectionViewWithSwipeMenu } from '@nativescript-community/ui-collectionview-swipemenu';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { Template } from 'svelte-native/components';
    import { NativeElementNode, NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { l, slc } from '~/helpers/locale';
    import { showError } from '~/utils/error';
    import { colors } from '~/variables';
    import ListItemAutoSize from './common/ListItemAutoSize.svelte';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService } from '~/services/api';
    import { onMount } from 'svelte';
    import { Page, View } from '@nativescript/core';
    import { CheckBox } from '@nativescript-community/ui-checkbox';

    $: ({ colorBackground, colorOnSurfaceVariant, colorSurface, colorError, colorOnError, colorPrimary } = $colors);

    export let weatherLocation: FavoriteLocation;

    const dataList = [];
    let page: NativeViewElementNode<Page>;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let loading = false;

    onMount(async () => {
        networkService.on(NetworkConnectionStateEvent, (event: NetworkConnectionStateEventData) => {
            try {
                if (networkConnected !== event.data.connected) {
                    networkConnected = event.data.connected;
                }
            } catch (error) {
                showError(error);
            }
        });
        networkService.start(); // should send connection event and then refresh
    });

    async function refreshWeather() {
        if (!weatherLocation) {
            showSnack({ message: l('no_location_set') });
            return;
        }
        if (!networkConnected) {
            showSnack({ message: l('no_network') });
            return;
        }
        loading = true;

        try {
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }
    async function onPullToRefresh() {
        try {
            await refresh();
        } catch (error) {
            showError(error);
        }
    }
    async function refresh() {
        if (!weatherLocation) {
            showSnack({ message: l('no_location_set') });
            return;
        }
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = true;
        }

        await refreshWeather();
        if (pullRefresh) {
            pullRefresh.nativeView.refreshing = false;
        }
    }

    let drawer: DrawerElement;
    let dataListCollectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
    function toggleDrawer() {
        drawer?.toggle();
    }

    let drawerOpened = false;
    function onDrawerStart() {
        drawerOpened = true;
    }

    function onDrawerClose() {
        drawerOpened = false;
        dataListCollectionView.nativeElement?.closeCurrentMenu();
    }

    let checkboxTapTimer;
    async function onTap(item, event) {
        try {
            if (item.type === 'checkbox' || item.type === 'switch') {
                // we dont want duplicate events so let s timeout and see if we clicking diretly on the checkbox
                const checkboxView: CheckBox = ((event.object as View).parent as View).getViewById('checkbox');
                checkboxTapTimer = setTimeout(() => {
                    checkboxView.checked = !checkboxView.checked;
                }, 10);
                return;
            }
        } catch (error) {
            showError(error);
        }
    }
    async function onCheckBox(item, event) {
        if (item.value === event.value) {
            return;
        }
        const value = event.value;
        item.value = value;
        if (checkboxTapTimer) {
            clearTimeout(checkboxTapTimer);
            checkboxTapTimer = null;
        }
        DEV_LOG && console.log('onCheckBox', item.id, value);
    }
</script>

<page bind:this={page} actionBarHidden={true}>
    <drawer
        bind:this={drawer}
        gestureHandlerOptions={{
            minDist: 50,
            failOffsetYStart: -40,
            failOffsetYEnd: 40
        }}
        leftSwipeDistance={50}
        on:close={onDrawerClose}
        on:start={onDrawerStart}>
        <gridlayout rows="auto,*" prop:mainContent>
            {#if !networkConnected}
                <label horizontalAlignment="center" row={1} text={l('no_network').toUpperCase()} verticalAlignment="middle" />
            {:else}
                <pullrefresh bind:this={pullRefresh} row={1} on:refresh={onPullToRefresh}>
                    <!-- <WeatherComponent {items} {weatherLocation} on:tap={onTap} /> -->
                </pullrefresh>
            {/if}
            <CActionBar onMenuIcon={toggleDrawer} showMenuIcon title={weatherLocation && weatherLocation.name}></CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={$slc('favorites')} />
            <collectionview bind:this={dataListCollectionView} id="favorite" items={dataList} row={1}>
                <Template key="sectionheader" let:item>
                    <label class="sectionHeader" text={item.title} />
                </Template>
                <Template key="switch" let:item>
                    <ListItemAutoSize fontSize={20} on:tap={(event) => onTap(item, event)}>
                        <switch id="checkbox" checked={item.value} col={2} marginLeft={10} on:checkedChange={(e) => onCheckBox(item, e)} ios:backgroundColor={colorPrimary} />
                    </ListItemAutoSize>
                </Template>
            </collectionview>
        </gridlayout>
    </drawer>
</page>
