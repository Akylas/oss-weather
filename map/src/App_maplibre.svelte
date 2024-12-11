<script lang="ts">
    import { type LngLatLike, Map, Marker, type StyleSpecification } from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';
    import './global.css';
    import './rainviewer.css';
    import { onDestroy } from 'svelte';
    import RainViewerLegend from './RainViewerLegend.svelte';
    import RangeSlider from 'svelte-range-slider-pips';

    function GetURLParameters() {
        const sPageURL = window.location.search.substring(1);
        const sURLVariables = sPageURL.split('&');
        return sURLVariables.reduce((acc, val)=>{
            const sParameterName = val.split('=');
            acc[sParameterName[0]]= sParameterName[1];
            return acc;
        }, {})
    }
    const urlParamers = GetURLParameters();
    let map: Map;

    const position = (urlParamers['position'] || '45.18453,5.75').split(',').map(parseFloat).reverse() as LngLatLike;
    const mapCenter = (urlParamers['mapCenter'] || '45.18453,5.75').split(',').map(parseFloat).reverse() as LngLatLike;
    const zoom = parseFloat(urlParamers['zoom'] || '8');
    let layerOpacity = parseFloat(urlParamers['opacity'] || '0.8');
    let animationSpeed = parseFloat(urlParamers['animationSpeed'] || '100');
    const animated = (urlParamers['animated'] || 'false') === 'true';
    const dark = (urlParamers['dark'] || 'light');
    const colors = urlParamers['colors'] || '1';
    const optionSmoothData = 1; // 0 - not smooth, 1 - smooth
    const optionSnowColors = 1; // 0 - do not show snow colors, 1 - show snow colors
    const optionTileSize = 256; // can be 256 or 512.
    let apiData: any = {};
    let data: any[] = [];
    let dataLength: number = 0;

    console.log(`dark ${dark}`)
    document.documentElement.setAttribute("data-dark", dark === 'black' ? "dark": dark);
    if (dark === 'dark'  || dark === 'black') {
        document.documentElement.style.setProperty('--background-color', dark === 'black'? '#000': '#333');
        document.documentElement.style.setProperty('--button-color', 'white');
    }

    async function createMap(container) {
        // Initialise the map
        const style  = await import(`./${dark === 'light' ? 'light':'dark'}_theme.json`);
        console.log('style', style)
        const map = new Map({
            fadeDuration: 0,
            validateStyle: false,
            attributionControl:{
                compact: true,
                customAttribution:['<a href="https://maplibre.org/">MapLibre</a>', '<a href="https://www.openstreetmap.org">OpenStreetMap</a>', '<a href=\"https://carto.com/about-carto/\">CARTO</a>', '<a href="https://www.rainviewer.com/api.html">RainViewer</a>']
            },
            //  refreshExpiredTiles:false,
            container,
            style,
            center: mapCenter,
            zoom
        });
        const el = document.createElement('div');
        el.className = 'marker';
        new Marker({ element: el }).setLngLat(position).addTo(map);

        return map;
    }
    function mapAction(container) {
        createMap(container).then(result=>{
            map = result
            fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then((response) => response.text())
            .then((response) => {
                apiData = JSON.parse(response);
                data = apiData.radar.past.concat(apiData.radar.nowcast);
                dataLength = data.length;
                data.forEach((frame) => {
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
                if (animated) {
                    startStopAnimation();
                }
            });
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
        map.setPaintProperty(`rainviewer_${frame.path}`, 'raster-opacity', layerOpacity, { validate: false });
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
    //@ts-ignore
    window.getParameters = function () {
        return {
            animated:!!animationInterval,
            zoom:map.getZoom(),
            mapCenter: map.getCenter()
        };
    };
    //@ts-ignore
    window.setAnimationSpeed = function (value) {
        animationSpeed = value;
        if (!!animationInterval){
            stopAnimation();
            startStopAnimation()
        }
    };
    //@ts-ignore
    window.setLayerOpacity = function (value) {
        layerOpacity = value;
        refreshMap();
    };
</script>

<!-- <svelte:window on:resize={resizeMap} /> -->

<div style="height:100%;width:100%;display:flex;justify-content:center  ">
    <div style="height:100%;width:100%;" class="map" use:mapAction />

    <RainViewerLegend colorScheme={colors} />
    <div style="position: absolute; bottom:5px; width: 90%; height: 80px;  align-content: center;flex-direction: row;display: flex;" class="popup">
        <div style="display: flex;flex-direction: column;flex-grow:1;">
            <div style="display: flex;flex-direction: row;flex-grow:1;">
                <div style="text-align:center; height: 30px;flex-direction: row;flex-grow: 1;">
                    <button class="button" id="prevBtn" style="width:30px;height:30px;" on:click={showPreviousFrame} />
                    <button class="button" id={animationInterval ? 'pauseBtn' : 'playBtn'} style="width:30px;height:30px;" on:click={startStopAnimation} />
                    <button class="button" id="nextBtn" style="width:30px;height:30px;" on:click={showNextFrame} />

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
                <div class="label"  id="timestamp" style="text-align:center; font-weight:bold;padding:4px"></div>
            </div>

            <div style="padding: 0px 0px;">
                <RangeSlider float {handleFormatter} max={dataLength - 1} min={0} pips values={[currentIndex]} on:start={stopAnimation} on:change={(e) => setIndex(e.detail.value)}/>
            </div>
        </div>
    </div>
</div>
