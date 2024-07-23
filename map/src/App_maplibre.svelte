<style>
</style>

<script lang="ts">
    import { type LngLatLike, Map, Marker, type StyleSpecification } from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import './global.css';
    import './rainviewer.css';
    import { onDestroy } from 'svelte';
    import RainViewerLegend from './RainViewerLegend.svelte';
    import RangeSlider from 'svelte-range-slider-pips';

    function GetURLParameter(sParam) {
        const sPageURL = window.location.search.substring(1);
        const sURLVariables = sPageURL.split('&');
        for (let i = 0; i < sURLVariables.length; i++) {
            const sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1];
            }
        }
    }
    let map: Map;

    const position = (GetURLParameter('position') || '45.18453,5.75').split(',').map(parseFloat).reverse() as LngLatLike;
    const zoom = parseFloat(GetURLParameter('zoom') || '8');
    const animationSpeed = parseFloat(GetURLParameter('animationSpeed') || '100');
    const colors = GetURLParameter('colors') || '1';
    const optionSmoothData = 1; // 0 - not smooth, 1 - smooth
    const optionSnowColors = 1; // 0 - do not show snow colors, 1 - show snow colors
    const optionTileSize = 256; // can be 256 or 512.
    const optionKind: string = 'radar'; // can be 'radar' or 'satellite'

    let apiData: any = {};
    let data: any[] = [];
    let dataLength: number = 0;
    const mapFrames: any[] = [];
    const lastPastFramePosition = -1;

    function createMap(container) {
        console.log('container', position, zoom);
        const style = {
            version: 8,
            sources: {
                osm: {
                    type: 'raster',
                    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '&copy; OpenStreetMap Contributors',
                    maxzoom: 19
                }
            },
            layers: [
                {
                    id: 'osm',
                    type: 'raster',
                    source: 'osm'
                }
            ]
        } as StyleSpecification;
        // Initialise the map
        const map = new Map({
            fadeDuration: 0,
            validateStyle: false,
            //  refreshExpiredTiles:false,
            container,
            style,
            center: position,
            zoom
        });
        const el = document.createElement('div');
        el.className = 'marker';
        new Marker({ element: el }).setLngLat(position).addTo(map);

        return map;
    }
    function mapAction(container) {
        map = createMap(container);
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then((response) => response.text())
            .then((response) => {
                apiData = JSON.parse(response);
                console.log('apiData', apiData);
                data = apiData.radar.past.concat(apiData.radar.nowcast);
                dataLength = data.length;
                data.forEach((frame) => {
                    console.log('addLayer', frame.path);
                    map.addLayer({
                        id: `rainviewer_${frame.path}`,
                        type: 'raster',
                        source: {
                            type: 'raster',
                            tiles: [apiData.host + frame.path + `/${optionTileSize}/{z}/{x}/{y}/${colors}/${optionSmoothData}_${optionSnowColors}.png`],
                            tileSize: optionTileSize
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
                // startStopAnimation();
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
        map.setPaintProperty(`rainviewer_${frame.path}`, 'raster-opacity', 1, { validate: false });
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
        }, animationSpeed);
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
</script>

<!-- <svelte:window on:resize={resizeMap} /> -->

<div style="height:100%;width:100%;display:flex;justify-content:center  ">
    <div style="height:100%;width:100%;" class="map" use:mapAction />

    <RainViewerLegend colorScheme={colors} />
    <div style="position: absolute; bottom:25px; width: 90%; height: 80px;background-color:white;  align-content: center;flex-direction: row;display: flex;" class="popup">
        <div style="display: flex;flex-direction: column;flex-grow:1;">
            <div style="display: flex;flex-direction: row;flex-grow:1;">
                <div style="text-align:center; height: 30px;flex-direction: row;flex-grow: 1;">
                    <button id="prevBtn" style="width:30px;height:30px;" on:click={showPreviousFrame} />
                    <button id={animationInterval ? 'pauseBtn' : 'playBtn'} style="width:30px;height:30px;" on:click={startStopAnimation} />
                    <button id="nextBtn" style="width:30px;height:30px;" on:click={showNextFrame} />

                    <!-- <li>
                        <select id="colors" onchange="setColors(); return;">
                            <option value="0">Black and White Values</option>
                            <option value="1">Original</option>
                            <option selected="selected" value="2">Universal Blue</option>
                            <option value="3">TITAN</option>
                            <option value="4">The Weather Channel</option>
                            <option value="5">Meteored</option>
                            <option value="6">NEXRAD Level-III</option>
                            <option value="7">RAINBOW @ SELEX-SI</option>
                            <option value="8">Dark Sky</option>
                        </select>
                    </li> -->
                </div>
                <div id="timestamp" style="text-align:center; font-weight:bold;padding:4px"></div>
            </div>

            <div style="padding: 0px 0px;">
                <RangeSlider float {handleFormatter} max={dataLength - 1} min={0} pips values={[currentIndex]} on:start={stopAnimation} on:change={(e) => setIndex(e.detail.value)} />
            </div>
        </div>
    </div>
</div>
