<script>
    import { wiFontFamily } from '~/variables';
    export let icon;
    // export let frontAlpha = 1;
    export let fontSize = 40;
    export let autoPlay = false;

    // const sunnyColor = '#ffa500';
    // const scatteredCloudyColor = '#cccccc';
    // const cloudyColor = '#929292';
    // let rainColor = 'rgb(70, 129, 195)';
    // let snowColor = 'rgb(133, 216, 247)';
    // let backIcon, middleIcon, frontIcon;
    // let backColor, middleColor, frontColor;


    let iconSrc;
    let p
    $:{
        let {icon, autoPlay,...p2} = $$props
        p = p2;
    }

    $:{
        switch (icon) {
            case 'clear-day':
                iconSrc = '4804-weather-sunny'
                break;
            case 'clear-night':
                iconSrc = '4799-weather-night'
                break;
            case 'rain':
                iconSrc = '4801-weather-partly-shower'
                break;
            case 'snow':
            case 'sleet':
                iconSrc = '4793-weather-snow'
                break;
            case 'wind':
                iconSrc = '4806-weather-windy'
                break;
            case 'fog':
                iconSrc = '4795-weather-mist'
                break;
            case 'cloudy':
                iconSrc = '4791-foggy'
                break;
            case 'partly-cloudy-day':
                iconSrc = '4800-weather-partly-cloudy'
                break;
            case 'partly-cloudy-night':
                iconSrc = '4796-weather-cloudynight'
                break;
        }
    }

    // $: {
    //     // console.log('icon', icon);
    //     const isNight = (icon && (icon.endsWith('-night') || icon.charAt(2) === 'n'))
    //     backIcon = isNight ? 'forecastfont-night' : 'forecastfont-sunny';
    //     icon = icon.replace('-night', '').replace('-day', '')
    //     backColor = sunnyColor;
    //     frontIcon = '';

    //     switch (icon) {
    //         // case '01d':
    //         // case '01n':
    //         case 'clear':
    //             if (isNight) {
    //                 middleIcon = 'forecastfont-moon';
    //             } else {
    //                 middleIcon = 'forecastfont-sun';
    //             }
    //             backIcon = '';
    //             middleColor = sunnyColor;
    //             break;
    //         // case '02d':
    //         // case '02n':
    //             // middleIcon = 'forecastfont-cloud';
    //             // middleColor = cloudyColor;
    //             // break;
    //         // case '03d':
    //             // backIcon = '';
    //         case 'partly-cloudy':
    //         // case '03n':
    //             middleIcon = 'forecastfont-cloud';
    //             middleColor = scatteredCloudyColor;
    //             break;
    //         case 'cloudy':
    //         // case '04d':
    //             backIcon = '';
    //         // case '04n':
    //             middleIcon = 'forecastfont-cloud';
    //             middleColor = cloudyColor;
    //             break;
    //         case 'rain':
    //         // case '09d':
    //             backIcon = '';
    //         // case '09n':
    //             middleIcon = 'forecastfont-basecloud';
    //             middleColor = cloudyColor;
    //             frontIcon = 'forecastfont-rainy';
    //             frontColor = `rgba(70, 129, 195, ${frontAlpha})`;
    //             break;
    //         // case '10n':
    //         // case '10d':
    //             // middleIcon = 'forecastfont-basecloud';
    //             // middleColor = cloudyColor;
    //             // frontIcon = 'forecastfont-rainy';
    //             // frontColor = `rgba(70, 129, 195, ${frontAlpha})`;
    //             // break;
    //         // case '11d':
    //             // backIcon = '';
    //         // case '11n':
    //             // middleIcon = 'forecastfont-basecloud';
    //             // middleColor = cloudyColor;
    //             // frontIcon = 'forecastfont-thunder';
    //             // frontColor = sunnyColor;
    //             // break;
    //         // case '13d':
    //             // backIcon = '';
    //         // case '13n':
    //         //     middleIcon = 'forecastfont-basecloud';
    //         //     middleColor = cloudyColor;
    //         //     frontIcon = 'forecastfont-snowy';
    //         //     frontColor = `rgba(133, 216, 247, ${frontAlpha})`;
    //         //     break;
    //         // case '50d':
    //         // case '50n':
    //         //     backIcon = '';
    //         //     middleIcon = 'forecastfont-mist';
    //         //     middleColor = cloudyColor;
    //         //     break;
    //     }
    //     // htmlText = `<font face="${wiFontFamily}" color=${backColor}>${backIcon}</font>`
    // }
</script>

<!-- <gridLayout {...$$props} horizontalAlignment="center"  width={fontSize} height={fontSize}> -->
    <lottie {...p} src="~/assets/lottie/{iconSrc}.json" width={fontSize} height={fontSize} loop="true" {autoPlay}/>
     <!-- <label fontSize={fontSize} class="forecastfont" text={backIcon} color={backColor}  /> -->
    <!-- <label {fontSize} class="forecastfont" text={middleIcon} color={middleColor} /> -->
    <!-- <label {fontSize} class="forecastfont" text={frontIcon} color={frontColor}  /> -->
<!-- </gridLayout> -->
 