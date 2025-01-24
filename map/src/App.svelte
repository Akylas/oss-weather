<script lang="ts">
    import { type LngLatLike, Map, Marker, type StyleSpecification } from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import './global.css';
    import './rainviewer.css';
    import { onDestroy } from 'svelte';
    import RainViewerLegend from './RainViewerLegend.svelte';
    import RangeSlider from 'svelte-range-slider-pips';

    function GetURLParameters() {
        // console.log('GetURLParameters ' + window.location.search);
        const sPageURL = decodeURI(window.location.search).substring(1);
        const sURLVariables = sPageURL.split('&');
        return sURLVariables.reduce((acc, val) => {
            const sParameterName = decodeURIComponent(val).split('=');
            acc[sParameterName[0]] = sParameterName.slice(1).join('=');
            return acc;
        }, {});
    }
    const urlParamers = GetURLParameters();
    let map: Map;

    let options = {
        source: urlParamers['source'],
        position: urlParamers['position']?.split(',').map(parseFloat).reverse() as LngLatLike,
        mapCenter: (urlParamers['mapCenter'] || '45.18453,5.75').split(',').map(parseFloat).reverse() as LngLatLike,
        zoom: parseFloat(urlParamers['zoom'] || '8'),
        useToPickLocation: parseFloat(urlParamers['useToPickLocation'] || '0') === 1,
        layerOpacity: parseFloat(urlParamers['opacity'] || '0.8'),
        animationSpeed: parseFloat(urlParamers['animationSpeed'] || '100'),
        animated: (urlParamers['animated'] || 'false') === 'true',
        hideAttribution: (urlParamers['hideAttribution'] || 'false') === 'true',
        dark: urlParamers['dark'] || 'light',
        language: urlParamers['lang'] || 'en',
        colors: urlParamers['colors'] || '1',
        smoothData: parseFloat(urlParamers['smoothData'] || '1'), // 0 - not smooth, 1 - smooth
        snowColors: parseFloat(urlParamers['snowColors'] || '1'), // 0 - do not show snow colors, 1 - show snow colors
        tileSize: parseFloat(urlParamers['tileSize'] || '256') // can be 256 or 512.
    };
    // console.log(`options ${JSON.stringify(options)}`);
    let apiData: any = {};
    let data: any[] = [];
    let dataLength: number = 0;
    document.documentElement.style.setProperty('--bottom-padding', options.useToPickLocation ? '0px' : '100px');

    document.documentElement.setAttribute('data-dark', options.dark === 'black' ? 'dark' : options.dark);
    if (options.dark === 'dark' || options.dark === 'black') {
        document.documentElement.style.setProperty('--background-color', options.dark === 'black' ? '#000' : '#333');
        document.documentElement.style.setProperty('--button-color', 'white');
    }

    async function createMap(container) {
        // Initialise the map
        const style: StyleSpecification = await import(`./${options.dark === 'light' ? 'light' : 'dark'}_theme.json`);
        if (options.source) {
            try {
                // we test if the custom tile source is available.
                // if not we add the default
                await fetch(options.source.replace(/\{(x|y|z)\}/g, '0'), {
                    method: 'HEAD'
                });
                style.sources.openmaptiles = {
                    type: 'vector',
                    tiles: [options.source],
                    maxzoom: 14
                };
            } catch (error) {
                console.error('error ' + error);
            }
        }
        map = new Map({
            fadeDuration: 0,
            validateStyle: false,
            attributionControl: options.hideAttribution
                ? false
                : {
                      compact: true,
                      customAttribution: [
                          '<a href="https://maplibre.org/">MapLibre</a>',
                          '<a href="https://www.openstreetmap.org">OpenStreetMap</a>',
                          '<a href="https://carto.com/about-carto/">CARTO</a>'
                      ].concat(options.useToPickLocation ? [] : ['<a href="https://www.rainviewer.com/api.html">RainViewer</a>'])
                  },
            //  refreshExpiredTiles:false,
            container,
            // style:'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json',
            style,
            center: options.mapCenter,
            zoom: options.zoom
        });
        map.touchZoomRotate.disableRotation();
        map.on('styledata', () => {
            const languageFieldName = `name:${options.language}`;
            map?.getStyle()
                ?.layers?.filter((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])
                .forEach(function (layer) {
                    const result = ['coalesce', ['get', languageFieldName], ['get', 'name'], ['get', 'name:latin'], ['get', 'name']];
                    map.setLayoutProperty(layer.id, 'text-field', result);
                });
        });
        return map;
    }
    function mapAction(container) {
        createMap(container).then((map) => {
            if (options.position) {
                const el = document.createElement('div');
                el.className = 'marker';
                new Marker({ element: el }).setLngLat(options.position).addTo(map);
            }
            if (options.useToPickLocation) {
                let positionMarker: Marker;
                map.on('click', (e) => {
                    if (!positionMarker) {
                        const el = document.createElement('div');
                        el.className = 'marker';
                        positionMarker = new Marker({ element: el }).setLngLat(e.lngLat).addTo(map);
                    } else {
                        positionMarker.setLngLat(e.lngLat);
                    }
                    if (window['nsWebViewBridge']) {
                        // console.log('emitNSEvent ', name, value);
                        window['nsWebViewBridge'].emit('position', e.lngLat);
                    }
                });
            } else {
                fetch('https://api.rainviewer.com/public/weather-maps.json')
                    .then((response) => response.text())
                    .then((response) => {
                        apiData = JSON.parse(response);
                        console.log('apiData ' + response);
                        data = apiData.radar.past.concat(apiData.radar.nowcast);
                        dataLength = data.length;
                        data.forEach((frame) => {
                            map.addLayer({
                                id: `rainviewer_${frame.path}`,
                                type: 'raster',
                                source: {
                                    type: 'raster',
                                    tiles: [apiData.host + frame.path + `/${options.tileSize}/{z}/{x}/{y}/${options.colors}/${options.smoothData}_${options.snowColors}.png`],
                                    tileSize: options.tileSize
                                },
                                // layout: { visibility: 'none' },
                                paint: {
                                    'raster-fade-duration': 0,
                                    'raster-opacity': 0
                                },
                                minzoom: 0,
                                maxzoom: 12
                            });
                        });
                        setIndex(apiData.radar.past.length - 1);
                        if (options.animated) {
                            startStopAnimation();
                        }
                    });
            }
        });
    }
    let currentIndex = 0;
    let lastIndex = -1;
    let animationInterval;
    function stopAnimation() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }

    function refreshMap() {
        const frame = data[currentIndex];
        // apiData.radar.past.forEach((frame, index) => {
        document.getElementById('timestamp').innerHTML = new Date(frame.time * 1000).toLocaleTimeString();
        // });
        if (lastIndex >= 0) {
            const frame = data[lastIndex];
            // let opacity = 1;
            // setTimeout(() => {
            // const i2 = setInterval(() => {
            //     if (opacity <= 0) {
            //         return clearInterval(i2);
            //     }
            map.setPaintProperty(`rainviewer_${frame.path}`, 'raster-opacity', 0, { validate: false });
            // opacity -= 0.1;
            // }, 50);
            // }, 400);
        }
        map.setPaintProperty(`rainviewer_${frame.path}`, 'raster-opacity', options.layerOpacity, { validate: false });
    }
    function startStopAnimation() {
        if (animationInterval) {
            stopAnimation();
            return;
        }
        animationInterval = setInterval(() => {
            // if (i > apiData.radar.past.length - 1) {
            //     clearInterval(interval);
            //     return;
            // } else {
            lastIndex = currentIndex;
            currentIndex = (currentIndex + 1) % dataLength;
            refreshMap();
            // }
        }, options.animationSpeed);
    }
    function showNextFrame() {
        stopAnimation();
        lastIndex = currentIndex;
        currentIndex = (currentIndex + 1) % dataLength;
        refreshMap();
    }
    function showPreviousFrame() {
        stopAnimation();
        lastIndex = currentIndex;
        currentIndex = (currentIndex - 1 + dataLength) % dataLength;
        refreshMap();
    }
    function setIndex(value) {
        try {
            // console.log('setIndex', value);
            stopAnimation();
            lastIndex = currentIndex;
            currentIndex = value % dataLength;
            refreshMap();
        } catch (error) {
            console.error(error);
        }
    }
    onDestroy(() => {
        map?.remove();
    });

    function getFormattedDate(data, index) {
        return new Date(data?.[index]?.time * 1000).toLocaleTimeString();
    }

    const handleFormatter = (value) => getFormattedDate(data, value);
    //@ts-ignore
    window.getZoom = function () {
        return map.getZoom();
    };
    //@ts-ignore
    window.getParameters = function () {
        return {
            animated: !!animationInterval,
            zoom: map.getZoom(),
            mapCenter: map.getCenter()
        };
    };

    //@ts-ignore
    window.updateOption = function (key, value) {
        options[key] = value;
        options = options;
        switch (key) {
            case 'animationSpeed':
                if (!!animationInterval) {
                    stopAnimation();
                    startStopAnimation();
                }
                break;
            case 'layerOpacity':
                refreshMap();
                break;
            default:
                break;
        }
    };
</script>

<!-- <svelte:window on:resize={resizeMap} /> -->

<div style="height:100%;width:100%;display:flex;justify-content:center  ">
    <div style="height:100%;width:100%;" class="map" use:mapAction />

    {#if !options.useToPickLocation}
        <RainViewerLegend colorScheme={options.colors} snow={options.snowColors === 1} />
        <div style="position: absolute; bottom:5px; width: 90%; height: 60px;  align-content: center;flex-direction: row;display: flex;" class="popup">
            <div style="display: flex;flex-direction: column;flex-grow:1;">
                <div style="display: flex;flex-direction: row;flex-grow:1;">
                    <div style="text-align:center; height: 30px;flex-direction: row;flex-grow: 1;">
                        <button id="prevBtn" style="width:30px;height:30px;" class="button" on:click={showPreviousFrame} />
                        <button id={animationInterval ? 'pauseBtn' : 'playBtn'} style="width:30px;height:30px;" class="button" on:click={startStopAnimation} />
                        <button id="nextBtn" style="width:30px;height:30px;" class="button" on:click={showNextFrame} />
                    </div>
                    <div id="timestamp" style="text-align:center; font-weight:bold;padding:4px" class="label"></div>
                </div>

                <div style="padding: 0px 0px;">
                    <RangeSlider float {handleFormatter} max={dataLength - 1} min={0} pips values={[currentIndex]} on:start={stopAnimation} on:change={(e) => setIndex(e.detail.value)} />
                </div>
            </div>
        </div>
    {/if}
</div>
