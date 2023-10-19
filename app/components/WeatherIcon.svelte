<script context="module" lang="ts">
    import { getBoolean } from '@nativescript/core/application-settings';
    import { createEventDispatcher } from 'svelte';
    import { prefs } from '~/services/preferences';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let isUserInteractionEnabled = true;
    export let icon: string;
    export let size: string | number = 40;
    // export let autoPlay = true;
    export let autoPlay = getBoolean('animations', false);
    let iconSrc: string;
    $: {
        let realIcon;
        // console.log('icon', icon);
        switch (icon) {
            // case 'mostly_clear':
            // case 'mostly_clear-day':
            // case 'clear':
            // case 'clear-day':
            case '01d':
                realIcon = '4804-weather-sunny';
                break;
            // case 'mostly_clear-night':
            // case 'clear-night':
            case '01n':
                realIcon = '4799-weather-night';
                break;
            // case 'rain-night':
            case '09n':
            case '10n':
                // case 'rain_light-night':
                realIcon = '4797-weather-rainynight';
                break;
            // case 'rain-day':
            case '09d':
            case '10d':
                // case 'rain_light':
                // case 'rain_light-day':
                // case 'rain':
                realIcon = '4801-weather-partly-shower';
                break;
            // case 'snow-day':
            // case 'snow-night':
            case '13d':
                realIcon = '4793-weather-snow';
                break;
            case '13n':
                realIcon = '4798-weather-snownight';
                // case 'snow':
                // case 'sleet':
                break;
            // case 'wind':
            // realIcon = '4806-weather-windy';
            // break;
            // case 'fog':
            case '50d':
            case '50n':
                realIcon = '4795-weather-mist';
                break;
            case '04d':
            case '04n':
                // case 'cloudy':
                // case 'cloudy-day':
                // case 'cloudy-night':
                // case 'mostly_cloudy':
                // case 'mostly_cloudy-night':
                // case 'mostly_cloudy-day':
                // iconSrc = '4791-foggy';
                realIcon = '4806-weather-windy';
                break;
            case '03d':
            case '02d':
                // case 'partly_cloudy':
                // case 'partly_cloudy-day':
                // case 'partly-cloudy-day':
                // case 'drizzle':
                // case 'drizzle-day':
                realIcon = '4800-weather-partly-cloudy';
                break;
            case '02n':
            case '03n':
                // case 'partly_cloudy-night':
                // case 'drizzle-night':
                // case 'partly-cloudy-night':
                realIcon = '4796-weather-cloudynight';
                break;
            case '11d':
            case '11n':
                realIcon = '4805-weather-thunder';
                break;
            // not available through OWM
            case '12d':
            case '12n':
                realIcon = '4792-weather-stormshowersday';
                break;
        }
        if (realIcon) {
            if (autoPlay) {
                iconSrc = `~/assets/lottie/${realIcon}.lottie`;
            } else {
                iconSrc = `~/assets/images/${realIcon}.png`;
            }
        } else {
            iconSrc = realIcon;
        }
    }

    prefs.on('key:animations', () => {
        autoPlay = getBoolean('animations');
    });

    function conditionalEvent(node, { condition, event, callback }) {
        let toRemove;
        if (condition) {
            toRemove = callback;
            node.addEventListener(event, callback);
        }

        return {
            destroy() {
                if (toRemove) {
                    node.removeEventListener(event, toRemove);
                }
            }
        };
    }
</script>

{#if autoPlay}
    <lottie
        {...$$restProps}
        src={iconSrc}
        width={size}
        height={size}
        loop={true}
        {autoPlay}
        progress={0.5}
        use:conditionalEvent={{ condition: !!isUserInteractionEnabled, event: 'tap', callback: (event) => dispatch('tap', event) }}
        {isUserInteractionEnabled}
    />
{:else}
    <image {...$$restProps} src={iconSrc} width={size} height={size} 
    use:conditionalEvent={{ condition: !!isUserInteractionEnabled, event: 'tap', callback: (event) => dispatch('tap', event) }}
    {isUserInteractionEnabled} />
{/if}
