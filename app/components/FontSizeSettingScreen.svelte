<script lang="ts">
    import { lc } from '@nativescript-community/l';
    import { ApplicationSettings } from '@nativescript/core';
    import { getNumber } from '@nativescript/core/application-settings';
    import { onMount } from 'svelte';
    import WeatherComponent from '~/components/WeatherComponent.svelte';
    import { WeatherLocation, prepareItems } from '~/services/api';
    import { borderColor } from '~/variables';
    import CActionBar from './CActionBar.svelte';
    import dayjs from 'dayjs';

    let lastUpdate = getNumber('lastUpdate', -1);

    let weatherLocation: WeatherLocation = JSON.parse(
        '{"name":"Grenoble","sys":{"osm_id":80348,"osm_type":"R","extent":[5.6776059,45.2140762,5.7531176,45.1541442],"country":"France","osm_key":"place","osm_value":"city","name":"Grenoble","state":"Auvergne-Rhône-Alpes"},"coord":{"lat":45.1875602,"lon":5.7357819}}'
    );
    let weatherData: WeatherData = JSON.parse(
        '{"currently":{"time":1682009271000,"temperature":12,"pressure":1010,"humidity":93,"cloudCover":95,"windSpeed":2.4120000000000004,"windGust":5.9399999999999995,"windBearing":213,"uvIndex":0.28,"sunriseTime":1681965843000,"sunsetTime":1682015258000,"icon":"10d","description":"Light Rain","uvIndexColor":"#3EA72D","moonIcon":"","cloudColor":"#9292925F","windIcon":""},"daily":{"data":[{"time":1681988400000,"icon":"10d","description":"Moderate Rain","windSpeed":7,"windGust":8,"temperatureMin":8,"temperatureMax":16,"temperatureNight":11,"precipProbability":1,"cloudCover":87,"windBearing":316,"humidity":75,"pressure":1009,"sunriseTime":1681965843000,"sunsetTime":1682015258000,"precipAccumulation":15,"uvIndex":2.02,"precipColor":"#4681C3","color":"#4681C3","uvIndexColor":"#3EA72D","moonIcon":"","cloudColor":"#92929257","windIcon":"","hourly":[{"time":1682006400000,"icon":"10d","description":"Moderate Rain","windSpeed":2,"windGust":4,"temperature":12,"windBearing":330,"precipAccumulation":2.97,"precipProbability":0.97,"cloudCover":95,"humidity":94,"pressure":1010,"precipColor":"#4681C3","color":"#7E8E9D","cloudColor":"#9292925F","windIcon":""},{"time":1682010000000,"icon":"10d","description":"Moderate Rain","windSpeed":2,"windGust":6,"temperature":12,"windBearing":213,"precipAccumulation":1.15,"precipProbability":0.97,"cloudCover":95,"humidity":93,"pressure":1010,"precipColor":"#4681C3","color":"#8D9193","cloudColor":"#9292925F","windIcon":""},{"time":1682013600000,"icon":"10d","description":"Light Rain","windSpeed":4,"windGust":7,"temperature":12,"windBearing":135,"precipAccumulation":0.21,"precipProbability":0.97,"cloudCover":95,"humidity":94,"pressure":1010,"precipColor":"#4681C3","color":"#95938E","cloudColor":"#9292925F","windIcon":""},{"time":1682017200000,"icon":"10n","description":"Light Rain","windSpeed":4,"windGust":7,"temperature":11,"windBearing":147,"precipAccumulation":0.15,"precipProbability":0.8,"cloudCover":97,"humidity":95,"pressure":1010,"precipColor":"#4681C3","color":"#93928F","cloudColor":"#92929261","windIcon":""},{"time":1682020800000,"icon":"10n","description":"Moderate Rain","windSpeed":5,"windGust":8,"temperature":11,"windBearing":139,"precipAccumulation":1.8,"precipProbability":0.8,"cloudCover":98,"humidity":96,"pressure":1011,"precipColor":"#4681C3","color":"#858F99","cloudColor":"#92929262","windIcon":""},{"time":1682024400000,"icon":"10n","description":"Light Rain","windSpeed":4,"windGust":6,"temperature":11,"windBearing":127,"precipAccumulation":0.61,"precipProbability":0.8,"cloudCover":99,"humidity":97,"pressure":1012,"precipColor":"#4681C3","color":"#8E9094","cloudColor":"#92929263","windIcon":""},{"time":1682028000000,"icon":"10n","description":"Moderate Rain","windSpeed":2,"windGust":4,"temperature":10,"windBearing":156,"precipAccumulation":1.04,"precipProbability":0.8,"cloudCover":100,"humidity":97,"pressure":1012,"precipColor":"#4681C3","color":"#8A9097","cloudColor":"#92929264","windIcon":""},{"time":1682031600000,"icon":"10n","description":"Moderate Rain","windSpeed":4,"windGust":6,"temperature":10,"windBearing":114,"precipAccumulation":2.15,"precipProbability":0.79,"cloudCover":100,"humidity":98,"pressure":1012,"precipColor":"#4681C3","color":"#818E9C","cloudColor":"#92929264","windIcon":""}]},{"time":1682074800000,"icon":"10d","description":"Moderate Rain","windSpeed":9,"windGust":16,"temperatureMin":8,"temperatureMax":19,"temperatureNight":12,"precipProbability":0.8,"cloudCover":84,"windBearing":240,"humidity":56,"pressure":1010,"sunriseTime":1682052142000,"sunsetTime":1682101735000,"precipAccumulation":4.18,"uvIndex":5.18,"precipColor":"#4681C3","color":"#7C8F9D","uvIndexColor":"#FFF300","moonIcon":"","cloudColor":"#92929254","windIcon":""}]},"minutely":{"data":[{"intensity":3,"time":1682009280000},{"intensity":3,"time":1682009580000},{"intensity":3,"time":1682009880000},{"intensity":3,"time":1682010180000},{"intensity":3,"time":1682010480000},{"intensity":3,"time":1682010780000},{"intensity":3,"time":1682011080000},{"intensity":3,"time":1682011380000},{"intensity":3,"time":1682011680000},{"intensity":2,"time":1682011980000},{"intensity":2,"time":1682012280000},{"intensity":2,"time":1682012580000},{"intensity":2,"time":1682012880000}]},"alerts":[{"sender_name":"METEO-FRANCE","event":"Moderate avalanches warning","start":1681999262,"end":1682028000,"description":"Moderate damages may occur, especially in vulnerable or in exposed areas and to people who carry out weather-related activities.","tags":["Avalanches"]},{"sender_name":"METEO-FRANCE","event":"Moderate avalanches warning","start":1682028000,"end":1682114400,"description":"Moderate damages may occur, especially in vulnerable or in exposed areas and to people who carry out weather-related activities.","tags":["Avalanches"]}]}'
    );

    let fakeNow = weatherData.currently.time;
    let items = prepareItems(weatherData, lastUpdate, dayjs(fakeNow));
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
        <gridlayout row={1} margin="10" borderColor={$borderColor} borderWidth={1} borderRadius={10}>
            <WeatherComponent {weatherLocation} {items} {fakeNow} />
        </gridlayout>
        <gridlayout row={2} orientation="horizontal" columns="*,auto,auto">
            <slider value={fontScale} on:valueChange={(e) => setFontScale(e.value)} minValue={0.5} maxValue={2} />
            <label text={fontScale.toFixed(1)} col={1} verticalTextAlignment="middle"/>
            <mdbutton variant="text" verticalAlignment="middle" text={lc('reset')} on:tap={() => setFontScale(1)} col={2}/>
        </gridlayout>
        <CActionBar title={lc('font_scale')} />
    </gridlayout>
</page>
