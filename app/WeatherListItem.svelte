<script>
    // @ts-ignore
    import WeatherIcon from './WeatherIcon.svelte';
    import { localize as l } from '~/helpers/formatter';
    import { colorFromTempC } from '~/helpers/formatter';
    export let item;

    // let tempColor;
    // let frontAlpha = 1;

    // $: {
    //     frontAlpha = Math.min(item.fallPHour / 5, 1);
    //     tempColor = colorFromTempC(item.tempC);
    // }

    function onLayoutChange(event) {
        console.log('WeatherListItem', event.object.getMeasuredWidth(), event.object.getMeasuredHeight());
    }
</script>

<gridLayout padding="0 10 0 10" height="90" rows="24,*" columns="*,40,40,40,*" borderTopColor="#444" borderTopWidth="1">
    <label colSpan="5" fontSize="14" fontWeight="bold" horizontalAlignment="left" verticalAlignment="bottom" text={item.time} />
    <label col="0" row="1" fontSize="18" verticalAlignment="center" textAlignment="left" color={item.tempColor}>
        <span text={item.temp + '\n'} />
        <span fontSize="10" text={item.feels_like} />
    </label>
    <!-- <stackLayout row="1" col="1" horizontalAlignment="center" verticalAlignment="center" orientation="horizontal" opacity="0.7"> -->
    <label row="1" col="1" fontSize="10" verticalAlignment="center" textAlignment="center" width="60" opacity="0.7">
        <span fontSize="20" class="mdi" text={'mdi-arrow-up' + '\n'} />
        <span text={item.windSpeed} />
    </label>
    <label row="1" col="2" fontSize="10" verticalAlignment="center" textAlignment="center" width="60" opacity="0.7">
        <span fontSize="20" class="mdi" text={'mdi-water-percent' + '\n'} />
        <span text={item.humidity} />
    </label>
    <label row="1" col="3" fontSize="10" verticalAlignment="center" textAlignment="center" width="60" opacity="0.7">
        <span fontSize="20" class="mdi" text={'mdi-gauge' + '\n'} />
        <span text={item.pressure} />
    </label>
    <!-- </stackLayout> -->
    <label
        row="0"
        col="4"
        fontSize="10"
        text={item.fallDesc}
        horizontalAlignment="center"
        verticalAlignment="bottom"
        padding="2"
        borderRadius="2"
        backgroundColor="rgba(70, 129, 195, {item.frontAlpha})" />
    <WeatherIcon row="1" col="4" icon={item.icon} horizontalAlignment="right" verticalAlignment="center" />
</gridLayout>
