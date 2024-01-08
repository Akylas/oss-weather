<script context="module" lang="ts">
    import { getString } from '@nativescript/core/application-settings';
    import { lc } from '~/helpers/locale';
    import CActionBar from '~/components/common/CActionBar.svelte';
</script>

<script lang="ts">
    export let focusPos: { lat: number; lon: number };
    let url = '~/assets/map/index.html';
    $: url = `~/assets/map/index.html?zoom=8&position=${focusPos.lat},${focusPos.lon}&owm_key=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}`;

</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <CActionBar title={lc('weather_map')} />
        <webview ref="webview" row={1} src={url}/>
    </gridlayout>
</page>
