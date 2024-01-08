<script lang="ts">
    import { Canvas, CanvasView } from '@nativescript-community/ui-canvas';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { colors, fonts, systemFontScale } from '~/variables';
    $: ({ colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorOutlineVariant } = $colors);
    const dispatch = createEventDispatcher();
    // technique for only specific properties to get updated on store change
    export let showBottomLine: boolean = false;
    export let extraPaddingLeft: number = 0;
    export let iconFontSize: number = 24;
    export let fontSize: number = 17;
    export let fontWeight: string = 'bold';
    export let subtitleFontSize: number = 14;
    export let title: string = null;;
    export let subtitle: string = null;
    export let leftIcon: string = null;
    export let columns: string = '*';
    export let mainCol = 0;
    export let leftIconFonFamily: string = $fonts.mdi;
    export let color: string = colorOnSurface;
    export let onDraw: (event: { canvas: Canvas; object: CanvasView }) => void = null;
</script>

<canvas {columns} rippleColor={colorPrimary} on:tap={(event) => dispatch('tap', event)} {...$$restProps} padding="0 16 0 16">
    <canvaslabel col={mainCol} color={color || colorOnSurface} on:draw={onDraw}>
        <cgroup paddingBottom={subtitle ? 10 : 0} verticalAlignment="middle">
            <cspan fontFamily={leftIconFonFamily} fontSize={iconFontSize * $systemFontScale} paddingLeft="10" text={leftIcon} visibility={leftIcon ? 'visible' : 'hidden'} width={iconFontSize * 2} />
        </cgroup>
        <cgroup paddingLeft={(leftIcon ? iconFontSize * 2 : 0) + extraPaddingLeft} textAlignment="left" verticalAlignment="middle">
            <cspan fontSize={fontSize * $systemFontScale} {fontWeight} text={title} />
            <cspan color={colorOnSurfaceVariant} fontSize={subtitleFontSize * $systemFontScale} text={subtitle ? '\n' + subtitle : ''} visibility={subtitle ? 'visible' : 'hidden'} />
        </cgroup>
    </canvaslabel>
    <slot />
    <line color={colorOutlineVariant} height="1" startX="20" startY="0" stopX="100%" stopY="0" strokeWidth="1" verticalAlignment="bottom" visibility={showBottomLine ? 'visible' : 'hidden'} />
</canvas>