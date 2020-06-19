<script context="module">
    import { File, Folder, knownFolders, path } from '@nativescript/core/file-system/file-system';
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

<script>
    import { prefs } from '~/services/preferences';
    import { wiFontFamily } from '~/variables';
    import { getBoolean } from '@nativescript/core/application-settings';

    export let icon;
    export let fontSize = 40;
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
                realIcon = '4804-weather-sunny';
                break;
            case 'mostly_clear-night':
            case 'clear-night':
                realIcon = '4799-weather-night';
                break;
            case 'rain-night':
            case 'rain_light-night':
                realIcon = '4797-weather-rainynight';
                break;
            case 'rain-day':
            case 'rain_light':
            case 'rain_light-day':
            case 'rain':
                realIcon = '4801-weather-partly-shower';
                break;
            case 'snow-night':
                realIcon = '4798-weather-snownight';
                break;
            case 'snow-day':
            case 'snow':
            case 'sleet':
                realIcon = '4793-weather-snow';
                break;
            case 'wind':
                realIcon = '4806-weather-windy';
                break;
            case 'fog':
                realIcon = '4795-weather-mist';
                break;
            case 'cloudy':
            case 'cloudy-day':
            case 'cloudy-night':
            case 'mostly_cloudy':
            case 'mostly_cloudy-night':
            case 'mostly_cloudy-day':
                // iconSrc = '4791-foggy';
                realIcon = '4806-weather-windy';
                break;
            case 'partly_cloudy':
            case 'partly_cloudy-day':
            case 'partly-cloudy-day':
            case 'drizzle':
            case 'drizzle-day':
                realIcon = '4800-weather-partly-cloudy';
                break;
            case 'partly_cloudy-night':
            case 'drizzle-night':
            case 'partly-cloudy-night':
                realIcon = '4796-weather-cloudynight';
                break;
        }
        if (realIcon) {
            if (gVars.isAndroid) {
                iconSrc = loadLottieJSON(realIcon);
            } else {
                iconSrc = path.join(appPath, 'assets/lottie', realIcon + '.json');
            }
        } else {
            iconSrc = realIcon
        }

    }

    $: prefs.on('key:animations', () => {
        autoPlay = getBoolean('animations');
    });
</script>

<lottie {...$$restProps} src={iconSrc} width={fontSize} height={fontSize} loop="true" {autoPlay} progress={0.5} />
