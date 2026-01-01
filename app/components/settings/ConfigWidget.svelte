<script context="module" lang="ts">
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { Screen, View } from '@nativescript/core';
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
    import { selectValue, showPopoverMenu } from '~/utils/ui';
    import { actionBarHeight, colors, fontScale, windowInset } from '~/variables';

    // Import generated widget components
    import SimpleWeatherWidgetView from '~/components/widgets/generated/SimpleWeatherWidgetView.generated.svelte';
    import SimpleWeatherWithDateWidgetView from '~/components/widgets/generated/SimpleWeatherWithDateWidgetView.generated.svelte';
    import SimpleWeatherWithClockWidgetView from '~/components/widgets/generated/SimpleWeatherWithClockWidgetView.generated.svelte';
    import HourlyWeatherWidgetView from '~/components/widgets/generated/HourlyWeatherWidgetView.generated.svelte';
    import DailyWeatherWidgetView from '~/components/widgets/generated/DailyWeatherWidgetView.generated.svelte';
    import ForecastWeatherWidgetView from '~/components/widgets/generated/ForecastWeatherWidgetView.generated.svelte';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { closePopover } from '@nativescript-community/ui-popover/svelte';

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
    let { colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors);

    // Props
    export let widgetClass: string = '';
    export let widgetId: string = '';
    export let modalMode: boolean = false;
    export let isKindConfig: boolean = false; // true for per-kind config, false for per-instance

    // State
    let config: WidgetConfig = null;
    let locationName: string = 'current';
    let latitude: number = null;
    let longitude: number = null;
    let model: string = null;
    let provider: string = null;
    let updateFrequency: number = DEFAULT_UPDATE_FREQUENCY;
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
        updateFrequency = WidgetConfigManager.getUpdateFrequency();
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

        if (config) {
            locationName = config.locationName || 'current';
            latitude = config.latitude;
            longitude = config.longitude;
            model = config.model;
            provider = config.provider;
        }
    }

    function saveConfig() {
        const newConfig: WidgetConfig = {
            locationName,
            latitude,
            longitude,
            model,
            provider: provider as any,
            widgetKind: widgetClass
        };

        if (isKindConfig) {
            // Save per-kind default config
            WidgetConfigManager.saveKindConfig(widgetClass, newConfig);
            showSnack({ message: lc('widget_kind_config_saved') });
        } else if (widgetId) {
            // Save per-instance config
            WidgetConfigManager.saveConfig(widgetId, newConfig, widgetClass);
            showSnack({ message: lc('widget_config_saved') });

            // Trigger widget update
            widgetService.updateWidget(widgetId);
        }
    }

    async function selectLocation() {
        try {
            const SelectCity = (await import('~/components/SelectCity.svelte')).default;
            const result: WeatherLocation = await showModal({
                page: SelectCity,
                fullscreen: true,
                props: {}
            });
            if (result) {
                locationName = result.name || result.sys?.name || 'Selected';
                latitude = result.coord.lat;
                longitude = result.coord.lon;
                saveConfig();
            }
        } catch (error) {
            showError(error);
        }
    }

    async function selectLocationOnMap() {
        try {
            const SelectPositionOnMap = (await import('~/components/SelectPositionOnMap.svelte')).default;
            const result: WeatherLocation = await showModal({
                page: SelectPositionOnMap,
                fullscreen: true,
                props: {
                    focusPos: latitude && longitude ? { lat: latitude, lon: longitude } : undefined
                }
            });
            if (result) {
                locationName = result.name;
                latitude = result.coord.lat;
                longitude = result.coord.lon;
                saveConfig();
            }
        } catch (error) {
            showError(error);
        }
    }

    function useCurrentLocation() {
        locationName = 'current';
        latitude = null;
        longitude = null;
        saveConfig();
    }

    async function selectProvider() {
        try {
            const result = await selectValue(
                [{ title: lc('auto'), data: null }].concat(
                    providers.map((p) => ({
                        title: lc('provider.' + p),
                        data: p
                    }))
                ),
                provider,
                { title: lc('provider.title') }
            );
            if (result !== undefined) {
                provider = result;
                saveConfig();
            }
        } catch (error) {
            showError(error);
        }
    }

    async function selectModel() {
        try {
            const modelOptions = [{ title: lc('auto'), data: null }].concat(
                Object.keys(OpenMeteoModels).map((k) => ({
                    title: OpenMeteoModels[k],
                    data: k
                }))
            );

            const result = await selectValue(modelOptions, model, {
                title: lc('model')
            });
            if (result !== undefined) {
                model = result;
                saveConfig();
            }
        } catch (error) {
            showError(error);
        }
    }

    async function selectUpdateFrequency() {
        try {
            const frequencyOptions = [15, 30, 60, 120, 240, 360, 720, 1440].map((mins) => ({
                title: mins < 60 ? `${mins} min` : mins === 60 ? '1 hour' : `${mins / 60} hours`,
                data: mins
            }));

            const result = await selectValue(frequencyOptions, updateFrequency, {
                title: lc('widget_update_frequency')
            });
            if (result !== undefined) {
                updateFrequency = result;
                WidgetConfigManager.setUpdateFrequency(updateFrequency);
                showSnack({ message: lc('widget_update_frequency_saved') });
            }
        } catch (error) {
            showError(error);
        }
    }

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
        if (isDefaultLocation(locationName)) {
            return lc('my_location');
        }
        if (latitude != null && longitude != null) {
            return `${locationName} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
        }
        return locationName;
    }

    function getProviderDescription(): string {
        if (!provider) {
            return lc('auto') + ' (' + lc('provider.' + getProviderType()) + ')';
        }
        return lc('provider.' + provider);
    }

    function getModelDescription(): string {
        if (!model) {
            return lc('auto');
        }
        return OpenMeteoModels[model] || model;
    }

    $: widgetComponent = widgetClass ? widgetComponents[widgetClass] : null;
    $: widgetSize = previewSize ?? { width: 160, height: 160 };
    $: DEV_LOG && console.log('widgetComponent', !!widgetComponent);
    $: DEV_LOG && console.log('previewData', JSON.stringify(previewData));
    $: DEV_LOG && console.log('widgetSize', widgetSize);
</script>

<page actionBarHidden={true}>
    <gridlayout class="pageContent" rows="auto,*">
        <CActionBar modalWindow={modalMode} title={getWidgetTitle()} />

        <scrollview row={1} android:paddingBottom={$windowInset.bottom}>
            <stacklayout padding="0 0 20 0">
                <!-- Preview Section -->
                {#if widgetComponent && previewData && previewSize}
                    <stacklayout backgroundColor={colorSurfaceContainer} borderRadius={10} horizontalAlignment="center">
                        <svelte:component this={widgetComponent} data={previewData} size={widgetSize} />
                    </stacklayout>
                    <gridlayout columns="*,*">
                        <ListItemAutoSize
                            item={{
                                title: lc('widget.preview_set'),
                                subtitle: lc(`widget.preview_set.${previewSet}`) || previewSet
                            }}
                            on:tap={selectPreviewSet} />
                        <ListItemAutoSize
                            col={1}
                            item={{
                                title: lc('widget.preview_size'),
                                subtitle: lc(previewSize.family)
                            }}
                            on:tap={selectPreviewSize} />
                    </gridlayout>
                {/if}
                {#if isKindConfig}
                    <label class="sectionHeader" text={lc('default_widget_settings_note')} />
                {/if}

                <!-- Location Section -->
                <label class="sectionHeader" text={lc('select_location')} />

                <ListItemAutoSize
                    item={{
                        title: lc('location_name'),
                        subtitle: getLocationDescription()
                    }}
                    on:tap={selectLocation} />

                <ListItemAutoSize
                    item={{
                        title: lc('select_location_map'),
                        subtitle: lc('select_on_map')
                    }}
                    on:tap={selectLocationOnMap} />

                <ListItemAutoSize
                    item={{
                        title: lc('my_location'),
                        subtitle: isDefaultLocation(locationName) ? lc('default_location') : ''
                    }}
                    on:tap={useCurrentLocation} />

                <!-- Provider Section -->
                <label class="sectionHeader" text={lc('providers')} />

                <ListItemAutoSize
                    item={{
                        title: lc('provider.title'),
                        subtitle: getProviderDescription()
                    }}
                    on:tap={selectProvider} />

                <ListItemAutoSize
                    item={{
                        title: lc('model'),
                        subtitle: getModelDescription()
                    }}
                    on:tap={selectModel} />

                <!-- Info Notes -->
                <label color={colorOnSurfaceVariant} fontSize={12} margin="16 16 0 16" text={isKindConfig ? lc('widget_kind_configuration_note') : lc('widget_configuration_note')} textWrap={true} />

                {#if !isKindConfig}
                    <label color={colorOnSurfaceVariant} fontSize={12} margin="8 16 0 16" text={__ANDROID__ ? lc('widget_android_note') : lc('widget_ios_note')} textWrap={true} />
                {/if}
            </stacklayout>
        </scrollview>
    </gridlayout>
</page>
