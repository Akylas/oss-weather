<script context="module" lang="ts">
    import { PersistentCacheTileDataSource } from '@nativescript-community/ui-carto/datasources/cache';
    import { HTTPTileDataSource } from '@nativescript-community/ui-carto/datasources/http';
    import { RasterTileLayer } from '@nativescript-community/ui-carto/layers/raster';
    import { Folder, knownFolders, path } from '@nativescript/core/file-system';
    import { l } from '~/helpers/locale';
    import CActionBar from './CActionBar.svelte';
    import { CartoMap } from '@nativescript-community/ui-carto/ui';
    import { getString } from '@akylas/nativescript/application-settings';
    import { Page } from '@akylas/nativescript';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { setShowDebug, setShowError, setShowInfo, setShowWarn } from '@nativescript-community/ui-carto/utils';
    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
    const dataSource = new PersistentCacheTileDataSource({
        dataSource: new HTTPTileDataSource({
            minZoom: 2,
            subdomains: 'abc',
            maxZoom: 18,
            url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        }),
        databasePath: path.join(cacheFolder.path, 'cache.db'),
    });
</script>

<script lang="ts">
    export let focusPos;
    let cartoMap: CartoMap;
    let page: NativeViewElementNode<Page>;

    function onMapReady(event) {
        setShowDebug(true);
        cartoMap = event.object as CartoMap;
        const options = cartoMap.getOptions();
        options.setZoomGestures(true);
        options.setWatermarkScale(0.5);
        const rasterLayer = new RasterTileLayer({ dataSource });

        const dataSourceRadar = new HTTPTileDataSource({
            minZoom: 4,
            subdomains: 'abc',
            maxZoom: 10,
            url: `https://{s}.sat.owm.io/vane/2.0/weather/PA0/{z}/{x}/{y}?appid=${getString('owmApiKey', OWM_MY_KEY || OWM_DEFAULT_KEY)}&palette=0:00000000;0.1:C8969620;0.2:9696AA30;0.5:7878BE40;1:6E6ECD70;10:5050E1B2;140:1414FFE5&opacity=0.8`,
        });
        const rasterLayerRadar = new RasterTileLayer({ dataSource: dataSourceRadar });

        cartoMap.addLayer(rasterLayer);
        cartoMap.addLayer(rasterLayerRadar);
        cartoMap.setFocusPos(focusPos, 0);
    }
    console.log('creating map instance');
    function onNavigatingTo(e) {
        console.log('onNavigatingTo', page && page.nativeView, e.object);
    }

    $: {
        //update if focusPos change (cell reuse)
        if (cartoMap) {
            cartoMap.setFocusPos(focusPos, 0);
        }
    }
</script>

<!-- <frame backgroundColor="transparent"> -->
<page bind:this={page} actionBarHidden="true" on:navigatingTo={onNavigatingTo}>
    <gridLayout rows="auto,*">
        <CActionBar title={l('weather_map')} />
        <cartomap row="1" zoom="8" on:mapReady={onMapReady} />
    </gridLayout>
</page>
<!-- </frame> -->
