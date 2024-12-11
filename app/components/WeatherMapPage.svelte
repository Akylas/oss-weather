<script context="module" lang="ts">
    import { AWebView } from '@nativescript-community/ui-webview';
    import { ApplicationSettings, Screen } from '@nativescript/core';
    import { getString } from '@nativescript/core/application-settings';
    import { showError } from '@shared/utils/showError';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import {
        SETTINGS_WEATHER_MAP_ANIMATION_SPEED,
        SETTINGS_WEATHER_MAP_COLORS,
        SETTINGS_WEATHER_MAP_LAYER_OPACITY,
        WEATHER_MAP_ANIMATION_SPEED,
        WEATHER_MAP_COLORS,
        WEATHER_MAP_COLOR_SCHEMES,
        WEATHER_MAP_LAYER_OPACITY
    } from '~/helpers/constants';
    import { l, lc } from '~/helpers/locale';
    import { hideLoading, openLink, showAlertOptionSelect, showLoading, showPopoverMenu } from '~/utils/ui';
    import { actionBarHeight, screenWidthDips, systemFontScale, windowInset } from '~/variables';
    import { debounce } from '@nativescript/core/utils';
    import { rowHeightProperty } from '@akylas/nativescript/ui/list-view';
    import { closePopover } from '@nativescript-community/ui-popover/svelte';
    import { currentTheme, isDarkTheme, sTheme } from '~/helpers/theme';
</script>

<script lang="ts">
    export let focusPos: { lat: number; lon: number };
    let webView: NativeViewElementNode<AWebView>;
    let url = '~/assets/map/index.html';
    let zoom = 8;
    let mapCenter = focusPos;
    let animated = false;
    let colors = ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_COLORS, WEATHER_MAP_COLORS);
    const animationSpeed = ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_ANIMATION_SPEED, WEATHER_MAP_ANIMATION_SPEED);
    $: {
        url = `~/assets/map/index.html?zoom=${zoom}&animated=${animated}&animationSpeed=${animationSpeed}&colors=${colors}&position=${focusPos.lat},${focusPos.lon}&mapCenter=${mapCenter.lat},${mapCenter.lon}&dark=${$currentTheme}`;
    }
    $: DEV_LOG && console.log('currentTheme', $currentTheme);
    $: DEV_LOG && console.log('url', url);
    const consoleEnabled = !PRODUCTION;

    function callJSFunction<T>(method: string, ...args) {
        // DEV_LOG && console.log('callJSFunction', method, `${method}(${args ? args.map((s) => (typeof s === 'string' ? `"${s}"` : s)).join(',') : ''})`);
        const nView = webView?.nativeView;
        if (!nView) {
            return;
        }
        try {
            return nView.executeJavaScript<T>(`${method}(${args ? args.map((s) => (typeof s === 'string' ? `"${s}"` : s)).join(',') : ''})`);
        } catch (err) {
            showError(err);
        }
    }

    async function seletMapColors(event) {
        const values = WEATHER_MAP_COLOR_SCHEMES;
        const currentValue = ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_COLORS, WEATHER_MAP_COLORS);
        let selectedIndex = -1;
        const options = values.map((k, index) => {
            const selected = currentValue === k.value;
            if (selected) {
                selectedIndex = index;
            }
            return {
                name: k.title,
                data: k.value,
                boxType: 'circle',
                type: 'checkbox',
                value: selected
            };
        });
        const result = await showPopoverMenu({
            options,
            anchor: event.object,
            vertPos: VerticalPosition.BELOW,
            props: {
                async onCheckBox(item, value, e) {
                    closePopover();
                    DEV_LOG && console.log('onCheckBox', item, value);
                    if (item !== undefined) {
                        await saveCurrentMapParameters();
                        colors = parseInt(item.data, 10);
                        ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_COLORS, colors);
                    }
                },
                selectedIndex
            }
        });
    }

    async function saveCurrentMapParameters() {
        if (webView?.nativeView) {
            const parameters = await callJSFunction<any>('getParameters');
            zoom = parameters.zoom;
            mapCenter = { lat: parameters.mapCenter.lat, lon: parameters.mapCenter.lng };
            animated = parameters.animated;
            // { zoom } = JSON.parse(parameters);
        }
    }

    async function showOptions(event) {
        try {
            const options = [
                {
                    type: 'slider',
                    icon: 'mdi-animation',
                    id: SETTINGS_WEATHER_MAP_ANIMATION_SPEED,
                    title: lc('animation_speed'),
                    value: WEATHER_MAP_ANIMATION_SPEED / ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_ANIMATION_SPEED, WEATHER_MAP_ANIMATION_SPEED),
                    min: 0.1,
                    max: 2,
                    valueFormatter: (value) => value.toFixed(2),
                    transformValue: (value) => Math.round(WEATHER_MAP_ANIMATION_SPEED / value)
                },
                {
                    type: 'slider',
                    icon: 'mdi-opacity',
                    id: SETTINGS_WEATHER_MAP_LAYER_OPACITY,
                    title: lc('layer_opacity'),
                    value: ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_LAYER_OPACITY, WEATHER_MAP_LAYER_OPACITY),
                    min: 0,
                    max: 1,
                    valueFormatter: (value) => value.toFixed(2),
                    transformValue: (value) => value
                }
                // {
                //     icon: 'mdi-information-outline',
                //     id: 'about',
                //     text: l('about')
                // }
            ];

            await showPopoverMenu({
                options,
                anchor: event.object,
                vertPos: VerticalPosition.BELOW,
                props: {
                    height: 'auto',
                    estimatedItemSize: false,
                    autoSize: true,
                    isScrollEnabled: false,
                    width: screenWidthDips * 0.7,
                    autoSizeListItem: true
                },
                onChange: debounce(async (item, value) => {
                    DEV_LOG && console.log('onChange', value, item.step);
                    if (item.transformValue) {
                        value = item.transformValue(value, item);
                    } else {
                        value = Math.round(value / item.step) * item.step;
                    }
                    DEV_LOG && console.log('onChange1', value);
                    try {
                        switch (item.id) {
                            case SETTINGS_WEATHER_MAP_ANIMATION_SPEED:
                                ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_ANIMATION_SPEED, value);
                                callJSFunction<any>('setAnimationSpeed', value);
                                break;

                            case SETTINGS_WEATHER_MAP_LAYER_OPACITY:
                                ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_LAYER_OPACITY, value);
                                callJSFunction<any>('setLayerOpacity', value);
                                break;

                            default:
                                break;
                        }
                    } catch (error) {
                        showError(error);
                    }
                }, 100),
                onClose: async (item) => {
                    try {
                        if (item) {
                            switch (item.id) {
                            }
                        }
                    } catch (error) {
                        showError(error);
                    } finally {
                        hideLoading();
                    }
                }
            });
        } catch (error) {
            showError(error);
        }
    }
    function shouldOverrideUrlLoading(e: { cancel; url }) {
        if (/http(s):\/\//.test(e.url)) {
            e.cancel = true;
            openLink(e.url);
        }
    }
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*" android:paddingBottom={$windowInset.bottom}>
        <CActionBar title={lc('weather_map')}>
            <mdbutton class="actionBarButton" text="mdi-palette" variant="text" verticalAlignment="middle" on:tap={seletMapColors} />
            <mdbutton class="actionBarButton" text="mdi-dots-vertical" variant="text" verticalAlignment="middle" on:tap={showOptions} />
        </CActionBar>
        <webview
            bind:this={webView}
            debugMode={consoleEnabled}
            displayZoomControls={false}
            normalizeUrls={false}
            row={1}
            src={url}
            webConsoleEnabled={consoleEnabled}
            on:shouldOverrideUrlLoading={shouldOverrideUrlLoading} />
    </gridlayout>
</page>
