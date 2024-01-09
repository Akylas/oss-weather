<script lang="ts">
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { openFilePicker, saveFile } from '@nativescript-community/ui-document-picker';
    import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { confirm, prompt } from '@nativescript-community/ui-material-dialogs';
    import { ApplicationSettings, File, ObservableArray, Utils, View } from '@nativescript/core';
    import dayjs from 'dayjs';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import ListItemAutoSize from '~/components/common/ListItemAutoSize.svelte';
    import { clock_24, getLocaleDisplayName, l, lc, onLanguageChanged, selectLanguage, slc } from '~/helpers/locale';
    import { getThemeDisplayName, onThemeChanged, selectTheme } from '~/helpers/theme';
    import { getProvider, getProviderType, providers } from '~/services/weatherproviderfactory';
    import { showError } from '~/utils/error';
    import { share } from '~/utils/share';
    import { openLink, showAlertOptionSelect } from '~/utils/ui';
    import { colors, fonts, iconColor, imperial, navigationBarHeight } from '~/variables';

    const version = __APP_VERSION__ + ' Build ' + __APP_BUILD_NUMBER__;

    // technique for only specific properties to get updated on store change
    let { colorPrimary, colorOutlineVariant, colorOnSurface, colorOnSurfaceVariant } = $colors;
    $: ({ colorPrimary, colorOutlineVariant, colorOnSurface, colorOnSurfaceVariant } = $colors);

    let collectionView: NativeViewElementNode<CollectionView>;

    let items: ObservableArray<any>;

    function getTitle(item) {
        switch (item.id) {
            case 'token':
                return lc(item.token);
            default:
                return item.title;
        }
    }
    function getDescription(item) {
        return typeof item.description === 'function' ? item.description() : item.description;
    }
    function refresh() {
        const newItems: any[] = [
            {
                type: 'header'
            },
            {
                id: 'language',
                description: getLocaleDisplayName,
                title: lc('language')
            },
            {
                id: 'dark_mode',
                description: getThemeDisplayName,
                title: lc('theme.title')
            },
            {
                key: 'provider',
                id:'setting',
                description: () => lc('provider.' + getProviderType()),
                title: lc('provider.title'),
                currentValue: getProviderType,
                values:providers.map(t=>({value:t, title:lc(t)}))
            },
            {
                type: 'switch',
                id: 'imperial',
                title: lc('imperial_units'),
                value: $imperial
            },
            {
                type: 'switch',
                id: 'metric_temp_decimal',
                title: lc('metric_temp_decimal'),
                value: ApplicationSettings.getBoolean('metric_temp_decimal', false)
            },
            {
                type: 'switch',
                id: 'animations',
                title: lc('animations'),
                value: ApplicationSettings.getBoolean('animations', false)
            },
            {
                type: 'switch',
                id: 'clock_24',
                title: lc('clock_24'),
                value: clock_24
            },
            {
                type: 'prompt',
                valueType:'string',
                id:'setting',
                key: 'owmApiKey',
                description: lc('api_key_required_description'),
                title: lc('owm_api_key')
            }
        ]
            .concat(
                PLAY_STORE_BUILD
                    ? [
                          //   {
                          //       id: 'share',
                          //       rightBtnIcon: 'mdi-chevron-right',
                          //       title: lc('share_application')
                          //   },
                          {
                              id: 'review',
                              rightBtnIcon: 'mdi-chevron-right',
                              title: lc('review_application')
                          }
                      ]
                    : ([] as any)
            )
            .concat([
                // {
                //     id: 'version',
                //     title: lc('version'),
                //     description: __APP_VERSION__ + ' Build ' + __APP_BUILD_NUMBER__
                // },
                // {
                //     id: 'github',
                //     rightBtnIcon: 'mdi-chevron-right',
                //     title: lc('source_code'),
                //     description: lc('get_app_source_code')
                // },
                {
                    id: 'third_party',
                    // rightBtnIcon: 'mdi-chevron-right',
                    title: lc('third_parties'),
                    description: lc('list_used_third_parties')
                }
            ] as any);

        items = new ObservableArray(newItems);
    }
    refresh();

    async function onLongPress(item, event) {
        try {
            switch (item.id) {
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
            switch (item.id) {
                case 'github':
                    openLink(GIT_URL);
                    break;
                case 'language':
                    await selectLanguage();
                    break;
                case 'dark_mode':
                    await selectTheme();
                    if (__IOS__) {
                        refresh();
                    }
                    break;
                case 'share':
                    share({
                        message: GIT_URL
                    });
                    break;
                case 'review':
                    openLink(STORE_REVIEW_LINK);
                    break;
                case 'sponsor':
                    openLink(SPONSOR_URL);
                    break;
                case 'third_party':
                    const ThirdPartySoftwareBottomSheet = (await import('~/components/settings/ThirdPartySoftwareBottomSheet.svelte')).default;
                    showBottomSheet({
                        parent: this,
                        view: ThirdPartySoftwareBottomSheet,
                        ignoreTopSafeArea: true,
                        trackingScrollView: 'trackingScrollView'
                    });
                    break;

                case 'setting': {
                    if (item.type === 'prompt') {
                        const result = await prompt({
                            title: getTitle(item),
                            message: item.full_description || item.description,
                            okButtonText: l('save'),
                            cancelButtonText: l('cancel'),
                            autoFocus: true,
                            defaultText: item.valueType === 'string' ? ApplicationSettings.getString(item.key, item.default) : (ApplicationSettings.getNumber(item.key, item.default) + '')
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
                         const component = (await import('~/components/common/OptionSelect.svelte')).default;
                        const result = await showAlertOptionSelect(
                            component,
                            {
                                height: item.values.length * 56,
                                rowHeight: 56,
                                options: item.values.map((k) => ({ name: k.title, data: k.value,  boxType: 'circle',
                        type: 'checkbox', value: (item.currentValue?.() ??item.currentValue ) === k.value}))
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
                        if (result) {
                            ApplicationSettings.setString(item.key, result.data);
                            updateItem(item);
                        }
                    }

                    break;
                }
            }
        } catch (err) {
            showError(err);
        }
    }
    onLanguageChanged(refresh);

    function selectTemplate(item, index, items) {
        if (item.type === 'prompt') {
            return 'default';
        }
        return item.type || 'default';
    }

    async function onCheckBox(item, event) {
        const value = event.value;
        if (checkboxTapTimer) {
            clearTimeout(checkboxTapTimer);
            checkboxTapTimer = null;
        }
        try {
            switch (item.id) {
                default:
                    ApplicationSettings.setBoolean(item.key || item.id, value);
                    break;
            }
        } catch (error) {
            showError(error);
        }
    }
    // function refreshCollectionView() {
    //     console.log('refreshCollectionView');
    //     const nativeView = collectionView?.nativeView;
    //     if (nativeView) {
    //         items.forEach((item, index)=>{
    //         if (item.type === 'switch') {
    //             nativeView.getViewForItemAtIndex(index).getViewById('checkbox')?.updateTheme?.();
    //         }
    //     });
    //     }
    // }
    // onThemeChanged(refreshCollectionView);
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <collectionview bind:this={collectionView} itemTemplateSelector={selectTemplate} {items} row={1} android:paddingBottom={$navigationBarHeight}>
            <Template key="header" let:item>
                <gridlayout rows="auto,auto">
                    <stacklayout
                        backgroundColor="#ea4bae"
                        borderRadius={10}
                        horizontalAlignment="center"
                        margin="10 16 0 16"
                        orientation="horizontal"
                        padding={10}
                        rippleColor="white"
                        verticalAlignment="center"
                        on:tap={(event) => onTap({ id: 'sponsor' }, event)}>
                        <label color="white" fontFamily={$fonts.mdi} fontSize={26} marginRight={10} text="mdi-heart" verticalAlignment="center" />
                        <label color="white" fontSize={12} text={lc('donate')} verticalAlignment="center" />
                    </stacklayout>

                    <stacklayout horizontalAlignment="center" marginBottom={0} marginTop={20} row={1} verticalAlignment="center">
                        <absolutelayout backgroundColor={iconColor} borderRadius="50%" height={50} width={50} />
                        <label fontSize={13} marginTop={4} text={version} />
                    </stacklayout>
                </gridlayout>
            </Template>
            <Template key="switch" let:item>
                <ListItemAutoSize leftIcon={item.icon} mainCol={1} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <switch id="checkbox" checked={item.value} col={2} on:checkedChange={(e) => onCheckBox(item, e)} />
                </ListItemAutoSize>
            </Template>
            <Template key="checkbox" let:item>
                <ListItemAutoSize leftIcon={item.icon} mainCol={1} subtitle={getDescription(item)} title={getTitle(item)} on:tap={(event) => onTap(item, event)}>
                    <checkbox id="checkbox" checked={item.value} col={2} on:checkedChange={(e) => onCheckBox(item, e)} />
                </ListItemAutoSize>
            </Template>
            <Template let:item>
                <ListItemAutoSize
                    leftIcon={item.icon}
                    rightIcon={item.rightBtnIcon}
                    rightValue={item.rightValue}
                    showBottomLine={false}
                    subtitle={getDescription(item)}
                    title={getTitle(item)}
                    on:tap={(event) => onTap(item, event)}
                    on:longPress={(event) => onLongPress(item, event)}>
                </ListItemAutoSize>
            </Template>
            <!-- <Template key="switch" let:item>
                <gridlayout columns="*,auto" padding="10 16 10 16">
                    <stacklayout verticalAlignment="middle" on:tap={(event) => onTap(item, event)}>
                        <label fontSize={17} fontWeight="bold" lineBreak="end" maxLines={1} text={getTitle(item)} verticalTextAlignment="top" />
                        <label
                            color={colorOnSurfaceVariant}
                            fontSize={14}
                            lineBreak="end"
                            text={item.description}
                            verticalTextAlignment="top"
                            visibility={item.description?.length > 0 ? 'visible' : 'collapsed'} />
                    </stacklayout>
                    <checkbox id="checkbox" checked={item.value} col={1} on:checkedChange={(e) => onCheckBox(item, e.value)} />
                </gridlayout>
            </Template>
            <Template let:item>
                <gridlayout columns="auto,*,auto" padding="10 16 10 16" rippleColor={colorOnSurface} on:tap={(event) => onTap(item, event)} on:longPress={(event) => onLongPress(item.id, item)}>
                    <label fontFamily={$fonts.mdi} fontSize={36} marginLeft="-10" text={item.icon} verticalAlignment="middle" visibility={!!item.icon ? 'visible' : 'hidden'} width={40} />
                    <stacklayout col={1} height={item.description?.length > 0 ? 'auto' : 50} marginLeft="10" verticalAlignment="middle">
                        <label color={colorOnSurface} fontSize={17} fontWeight="bold" lineBreak="end" maxLines={1} text={getTitle(item)} textWrap="true" verticalTextAlignment="top" />
                        <label color={colorOnSurfaceVariant} fontSize={14} lineBreak="end" text={item.description} verticalTextAlignment="top" />
                    </stacklayout>

                    <label
                        col={2}
                        color={colorOnSurfaceVariant}
                        marginLeft={16}
                        marginRight={16}
                        text={item.rightValue && item.rightValue()}
                        verticalAlignment="center"
                        visibility={!!item.rightValue ? 'visible' : 'collapsed'} />
                    <label
                        col={2}
                        color={colorOutlineVariant}
                        fontFamily={$fonts.mdi}
                        fontSize={30}
                        horizontalAlignment="right"
                        marginLeft={16}
                        marginRight={16}
                        text={item.rightBtnIcon}
                        verticalAlignment="center"
                        visibility={!!item.rightBtnIcon ? 'visible' : 'hidden'}
                        width={25} />
                </gridlayout>
            </Template> -->
        </collectionview>
        <CActionBar canGoBack title={lc('settings.title')}>
            <mdbutton class="actionBarButton" text="mdi-share-variant" variant="text" on:tap={(event) => onTap({ id: 'share' }, event)}/>
            <mdbutton class="actionBarButton" text="mdi-github" variant="text" on:tap={(event) => onTap({ id: 'github' }, event)}/>
        </CActionBar>
    </gridlayout>
</page>
