<script>
    import { onMount } from 'svelte';
    import { Frame } from '@nativescript/core/ui/frame';
    export let title;
    export let row;
    export let col;
    export let colSpan;
    export let subtitle;
    export let showLogo = false;
    export let showMenuIcon = false;
    export let canGoBack = false;
    export let disableBackButton = false;
    export let backgroundColor;
    let menuIcon;
    let menuIconVisible;
    let menuIconVisibility;

    onMount(() => (canGoBack = Frame.topmost() && Frame.topmost().canGoBack()));

    $: menuIcon = canGoBack ? (gVars.isIOS ? 'mdi-chevron-left' : 'mdi-arrow-left') : 'mdi-menu';
    $: menuIconVisible = (canGoBack && !disableBackButton) || showMenuIcon;
    $: menuIconVisibility = menuIconVisible ? 'visible' : 'collapsed';
</script>

<gridLayout class="actionBar" columns="auto,*, auto" paddingLeft="5" paddingRight="5" {col} {row} {colSpan} {backgroundColor}>
    <stackLayout col="1" colSpan="3" verticalAlignment="center">
        <label class="actionBarTitle" visibility={!!title ? 'visible' : 'hidden'} textAlignment="left" text={(title || '')} />
        <label visibility={!!subtitle ? 'visible' : 'collapse'} textAlignment="left" class="actionBarSubtitle" text={subtitle} />
    </stackLayout>
    {#if showLogo && !title}
        <label col="1" class="activelook" fontSize="28" color="white" text="logo" verticalAlignment="center" marginLeft="6" />
    {/if}
    <stackLayout col="0" orientation="horizontal">
        <slot name="left" />
        <button variant="flat" visibility={menuIconVisibility} class="icon-btn" text={menuIcon} @tap="onMenuIcon" />
    </stackLayout>
    <stackLayout col="2" orientation="horizontal">
        <slot />
    </stackLayout>
</gridLayout>
