<script context="module" lang="ts">
    import { Color } from '@akylas/nativescript';
    import { request } from '@nativescript-community/perms';
    import { MergedMBVTTileDataSource } from '@nativescript-community/ui-carto/datasources';
    import { PersistentCacheTileDataSource } from '@nativescript-community/ui-carto/datasources/cache';
    import { HTTPTileDataSource } from '@nativescript-community/ui-carto/datasources/http';
    import { MBTilesTileDataSource } from '@nativescript-community/ui-carto/datasources/mbtiles';
    import { HillshadeRasterTileLayer, RasterTileFilterMode, RasterTileLayer } from '@nativescript-community/ui-carto/layers/raster';
    import { VectorTileLayer, VectorTileRenderOrder } from '@nativescript-community/ui-carto/layers/vector';
    import { MapBoxElevationDataDecoder } from '@nativescript-community/ui-carto/rastertiles';
    import { CartoMap } from '@nativescript-community/ui-carto/ui';
    import { MBVectorTileDecoder } from '@nativescript-community/ui-carto/vectortiles';
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
    let hillshadeLayer: HillshadeRasterTileLayer;
    let vectorLayer: VectorTileLayer;

    function createMergeMBtiles({ name, sources, legend }: { name: string; sources: string[]; legend?: string }) {
        let dataSource;
        if (sources.length === 1) {
            dataSource = new MBTilesTileDataSource({
                databasePath: sources[0],
            });
        } else {
            dataSource = new MergedMBVTTileDataSource({
                dataSources: sources.map(
                    (s) =>
                        new MBTilesTileDataSource({
                            databasePath: s,
                        })
                ),
            });
        }
        const vectorTileDecoder = new MBVectorTileDecoder({
            style: 'voyager',
            liveReload: !PRODUCTION,
            dirPath: `~/assets/styles/osmxml`,
        });
        const layer = new VectorTileLayer({
            dataSource,
            decoder: vectorTileDecoder,
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
                vectorLayer = this.createMergeMBtiles({
                    legend: 'https://www.openstreetmap.org/key.html',
                    name: f.name,
                    sources: subentities.map((e2) => e2.path).filter((s) => s.endsWith('.mbtiles')),
                });
            }
            const etiles = entities.filter((e) => e.name.endsWith('.etiles')).slice(-1);
            etiles.forEach((e) => {
                // this.log('loading etiles', e.name);
                const dataSource = new MBTilesTileDataSource({
                    // minZoom: 5,
                    // maxZoom: 12,
                    databasePath: e.path,
                });
                const name = e.name;
                const contrast = 0.39;
                const heightScale = 0.29;
                const illuminationDirection = 207;
                const opacity = 1;
                const decoder = new MapBoxElevationDataDecoder();
                hillshadeLayer = new HillshadeRasterTileLayer({
                    decoder,
                    tileFilterMode: RasterTileFilterMode.RASTER_TILE_FILTER_MODE_NEAREST,
                    visibleZoomRange: [5, 16],
                    contrast,
                    illuminationDirection,
                    highlightColor: new Color(255, 141, 141, 141),
                    heightScale,
                    dataSource,
                    opacity,
                });
                hillshadeLayer.getNative().setTileFilterMode(RasterTileFilterMode.RASTER_TILE_FILTER_MODE_BILINEAR);
            });
            // return Promise.all(
        } catch (err) {
            console.error(err);
            setTimeout(() => {
                throw err;
            }, 0);
        }
    }
</script>

<script lang="ts">
    export let focusPos;

    let point;
    let cartoMap: CartoMap;

    async function onMapReady(event) {
        cartoMap = event.object;
        const options = cartoMap.getOptions();
        options.setWatermarkScale(0.5);
        options.setRotatable(false);
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

        const folderPath = this.getDefaultMBTilesDir();
        if (folderPath) {
            await this.loadLocalMbtiles(folderPath);
        }
        if (vectorLayer) {
            cartoMap.addLayer(vectorLayer);
            if (hillshadeLayer) {
                cartoMap.addLayer(hillshadeLayer);
            }
        } else {
            const rasterLayer = new RasterTileLayer({
                zoomLevelBias: 1,
                dataSource,
            });
            cartoMap.addLayer(rasterLayer);
        }

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
