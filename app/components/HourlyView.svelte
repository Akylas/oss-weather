<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Color } from '@nativescript/core';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { colors, fontScale, onImperialChanged } from '~/variables';
    import WeatherCollectionItem from '~/components/WeatherCollectionItem.svelte';
    import { HandlerType, Manager, NativeViewGestureHandler } from '@nativescript-community/gesturehandler';
    import { onThemeChanged } from '~/helpers/theme';

    $: ({ colorBackground } = $colors);

    export let items: any[];
    let collectionView: NativeViewElementNode<CollectionView>;
    // let gestureHandler;
    // $: {
    //     if (collectionView) {
    //         const manager = Manager.getInstance();
    //         gestureHandler = manager.createGestureHandler(HandlerType.NATIVE_VIEW, 15644, {
    //             disallowInterruption: true
    //         });
    //         gestureHandler.attachToView(collectionView.nativeView);
    //     }
    // }
    // let needsScrollToStart = false;
    // $: if(items) needsScrollToStart = true;

    function onDataPopulated() {
        collectionView?.nativeView?.scrollToOffset(0);
        showLeftShadow = false;
        showRightShadow = true;
    }

    let showLeftShadow = false;
    let showRightShadow = true;
    function onScrollEvent(event) {
        showLeftShadow = event.scrollOffsetPercentage > 0;
        showRightShadow = event.scrollOffsetPercentage < 1;
    }

    // onImperialChanged(() => {
    //     collectionView?.nativeView?.refreshVisibleItems();
    // });
    onThemeChanged(() => {
        collectionView.nativeView.refreshVisibleItems();
    });
</script>

<gridlayout {...$$restProps}>
    <collectionview
        bind:this={collectionView}
        id="hourly"
        colWidth={68 * $fontScale}
        height="100%"
        iosOverflowSafeAreaEnabled="false"
        isBounceEnabled="false"
        itemIdGenerator={(_item, index) => index}
        {items}
        nestedScrollingEnabled={false}
        orientation="horizontal"
        rowHeight="100%"
        on:dataPopulated={onDataPopulated}
        on:scroll={onScrollEvent}
    >
        <Template let:item>
            <WeatherCollectionItem {item} />
        </Template>
    </collectionview>
    <absolutelayout
        background={`linear-gradient(to right, ${colorBackground}, ${new Color(colorBackground).setAlpha(0)})`}
        height="100%"
        horizontalAlignment="left"
        visibility={showLeftShadow ? 'visible' : 'hidden'}
        width={40}
    />
    <absolutelayout
        background={`linear-gradient(to right, ${new Color(colorBackground).setAlpha(0)}, ${colorBackground})`}
        height="100%"
        horizontalAlignment="right"
        visibility={showRightShadow ? 'visible' : 'hidden'}
        width={40}
    />
</gridlayout>
