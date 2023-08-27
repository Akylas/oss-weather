<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Color } from '@nativescript/core';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { backgroundColor, fontScale, onImperialChanged } from '~/variables';
    import WeatherCollectionItem from '~/components/WeatherCollectionItem.svelte';
    import { HandlerType, Manager, NativeViewGestureHandler } from '@nativescript-community/gesturehandler';

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

    function onDataPopulated() {
        showLeftShadow = false;
        showRightShadow = true;
    }

    let showLeftShadow = false;
    let showRightShadow = true;
    function onScrollEvent(event) {
        showLeftShadow = event.scrollOffsetPercentage > 0;
        showRightShadow = event.scrollOffsetPercentage < 1;
    }

    onImperialChanged(() => {
        collectionView.nativeView.refreshVisibleItems();
    });
</script>

<gridlayout {...$$restProps}>
    <collectionview
        nestedScrollingEnabled={false}
        bind:this={collectionView}
        itemIdGenerator={(_item, index) => index}
        orientation="horizontal"
        colWidth={68 * $fontScale}
        rowHeight="100%"
        height="100%"
        isBounceEnabled="false"
        iosOverflowSafeAreaEnabled="false"
        {items}
        on:dataPopulated={onDataPopulated}
        on:scroll={onScrollEvent}
    >
        <Template let:item>
            <WeatherCollectionItem {item} />
        </Template>
    </collectionview>
    <absolutelayout
        visibility={showLeftShadow ? 'visible' : 'hidden'}
        background={`linear-gradient(to right, ${$backgroundColor}, ${new Color($backgroundColor).setAlpha(0)})`}
        height="100%"
        width={40}
        horizontalAlignment="left"
    />
    <absolutelayout
        visibility={showRightShadow ? 'visible' : 'hidden'}
        background={`linear-gradient(to right, ${new Color($backgroundColor).setAlpha(0)}, ${$backgroundColor})`}
        height="100%"
        width={40}
        horizontalAlignment="right"
    />
</gridlayout>
