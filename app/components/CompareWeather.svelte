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
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService, prepareItems } from '~/services/api';
    import { onMount } from 'svelte';
    import { Page, View } from '@nativescript/core';
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import { getProviderForType, getProviderType, providers } from '~/services/providers/weatherproviderfactory';
    import { ProviderType } from '~/services/providers/weather';
    import CompareLineChart from './CompareLineChart.svelte';

    $: ({ colorBackground, colorOnSurfaceVariant, colorSurface, colorError, colorOnError, colorPrimary } = $colors);

    const models = ['meteofrance', 'openweathermap', 'openmeteo'];

    const dataToCompare = [
        { id: 'temperature', type: 'linechart', forecast: 'hourly' },
        { id: 'temperatureMin', type: 'linechart', forecast: 'daily' }
    ];

    export let weatherLocation: FavoriteLocation;

    const dataList = providers.reduce((acc, val) => {
        const provider = getProviderForType(val);
        const models = provider.getModels();
        const keys = Object.keys(models);
        if (keys.length) {
            acc.push({
                type: 'sectionheader',
                id: provider.id,
                name: provider.getName(),
                shortName: provider.getName().replace(/[^A-Z]+/g, '')
            });
            for (let index = 0; index < keys.length; index++) {
                const key = keys[index];
                acc.push({
                    id: provider.id + ':' + key,
                    name: provider.getName() + ': ' + key,
                    shortName: provider.getName().replace(/[^A-Z]+/g, '') + ': ' + key
                });
            }
        } else {
            acc.push({
                id: provider.id,
                name: provider.getName(),
                shortName: provider.getName().replace(/[^A-Z]+/g, '')
            });
        }
        return acc;
    }, []);
    DEV_LOG && console.log('dataList', dataList);
    let page: NativeViewElementNode<Page>;
    let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let loading = false;
    let data = [];

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
        // networkService.start(); // should send connection event and then refresh
        networkConnected = networkService.connected;
        if (models.length && dataToCompare.length) {
            refreshWeather();
        }
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
        const now = Date.now();
        const weatherData = await Promise.all(
            models.map(async (model) => {
                const providerType = model.split(':')[0] as ProviderType;
                const provider = getProviderForType(providerType);
                const weatherData = await provider.getWeather(weatherLocation);
                const modelData = dataList.find((m) => m.id === model);
                DEV_LOG && console.log('modelData', model, modelData);
                return { weatherData, model: modelData as { id: string; name: string; shortName: string } };
                // return prepareItems(weatherLocation, weatherData, now);
            })
        );
        DEV_LOG && console.log('weatherData', weatherData.length);

        const newItems = [];
        for (let i = 0; i < dataToCompare.length; i++) {
            const d = dataToCompare[i];
            switch (d.type) {
                default:
                case 'linechart':
                    DEV_LOG && console.log('d', d);
                    newItems.push({
                        weatherData,
                        ...d
                    });
            }
        }
        data = newItems;

        try {
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }
    async function onPullToRefresh() {
        try {
            if (pullRefresh) {
                pullRefresh.nativeView.refreshing = false;
            }
            loading = true;
            await refreshWeather();
        } catch (error) {
            showError(error);
        } finally {
            loading = false;
        }
    }

    let drawer: DrawerElement;
    let dataListCollectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
    let collectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
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

    function isModelSelected(item) {
        return models.indexOf(item.id) !== -1;
    }

    function selectModelsTemplate(item, index, items) {
        if (item.type) {
            return item.type;
        }
        return 'default';
    }
    function selectDataTemplate(item, index, items) {
        if (item.type) {
            return item.type;
        }
        return 'linechart';
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
                    <collectionview bind:this={collectionView} id="data" itemTemplateSelector={selectDataTemplate} items={data}>
                        <Template key="linechart" let:item>
                            <CompareLineChart height={200} {item} startingSide={item.startingSide} />
                        </Template>
                    </collectionview>
                </pullrefresh>
            {/if}
            <CActionBar onMenuIcon={toggleDrawer} showMenuIcon title={weatherLocation && weatherLocation.name}></CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={$slc('favorites')} />
            <collectionview bind:this={dataListCollectionView} id="models" itemTemplateSelector={selectModelsTemplate} items={dataList} row={1}>
                <Template key="sectionheader" let:item>
                    <label class="sectionHeader" text={item.name} />
                </Template>
                <Template let:item>
                    <ListItemAutoSize
                        padding="0 16 0 16"
                        rows="50"
                        title={item.name}
                        titleProps={{
                            padding: 0
                        }}
                        on:tap={(event) => onTap(item, event)}>
                        <checkbox
                            boxType={item.boxType}
                            checked={isModelSelected(item)}
                            col={item.boxType === 'circle' ? 0 : 2}
                            ios:marginRight={10}
                            verticalAlignment="center"
                            on:checkedChange={(e) => onCheckBox(item, e)} />
                    </ListItemAutoSize>
                </Template>
            </collectionview>
        </gridlayout>
    </drawer>
</page>
