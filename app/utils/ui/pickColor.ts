import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
import { Color, View } from '@nativescript/core';
import { screenHeightDips } from '~/variables';

export async function pickColor(color: Color | string, { alpha = true, anchor }: { alpha?: boolean; anchor?: View } = {}) {
    const ColorPicker = (await import('@shared/components/ColorPicker.svelte')).default;
    return showBottomSheet<Color>({
        parent: anchor,
        view: ColorPicker,
        skipCollapsedState: true,
        props: {
            color,
            mode: 'grid',
            height: screenHeightDips * 0.8,
            alphaSupport: alpha
        }
    });
}
