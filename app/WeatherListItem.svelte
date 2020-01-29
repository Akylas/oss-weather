<script>
    import WeatherIcon from './WeatherIcon.svelte';
    import { localize as l } from 'nativescript-localize';
    import { colorFromTempC } from '~/helpers/formatter';
    export let item;

    let tempColor;
    let frontAlpha = 255;

    $: {
        frontAlpha = (item.fallPHour / 50) * 255;
        tempColor = colorFromTempC(item.tempC);
    }
</script>

<gridLayout padding="0 10 0 10" height="90" rows="*" columns="auto,*,auto">
    <label paddingTop="10" colSpan="2" fontSize="14" fontWeight="bold" verticalAlignment="top" text={item.time} />
    <label fontSize="18" fontWeight="bold" text={item.temp} verticalAlignment="center" color={tempColor} />
    <stackLayout  col="1" horizontalAlignment="center" verticalAlignment="center" orientation="horizontal" opacity="0.7">
        <label fontSize="12" padding="0" verticalAlignment="top" textAlignment="center">
            <span text={item.windSpeed + '\n'} />
            <span fontSize="22" class="mdi" text={'mdi-arrow-up'} />
        </label>
        <label fontSize="12" padding="0" verticalAlignment="top" textAlignment="center">
            <span text={item.humidity + '\n'} />
            <span fontSize="22" class="mdi" text={'mdi-water-percent'} />
        </label>
        <label fontSize="12" padding="0" verticalAlignment="top" textAlignment="center">
            <span text={item.feels_like + '\n'} />
            <span fontSize="22" class="mdi" text={'mdi-home-thermometer-outline'} />
        </label>
        <label fontSize="12" padding="0" verticalAlignment="top" textAlignment="center">
            <span text={item.pressure + '\n'} />
            <span fontSize="22" class="mdi" text={'mdi-gauge'} />
        </label>
    </stackLayout>
    <WeatherIcon col="2" icon={item.icon} {frontAlpha} horizontalAlignment="center"  verticalAlignment="center"/>
    <label paddingBottom="10" col="2" fontSize="10" text={item.fallDesc} horizontalAlignment="center" verticalAlignment="bottom" />
</gridLayout>
