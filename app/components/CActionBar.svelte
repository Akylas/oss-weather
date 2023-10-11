<script lang="ts">
    import { Frame } from '@nativescript/core/ui/frame';
    import { onMount } from 'svelte';
    import { closeModal, goBack } from 'svelte-native';

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
        setTimeout(() => {
            canGoBack = Frame.topmost() && Frame.topmost().canGoBack();
        }, 0);
    });
    function onMenuIconBtn() {
        if (onMenuIcon) {
            onMenuIcon();
        } else if (modalWindow) {
            closeModal(undefined);
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
        col={1}
        class="actionBarTitle"
        textAlignment="left"
        visibility={!!title ? 'visible' : 'hidden'}
        text={title || ''}
        verticalTextAlignment="center"
        maxLines={2}
        autoFontSize={true}
        minFontSize={12}
        maxFontSize={20}
    />
    <stacklayout col={0} orientation="horizontal">
        <mdbutton variant="text" visibility={menuIconVisibility} class="icon-btn" text={menuIcon} on:tap={onMenuIconBtn} />
        <slot name="left" />
    </stacklayout>
    <stacklayout col={2} orientation="horizontal">
        <slot />
    </stacklayout>
</gridlayout>
