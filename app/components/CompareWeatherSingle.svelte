<script lang="ts">
    import { CollectionViewWithSwipeMenu } from '@nativescript-community/ui-collectionview-swipemenu';
    import DrawerElement from '@nativescript-community/ui-drawer/svelte';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { Template } from 'svelte-native/components';
    import { NativeElementNode, NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { l, lc, slc } from '~/helpers/locale';
    import { showError } from '~/utils/error';
    import { actionBarButtonHeight, colors } from '~/variables';
    import ListItemAutoSize from './common/ListItemAutoSize.svelte';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, networkService, prepareItems } from '~/services/api';
    import { onMount } from 'svelte';
    import { ApplicationSettings, NavigatedData, ObservableArray, Page, View } from '@nativescript/core';
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import { getProviderForType, getProviderType, providers } from '~/services/providers/weatherproviderfactory';
    import { ProviderType } from '~/services/providers/weather';
    import CompareLineChart from './CompareLineChart.svelte';
    import toColor from '@mapbox/to-color';
    import { AVAILABLE_COMPARE_WEATHER_DATA, AVAILABLE_WEATHER_DATA, WeatherProps, getWeatherDataIcon, getWeatherDataTitle } from '~/services/weatherData';
    import CompareWeatherIcons from './CompareWeatherIcons.svelte';
    import ListItem from './common/ListItem.svelte';

    $: ({ colorBackground, colorOnSurfaceVariant, colorSurface, colorError, colorOnError, colorPrimary } = $colors);

    const models: string[] = JSON.parse(ApplicationSettings.getString('compare_models', '["meteofrance", "openweathermap", "openmeteo:best_match"]'));
    let dataToCompare: any = JSON.parse(ApplicationSettings.getString('compare_data_single', '{"id":"temperature","type":"linechart","forecast":"hourly"}'));

    const CHART_TYPE = {
        [WeatherProps.iconId]: 'weathericons',
        // [WeatherProps.windSpeed]: 'scatterchart',
        // [WeatherProps.windGust]: 'scatterchart',
        [WeatherProps.cloudCover]: 'scatterchart',
        [WeatherProps.windBearing]: 'scatterchart'
    };

    const possibleDatas = new ObservableArray(
        AVAILABLE_COMPARE_WEATHER_DATA.map((k) => ({
            id: k,
            type: CHART_TYPE[k] || 'linechart',
            title: getWeatherDataTitle(k),
            icon: getWeatherDataIcon(k),
            dailySelected: dataToCompare.id === k && dataToCompare.forecast === 'daily',
            hourlySelected: dataToCompare.id === k && dataToCompare.forecast === 'hourly'
        }))
    );

    export let weatherLocation: FavoriteLocation;
    let providerColors = {};

    interface Model {
        id: string;
        title: string;
        subtitle?: string;
        name: string;
        color: string;
        shortName: string;
    }

    function updateColors(args = { saturation: 3, brightness: 0.8 }) {
        providerColors = {};
        modelsList.forEach((model) => {
            const provider = model.id.split(':')[0];
            let colorGenerator = providerColors[provider];
            if (!colorGenerator) {
                colorGenerator = providerColors[provider] = new toColor(provider, args);
            }
        });
        modelsCollectionView?.nativeElement.refreshVisibleItems();
    }

    const modelsList = new ObservableArray<Model>(
        providers.reduce((acc, val) => {
            const provider = getProviderForType(val);
            const models = provider.getModels();
            const keys = Object.keys(models);

            let colorGenerator = providerColors[val];
            if (!colorGenerator) {
                colorGenerator = providerColors[val] = new toColor(val, { saturation: 3, brightness: 0.8 });
            }
            if (keys.length) {
                // acc.push({
                //     type: 'sectionheader',
                //     id: provider.id,
                //     name: provider.getName(),
                //     // color: colorGenerator.getColor().hsl.formatted,
                //     shortName: provider.getName().replace(/[^A-Z]+/g, '')
                // });
                for (let index = 0; index < keys.length; index++) {
                    const key = keys[index];
                    acc.push({
                        id: provider.id + ':' + key,
                        title: provider.getName(),
                        subtitle: key,
                        name: provider.getName() + ': ' + key,
                        color: colorGenerator.getColor().hsl.formatted,
                        shortName: provider.getName().replace(/[^A-Z]+/g, '') + ': ' + key
                    } as Model);
                }
            } else {
                acc.push({
                    id: provider.id,
                    name: provider.getName(),
                    color: colorGenerator.getColor().hsl.formatted,
                    shortName: provider.getName().replace(/[^A-Z]+/g, '')
                } as Model);
            }
            return acc;
        }, [])
    );
    let page: NativeViewElementNode<Page>;
    // let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let networkConnected = networkService.connected;
    let loading = true;
    let currentItem;

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
    });

    async function refreshData() {
        try {
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
                    const data = model.split(':');
                    const providerType = data[0] as ProviderType;
                    const provider = getProviderForType(providerType);
                    // TODO: for Open-Meteo make a single request for all models
                    const weatherData = await provider.getWeather(weatherLocation, { minutely: false, current: false, warnings: false, forceModel: true, model: data[1] });
                    const modelData = modelsList.find((m) => m.id === model);
                    // DEV_LOG && console.log('modelData', model, modelData);
                    return { weatherData, model: modelData as { id: string; name: string; shortName: string } };
                    // return prepareItems(weatherLocation, weatherData, now);
                })
            );

            currentItem = {
                weatherData,
                chartType: dataToCompare.type,
                timestamp: now,
                hidden: [],
                ...dataToCompare
            };
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }
    // async function onPullToRefresh() {
    //     try {
    //         if (pullRefresh) {
    //             pullRefresh.nativeView.refreshing = false;
    //         }
    //         loading = true;
    //         await refreshData();
    //     } catch (error) {
    //         showError(error);
    //     } finally {
    //         loading = false;
    //     }
    // }

    let drawer: DrawerElement;
    let modelsCollectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
    let dataCollectionView: NativeElementNode<CollectionViewWithSwipeMenu>;
    function toggleLeftDrawer() {
        drawer?.toggle('left');
    }
    function toggleRightDrawer() {
        drawer?.toggle('right');
    }

    let drawerOpened = false;
    function onDrawerStart() {
        drawerOpened = true;
    }

    function onDrawerClose() {
        drawerOpened = false;
        modelsCollectionView.nativeElement?.closeCurrentMenu();
    }

    let checkboxTapTimer;
    async function onModelTap(item, event) {
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
    async function onModelCheckBox(item: Model, event) {
        // if (item.value === event.value) {
        //     return;
        // }
        const value = event.value;
        // item.value = value;
        if (checkboxTapTimer) {
            clearTimeout(checkboxTapTimer);
            checkboxTapTimer = null;
        }
        if (value) {
            models.push(item.id);
        } else {
            const index = models.indexOf(item.id);
            if (index >= 0) {
                models.splice(index, 1);
            }
        }
        ApplicationSettings.setString('compare_models', JSON.stringify(models));
    }
    async function onDataCheckBox(forecast: string, item, event) {
        const value = event.value;
        if (value) {
            const currentlySelectedIndex = possibleDatas.findIndex((d) => d.id === dataToCompare.id);
            const index = possibleDatas.findIndex((d) => d.id === item.id);
            if (index !== currentlySelectedIndex && currentlySelectedIndex !== -1) {
                possibleDatas.setItem(currentlySelectedIndex, { ...possibleDatas.getItem(currentlySelectedIndex), dailySelected: false, hourlySelected: false });
            }
            DEV_LOG && console.log('onDataCheckBox1', forecast, item.id, value, currentlySelectedIndex, JSON.stringify(dataToCompare));
            dataToCompare = { ...item, forecast };
            if (forecast === 'hourly') {
                item.hourlySelected = true;
                item.dailySelected = false;
            } else {
                item.hourlySelected = false;
                item.dailySelected = true;
            }
            if (index !== -1) {
                possibleDatas.setItem(index, item);
            }

            DEV_LOG && console.log('onDataCheckBox', forecast, item.id, value, currentlySelectedIndex, JSON.stringify(dataToCompare));
            ApplicationSettings.setString('compare_data_single', JSON.stringify(dataToCompare));
            refreshData();
        } else {
            event.object.checked = true;
        }
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

    function onNavigatedTo(args: NavigatedData): void {
        if (models.length && dataToCompare) {
            refreshData();
        }
    }
</script>

<page bind:this={page} actionBarHidden={true} on:navigatedTo={onNavigatedTo}>
    <drawer
        bind:this={drawer}
        gestureHandlerOptions={{
            minDist: 50,
            failOffsetYStart: -40,
            failOffsetYEnd: 40
        }}
        leftClosedDrawerAllowDraging={false}
        rightClosedDrawerAllowDraging={false}
        on:close={onDrawerClose}
        on:start={onDrawerStart}>
        <gridlayout rows="auto,*" prop:mainContent>
            {#if !networkConnected}
                <label horizontalAlignment="center" row={1} text={l('no_network').toUpperCase()} verticalAlignment="middle" />
            {:else if currentItem}
                <CompareLineChart item={currentItem} row={1} visibility={currentItem?.chartType === 'weathericons' ? 'hidden' : 'visible'} />
                <CompareWeatherIcons item={currentItem} row={1} visibility={currentItem?.chartType === 'weathericons' ? 'visible' : 'hidden'} />
            {:else}
                <mdbutton horizontalAlignment="center" row={1} text={lc('select_data')} variant="text" verticalAlignment="middle" on:tap={toggleRightDrawer} />
            {/if}
            <CActionBar showMenuIcon title={weatherLocation && weatherLocation.name}>
                <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapse'} width={$actionBarButtonHeight} />
                <mdbutton class="actionBarButton" text="mdi-layers-triple" variant="text" verticalAlignment="middle" on:tap={toggleLeftDrawer} />
                <mdbutton class="actionBarButton" text="mdi-sun-thermometer-outline" variant="text" verticalAlignment="middle" on:tap={toggleRightDrawer} />
            </CActionBar>
        </gridlayout>
        <gridlayout prop:leftDrawer class="drawer" rows="auto,*,auto" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={$slc('models')} />
            <collectionview bind:this={modelsCollectionView} id="models" itemTemplateSelector={selectModelsTemplate} items={modelsList} row={1}>
                <Template key="sectionheader" let:item>
                    <label class="sectionHeader" text={item.name} />
                </Template>
                <Template let:item>
                    <ListItem
                        borderLeftColor={item.color}
                        borderLeftWidth={6}
                        color={item.color}
                        columns="*,auto"
                        fontWeight="normal"
                        padding="0 0 0 10"
                        paddingLeft={0}
                        paddingRight={0}
                        rows="50"
                        subtitle={item.subtitle || null}
                        subtitleColor={item.color}
                        title={item.title || item.name}
                        titleProps={{
                            paddingTop: 0,
                            paddingBottom: 0
                        }}
                        on:tap={(event) => onModelTap(item, event)}>
                        <checkbox
                            id="checkbox"
                            checked={isModelSelected(item)}
                            col={1}
                            ios:marginRight={10}
                            color={item.color}
                            fillColor={item.color}
                            verticalAlignment="center"
                            on:checkedChange={(e) => onModelCheckBox(item, e)} />
                    </ListItem>
                </Template>
            </collectionview>
            <mdbutton row={2} text={lc('refresh')} on:tap={refreshData} />
        </gridlayout>
        <gridlayout prop:rightDrawer class="drawer" rows="auto,*,auto" width="300">
            <label class="actionBarTitle" margin="20 20 20 20" text={$slc('data')} />
            <collectionview bind:this={dataCollectionView} id="data" items={possibleDatas} row={1}>
                <Template key="sectionheader" let:item>
                    <label class="sectionHeader" text={item.name} />
                </Template>
                <Template let:item>
                    <ListItem
                        columns="*,auto,auto"
                        fontWeight="normal"
                        mainCol={0}
                        padding="0 0 0 16"
                        rows="50"
                        subtitle={item.subtitle || null}
                        title={item.title || item.name}
                        titleProps={{
                            paddingTop: 0,
                            paddingBottom: 0
                        }}>
                        <checkbox checked={item.hourlySelected} col={1} ios:marginRight={10} verticalAlignment="center" on:checkedChange={(e) => onDataCheckBox('hourly', item, e)} />
                        <checkbox checked={item.dailySelected} col={2} ios:marginRight={10} verticalAlignment="center" on:checkedChange={(e) => onDataCheckBox('daily', item, e)} />
                    </ListItem>
                </Template>
            </collectionview>
            <!-- <mdbutton row={2} text={lc('refresh')} on:tap={refreshData} /> -->
        </gridlayout>
    </drawer>
</page>
