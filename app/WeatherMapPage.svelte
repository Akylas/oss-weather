<script context="module" lang="ts">
    import { Page } from '@nativescript/core';
    import { getString } from '@nativescript/core/application-settings';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { lc } from '~/helpers/locale';
    import CActionBar from './CActionBar.svelte';
</script>

<script lang="ts">
    export let focusPos: { lat: number; lon: number };
    let url = '~/assets/leaflet/index.html';
    $: {
        url = `~/assets/leaflet/index.html?zoom=8&position=${focusPos.lat},${focusPos.lon}&owm_key=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}`;
    }
</script>

<page actionBarHidden={true}>
    <gridLayout rows="auto,*">
        <CActionBar title={lc('weather_map')} />
        <webview row={1} ref="webview" src={url} />
    </gridLayout>
</page>
