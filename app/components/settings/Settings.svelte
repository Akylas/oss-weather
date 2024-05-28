<script context="module" lang="ts">
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { confirm, prompt } from '@nativescript-community/ui-material-dialogs';
    import { ApplicationSettings, File, ObservableArray, Page, StackLayout, TouchGestureEventData, Utils, View } from '@nativescript/core';
    import { Template } from 'svelte-native/components';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import ListItemAutoSize from '~/components/common/ListItemAutoSize.svelte';
    import {
        ANIMATIONS_ENABLED,
        CHARTS_LANDSCAPE,
        CHARTS_PORTRAIT_FULLSCREEN,
        DAILY_PAGE_HOURLY_CHART,
        DECIMAL_METRICS_TEMP,
        FEELS_LIKE_TEMPERATURE,
        MAIN_PAGE_HOURLY_CHART,
        MIN_UV_INDEX,
        NB_DAYS_FORECAST,
        NB_HOURS_FORECAST,
        NB_MINUTES_FORECAST,
        SETTINGS_DAILY_PAGE_HOURLY_CHART,
        SETTINGS_IMPERIAL,
        SETTINGS_LANGUAGE,
        SETTINGS_MAIN_PAGE_HOURLY_CHART,
        SHOW_CURRENT_DAY_DAILY,
        SHOW_DAILY_IN_CURRENTLY,
        WEATHER_DATA_LAYOUT,
        WEATHER_MAP_COLORS,
        WEATHER_MAP_COLOR_SCHEMES
    } from '~/helpers/constants';
    import { clock_24, getLocaleDisplayName, l, lc, onLanguageChanged, selectLanguage, slc } from '~/helpers/locale';
    import { getThemeDisplayName, onThemeChanged, selectTheme } from '~/helpers/theme';
    import { iconService } from '~/services/icon';
    import { OM_MODELS } from '~/services/providers/om';
    import { getProviderType, providers } from '~/services/providers/weatherproviderfactory';
    import { AVAILABLE_WEATHER_DATA, getWeatherDataTitle, weatherDataService } from '~/services/weatherData';
    import { showError } from '~/utils/error';
    import { share } from '~/utils/share';
    import { navigate } from '~/utils/svelte/ui';
    import { createView, hideLoading, isLandscape, openLink, showAlertOptionSelect, showLoading } from '~/utils/ui';
    import { colors, fonts, iconColor, imperial, windowInset } from '~/variables';
    import IconButton from '../common/IconButton.svelte';
    import { TextField } from '@nativescript-community/ui-material-textfield';
    import { TextView } from '@nativescript-community/ui-material-textview';
    import { Sentry } from '~/utils/sentry';
    import { showSnack } from '@nativescript-community/ui-material-snackbar';
    import { openFilePicker, saveFile } from '@nativescript-community/ui-document-picker';
    import dayjs from 'dayjs';
    import { restartApp } from '~/utils/utils';
    import { isPermResultAuthorized, request } from '@nativescript-community/perms';
    import { SDK_VERSION } from '@akylas/nativescript/utils';
    const version = __APP_VERSION__ + ' Build ' + __APP_BUILD_NUMBER__;
    const storeSettings = {};
</script>

<script lang="ts">
    // technique for only specific properties to get updated on store change
    let { colorPrimary, colorOutlineVariant, colorOnSurface, colorOnSurfaceVariant } = $colors;
    $: ({ colorPrimary, colorOutlineVariant, colorOnSurface, colorOnSurfaceVariant } = $colors);
    $: ({ bottom: windowInsetBottom } = $windowInset);

    let collectionView: NativeViewElementNode<CollectionView>;
    let page: NativeViewElementNode<Page>;

    let items: ObservableArray<any>;

    export let title = null;
    export let reorderEnabled = false;
    export let actionBarButtons = [
        { icon: 'mdi-share-variant', id: 'share' },
        { icon: 'mdi-github', id: 'github' }
    ];
    export let subSettingsOptions: string = null;
    export let options: (page, updateImte) => any[] = null;
    if (!options && subSettingsOptions) {
        options = getSubSettings(subSettingsOptions);
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

    function getStoreSetting(k: string, defaultValue) {
        if (!storeSettings[k]) {
            storeSettings[k] = JSON.parse(ApplicationSettings.getString(k, defaultValue));
        }
        return storeSettings[k];
    }
    function getSubSettings(id: string) {
        switch (id) {
            case 'charts':
                return () => [
                    {
                        type: 'switch',
                        id: 'charts_landscape',
                        title: lc('charts_landscape'),
                        value: ApplicationSettings.getBoolean('charts_landscape', CHARTS_LANDSCAPE)
                    },
                    {
                        type: 'switch',
                        id: 'charts_portrait_fullscreen',
                        title: lc('charts_portrait_fullscreen'),
                        value: ApplicationSettings.getBoolean('charts_portrait_fullscreen', CHARTS_PORTRAIT_FULLSCREEN)
                    },
                    {
                        type: 'switch',
                        id: SETTINGS_MAIN_PAGE_HOURLY_CHART,
                        title: lc('show_hourly_chart_on_main'),
                        value: ApplicationSettings.getBoolean(SETTINGS_MAIN_PAGE_HOURLY_CHART, MAIN_PAGE_HOURLY_CHART)
                    },
                    {
                        type: 'switch',
                        id: SETTINGS_DAILY_PAGE_HOURLY_CHART,
                        title: lc('show_hourly_chart_on_daily'),
                        value: ApplicationSettings.getBoolean(SETTINGS_DAILY_PAGE_HOURLY_CHART, DAILY_PAGE_HOURLY_CHART)
                    }
                ];
            case 'units':
                return () => [
                    {
                        type: 'switch',
                        id: SETTINGS_IMPERIAL,
                        title: lc('imperial_units'),
                        value: $imperial
                    },
                    {
                        type: 'switch',
                        id: 'metric_temp_decimal',
                        title: lc('metric_temp_decimal'),
                        value: ApplicationSettings.getBoolean('metric_temp_decimal', DECIMAL_METRICS_TEMP)
                    }
                ];
            case 'icons':
                return (page, updateItem) => [
                    {
                        type: 'switch',
                        id: 'animations',
                        title: lc('animations'),
                        description: lc('animations_desc'),
                        value: ApplicationSettings.getBoolean('animations', ANIMATIONS_ENABLED)
                    },
                    {
                        type: 'image',
                        id: 'icon_pack',
                        title: lc('icon_pack'),
                        description: () => iconService.getPackName(),
                        image: () => iconService.getPackIcon(),
                        async onTap(item) {
                            const themes = await iconService.getAvailableThemes();
                            const result = await showAlertOptionSelect(
                                {
                                    height: Math.min(themes.length * 65, 400),
                                    rowHeight: 65,
                                    options: themes.map((k) => ({
                                        name: k.name,
                                        subtitle: k.description,
                                        data: k.id,
                                        type: 'image',
                                        image: k.icon
                                    }))
                                },
                                {
                                    title: lc('icon_pack')
                                }
                            );
                            if (result?.data) {
                                ApplicationSettings.setString('icon_set', result.data);
                                updateItem(item, 'id');
                            }
                        }
                    }
                ];
            case 'providers':
                return () => [
                    {
                        key: 'provider',
                        id: 'setting',
                        valueType: 'string',
                        description: () => lc('provider.' + getProviderType()),
                        title: lc('provider.title'),
                        currentValue: getProviderType,
                        values: providers.map((t) => ({ value: t, title: lc(t) }))
                    },
                    {
                        key: 'forecast_nb_days',
                        id: 'setting',
                        title: lc('forecast_nb_days'),
                        values: Array.from(Array(15), (_, index) => ({ value: index + 1, title: index + 1 })),
                        currentValue: () => ApplicationSettings.getNumber('forecast_nb_days', NB_DAYS_FORECAST),
                        rightValue: () => ApplicationSettings.getNumber('forecast_nb_days', NB_DAYS_FORECAST)
                    },
                    {
                        key: 'forecast_nb_hours',
                        id: 'setting',
                        title: lc('forecast_nb_hours'),
                        values: Array.from(Array(72), (_, index) => ({ value: index + 1, title: index + 1 })),
                        currentValue: () => ApplicationSettings.getNumber('forecast_nb_hours', NB_HOURS_FORECAST),
                        rightValue: () => ApplicationSettings.getNumber('forecast_nb_hours', NB_HOURS_FORECAST)
                    },
                    {
                        key: 'forecast_nb_minutes',
                        id: 'setting',
                        title: lc('forecast_nb_minutes'),
                        values: Array.from(Array(120), (_, index) => ({ value: index + 1, title: index + 1 })),
                        currentValue: () => ApplicationSettings.getNumber('forecast_nb_minutes', NB_MINUTES_FORECAST),
                        rightValue: () => ApplicationSettings.getNumber('forecast_nb_minutes', NB_MINUTES_FORECAST)
                    },
                    {
                        type: 'sectionheader',
                        title: lc('provider.openmeteo')
                    },
                    {
                        key: 'open_meteo_prefered_model',
                        id: 'setting',
                        valueType: 'string',
                        description: () => OM_MODELS[ApplicationSettings.getString('open_meteo_prefered_model', 'best_match')],
                        title: lc('open_meteo_prefered_model'),
                        currentValue: () => ApplicationSettings.getString('open_meteo_prefered_model', 'best_match'),
                        values: Object.keys(OM_MODELS).map((t) => ({ value: t, title: OM_MODELS[t] }))
                    },
                    {
                        type: 'sectionheader',
                        title: lc('provider.openweathermap')
                    },
                    {
                        type: 'prompt',
                        valueType: 'string',
                        id: 'setting',
                        key: 'owmApiKey',
                        description: lc('api_key_required_description'),
                        title: lc('owm_api_key')
                    },
                    {
                        id: 'setting',
                        valueType: 'string',
                        key: 'owm_one_call_version',
                        title: lc('owm_one_call_version'),
                        values: [
                            { value: '2.5', title: '2.5' },
                            { value: '3.0', title: '3.0' }
                        ],
                        currentValue: () => ApplicationSettings.getString('owm_one_call_version', '3.0'),
                        rightValue: () => ApplicationSettings.getString('owm_one_call_version', '3.0')
                    }
                ];
            case 'weather_data':
                return () => {
                    const currentData = weatherDataService.currentWeatherData;
                    const disabledData = AVAILABLE_WEATHER_DATA.filter((d) => currentData.indexOf(d) === -1);
                    return [
                        {
                            id: 'setting',
                            valueType: 'string',
                            key: 'weather_data_layout',
                            title: lc('weather_data_layout'),
                            values: [
                                { value: 'default', title: lc('blocks') },
                                { value: 'line', title: lc('lines') }
                            ],
                            currentValue: () => ApplicationSettings.getString('weather_data_layout', WEATHER_DATA_LAYOUT),
                            rightValue: () => ApplicationSettings.getString('weather_data_layout', WEATHER_DATA_LAYOUT)
                        },
                        {
                            type: 'switch',
                            id: 'show_current_day_daily',
                            title: lc('show_current_day_daily'),
                            value: ApplicationSettings.getBoolean('show_current_day_daily', SHOW_CURRENT_DAY_DAILY)
                        },
                        {
                            type: 'switch',
                            id: 'show_daily_in_currently',
                            title: lc('show_daily_in_currently'),
                            value: ApplicationSettings.getBoolean('show_daily_in_currently', SHOW_DAILY_IN_CURRENTLY)
                        },
                        {
                            type: 'switch',
                            id: 'feels_like_temperatures',
                            title: lc('feels_like_temperatures'),
                            value: ApplicationSettings.getBoolean('feels_like_temperatures', FEELS_LIKE_TEMPERATURE)
                        },
                        {
                            key: 'min_uv_index',
                            id: 'setting',
                            title: lc('min_uv_index'),
                            values: Array.from(Array(10), (_, index) => ({ value: index + 1, title: index + 1 })),
                            currentValue: () => ApplicationSettings.getNumber('min_uv_index', MIN_UV_INDEX),
                            rightValue: () => ApplicationSettings.getNumber('min_uv_index', MIN_UV_INDEX)
                        },
                        {
                            type: 'sectionheader',
                            id: 'enabled',
                            title: lc('enabled_weather_data')
                        }
                    ]
                        .concat(
                            currentData.map((k) => ({
                                id: k,
                                reorder: true,
                                type: 'reorder',
                                title: getWeatherDataTitle(k)
                            })) as any
                        )
                        .concat([
                            {
                                type: 'sectionheader',
                                id: 'disabled',
                                reorder: true,
                                title: lc('disabled_weather_data')
                            }
                        ] as any)
                        .concat(
                            disabledData.map((k) => ({
                                id: k,
                                reorder: true,
                                type: 'reorder',
                                title: getWeatherDataTitle(k)
                            })) as any
                        );
                };
            case 'map':
                return () => [
                    {
                        key: 'weather_map_colors',
                        id: 'setting',
                        title: lc('weather_map_colors'),
                        currentValue: () => ApplicationSettings.getNumber('weather_map_colors', WEATHER_MAP_COLORS),
                        values: WEATHER_MAP_COLOR_SCHEMES,
                        description: () => WEATHER_MAP_COLOR_SCHEMES[ApplicationSettings.getNumber('weather_map_colors', WEATHER_MAP_COLORS)].title
                    }
                ];
            case 'geolocation':
                return () => [
                    {
                        type: 'switch',
                        id: 'refresh_location_on_pull',
                        title: lc('refresh_location_on_pull'),
                        value: ApplicationSettings.getBoolean('refresh_location_on_pull', false)
                    }
                ];
            default:
                break;
        }
    }
    function refresh() {
        const newItems: any[] =
            options?.(page, updateItem) ||
            [
                {
                    type: 'header',
                    title: __IOS__ ? lc('show_love') : lc('donate')
                },
                {
                    type: 'sectionheader',
                    title: lc('general')
                },
                {
                    id: SETTINGS_LANGUAGE,
                    description: () => getLocaleDisplayName(),
                    title: lc('language')
                },
                {
                    id: 'dark_mode',
                    description: () => getThemeDisplayName(),
                    title: lc('theme.title')
                },
                {
                    type: 'switch',
                    id: 'auto_black',
                    title: lc('auto_black'),
                    value: ApplicationSettings.getBoolean('auto_black', false)
                },
                {
                    type: 'switch',
                    id: 'clock_24',
                    title: lc('clock_24'),
                    value: clock_24
                },
                {
                    icon: 'mdi-format-size',
                    id: 'font_scale',
                    title: lc('font_scale')
                }
            ]
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('icons'),
                        description: lc('icons_settings'),
                        icon: 'mdi-weather-partly-cloudy',
                        options: getSubSettings('icons')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('units'),
                        description: lc('units_settings'),
                        icon: 'mdi-temperature-celsius',
                        options: getSubSettings('units')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('providers'),
                        description: lc('providers_settings'),
                        icon: 'mdi-cloud-circle',
                        options: getSubSettings('providers')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('weather_data'),
                        description: lc('weather_data_settings'),
                        reorderEnabled: true,
                        onReordered: () => {},
                        icon: 'mdi-gauge',
                        options: getSubSettings('weather_data')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('charts'),
                        description: lc('charts_settings'),
                        reorderEnabled: true,
                        onReordered: () => {},
                        icon: 'mdi-chart-bar',
                        options: getSubSettings('charts')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('map'),
                        description: lc('map_settings'),
                        icon: 'mdi-map',
                        options: getSubSettings('map')
                    }
                ] as any)
                .concat([
                    {
                        id: 'sub_settings',
                        title: lc('geolocation'),
                        description: lc('geolocation_settings'),
                        icon: 'mdi-map-marker-circle',
                        options: getSubSettings('geolocation')
                    }
                ] as any)
                .concat([
                    {
                        id: 'third_party',
                        // rightBtnIcon: 'mdi-chevron-right',
                        title: lc('third_parties'),
                        description: lc('list_used_third_parties')
                    }
                ] as any)
                .concat(
                    SENTRY_ENABLED
                        ? [
                              {
                                  id: 'feedback',
                                  icon: 'mdi-bullhorn',
                                  title: lc('send_feedback')
                              }
                          ]
                        : ([] as any)
                )
                .concat(
                    PLAY_STORE_BUILD
                        ? [
                              //   {
                              //       id: 'share',
                              //       rightBtnIcon: 'mdi-chevron-right',
                              //       title: lc('share_application')
                              //   },
                              {
                                  type: 'rightIcon',
                                  id: 'review',
                                  rightBtnIcon: 'mdi-chevron-right',
                                  title: lc('review_application')
                              }
                          ]
                        : ([] as any)
                )

                .concat([
                    {
                        type: 'sectionheader',
                        title: lc('backup_restore')
                    },
                    {
                        id: 'export_settings',
                        title: lc('export_settings'),
                        description: lc('export_settings_desc')
                        // rightBtnIcon: 'mdi-chevron-right'
                    },
                    {
                        id: 'import_settings',
                        title: lc('import_settings'),
                        description: lc('import_settings_desc')
                        // rightBtnIcon: 'mdi-chevron-right'
                    }
                ] as any);

        items = new ObservableArray(newItems);
    }
    refresh();

    async function onLongPress(id, event) {
        try {
            switch (id) {
                case 'version':
                    if (SENTRY_ENABLED) {
                        throw new Error('test error');
                    }
            }
        } catch (error) {
            showError(error);
        }
    }
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
            } else if (item.type === 'reorder') {
                const position = items.indexOf(item);
                let disabledPosition = items.findIndex((d) => d.id === 'disabled');
                let enabledPosition = items.findIndex((d) => d.id === 'enabled');
                if (position > disabledPosition) {
                    items.splice(position, 1);
                    items.splice(disabledPosition, 0, item);
                } else if (position > enabledPosition) {
                    items.splice(position, 1);
                    items.push(item);
                }
                disabledPosition = items.findIndex((d) => d.id === 'disabled');
                enabledPosition = items.findIndex((d) => d.id === 'enabled');
                weatherDataService.updateCurrentWeatherData([...items.slice(enabledPosition + 1, disabledPosition)].map((d) => d.id));
                return;
            }
            switch (item.id) {
                case 'sub_settings': {
                    const component = (await import('~/components/settings/Settings.svelte')).default;
                    navigate({
                        page: component,
                        props: {
                            title: item.title,
                            reorderEnabled: item.reorderEnabled,
                            options: item.options,
                            actionBarButtons: item.actionBarButtons?.() || []
                        }
                    });

                    break;
                }
                case 'font_scale':
                    const FontSizeSettingScreen = (await import('~/components/settings/FontSizeSettingScreen.svelte')).default;
                    navigate({ page: FontSizeSettingScreen });
                    break;
                case 'github':
                    openLink(GIT_URL);
                    break;
                case SETTINGS_LANGUAGE:
                    await selectLanguage();
                    break;
                case 'dark_mode':
                    await selectTheme();
                    break;
                case 'share':
                    await share({
                        message: GIT_URL
                    });
                    break;
                case 'review':
                    openLink(STORE_REVIEW_LINK);
                    break;
                case 'sponsor':
                case 'sponsor':
                    switch (item.type) {
                        case 'librepay':
                            openLink('https://liberapay.com/farfromrefuge');
                            break;
                        case 'patreon':
                            openLink('https://patreon.com/farfromrefuge');
                            break;

                        default:
                            // Apple wants us to use in-app purchase for donations => taking 30% ...
                            // so lets just open github and ask for love...
                            openLink(__IOS__ ? GIT_URL : SPONSOR_URL);
                            break;
                    }
                    break;
                case 'third_party':
                    const ThirdPartySoftwareBottomSheet = (await import('~/components/settings/ThirdPartySoftwareBottomSheet.svelte')).default;
                    showBottomSheet({
                        parent: this,
                        peekHeight: 400,
                        // skipCollapsedState: isLandscape(),
                        view: ThirdPartySoftwareBottomSheet
                    });
                    break;
                case 'feedback': {
                    if (SENTRY_ENABLED) {
                        const view = createView(StackLayout, {
                            padding: 10
                        });
                        const commentsTF = createView(TextView, {
                            hint: lc('comments'),
                            variant: 'outline',
                            height: 150,
                            returnKeyType: 'done'
                        });
                        const emailTF = createView(TextField, {
                            hint: lc('email'),
                            variant: 'outline',
                            autocapitalizationType: 'none',
                            autocorrect: false,
                            keyboardType: 'email',
                            returnKeyType: 'next'
                        });
                        const nameTF = createView(TextField, {
                            hint: lc('name'),
                            variant: 'outline',
                            returnKeyType: 'next'
                        });
                        view.addChild(nameTF);
                        view.addChild(emailTF);
                        view.addChild(commentsTF);
                        const result = await confirm({
                            title: lc('send_feedback'),
                            okButtonText: l('send'),
                            cancelButtonText: l('cancel'),
                            view
                        });
                        if (result) {
                            const eventId = Sentry.captureMessage('User Feedback');

                            Sentry.captureUserFeedback({
                                event_id: eventId,
                                name: nameTF.text,
                                email: emailTF.text,
                                comments: commentsTF.text
                            });
                            Sentry.flush();
                            showSnack({ message: l('feedback_sent') });
                        }
                    } else {
                        openLink(GIT_URL + 'issues');
                    }
                    break;
                }
                case 'export_settings':
                    if (__ANDROID__ && SDK_VERSION < 29) {
                        const permRes = await request('storage');
                        if (!isPermResultAuthorized(permRes)) {
                            throw new Error(lc('missing_storage_perm_settings'));
                        }
                    }
                    const jsonStr = ApplicationSettings.getAllJSON();
                    if (jsonStr) {
                        const result = await saveFile({
                            name: `${__APP_ID__}_settings_${dayjs().format('YYYY-MM-DD')}.json`,
                            data: jsonStr
                        });
                        DEV_LOG && console.log('export_settings done', result, jsonStr);
                    }
                    break;
                case 'import_settings':
                    const result = await openFilePicker({
                        extensions: ['json'],
                        multipleSelection: false,
                        pickerMode: 0
                    });
                    const filePath = result.files[0];
                    if (filePath && File.exists(filePath)) {
                        showLoading();
                        const text = await File.fromPath(filePath).readText();
                        DEV_LOG && console.log('import_settings', text);
                        const json = JSON.parse(text);
                        const nativePref = ApplicationSettings.getNative();
                        if (__ANDROID__) {
                            const editor = (nativePref as android.content.SharedPreferences).edit();
                            editor.clear();
                            Object.keys(json).forEach((k) => {
                                if (k.startsWith('_')) {
                                    return;
                                }
                                const value = json[k];
                                const type = typeof value;
                                switch (type) {
                                    case 'boolean':
                                        editor.putBoolean(k, value);
                                        break;
                                    case 'number':
                                        editor.putLong(k, java.lang.Double.doubleToRawLongBits(double(value)));
                                        break;
                                    case 'string':
                                        editor.putString(k, value);
                                        break;
                                }
                            });
                            editor.apply();
                        } else {
                            const userDefaults = nativePref as NSUserDefaults;
                            const domain = NSBundle.mainBundle.bundleIdentifier;
                            userDefaults.removePersistentDomainForName(domain);
                            Object.keys(json).forEach((k) => {
                                if (k.startsWith('_')) {
                                    return;
                                }
                                const value = json[k];
                                const type = typeof value;
                                switch (type) {
                                    case 'boolean':
                                        userDefaults.setBoolForKey(value, k);
                                        break;
                                    case 'number':
                                        userDefaults.setDoubleForKey(value, k);
                                        break;
                                    case 'string':
                                        userDefaults.setObjectForKey(value, k);
                                        break;
                                }
                            });
                        }
                        hideLoading();
                        const result = await confirm({
                            message: lc('restart_app'),
                            okButtonText: lc('restart'),
                            cancelButtonText: lc('later')
                        });
                        if (result) {
                            restartApp();
                        }
                    }
                    break;
                case 'setting': {
                    if (item.type === 'prompt') {
                        const result = await prompt({
                            title: getTitle(item),
                            message: item.full_description || item.description,
                            okButtonText: l('save'),
                            cancelButtonText: l('cancel'),
                            textFieldProperties: item.textFieldProperties,
                            autoFocus: true,
                            defaultText: typeof item.rightValue === 'function' ? item.rightValue() : item.default
                        });
                        Utils.dismissSoftInput();
                        if (result) {
                            if (result.result && result.text.length > 0) {
                                if (item.valueType === 'string') {
                                    ApplicationSettings.setString(item.key, result.text);
                                } else {
                                    ApplicationSettings.setNumber(item.key, parseInt(result.text, 10));
                                }
                            } else {
                                ApplicationSettings.remove(item.key);
                            }
                            updateItem(item);
                        }
                    } else {
                        const result = await showAlertOptionSelect(
                            {
                                height: Math.min(item.values.length * 56, 400),
                                rowHeight: 56,
                                options: item.values.map((k) => ({
                                    name: k.title,
                                    data: k.value,
                                    boxType: 'circle',
                                    type: 'checkbox',
                                    value: (item.currentValue?.() ?? item.currentValue) === k.value
                                }))
                            },
                            {
                                title: item.title,
                                message: item.full_description
                            }
                        );
                        // const OptionSelect = (await import('~/components/common/OptionSelect.svelte')).default;
                        // const result = await showBottomSheet<any>({
                        //     parent: null,
                        //     view: OptionSelect,
                        //     props: {
                        //         options: item.values.map((k) => ({ name: k.title, data: k.value }))
                        //     },
                        //     trackingScrollView: 'collectionView'
                        // });
                        if (result?.data !== undefined) {
                            if (item.valueType === 'string') {
                                ApplicationSettings.setString(item.key, result.data);
                            } else {
                                ApplicationSettings.setNumber(item.key, parseInt(result.data, 10));
                            }
                            updateItem(item);
                        }
                    }

                    break;
                }
                default: {
                    const needsUpdate = await item.onTap?.(item, event);
                    if (needsUpdate) {
                        updateItem(item);
                    }
                    break;
                }
            }
        } catch (err) {
            showError(err);
        } finally {
            hideLoading();
        }
    }
    onLanguageChanged(refresh);

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

    let ignoreNextOnCheckBoxChange = false;
    async function onCheckBox(item, event) {
        if (ignoreNextOnCheckBoxChange || item.value === event.value) {
            return;
        }
        const value = event.value;
        item.value = value;
        clearCheckboxTimer();
        DEV_LOG && console.log('onCheckBox', item.id, value);
        try {
            ignoreNextOnCheckBoxChange = true;
            switch (item.id) {
                default:
                    DEV_LOG && console.log('updating setting for checkbox', item.id, item.key, value);
                    ApplicationSettings.setBoolean(item.key || item.id, value);
                    break;
            }
        } catch (error) {
            showError(error);
        } finally {
            ignoreNextOnCheckBoxChange = false;
        }
    }
    function refreshCollectionView() {
        collectionView?.nativeView?.refresh();
    }
    onThemeChanged(refreshCollectionView);

    async function onItemReordered(e) {
        try {
            const newIndex = e.data.targetIndex;
            const disabledPosition = items.findIndex((d) => d.id === 'disabled');
            const enabledPosition = items.findIndex((d) => d.id === 'enabled');
            weatherDataService.updateCurrentWeatherData([...items.slice(enabledPosition + 1, disabledPosition)].map((d) => d.id));
        } catch (error) {
            showError(error);
        }
    }
    function onItemReorderStarting(e) {
        e.returnValue = e.item.reorder === true && e.item.id !== 'disabled';
    }
    function onItemReorderCheck(e) {
        e.returnValue = e.item.reorder;
    }

    function startReordering(item, event: TouchGestureEventData) {
        if (event.action === 'down') {
            const index = items.indexOf(item);
            collectionView.nativeView.startDragging(index, event.getActivePointers()[0]);
        }
    }
</script>

<page bind:this={page} id={title || $slc('settings.title')} actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <collectionview
            bind:this={collectionView}
            accessibilityValue="settingsCV"
            itemTemplateSelector={selectTemplate}
            {items}
            {reorderEnabled}
            row={1}
            android:paddingBottom={windowInsetBottom}
            on:itemReordered={onItemReordered}
            on:itemReorderCheck={onItemReorderCheck}
            on:itemReorderStarting={onItemReorderStarting}>
            <Template key="header" let:item>
                <gridlayout rows="auto,auto">
                    <gridlayout columns="*,auto,auto" margin="10 16 0 16">
                        <stacklayout
                            backgroundColor="#ea4bae"
                            borderRadius={10}
                            orientation="horizontal"
                            padding={10}
                            rippleColor="white"
                            verticalAlignment="center"
                            on:tap={(event) => onTap({ id: 'sponsor' }, event)}>
                            <label color="white" fontFamily={$fonts.mdi} fontSize={26} marginRight={10} text="mdi-heart" verticalAlignment="center" />
                            <label color="white" fontSize={12} text={item.title} textWrap={true} verticalAlignment="center" />
                        </stacklayout>
                        {#if __ANDROID__}
                            <image
                                borderRadius={6}
                                col={1}
                                height={40}
                                margin="0 10 0 10"
                                rippleColor="white"
                                src="~/assets/images/librepay.png"
                                verticalAlignment="center"
                                on:tap={(event) => onTap({ id: 'sponsor', type: 'librepay' }, event)} />
                            <image borderRadius={6} col={2} height={40} rippleColor="#f96754" src="~/assets/images/patreon.png" on:tap={(event) => onTap({ id: 'sponsor', type: 'patreon' }, event)} />
                        {/if}
                    </gridlayout>

                    <stacklayout horizontalAlignment="center" marginBottom={0} marginTop={20} row={1} verticalAlignment="center">
                        <absolutelayout backgroundColor={iconColor} borderRadius="50%" height={50} horizontalAlignment="center" width={50} />
                        <label fontSize={13} marginTop={4} text={version} on:longPress={(event) => onLongPress('version', event)} />
                    </stacklayout>
                </gridlayout>
            </Template>
            <Template key="sectionheader" let:item>
                <label class="sectionHeader" text={item.title} />
            </Template>
            <Template key="switch" let:item>
                <ListItemAutoSize fontSize={20} leftIcon={item.icon} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <switch id="checkbox" checked={item.value} col={1} marginLeft={10} on:checkedChange={(e) => onCheckBox(item, e)} ios:backgroundColor={colorPrimary} />
                </ListItemAutoSize>
            </Template>
            <Template key="checkbox" let:item>
                <ListItemAutoSize fontSize={20} leftIcon={item.icon} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <checkbox id="checkbox" checked={item.value} col={1} marginLeft={10} on:checkedChange={(e) => onCheckBox(item, e)} />
                </ListItemAutoSize>
            </Template>
            <Template key="rightIcon" let:item>
                <ListItemAutoSize fontSize={20} showBottomLine={false} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <IconButton col={1} text={item.rightBtnIcon} on:tap={(event) => onRightIconTap(item, event)} />
                </ListItemAutoSize>
            </Template>
            <Template key="reorder" let:item>
                <ListItemAutoSize fontSize={20} showBottomLine={false} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <label col={1} fontFamily={$fonts.mdi} fontSize={24} padding={4} text="mdi-dots-grid" verticalAlignment="center" on:touch={(event) => startReordering(item, event)} />
                </ListItemAutoSize>
            </Template>
            <Template key="leftIcon" let:item>
                <ListItemAutoSize
                    columns="auto,*,auto"
                    fontSize={20}
                    leftIcon={item.icon}
                    mainCol={1}
                    rightValue={item.rightValue}
                    showBottomLine={false}
                    subtitle={getDescription(item)}
                    title={getTitle(item)}
                    on:tap={(event) => onTap(item, event)}>
                    <label col={0} fontFamily={$fonts.mdi} fontSize={24} padding="0 10 0 0" text={item.icon} verticalAlignment="center" />
                </ListItemAutoSize>
            </Template>
            <Template key="image" let:item>
                <ListItemAutoSize fontSize={20} showBottomLine={false} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <image col={1} height={45} src={item.image()} />
                </ListItemAutoSize>
            </Template>
            <Template let:item>
                <ListItemAutoSize fontSize={20} rightValue={item.rightValue} showBottomLine={false} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                </ListItemAutoSize>
            </Template>
        </collectionview>
        <CActionBar canGoBack title={title || $slc('settings.title')}>
            {#each actionBarButtons as button}
                <mdbutton class="actionBarButton" text={button.icon} variant="text" on:tap={(event) => onTap({ id: button.id }, event)} />
            {/each}
        </CActionBar>
    </gridlayout>
</page>
