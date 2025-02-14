<script lang="ts">
    import { CoreTypes } from '@nativescript/core';
    import { Frame } from '@nativescript/core/ui/frame';
    import { closeModal, goBack } from '@shared/utils/svelte/ui';
    import { onMount } from 'svelte';
    import { actionBarHeight, fontScale, windowInset } from '~/variables';

    export let title: string = null;
    export let height = null;
    export let showMenuIcon: boolean = false;
    export let canGoBack: boolean = false;
    export let modalWindow: boolean = false;
    export let disableBackButton: boolean = false;
    export let onMenuIcon: Function = null;
    let menuIcon: string;
    let menuIconVisible: boolean;
    let menuIconVisibility: CoreTypes.VisibilityType;

    onMount(() => {
        const frame = Frame.topmost();
        canGoBack = frame?.canGoBack() || !!frame?.currentEntry;
    });
    function onMenuIconBtn() {
        if (onMenuIcon) {
            onMenuIcon();
        } else if (modalWindow) {
            closeModal(undefined);
        } else {
            const frame = Frame.topmost();
            // this means the frame is animating
            // doing goBack would mean boing back up 2 levels because
            // the animating context is not yet in the backStack
            if (frame['_executingContext']) {
                return;
            }
            goBack();
        }
    }
    $: {
        if (modalWindow) {
            menuIcon = 'mdi-close';
        } else {
            menuIcon = canGoBack ? (__IOS__ ? 'mdi-chevron-left' : 'mdi-arrow-left') : 'mdi-menu';
        }
    }
    $: menuIconVisible = ((canGoBack || modalWindow) && !disableBackButton) || showMenuIcon;
    $: menuIconVisibility = menuIconVisible ? 'visible' : 'collapse';
</script>

<gridlayout class="actionBar" android:marginTop={$windowInset.top} columns="auto,*,auto" rows={`${height || $actionBarHeight},auto`} on:swipe on:tap={() => {}} {...$$restProps}>
    <label
        id="actionBarTitle"
        class="actionBarTitle"
        autoFontSize={true}
        col={1}
        maxFontSize={20 * $fontScale}
        maxLines={2}
        minFontSize={12 * $fontScale}
        text={title || ''}
        textAlignment="left"
        verticalTextAlignment="center"
        visibility={!!title ? 'visible' : 'hidden'}
        {...$$restProps?.titleProps}>
        <slot name="subtitle" />
        <slot name="subtitle2" />
    </label>
    <slot name="center" />
    <stacklayout orientation="horizontal">
        <mdbutton class="actionBarButton" text={menuIcon} variant="text" visibility={menuIconVisibility} on:tap={onMenuIconBtn} />
        <slot name="left" />
    </stacklayout>
    <stacklayout col={2} orientation="horizontal">
        <slot />
    </stacklayout>
    <slot name="bottom" row={1} />
</gridlayout>
