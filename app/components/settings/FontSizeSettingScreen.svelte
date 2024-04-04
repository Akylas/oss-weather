<script lang="ts">
    import { lc } from '@nativescript-community/l';
    import { ApplicationSettings } from '@nativescript/core';
    import { getNumber } from '@nativescript/core/application-settings';
    import { onMount } from 'svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, prepareItems } from '~/services/api';
    import { colors } from '~/variables';
    import CActionBar from '../common/CActionBar.svelte';
    import dayjs from 'dayjs';
    import { WeatherData } from '~/services/providers/weather';

    $: ({ colorOutline } = $colors);

    const lastUpdate = getNumber('lastUpdate', -1);

    const weatherLocation: WeatherLocation = JSON.parse(
        '{"name":"Grenoble","sys":{"osm_id":80348,"osm_type":"R","extent":[5.6776059,45.2140762,5.7531176,45.1541442],"country":"France","osm_key":"place","osm_value":"city","name":"Grenoble","state":"Auvergne-Rhône-Alpes"},"coord":{"lat":45.1875602,"lon":5.7357819}}'
    );
    const weatherData: WeatherData = JSON.parse(
        '{"currently":{"time":1712241000000,"temperature":8.7,"usingFeelsLike":false,"windSpeed":15.8,"cloudCover":100,"isDay":true,"windBearing":142,"iconId":310,"description":"Bruine","color":"#929292","moonPerc":112,"moonIcon":"","cloudColor":"#929292FE","windIcon":""},"daily":{"data":[{"time":1712188800000,"description":"Bruine abondante","isDay":true,"iconId":321,"temperatureMax":9.9,"temperatureMin":4.6,"usingFeelsLike":false,"uvIndex":4,"windGust":55,"windSpeed":44,"windBearing":158,"precipProbability":100,"precipAccumulation":7.4,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#76939C","uvIndexColor":"#FFBC03","moonPerc":117,"moonIcon":"","windBeaufortIcon":"","windIcon":"","hourly":[{"time":1712239200000,"isDay":true,"iconId":310,"description":"Bruine","temperature":9.2,"usingFeelsLike":false,"windBearing":168,"precipProbability":88,"snowfall":0,"rain":0.8,"precipAccumulation":0.8,"cloudCover":100,"windSpeed":17.3,"windGust":24.5,"snowDepth":0,"iso":1500,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#8B9095","cloudColor":"#929292FE","windIcon":""},{"time":1712242800000,"isDay":true,"iconId":321,"description":"Bruine abondante","temperature":8.2,"usingFeelsLike":false,"windBearing":115,"precipProbability":97,"snowfall":0,"rain":1.2,"precipAccumulation":1.2,"cloudCover":100,"windSpeed":14.8,"windGust":20.2,"snowDepth":0,"iso":1470,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#888F97","cloudColor":"#929292FE","windIcon":""},{"time":1712246400000,"isDay":true,"iconId":321,"description":"Bruine abondante","temperature":8,"usingFeelsLike":false,"windBearing":120,"precipProbability":89,"snowfall":0,"rain":1.2,"precipAccumulation":1.2,"cloudCover":100,"windSpeed":21.2,"windGust":24.8,"snowDepth":0,"iso":1560,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#888F97","cloudColor":"#929292FE","windIcon":""},{"time":1712250000000,"isDay":true,"iconId":300,"description":"Légère bruine","temperature":7.8,"usingFeelsLike":false,"windBearing":127,"precipProbability":82,"snowfall":0,"rain":0.2,"precipAccumulation":0.2,"cloudCover":100,"windSpeed":17.3,"windGust":25.6,"snowDepth":0,"iso":1680,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#909192","cloudColor":"#929292FE","windIcon":""},{"time":1712253600000,"isDay":true,"iconId":804,"description":"Nuageux","temperature":7.8,"usingFeelsLike":false,"windBearing":145,"precipProbability":74,"snowfall":0,"rain":0,"precipAccumulation":0,"cloudCover":100,"windSpeed":10.4,"windGust":19.8,"snowDepth":0,"iso":1690,"color":"#929292","cloudColor":"#929292FE","windIcon":""},{"time":1712257200000,"isDay":false,"iconId":804,"description":"Nuageux","temperature":8.2,"usingFeelsLike":false,"windBearing":241,"precipProbability":59,"snowfall":0,"rain":0,"precipAccumulation":0,"cloudCover":98,"windSpeed":29.5,"windGust":35.3,"snowDepth":0,"iso":1770,"color":"#949390","cloudColor":"#929292F9","windBeaufortIcon":"","windIcon":""}]},{"time":1712275200000,"description":"Pluie","isDay":true,"iconId":502,"temperatureMax":10.6,"temperatureMin":6.2,"usingFeelsLike":false,"uvIndex":3,"windGust":53,"windSpeed":41,"windBearing":231,"precipProbability":100,"precipAccumulation":7.3,"precipColor":"#4681C3","precipIcon":"","precipUnit":"mm","color":"#77949B","uvIndexColor":"#FFBC03","moonPerc":112,"moonIcon":"","windBeaufortIcon":"","windIcon":"","hourly":[]},{"time":1712361600000,"description":"Nuageux","isDay":true,"iconId":804,"temperatureMax":12.4,"temperatureMin":8.1,"usingFeelsLike":false,"uvIndex":3,"windGust":39,"windSpeed":30,"windBearing":194,"precipProbability":6,"precipAccumulation":0,"color":"#FFC930","uvIndexColor":"#FFBC03","moonPerc":108,"moonIcon":"","windBeaufortIcon":"","windIcon":"","hourly":[]}]},"minutely":{"data":[{"time":1712241000000,"intensity":1},{"time":1712241900000,"intensity":1},{"time":1712242800000,"intensity":1},{"time":1712243700000,"intensity":1}]},"alerts":[]}'
    );

    const fakeNow = weatherData.currently.time;
    const items = prepareItems(weatherLocation, weatherData, lastUpdate, dayjs(fakeNow));
    let fontScale = ApplicationSettings.getNumber('fontscale', 1);
    onMount(async () => {});
    function setFontScale(value) {
        fontScale = value;
        ApplicationSettings.setNumber('fontscale', fontScale);
    }
    function onValueChange(e) {}
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*,auto">
        <gridlayout borderColor={colorOutline} borderRadius={10} borderWidth={1} margin="10" row={1}>
            <WeatherComponent {fakeNow} {items} {weatherLocation} />
        </gridlayout>
        <gridlayout columns="*,auto,auto" orientation="horizontal" row={2}>
            <slider maxValue={2} minValue={0.5} value={fontScale} on:valueChange={(e) => setFontScale(e.value)} />
            <label col={1} text={fontScale.toFixed(1)} verticalTextAlignment="middle" />
            <mdbutton col={2} text={lc('reset')} variant="text" verticalAlignment="middle" on:tap={() => setFontScale(1)} />
        </gridlayout>
        <CActionBar title={lc('font_scale')} />
    </gridlayout>
</page>
