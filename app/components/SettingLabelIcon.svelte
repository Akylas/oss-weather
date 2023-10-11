<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { borderColor, iconColor, mdiFontFamily, primaryColor, subtitleColor as defaultSubtitleColor } from '~/variables';

    const dispatch = createEventDispatcher();
    export let title: string = null;
    export let subtitle: string = null;
    export let icon: string = null;
    export let subtitleColor = $defaultSubtitleColor;
    export let subtitleMaxLines = 2;
</script>

<gridlayout columns="16,*,auto,16" rippleColor={primaryColor} on:tap={(event) => dispatch('tap', event)} rows="12,*,12">
    <stacklayout row={1} col={1} verticalAlignment="middle">
        <label fontSize={17} text={title} textWrap="true" verticalTextAlignment="top" maxLines={2} lineBreak="end" />
        <label visibility={!!subtitle ? 'visible' : 'collapsed'} fontSize={14} text={subtitle} verticalTextAlignment="top" color={subtitleColor} maxLines={subtitleMaxLines} lineBreak="end" />
    </stacklayout>
    <label row={1} col={2} visibility={!!icon ? 'visible' : 'collapsed'} fontFamily={mdiFontFamily} fontSize={24} textAlignment="right" color={$iconColor} text={icon} verticalAlignment="middle" />

    <absoluteLayout row={2} col={1} colSpan={3} backgroundColor={$borderColor} height={1} verticalAlignment="bottom" />
</gridlayout>
