<script context="module" lang="ts">
    import { iconService } from '~/services/icon';
    import { createEventDispatcher } from '@shared/utils/svelte/ui';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let isUserInteractionEnabled = true;
    export let iconData: [number, boolean];
    export let size: string | number = 40;
    // export let autoPlay = true;
    export let animated = false;
    let iconSrc: string;
    $: {
        if (iconData) {
            const icon = iconService.getIcon(iconData[0], iconData[1]);
            if (animated) {
                iconSrc = `~/assets/icon_themes/${iconService.iconSet}/lottie/${icon}.lottie`;
            } else {
                iconSrc = `${iconService.iconSetFolderPath}/images/${icon}.png`;
            }
        } else {
            iconSrc = null;
        }
    }

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

{#if animated}
    <lottie
        {...$$restProps}
        async={false}
        autoPlay={true}
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
