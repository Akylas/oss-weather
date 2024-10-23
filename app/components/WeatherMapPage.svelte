<script context="module" lang="ts">
    import { AWebView } from '@nativescript-community/ui-webview';
    import { ApplicationSettings } from '@nativescript/core';
    import { getString } from '@nativescript/core/application-settings';
    import { showError } from '@shared/utils/showError';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { SETTINGS_WEATHER_MAP_COLORS, WEATHER_MAP_COLORS, WEATHER_MAP_COLOR_SCHEMES } from '~/helpers/constants';
    import { lc } from '~/helpers/locale';
    import { showAlertOptionSelect } from '~/utils/ui';
</script>

<script lang="ts">
    export let focusPos: { lat: number; lon: number };
    let webView: NativeViewElementNode<AWebView>;
    let url = '~/assets/map/index.html';
    let zoom = 8;
    let colors = ApplicationSettings.getNumber(SETTINGS_WEATHER_MAP_COLORS, WEATHER_MAP_COLORS);
    $: {
        url = `~/assets/map/index.html?zoom=${zoom}&colors=${colors}&position=${focusPos.lat},${focusPos.lon}&owm_key=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}`;
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
            if (webView?.nativeView) {
                zoom = await callJSFunction('getZoom');
            }
            colors = parseInt(result.data, 10);
            ApplicationSettings.setNumber(SETTINGS_WEATHER_MAP_COLORS, colors);
        }
    }
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <CActionBar title={lc('weather_map')}>
            <mdbutton class="actionBarButton" text="mdi-palette" variant="text" verticalAlignment="middle" on:tap={seletMapColors} />
        </CActionBar>
        <webview bind:this={webView} debugMode={consoleEnabled} displayZoomControls={false} normalizeUrls={false} row={1} src={url} webConsoleEnabled={consoleEnabled} />
    </gridlayout>
</page>
