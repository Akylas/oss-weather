<script context="module" lang="ts">
    import { getBoolean } from '@nativescript/core/application-settings';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { prefs } from '~/services/preferences';
    import { iconService } from '~/services/icon';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let isUserInteractionEnabled = true;
    export let iconData: [number, boolean];
    export let size: string | number = 40;
    // export let autoPlay = true;
    export let autoPlay = getBoolean('animations', false);
    let iconSrc: string;
    $: {
        if (iconData) {
            const icon = iconService.getIcon(iconData[0], iconData[1]);
            if (autoPlay) {
                iconSrc = `~/assets/icon_themes/${iconService.iconSet}/lottie/${icon}.lottie`;
            } else {
                iconSrc = `${iconService.iconSetFolderPath}/images/${icon}.png`;
            }
        } else {
            iconSrc = null;
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
        async={false}
        {autoPlay}
        height={size}
        {isUserInteractionEnabled}
        loop={true}
        progress={0.5}
        src={iconSrc}
        width={size}
        use:conditionalEvent={{ condition: !!isUserInteractionEnabled, event: 'tap', callback: (event) => dispatch('tap', event) }} />
{:else}
    <image
        {...$$restProps}
        height={size}
        {isUserInteractionEnabled}
        src={iconSrc}
        width={size}
        use:conditionalEvent={{ condition: !!isUserInteractionEnabled, event: 'tap', callback: (event) => dispatch('tap', event) }} />
{/if}
