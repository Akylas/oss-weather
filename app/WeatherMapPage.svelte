<script context="module" lang="ts">
    import { getString } from '@nativescript/core/application-settings';
    import { request } from '@nativescript-community/perms';
    import { MergedMBVTTileDataSource } from '@nativescript-community/ui-carto/datasources';
    import { PersistentCacheTileDataSource } from '@nativescript-community/ui-carto/datasources/cache';
    import { HTTPTileDataSource } from '@nativescript-community/ui-carto/datasources/http';
    import { MBTilesTileDataSource } from '@nativescript-community/ui-carto/datasources/mbtiles';
    import { HillshadeRasterTileLayer, RasterTileLayer } from '@nativescript-community/ui-carto/layers/raster';
    import { VectorTileLayer, VectorTileRenderOrder } from '@nativescript-community/ui-carto/layers/vector';
    import { CartoMap } from '@nativescript-community/ui-carto/ui';
    import { setShowDebug } from '@nativescript-community/ui-carto/utils';
    import { MBVectorTileDecoder } from '@nativescript-community/ui-carto/vectortiles';
    import { Application, Page } from '@nativescript/core';
    import { Folder, knownFolders, path } from '@nativescript/core/file-system';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { l } from '~/helpers/locale';
    import { getDataFolder } from '~/utils/utils';
    import CActionBar from './CActionBar.svelte';
    import { showError } from './utils/error';

    const cacheFolder = Folder.fromPath(path.join(knownFolders.temp().path, 'carto_cache'));
    const dataSource = new PersistentCacheTileDataSource({
        dataSource: new HTTPTileDataSource({
            minZoom: 2,
            subdomains: 'abc',
            maxZoom: 18,
            url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
        }),
        databasePath: path.join(cacheFolder.path, 'cache.db')
    });
    const dataSourceRadar = new HTTPTileDataSource({
        minZoom: 4,
        subdomains: 'abc',
        maxZoom: 10,
        url: `https://{s}.sat.owm.io/vane/2.0/weather/PA0/{z}/{x}/{y}?appid=${getString(
            'owmApiKey',
            OWM_MY_KEY || OWM_DEFAULT_KEY
        )}&palette=0:00000000;0.1:C8969620;0.2:9696AA30;0.5:7878BE40;1:6E6ECD70;10:5050E1B2;140:1414FFE5&opacity=0.8`
    });
    let hillshadeLayer: HillshadeRasterTileLayer;
    let vectorLayer: VectorTileLayer;

    function getDefaultMBTilesDir() {
        let localMbtilesSource = getString('local_mbtiles_directory');
        if (!localMbtilesSource) {
            let defaultPath = path.join(getDataFolder(), 'alpimaps_mbtiles');
            if (global.isAndroid) {
                const dirs = (Application.android.startActivity as android.app.Activity).getExternalFilesDirs(null);
                const sdcardFolder = dirs[dirs.length - 1]?.getAbsolutePath();
                if (sdcardFolder) {
                    defaultPath = path.join(sdcardFolder, '../../../..', 'alpimaps_mbtiles');
                }
            }
            localMbtilesSource = getString('local_mbtiles_directory', defaultPath);
        }
        return localMbtilesSource;
    }
    function createMergeMBtiles({ name, sources, legend }: { name: string; sources: string[]; legend?: string }) {
        let dataSource;
        if (sources.length === 1) {
            dataSource = new MBTilesTileDataSource({
                databasePath: sources[0]
            });
        } else {
            dataSource = new MergedMBVTTileDataSource({
                dataSources: sources.map(
                    (s) =>
                        new MBTilesTileDataSource({
                            databasePath: s
                        })
                )
            });
        }
        const vectorTileDecoder = new MBVectorTileDecoder({
            style: 'voyager',
            liveReload: !PRODUCTION,
            dirPath: `~/assets/styles/osmxml`
        });
        const layer = new VectorTileLayer({
            dataSource,
            decoder: vectorTileDecoder
        });
        layer.setLabelRenderOrder(VectorTileRenderOrder.LAST);
        // layer.setBuildingRenderOrder(VectorTileRenderOrder.LAYER);
        // layer.setVectorTileEventListener(this, mapComp.mapProjection);
        return layer;
    }
    async function loadLocalMbtiles(directory: string) {
        await request('storage');
        if (!Folder.exists(directory)) {
            return;
        }
        try {
            const folder = Folder.fromPath(directory);
            const entities = await folder.getEntities();
            const folders = entities.filter((e) => Folder.exists(e.path));
            for (let i = 0; i < folders.length; i++) {
                const f = folders[i];
                const subentities = await Folder.fromPath(f.path).getEntities();
                vectorLayer = createMergeMBtiles({
                    legend: 'https://www.openstreetmap.org/key.html',
                    name: f.name,
                    sources: subentities.map((e2) => e2.path).filter((s) => s.endsWith('.mbtiles'))
                });
            }
            // const etiles = entities.filter((e) => e.name.endsWith('.etiles')).slice(-1);
            // etiles.forEach((e) => {
            //     // this.log('loading etiles', e.name);
            //     const dataSource = new MBTilesTileDataSource({
            //         // minZoom: 5,
            //         // maxZoom: 12,
            //         databasePath: e.path,
            //     });
            //     const name = e.name;
            //     const contrast = 0.39;
            //     const heightScale = 0.29;
            //     const illuminationDirection = 207;
            //     const opacity = 1;
            //     const decoder = new MapBoxElevationDataDecoder();
            //     hillshadeLayer = new HillshadeRasterTileLayer({
            //         decoder,
            //         tileFilterMode: RasterTileFilterMode.RASTER_TILE_FILTER_MODE_NEAREST,
            //         visibleZoomRange: [5, 16],
            //         contrast,
            //         illuminationDirection,
            //         highlightColor: new Color(255, 141, 141, 141),
            //         heightScale,
            //         dataSource,
            //         opacity,
            //     });
            // });
        } catch (err) {
            showError(err);
        }
    }
</script>

<script lang="ts">
    export let focusPos;
    let cartoMap: CartoMap;
    let page: NativeViewElementNode<Page>;

    async function onMapReady(event) {
        cartoMap = event.object as CartoMap;
        const options = cartoMap.getOptions();
        options.setZoomGestures(true);
        options.setWatermarkScale(0.5);
        options.setRotatable(false);

        try {
            const folderPath = getDefaultMBTilesDir();
            if (folderPath) {
                await loadLocalMbtiles(folderPath);
            }
        } catch (err) {
            console.error(err);
        }
        if (vectorLayer) {
            cartoMap.addLayer(vectorLayer);
            if (hillshadeLayer) {
                cartoMap.addLayer(hillshadeLayer);
            }
        } else {
            const rasterLayer = new RasterTileLayer({
                zoomLevelBias: 1,
                dataSource
            });
            cartoMap.addLayer(rasterLayer);
        }
        const rasterLayerRadar = new RasterTileLayer({ dataSource: dataSourceRadar });
        cartoMap.addLayer(rasterLayerRadar);
        cartoMap.setFocusPos(focusPos, 0);
    }
    // }
    // console.log('creating map instance');
    function onNavigatingTo(e) {
        // console.log('onNavigatingTo', page && page.nativeView, e.object);
    }

    $: {
        //update if focusPos change (cell reuse)
        if (cartoMap) {
            cartoMap.setFocusPos(focusPos, 0);
        }
    }
</script>

<page bind:this={page} actionBarHidden="true" on:navigatingTo={onNavigatingTo}>
    <gridLayout rows="auto,*">
        <CActionBar title={l('weather_map')} />
        <cartomap row="1" zoom="8" on:mapReady={onMapReady} useTextureView={true} />
    </gridLayout>
</page>
    