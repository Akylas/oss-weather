<script context="module" lang="ts">
    import { Page } from '@nativescript/core';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { l } from '~/helpers/locale';
    import CActionBar from './CActionBar.svelte';
</script>

<script lang="ts">
    import { getString } from '@nativescript/core/application-settings';

    export let focusPos;
    let page: NativeViewElementNode<Page>;
    let url = '~/assets/leaflet/index.html';
    function onNavigatingTo(e) {}
    $: {
        url = `~/assets/leaflet/index.html?zoom=8&position=${focusPos.lat},${focusPos.lon}&owm_key=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}`;
    }
</script>

<page bind:this={page} actionBarHidden="true" on:navigatingTo={onNavigatingTo}>
    <gridLayout rows="auto,*">
        <CActionBar title={l('weather_map')} />
        <webview row="1" ref="webview" src={url} />
    </gridLayout>
</page>
