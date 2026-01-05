<script context="module" lang="ts">
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { ApplicationSettings, ObservableArray, Screen, View } from '@nativescript/core';
    import { showError } from '@shared/utils/showError';
    import { showModal } from '@shared/utils/svelte/ui';
    import { onMount } from 'svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import ListItemAutoSize from '~/components/common/ListItemAutoSize.svelte';
    import { lc } from '~/helpers/locale';
    import { WeatherLocation } from '~/services/api';
    import { OpenMeteoModels } from '~/services/providers/om';
    import { getProviderType, providers } from '~/services/providers/weatherproviderfactory';
    import { widgetService } from '~/services/widgets/WidgetBridge';
    import { WidgetConfigManager } from '~/services/widgets/WidgetConfigManager';
    import { isDefaultLocation } from '~/services/widgets/WidgetDataManager';
    import { DEFAULT_UPDATE_FREQUENCY, WeatherWidgetData, WidgetConfig } from '~/services/widgets/WidgetTypes';
    import { hideLoading, selectValue, showPopoverMenu } from '~/utils/ui';
    import { actionBarHeight, colors, fontScale, fonts, onFontScaleChanged, windowInset } from '~/variables';

    // Import generated widget components
    import SimpleWeatherWidgetView from '~/components/widgets/generated/SimpleWeatherWidgetView.generated.svelte';
    import SimpleWeatherWithDateWidgetView from '~/components/widgets/generated/SimpleWeatherWithDateWidgetView.generated.svelte';
    import SimpleWeatherWithClockWidgetView from '~/components/widgets/generated/SimpleWeatherWithClockWidgetView.generated.svelte';
    import HourlyWeatherWidgetView from '~/components/widgets/generated/HourlyWeatherWidgetView.generated.svelte';
    import DailyWeatherWidgetView from '~/components/widgets/generated/DailyWeatherWidgetView.generated.svelte';
    import ForecastWeatherWidgetView from '~/components/widgets/generated/ForecastWeatherWidgetView.generated.svelte';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { closePopover } from '@nativescript-community/ui-popover/svelte';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { onThemeChanged } from '~/helpers/theme';
    import { Template } from 'svelte-native/components';
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import IconButton from '@shared/components/IconButton.svelte';

    // Map widget classes to components
    const widgetComponents = {
        SimpleWeatherWidget: SimpleWeatherWidgetView,
        SimpleWeatherWithDateWidget: SimpleWeatherWithDateWidgetView,
        SimpleWeatherWithClockWidget: SimpleWeatherWithClockWidgetView,
        HourlyWeatherWidget: HourlyWeatherWidgetView,
        DailyWeatherWidget: DailyWeatherWidgetView,
        ForecastWeatherWidget: ForecastWeatherWidgetView
    };

    // Load sample data helper
    async function loadWidgetSample(widgetClass: string, setName: string = 'default'): Promise<WeatherWidgetData> {
        try {
            const sampleData = (await import(`/widget-layouts/widgets/samples/${widgetClass}.sample.json`)).default;
            return sampleData[setName] || sampleData.default || null;
        } catch (error) {
            console.error(`Failed to load sample for ${widgetClass}:`, error, error.stack);
            return null;
        }
    }
    // Load sample data helper
    async function loadWidgetData(widgetClass: string): Promise<any> {
        const data = (await import(`/widget-layouts/widgets/${widgetClass}.json`)).default;
        return data;
    }
</script>

<script lang="ts">
    let { colorOnBackground, colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors;
    $: ({ colorOnBackground, colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors);

    // Props
    export let widgetClass: string = '';
    export let widgetId: string = '';
    export let modalMode: boolean = false;
    export let isKindConfig: boolean = false; // true for per-kind config, false for per-instance

    let collectionView: NativeViewElementNode<CollectionView>;

    // State
    let config: WidgetConfig = null;
    // let updateFrequency: number = DEFAULT_UPDATE_FREQUENCY;
    let previewData: WeatherWidgetData = null;
    let previewConfig: { name: string; displayName: string; description: string; supportedSizes: { width: number; height: number; family: string }[] } = null;
    let previewSet: string = 'default';
    let previewSize: { width: number; height: number; family: string } = null;

    // Widget kind display names
    const widgetKindNames = {
        SimpleWeatherWidget: lc('widget.simple.name'),
        SimpleWeatherWithDateWidget: lc('widget.withdate.name'),
        SimpleWeatherWithClockWidget: lc('widget.withclock.name'),
        HourlyWeatherWidget: lc('widget.hourly.name'),
        DailyWeatherWidget: lc('widget.daily.name'),
        ForecastWeatherWidget: lc('widget.forecast.name')
    };

    function getWidgetTitle(): string {
        if (widgetClass && widgetKindNames[widgetClass]) {
            const baseName = widgetKindNames[widgetClass];
            if (isKindConfig) {
                return `${baseName} - ${lc('default_settings')}`;
            } else if (widgetId) {
                return `${baseName} #${widgetId}`;
            }
            return baseName;
        }
        if (widgetId) {
            return `${lc('widget')} #${widgetId}`;
        }
        return lc('widget_settings');
    }

    onMount(async () => {
        loadConfig();
        // updateFrequency = WidgetConfigManager.getUpdateFrequency();
        // Load initial preview data
        if (widgetClass) {
            previewData = await loadWidgetSample(widgetClass, previewSet);
            previewConfig = await loadWidgetData(widgetClass);
            previewSize = previewConfig.supportedSizes[0];
        }
    });

    function loadConfig() {
        if (isKindConfig) {
            // Load per-kind default config
            config = WidgetConfigManager.getKindConfig(widgetClass);
        } else if (widgetId) {
            // Load per-instance config
            config = WidgetConfigManager.getConfig(widgetId);
        }
    }

    function saveConfig() {
        if (isKindConfig) {
            // Save per-kind default config
            WidgetConfigManager.saveKindConfig(widgetClass, config);
            showSnack({ message: lc('widget_kind_config_saved') });
        } else if (widgetId) {
            // Save per-instance config
            WidgetConfigManager.saveConfig(widgetId, config, widgetClass);
            showSnack({ message: lc('widget_config_saved') });

            // Trigger widget update
            widgetService.updateWidget(widgetId);
        }
    }

    async function selectLocation(item) {
        const SelectCity = (await import('~/components/SelectCity.svelte')).default;
        const result: WeatherLocation = await showModal({
            page: SelectCity,
            fullscreen: true,
            props: {}
        });
        if (result) {
            config.locationName = result.name || result.sys?.name || 'Selected';
            config.latitude = result.coord.lat;
            config.longitude = result.coord.lon;
            updateItem(item);
            saveConfig();
        }
    }

    async function selectLocationOnMap(item) {
        const SelectPositionOnMap = (await import('~/components/SelectPositionOnMap.svelte')).default;
        const result: WeatherLocation = await showModal({
            page: SelectPositionOnMap,
            fullscreen: true,
            props: {
                focusPos: config.latitude && config.longitude ? { lat: config.latitude, lon: config.longitude } : undefined
            }
        });
        if (result) {
            config.locationName = result.name;
            config.latitude = result.coord.lat;
            config.longitude = result.coord.lon;
            updateItem(item);
            saveConfig();
        }
    }

    function useCurrentLocation() {
        config.locationName = 'current';
        config.latitude = null;
        config.longitude = null;
        saveConfig();
    }

    async function selectProvider(item) {
        try {
            const result = await selectValue(
                [{ title: lc('auto'), data: null }].concat(
                    providers.map((p) => ({
                        title: lc('provider.' + p),
                        data: p
                    }))
                ),
                config.provider,
                { title: lc('provider.title') }
            );
            if (result !== undefined) {
                config.provider = result;
                saveConfig();
                updateItem(item);
            }
        } catch (error) {
            showError(error);
        }
    }

    async function selectModel(item) {
        try {
            const modelOptions = [{ title: lc('auto'), data: null }].concat(
                Object.keys(OpenMeteoModels).map((k) => ({
                    title: OpenMeteoModels[k],
                    data: k
                }))
            );

            const result = await selectValue(modelOptions, config.model, {
                title: lc('model')
            });
            if (result !== undefined) {
                config.model = result;
                saveConfig();
                updateItem(item);
            }
        } catch (error) {
            showError(error);
        }
    }

    // async function selectUpdateFrequency() {
    //     try {
    //         const frequencyOptions = [15, 30, 60, 120, 240, 360, 720, 1440].map((mins) => ({
    //             title: mins < 60 ? `${mins} min` : mins === 60 ? '1 hour' : `${mins / 60} hours`,
    //             data: mins
    //         }));

    //         const result = await selectValue(frequencyOptions, config.updateFrequency, {
    //             title: lc('widget_update_frequency')
    //         });
    //         if (result !== undefined) {
    //             config.updateFrequency = result;
    //             WidgetConfigManager.setUpdateFrequency(config.updateFrequency);
    //             showSnack({ message: lc('widget_update_frequency_saved') });
    //         }
    //     } catch (error) {
    //         showError(error);
    //     }
    // }

    async function selectPreviewSet(event) {
        try {
            const options = ['default', 'hot', 'storm'].map((set) => ({
                title: lc(`widget.preview_set.${set}`) || set,
                type: 'checkbox',
                boxType: 'circle',
                value: set === previewSet,
                data: set
            }));
            await showPopoverMenu({
                options,
                anchor: event.object,
                vertPos: VerticalPosition.BELOW,
                props: {
                    width: 220 * $fontScale,
                    maxHeight: Screen.mainScreen.heightDIPs - $actionBarHeight
                    // autoSizeListItem: true
                },

                onCheckBox: async (item) => {
                    closePopover();
                    if (item?.data) {
                        previewSet = item?.data;
                        previewData = await loadWidgetSample(widgetClass, previewSet);
                    }
                }
            });
        } catch (error) {
            showError(error);
        }
    }
    async function selectPreviewSize(event) {
        try {
            const options = previewConfig.supportedSizes.map((set) => ({
                title: lc(`widget.preview_set.${set.family}`) || set.family,
                type: 'checkbox',
                boxType: 'circle',
                value: set.width === previewSize.width && set.height === previewSize.height,
                data: set
            }));
            await showPopoverMenu({
                options,
                anchor: event.object,
                vertPos: VerticalPosition.BELOW,
                props: {
                    width: 220 * $fontScale,
                    maxHeight: Screen.mainScreen.heightDIPs - $actionBarHeight
                    // autoSizeListItem: true
                },

                onCheckBox: async (item) => {
                    closePopover();
                    if (item?.data) {
                        previewSize = item?.data;
                    }
                }
            });
        } catch (error) {
            showError(error);
        }
    }

    function getLocationDescription(): string {
        if (isDefaultLocation(config.locationName)) {
            return lc('my_location');
        }
        if (config.latitude != null && config.longitude != null) {
            return `${config.locationName} (${config.latitude.toFixed(2)}, ${config.longitude.toFixed(2)})`;
        }
        return config.locationName;
    }

    function getProviderDescription(): string {
        if (!config.provider) {
            return lc('auto') + ' (' + lc('provider.' + getProviderType()) + ')';
        }
        return lc('provider.' + config.provider);
    }

    function getModelDescription(): string {
        if (!config.model) {
            return lc('auto');
        }
        return OpenMeteoModels[config.model] || config.model;
    }

    function selectTemplate(item, index, items) {
        if (item.type) {
            if (item.type === 'prompt' || item.type === 'slider') {
                return 'default';
            }
            return item.type;
        }
        if (item.icon) {
            return 'leftIcon';
        }
        return 'default';
    }
    function refreshCollectionView() {
        collectionView?.nativeView?.refresh();
    }
    function refreshCollectionViewVisibleItems() {
        collectionView?.nativeView?.refreshVisibleItems();
    }
    onFontScaleChanged(refreshCollectionViewVisibleItems);
    onThemeChanged(refreshCollectionView);

    $: widgetComponent = widgetClass ? widgetComponents[widgetClass] : null;
    $: widgetSize = previewSize ?? { width: 160, height: 160 };

    $: DEV_LOG && console.log('widgetComponent', !!widgetComponent);
    $: DEV_LOG && console.log('previewData', JSON.stringify(previewData));
    $: DEV_LOG && console.log('widgetSize', widgetSize);

    const items = new ObservableArray(
        (
            [
                {
                    id: 'preview_set',
                    title: lc('widget.preview_set'),
                    description: () => lc(`widget.preview_set.${previewSet}`) || previewSet
                },
                {
                    id: 'preview_size',
                    title: lc('widget.preview_size'),
                    description: () => lc(previewSize.family)
                }
            ] as any[]
        )
            .concat(isKindConfig ? [{ type: 'header', title: lc('default_widget_settings_note') }] : [])
            .concat([
                { type: 'rightIcon', id: 'location', rightBtnIcon: 'mdi-map', title: lc('location_name'), description: getLocationDescription, onRightIconTap: selectLocationOnMap },
                {
                    type: 'header',
                    title: lc('providers')
                },
                {
                    id: 'provider',
                    title: lc('provider.title'),
                    description: getProviderDescription
                },
                {
                    id: 'model',
                    title: lc('model'),
                    description: getModelDescription
                },
                {
                    id: 'header',
                    description: () => (isKindConfig ? lc('widget_kind_configuration_note') : lc('widget_configuration_note'))
                }
            ])
    );

    function updateItem(item, key = 'key') {
        const index = items.findIndex((it) => it[key] === item[key]);
        if (index !== -1) {
            items.setItem(index, item);
        }
    }
    let checkboxTapTimer;
    function clearCheckboxTimer() {
        if (checkboxTapTimer) {
            clearTimeout(checkboxTapTimer);
            checkboxTapTimer = null;
        }
    }
    let ignoreNextOnCheckBoxChange = false;
    async function onCheckBox(item, event) {
        if (ignoreNextOnCheckBoxChange || item.value === event.value) {
            return;
        }
        const value = event.value;
        item.value = value;
        clearCheckboxTimer();
        try {
            ignoreNextOnCheckBoxChange = true;
            switch (item.id) {
                default:
                    // TODO: implement
                    // ApplicationSettings.setBoolean(item.key || item.id, value);
                    break;
            }
        } catch (error) {
            showError(error);
        } finally {
            ignoreNextOnCheckBoxChange = false;
        }
    }
    async function onRightIconTap(item, event) {
        try {
            const needsUpdate = await item.onRightIconTap?.(item, event);
            if (needsUpdate) {
                updateItem(item);
            }
        } catch (error) {
            showError(error);
        }
    }
    async function onTap(item, event) {
        try {
            if (item.type === 'checkbox' || item.type === 'switch') {
                // we dont want duplicate events so let s timeout and see if we clicking diretly on the checkbox
                const checkboxView: CheckBox = ((event.object as View).parent as View).getViewById('checkbox');
                clearCheckboxTimer();
                checkboxTapTimer = setTimeout(() => {
                    checkboxView.checked = !checkboxView.checked;
                }, 10);
                return;
            }
            DEV_LOG && console.log('onTap', item.id);
            switch (item.id) {
                case 'location':
                    await selectLocation(item);
                    break;
                case 'preview_set':
                    await selectPreviewSet(event);
                    break;
                case 'preview_size':
                    await selectPreviewSize(event);
                    break;
                case 'provider':
                    await selectProvider(event);
                    break;
                case 'model':
                    await selectModel(event);
                    break;
            }
        } catch (err) {
            showError(err);
        } finally {
            hideLoading();
        }
    }
    function getTitle(item) {
        switch (item.id) {
            case 'token':
                return lc(item.token);
            default:
                return item.title;
        }
    }
    function getDescription(item) {
        return typeof item.description === 'function' ? item.description(item) : item.description;
    }
</script>

<page actionBarHidden={true}>
    <gridlayout class="pageContent" rows="auto,auto,*">
        <!-- Preview Section -->
        {#if widgetComponent && previewData && previewSize}
            <gridlayout backgroundColor={colorSurfaceContainer} borderRadius={10} horizontalAlignment="center" row={1}>
                <svelte:component this={widgetComponent} data={previewData} size={widgetSize} />
            </gridlayout>
        {/if}
        <collectionview bind:this={collectionView} itemTemplateSelector={selectTemplate} {items} row={2} android:paddingBottom={$windowInset.bottom}>
            <Template key="sectionheader" let:item>
                <label class="sectionHeader" {...item.additionalProps || {}} text={item.title} />
            </Template>
            <Template key="switch" let:item>
                <ListItemAutoSize fontSize={20} item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }} leftIcon={item.icon} on:tap={(event) => onTap(item, event)}>
                    <switch id="checkbox" checked={item.value} col={1} marginLeft={10} verticalAlignment="center" on:checkedChange={(e) => onCheckBox(item, e)} />
                </ListItemAutoSize>
            </Template>
            <Template key="checkbox" let:item>
                <ListItemAutoSize fontSize={20} item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }} leftIcon={item.icon} on:tap={(event) => onTap(item, event)}>
                    <checkbox id="checkbox" checked={item.value} col={1} on:checkedChange={(e) => onCheckBox(item, e)} />
                </ListItemAutoSize>
            </Template>
            <Template key="rightIcon" let:item>
                <ListItemAutoSize fontSize={20} item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }} showBottomLine={false} on:tap={(event) => onTap(item, event)}>
                    <IconButton col={1} text={item.rightBtnIcon} on:tap={(event) => onRightIconTap(item, event)} />
                </ListItemAutoSize>
            </Template>
            <Template key="leftIcon" let:item>
                <ListItemAutoSize
                    columns="auto,*,auto"
                    fontSize={20}
                    item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }}
                    mainCol={1}
                    showBottomLine={false}
                    on:tap={(event) => onTap(item, event)}>
                    <label col={0} color={colorOnBackground} fontFamily={$fonts.mdi} fontSize={24} padding="0 10 0 0" text={item.icon} verticalAlignment="center" />
                </ListItemAutoSize>
            </Template>
            <Template key="image" let:item>
                <ListItemAutoSize fontSize={20} item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }} showBottomLine={false} on:tap={(event) => onTap(item, event)}>
                    <image col={1} height={45} src={item.image()} />
                </ListItemAutoSize>
            </Template>
            <Template key="info" let:item>
                <label color={colorOnSurfaceVariant} fontSize={14} margin="16" text={item.title} textWrap={true} />
            </Template>
            <Template let:item>
                <ListItemAutoSize fontSize={20} item={{ ...item, title: getTitle(item), subtitle: getDescription(item) }} showBottomLine={false} on:tap={(event) => onTap(item, event)}>
                </ListItemAutoSize>
            </Template>
        </collectionview>
        <CActionBar modalWindow={modalMode} title={getWidgetTitle()} />
    </gridlayout>
</page>
