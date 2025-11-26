<script context="module" lang="ts">
    import { ApplicationSettings, Utils, View } from '@nativescript/core';
    import { showError } from '@shared/utils/showError';
    import { closeModal, showModal } from '@shared/utils/svelte/ui';
    import { onDestroy, onMount } from 'svelte';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import ListItemAutoSize from '~/components/common/ListItemAutoSize.svelte';
    import { lc, onLanguageChanged } from '~/helpers/locale';
    import { WidgetConfigManager } from '~/services/widgets/WidgetConfigManager';
    import { DEFAULT_UPDATE_FREQUENCY, MAX_UPDATE_FREQUENCY, MIN_UPDATE_FREQUENCY, WidgetConfig, WidgetType } from '~/services/widgets/WidgetTypes';
    import { colors, fonts, windowInset } from '~/variables';
    import { OpenMeteoModels } from '~/services/providers/om';
    import { providers, getProviderType } from '~/services/providers/weatherproviderfactory';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { selectValue } from '~/utils/ui';
    import { isDefaultLocation } from '~/services/widgets/WidgetDataManager';
    import { widgetService } from '~/services/widgets/WidgetBridge';
</script>

<script lang="ts">
    let { colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors;
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorSurfaceContainer } = $colors);

    // Props
    export let widgetClass: string = '';
    export let widgetId: string = '';
    export let modalMode: boolean = false;

    // State
    let config: WidgetConfig = null;
    let locationName: string = 'current';
    let latitude: number = null;
    let longitude: number = null;
    let model: string = null;
    let provider: string = null;
    let updateFrequency: number = DEFAULT_UPDATE_FREQUENCY;
    let previewView: View = null;

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
            return widgetKindNames[widgetClass];
        }
        if (widgetId) {
            return `${lc('widget')} #${widgetId}`;
        }
        return lc('widget_settings');
    }

    onMount(() => {
        loadConfig();
        updateFrequency = WidgetConfigManager.getUpdateFrequency();
    });

    function loadConfig() {
        if (widgetId) {
            config = WidgetConfigManager.getConfig(widgetId);
            if (config) {
                locationName = config.locationName || 'current';
                latitude = config.latitude;
                longitude = config.longitude;
                model = config.model;
                provider = config.provider;
            }
        }
    }

    function saveConfig() {
        if (!widgetId) return;

        const newConfig: WidgetConfig = {
            locationName,
            latitude,
            longitude,
            model,
            provider: provider as any,
            widgetKind: widgetClass
        };

        WidgetConfigManager.saveConfig(widgetId, newConfig, widgetClass);
        showSnack({ message: lc('widget_config_saved') });

        // Trigger widget update using widgetService
        widgetService.updateWidget(widgetId);
    }

    async function selectLocation() {
        try {
            const SelectCity = (await import('~/components/SelectCity.svelte')).default;
            const result = await showModal({
                page: SelectCity,
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
            const result = await showModal({
                page: SelectPositionOnMap,
                props: {
                    focusPos: latitude && longitude ? { lat: latitude, lon: longitude } : undefined
                }
            });
            if (result) {
                locationName = `${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}`;
                latitude = result.lat;
                longitude = result.lon;
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
                [{ title: lc('auto'), value: null }].concat(
                    providers.map((p) => ({
                        title: lc('provider.' + p),
                        value: p
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
            const modelOptions = [{ title: lc('auto'), value: null }].concat(
                Object.keys(OpenMeteoModels).map((k) => ({
                    title: OpenMeteoModels[k],
                    value: k
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
                value: mins
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

    function getFrequencyDescription(): string {
        if (updateFrequency < 60) {
            return `${updateFrequency} min`;
        }
        return updateFrequency === 60 ? '1 hour' : `${updateFrequency / 60} hours`;
    }
</script>

<page actionBarHidden={true}>
    <gridlayout class="pageContent" rows="auto,*">
        <CActionBar modalWindow={modalMode} title={getWidgetTitle()} />

        <scrollview row={1} android:paddingBottom={$windowInset.bottom}>
            <stacklayout padding="0 0 20 0">
                <!-- Preview Section with home background -->
                {#if widgetId}
                    <gridlayout
                        backgroundImage="~/assets/images/pattern.png"
                        backgroundRepeat="repeat"
                        borderRadius={12}
                        height={200}
                        margin="16"
                        padding="10">
                        <!-- Widget preview placeholder - styled like a home screen widget -->
                        <gridlayout
                            backgroundColor={colorSurfaceContainer}
                            borderRadius={16}
                            horizontalAlignment="center"
                            opacity={0.95}
                            padding="16"
                            verticalAlignment="center"
                            width={180}>
                            <stacklayout horizontalAlignment="center" verticalAlignment="center">
                                <label
                                    color={colorOnSurface}
                                    fontSize={24}
                                    fontWeight="bold"
                                    horizontalAlignment="center"
                                    text="8°C" />
                                <label
                                    color={colorOnSurfaceVariant}
                                    fontSize={14}
                                    horizontalAlignment="center"
                                    text={locationName === 'current' ? lc('my_location') : locationName} />
                                <label
                                    color={colorOnSurfaceVariant}
                                    fontSize={12}
                                    horizontalAlignment="center"
                                    marginTop={4}
                                    text={lc('widget') + ' Preview'} />
                            </stacklayout>
                        </gridlayout>
                    </gridlayout>
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
                        subtitle: isDefaultLocation(locationName) ? '✓' : ''
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

                <!-- Update Frequency Section -->
                <label class="sectionHeader" text={lc('widget_settings')} />

                <ListItemAutoSize
                    item={{
                        title: lc('widget_update_frequency'),
                        subtitle: getFrequencyDescription()
                    }}
                    on:tap={selectUpdateFrequency} />

                <!-- Info Notes -->
                <label
                    color={colorOnSurfaceVariant}
                    fontSize={12}
                    margin="16 16 0 16"
                    text={lc('widget_configuration_note')}
                    textWrap={true} />

                <label
                    color={colorOnSurfaceVariant}
                    fontSize={12}
                    margin="8 16 0 16"
                    text={__ANDROID__ ? lc('widget_android_note') : lc('widget_ios_note')}
                    textWrap={true} />
            </stacklayout>
        </scrollview>
    </gridlayout>
</page>
