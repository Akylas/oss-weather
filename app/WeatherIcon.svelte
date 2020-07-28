<script context="module" lang="ts">
    import { File, Folder, knownFolders, path } from '@nativescript/core/file-system';
    const appPath = knownFolders.currentApp().path;
    const cache = new Map();
    function loadLottieJSON(iconSrc) {
        if (!cache.has(iconSrc)) {
            const file = File.fromPath(`${path.join(appPath, 'assets/lottie', iconSrc + '.json')}`);
            const value = file.readTextSync();
            cache.set(iconSrc, value);
            return value;
        }
        return cache.get(iconSrc);
    }
</script>

<script lang="ts">
    import { prefs } from '~/services/preferences';
    import { wiFontFamily } from '~/variables';
    import { getBoolean } from '@nativescript/core/application-settings';

    export let icon;
    export let fontSize: string|number = 40;
    export let autoPlay = getBoolean('animations', false);
    let iconSrc;
    $: {
        let realIcon;
        // console.log('icon', icon);
        switch (icon) {
            case 'mostly_clear':
            case 'mostly_clear-day':
            case 'clear':
            case 'clear-day':
            case '01d':
                realIcon = '4804-weather-sunny';
                break;
            case 'mostly_clear-night':
            case 'clear-night':
            case '01n':
                realIcon = '4799-weather-night';
                break;
            case 'rain-night':
            case '09n':
            case '10n':
            case 'rain_light-night':
                realIcon = '4797-weather-rainynight';
                break;
            case 'rain-day':
            case '09d':
            case '10d':
            case 'rain_light':
            case 'rain_light-day':
            case 'rain':
                realIcon = '4801-weather-partly-shower';
                break;
            case 'snow-night':
                realIcon = '4798-weather-snownight';
                break;
            case 'snow-day':
            case 'snow-night':
            case '13d':
            case '13n':
            case 'snow':
            case 'sleet':
                realIcon = '4793-weather-snow';
                break;
            case 'wind':
                realIcon = '4806-weather-windy';
                break;
            case 'fog':
            case '50d':
            case '50n':
                realIcon = '4795-weather-mist';
                break;
            case '04d':
            case '04n':
            case 'cloudy':
            case 'cloudy-day':
            case 'cloudy-night':
            case 'mostly_cloudy':
            case 'mostly_cloudy-night':
            case 'mostly_cloudy-day':
                // iconSrc = '4791-foggy';
                realIcon = '4806-weather-windy';
                break;
            case '03d':
            case '02d':
            case 'partly_cloudy':
            case 'partly_cloudy-day':
            case 'partly-cloudy-day':
            case 'drizzle':
            case 'drizzle-day':
                realIcon = '4800-weather-partly-cloudy';
                break;
            case '02n':
            case '03n':
            case 'partly_cloudy-night':
            case 'drizzle-night':
            case 'partly-cloudy-night':
                realIcon = '4796-weather-cloudynight';
                break;
            case '11d':
            case '11n':
                realIcon = '4805-weather-thunder';
                break;
        }
        if (realIcon) {
            if (autoPlay) {
                if (gVars.isAndroid) {
                    iconSrc = loadLottieJSON(realIcon);
                } else {
                    iconSrc = path.join(appPath, 'assets/lottie', realIcon + '.json');
                }
            } else {
                iconSrc = path.join(appPath, 'assets/images', realIcon + '.png');
            }
        } else {
            iconSrc = realIcon;
        }
    }

    $: prefs.on('key:animations', () => {
        autoPlay = getBoolean('animations');
    });
</script>

{#if autoPlay}
    <lottie {...$$restProps} src={iconSrc} width={fontSize} height={fontSize} loop="true" {autoPlay} progress={0.5} />
{:else}
    <image {...$$restProps} src={iconSrc} width={fontSize} height={fontSize}/>
{/if}
