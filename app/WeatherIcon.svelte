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

    export let icon;
    export let fontSize = 40;
    export let autoPlay = prefs.getValue('animations', false);

    let iconSrc;
    let iconJSON;
    let p;
    $: {
        let { icon, autoPlay, ...p2 } = $$props;
        p = p2;
    }

    $: {
        switch (icon) {
            case 'clear-day':
                iconSrc = '4804-weather-sunny';
                break;
            case 'clear-night':
                iconSrc = '4799-weather-night';
                break;
            case 'rain':
                iconSrc = '4801-weather-partly-shower';
                break;
            case 'snow':
            case 'sleet':
                iconSrc = '4793-weather-snow';
                break;
            case 'wind':
                iconSrc = '4806-weather-windy';
                break;
            case 'fog':
                iconSrc = '4795-weather-mist';
                break;
            case 'cloudy':
                iconSrc = '4791-foggy';
                break;
            case 'partly-cloudy-day':
                iconSrc = '4800-weather-partly-cloudy';
                break;
            case 'partly-cloudy-night':
                iconSrc = '4796-weather-cloudynight';
                break;
        }
        iconJSON = loadLottieJSON(iconSrc);
    }

    $: prefs.on('key:animations', () => {
        autoPlay = prefs.getValue('animations');
        console.log('autoPlay', 'changed', autoPlay);
    });
</script>

<lottie {...p} src={iconJSON} width={fontSize} height={fontSize} loop="true" {autoPlay} progress={0.5} />
