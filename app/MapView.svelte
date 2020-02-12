<script context="module">
    import { PersistentCacheTileDataSource } from 'nativescript-carto/datasources/cache';
    import { Folder, knownFolders, path } from '@nativescript/core/file-system/file-system';
    import { HTTPTileDataSource } from 'nativescript-carto/datasources/http';
    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
    const dataSource = new PersistentCacheTileDataSource({
        dataSource: new HTTPTileDataSource({
            minZoom: 2,
            subdomains: 'abc',
            maxZoom: 18,
            url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
        }),
        databasePath: cacheFolder.path
    });
</script>

<script>
    import { Point } from 'nativescript-carto/vectorelements/point';
    import { LocalVectorDataSource } from 'nativescript-carto/datasources/vector';
    import { RasterTileLayer } from 'nativescript-carto/layers/raster';
    import { Template } from 'svelte-native/components';
    let cartoMap;
    let rasterLayer;
    export let focusPos;

    function onMapReady() {
        console.log('onMapready', focusPos);
        const options = cartoMap.getOptions();
        options.setWatermarkScale(0.2);
        options.setRestrictedPanning(true);
        options.setSeamlessPanning(true);
        options.setEnvelopeThreadPoolSize(2);
        options.setTileThreadPoolSize(2);
        options.setZoomGestures(true);
        options.setRotatable(true);

        const rasterLayer = new RasterTileLayer({
            zoomLevelBias: 1,
            dataSource
        });

        cartoMap.addLayer(rasterLayer);

        const localVectorDataSource = new LocalVectorDataSource({ projection: cartoMap.mapProjection });
        const point = new Point({
            focusPos,
            styleBuilder: {
                size: 17,
                color: 'red'
            }
        });
        localVectorDataSource.add(point);
        const localVectorLayer = new VectorLayer({ visibleZoomRange: [0, 24], dataSource: localVectorDataSource });
        cartoMap.addLayer(localVectorLayer);
        console.log('onMapready2', focusPos);
        // always add it at 1 to respect local order
        cartoMap.setFocusPos(focusPos);
    }
</script>

<cartomap bind:this={cartoMap} zoom="10" on:mapReady={onMapReady} isUserInteractionEnabled="false" />
