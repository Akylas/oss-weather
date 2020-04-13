<script>
    import { Folder, knownFolders, path } from '@nativescript/core/file-system/file-system';
    import { Point } from 'nativescript-carto/vectorelements/point';
    import { LocalVectorDataSource } from 'nativescript-carto/datasources/vector';
    import { RasterTileLayer } from 'nativescript-carto/layers/raster';
    import { Template } from 'svelte-native/components';
    import { VectorLayer } from 'nativescript-carto/layers/vector';
    import { CartoMap } from 'nativescript-carto/ui';
    import { primaryColor } from '~/variables';
    import { PersistentCacheTileDataSource } from 'nativescript-carto/datasources/cache';
    import { HTTPTileDataSource } from 'nativescript-carto/datasources/http';
    import { GenericMapPos } from 'nativescript-carto/core';

    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
    // export let focusPos: GenericMapPos<LatLonKeys>;
    export let focusPos;

    let point;
    // let cartoMap: CartoMap<LatLonKeys>;
    let cartoMap;

    function onMapReady(event) {
        cartoMap = event.object;
        const options = cartoMap.getOptions();
        options.setWatermarkScale(0);
        // options.setEnvelopeThreadPoolSize(2);
        // options.setTileThreadPoolSize(2);

        const dataSource = new PersistentCacheTileDataSource({
            dataSource: new HTTPTileDataSource({
                minZoom: 10,
                subdomains: 'abc',
                maxZoom: 10,
                url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
            }),
            databasePath: cacheFolder.path
        });

        const rasterLayer = new RasterTileLayer({ dataSource });

        cartoMap.addLayer(rasterLayer);

        const localVectorDataSource = new LocalVectorDataSource({ projection: cartoMap.projection });
        point = new Point({
            position: focusPos,
            styleBuilder: {
                size: 10,
                color: primaryColor
            }
        });
        localVectorDataSource.add(point);
        const localVectorLayer = new VectorLayer({ dataSource: localVectorDataSource });
        cartoMap.addLayer(localVectorLayer);
        // always add it at 1 to respect local order
        cartoMap.setFocusPos(focusPos, 0);
    }

    $: {
        if (cartoMap) {
            point.position = focusPos;
            cartoMap.setFocusPos(focusPos, 0);
        }
    }
</script>

<!-- <script context="module">
    import { Folder, knownFolders, path } from '@nativescript/core/file-system/file-system';
    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
</script> -->
<cartomap zoom="10" on:mapReady={onMapReady} isUserInteractionEnabled="false" />
