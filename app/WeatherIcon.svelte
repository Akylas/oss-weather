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
    let iconJSON;
    // let p;
    // $: {
    //     // let { icon, autoPlay, ...p2 } = $$props;
    //     p = $$restProps;
    // }

    $: {
        console.log('icon', icon);
        switch (icon) {
            case 'clear-day':
                iconSrc = '4804-weather-sunny';
                break;
            case 'clear-night':
                iconSrc = '4799-weather-night';
                break;
            case 'rain-night':
                iconSrc = '4797-weather-rainynight';
                break;
            case 'rain-day':
            case 'rain':
                iconSrc = '4801-weather-partly-shower';
                break;
            case 'snow-night':
                iconSrc = '4798-weather-snownight';
                break;
            case 'snow-day':
            case 'snow':
            case 'sleet':
            case 'drizzle':
                iconSrc = '4793-weather-snow';
                break;
            case 'wind':
                iconSrc = '4806-weather-windy';
                break;
            case 'fog':
                iconSrc = '4795-weather-mist';
                break;
            case 'cloudy':
            case 'mostly_cloudy':
                // iconSrc = '4791-foggy';
                iconSrc = '4806-weather-windy';
                break;
            case 'partly-cloudy-day':
                iconSrc = '4800-weather-partly-cloudy';
                break;
            case 'partly-cloudy-night':
                iconSrc = '4796-weather-cloudynight';
                break;
        }
        if (iconSrc) {
            iconJSON = loadLottieJSON(iconSrc);
        } else {
            iconJSON = null;
        }

        // iconSrc = path.join('~/assets/lottie', iconSrc + '.json');
    }

    $: prefs.on('key:animations', () => {
        autoPlay = getBoolean('animations');
    });
</script>

<lottie {...$$restProps} src={iconJSON} width={fontSize} height={fontSize} loop="true" {autoPlay} progress={0.5} />
