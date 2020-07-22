<script context="module" lang="ts">
    import { Folder, knownFolders, path } from '@nativescript/core/file-system';
    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
</script>

<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { IMapPos } from '~/helpers/geo';
    import { showError } from '~/utils/error';
    import { action, alert, confirm, prompt } from 'nativescript-material-dialogs';
    import { photonSearch } from '~/services/api';
    import { Page } from '@nativescript/core/ui/page';
    import { l } from '~/helpers/locale';
    import { closeModal, goBack } from 'svelte-native';
    import { darkColor, primaryColor } from '~/variables';
    import CActionBar from './CActionBar.svelte';
    import { Point } from 'nativescript-carto/vectorelements/point';
    import { LocalVectorDataSource } from 'nativescript-carto/datasources/vector';
    import { RasterTileLayer } from 'nativescript-carto/layers/raster';
    import { VectorLayer } from 'nativescript-carto/layers/vector';
    import { PersistentCacheTileDataSource } from 'nativescript-carto/datasources/cache';
    import { HTTPTileDataSource } from 'nativescript-carto/datasources/http';

    export let focusPos;
    let loading = false;

    function onMapReady(event) {
        const cartoMap = event.object;
        const options = cartoMap.getOptions();
        options.setWatermarkScale(0);
        options.setEnvelopeThreadPoolSize(2);
        options.setTileThreadPoolSize(2);

        const dataSource = new PersistentCacheTileDataSource({
            dataSource: new HTTPTileDataSource({
                minZoom: 2,
                subdomains: 'abc',
                maxZoom: 18,
                url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
            }),
            databasePath: cacheFolder.path
        });

        const rasterLayer = new RasterTileLayer({ dataSource });

        cartoMap.addLayer(rasterLayer);

        // always add it at 1 to respect local order
        focusPos && cartoMap.setFocusPos(focusPos);
    }
</script>

<frame>
    <page actionBarHidden="true">
        <gridLayout rows="auto,auto,*">
            <CActionBar title={l('select_location')} modalWindow={true}>
                <activityIndicator color="white" busy={loading} verticalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
            </CActionBar>
            <label row="1" text={l('click_on_map_to_select_location')} />
            <cartomap row="2" zoom="10" on:mapReady={onMapReady} />
        </gridLayout>
    </page>
</frame>
