<script context="module" lang="ts">
    import { PersistentCacheTileDataSource } from '@nativescript-community/ui-carto/datasources/cache';
    import { HTTPTileDataSource } from '@nativescript-community/ui-carto/datasources/http';
    import { RasterTileLayer } from '@nativescript-community/ui-carto/layers/raster';
    import { Folder, knownFolders, path } from '@nativescript/core/file-system';
    const cacheFolder = Folder.fromPath(path.join(knownFolders.documents().path, 'carto_cache'));
    const dataSource = new PersistentCacheTileDataSource({
        dataSource: new HTTPTileDataSource({
            minZoom: 10,
            subdomains: 'abc',
            maxZoom: 10,
            url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        }),
        databasePath: path.join(cacheFolder.path, 'cache.db'),
    });
</script>

<script lang="ts">
    export let focusPos;

    let point;
    let cartoMap;

    function onMapReady(event) {
        cartoMap = event.object;
        const options = cartoMap.getOptions();
        options.setWatermarkScale(0.5);

        // const dataSource = new PersistentCacheTileDataSource({
        //     dataSource: new HTTPTileDataSource({
        //         minZoom: 10,
        //         subdomains: 'abc',
        //         maxZoom: 10,
        //         url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
        //     }),
        //     databasePath: path.join(cacheFolder.path, 'cache.db')
        // });

        // const rasterLayer = new RasterTileLayer({ dataSource });
        const rasterLayer = new RasterTileLayer({ dataSource });

        cartoMap.addLayer(rasterLayer);

        // const localVectorDataSource = new LocalVectorDataSource({ projection: cartoMap.projection });
        // point = new Point({
        //     position: focusPos,
        //     styleBuilder: {
        //         size: 10,
        //         color: primaryColor
        //     }
        // });
        // localVectorDataSource.add(point);
        // const localVectorLayer = new VectorLayer({ dataSource: localVectorDataSource });
        // cartoMap.addLayer(localVectorLayer);
        cartoMap.setFocusPos(focusPos, 0);
    }

    $: {
        //update if focusPos change (cell reuse)
        if (cartoMap) {
            point.position = focusPos;
            cartoMap.setFocusPos(focusPos, 0);
        }
    }
</script>

<cartomap zoom="10" on:mapReady={onMapReady} isUserInteractionEnabled="false" />
