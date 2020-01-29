<script>
    export let row;
    export let col;
    export let icon;
    export let frontAlpha;
    export let fontSize = 55;

    const sunnyColor = '#ffa500';
    const scatteredCloudyColor = '#cccccc';
    const cloudyColor = '#929292';
    let rainColor = 'rgb(70, 129, 195)';
    let snowColor = 'rgb(133, 216, 247)';
    let backIcon, middleIcon, frontIcon;
    let backColor, middleColor, frontColor;

    $: {
        backIcon = icon.charAt(2) === 'n' ? 'forecastfont-night' : 'forecastfont-sunny';
        backColor = sunnyColor;
        switch (icon) {
            case '01d':
                middleIcon = 'forecastfont-sun';
            case '01n':
                middleIcon = 'forecastfont-moon';
                backIcon = '';
                middleColor = sunnyColor;
                break;
            case '02d':
            case '02n':
                middleIcon = 'forecastfont-cloud';
                middleColor = cloudyColor;
                break;
            case '03d':
                backIcon = '';
            case '03n':
                middleIcon = 'forecastfont-cloud';
                middleColor = scatteredCloudyColor;
                break;
            case '04d':
                backIcon = '';
            case '04n':
                middleIcon = 'forecastfont-cloud';
                middleColor = cloudyColor;
                break;
            case '09d':
                backIcon = '';
            case '09n':
                middleIcon = 'forecastfont-basecloud';
                middleColor = cloudyColor;
                frontIcon = 'forecastfont-drizzle';
                frontColor = `rgba(70, 129, 195, ${frontAlpha})`;
                break;
            case '10n':
            case '10d':
                middleIcon = 'forecastfont-basecloud';
                middleColor = cloudyColor;
                frontIcon = 'forecastfont-drizzle';
                frontColor = `rgba(70, 129, 195, ${frontAlpha})`;
                break;
            case '11d':
                backIcon = '';
            case '11n':
                middleIcon = 'forecastfont-basecloud';
                middleColor = cloudyColor;
                frontIcon = 'forecastfont-thunder';
                frontColor = sunnyColor;
                break;
            case '13d':
                backIcon = '';
            case '13n':
                middleIcon = 'forecastfont-basecloud';
                middleColor = cloudyColor;
                frontIcon = 'forecastfont-snowy';
                frontColor = `rgba(133, 216, 247, ${frontAlpha})`;
                break;
            case '50d':
            case '50n':
                backIcon = '';
                middleIcon = 'forecastfont-mist';
                middleColor = cloudyColor;
                break;
        }
    }
</script>

<gridLayout {row} {col} horizontalAlignment="center" verticalAlignment="center">
    <label fontSize={fontSize * 1} class="forecastfont" text={backIcon} color={backColor} horizontalAlignment="right" />
    <label {fontSize} class="forecastfont" text={middleIcon} color={middleColor} />
    <label {fontSize} class="forecastfont" text={frontIcon} color={frontColor} verticalAlignment="bottom" />
</gridLayout>

