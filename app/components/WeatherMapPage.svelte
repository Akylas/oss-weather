<script context="module" lang="ts">
    import { AWebView } from '@nativescript-community/ui-webview';
    import { ApplicationSettings, Screen } from '@nativescript/core';
    import { getString } from '@nativescript/core/application-settings';
    import { showError } from '@shared/utils/showError';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { VerticalPosition } from '@nativescript-community/ui-popover';
    import { SETTINGS_WEATHER_MAP_ANIMATION_SPEED, SETTINGS_WEATHER_MAP_COLORS, WEATHER_MAP_ANIMATION_SPEED, WEATHER_MAP_COLORS, WEATHER_MAP_COLOR_SCHEMES } from '~/helpers/constants';
    import { lc } from '~/helpers/locale';
    import { hideLoading, showAlertOptionSelect, showLoading, showPopoverMenu } from '~/utils/ui';
    import { actionBarHeight, screenWidthDips, systemFontScale } from '~/variables';
    import { debounce } from '@nativescript/core/utils';
    import { rowHeightProperty } from '@akylas/nativescript/ui/list-view';
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
        url = `~/assets/map/index.html?zoom=${zoom}&animated=${animated}&animationSpeed=${animationSpeed}&colors=${colors}&position=${focusPos.lat},${focusPos.lon}&mapCenter=${mapCenter.lat},${mapCenter.lon}&owm_key=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}`;
    }
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

    async function seletMapColors() {
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
        const result = await showAlertOptionSelect(
            {
                height: Math.min(values.length * 56, 400),
                rowHeight: 56,
                selectedIndex,
                options
            },
            {
                title: lc('weather_map_colors')
            }
        );
        if (result?.data !== undefined) {
            await saveCurrentMapParameters();
            colors = parseInt(result.data, 10);
            ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_COLORS, colors);
        }
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
                    value: animationSpeed,
                    step: 1,
                    min: 50,
                    max: 1000
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
                    width: screenWidthDips * 0.7,
                    autoSizeListItem: true,
                    height: 'auto'
                },
                onChange: debounce(async (item, value) => {
                    try {
                        switch (item.id) {
                            case SETTINGS_WEATHER_MAP_ANIMATION_SPEED:
                                ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_ANIMATION_SPEED, value);
                                callJSFunction<any>('setAnimationSpeed', value);
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
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <CActionBar title={lc('weather_map')}>
            <mdbutton class="actionBarButton" text="mdi-palette" variant="text" verticalAlignment="middle" on:tap={seletMapColors} />
            <mdbutton class="actionBarButton" text="mdi-dots-vertical" variant="text" verticalAlignment="middle" on:tap={showOptions} />
        </CActionBar>
        <webview bind:this={webView} debugMode={consoleEnabled} displayZoomControls={false} normalizeUrls={false} row={1} src={url} webConsoleEnabled={consoleEnabled} />
    </gridlayout>
</page>
