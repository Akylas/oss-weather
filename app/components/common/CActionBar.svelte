<script lang="ts">
    import { Frame } from '@nativescript/core/ui/frame';
    import { onMount } from 'svelte';
    import { closeModal, goBack } from '~/utils/svelte/ui';
    import { conditionalEvent } from '~/utils/svelte/ui';
    import { fontScale } from '~/variables';

    export let title: string;
    export let showMenuIcon: boolean = false;
    export let canGoBack: boolean = false;
    export let modalWindow: boolean = false;
    export let disableBackButton: boolean = false;
    export let onMenuIcon: Function = null;
    let menuIcon: string;
    let menuIconVisible: boolean;
    let menuIconVisibility: string;

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

<gridlayout class="actionBar" columns="auto,*,auto" paddingLeft={5} paddingRight={5} rows="*" on:swipe {...$$restProps}>
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
        visibility={!!title ? 'visible' : 'hidden'} />
    <stacklayout col={0} orientation="horizontal">
        <mdbutton class="actionBarButton" text={menuIcon} variant="text" visibility={menuIconVisibility} on:tap={onMenuIconBtn} />
        <slot name="left" />
    </stacklayout>
    <stacklayout col={2} orientation="horizontal">
        <slot />
    </stacklayout>
</gridlayout>
