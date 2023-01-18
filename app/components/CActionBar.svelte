<script lang="ts">
    import { Frame } from '@nativescript/core/ui/frame';
    import { onMount } from 'svelte';
    import { closeModal, goBack } from '~/utils/svelte/navigation';
    import { textColor } from '~/variables';

    export let title: string;
    export let showMenuIcon: boolean = false;
    export let canGoBack: boolean = false;
    export let modalWindow: boolean = false;
    export let disableBackButton: boolean = false;
    export let onClose: Function = null;
    let menuIcon: string;
    let menuIconVisible: boolean;
    let menuIconVisibility: string;

    onMount(() => {
        setTimeout(() => {
            canGoBack = Frame.topmost() && Frame.topmost().canGoBack();
        }, 0);
    });
    function onMenuIcon() {
        if (modalWindow) {
            onClose ? onClose() : closeModal(undefined);
        } else {
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
    $: menuIconVisibility = menuIconVisible ? 'visible' : 'collapsed';
</script>

<gridlayout class="actionBar" columns="auto,*, auto" rows="*" paddingLeft={5} paddingRight={5}>
    <label
        id="actionbar-title"
        col={1}
        colSpan={3}
        class="actionBarTitle"
        textAlignment="left"
        visibility={!!title ? 'visible' : 'hidden'}
        text={title || ''}
        verticalTextAlignment="center"
    />
    <!-- {#if showLogo && !title}
        <label col={1} class="activelook" fontSize={28} color="white" text="logo" verticalAlignment="center" marginLeft={6} />
    {/if} -->
    <stacklayout col={0} orientation="horizontal">
        <slot name="left" />
        <mdbutton variant="text" visibility={menuIconVisibility} class="icon-btn" text={menuIcon} on:tap={onMenuIcon} />
    </stacklayout>
    <stacklayout col={2} orientation="horizontal">
        <slot />
    </stacklayout>
</gridlayout>
