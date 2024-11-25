<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Color } from '@nativescript/core';
    import { Template } from 'svelte-native/components';
    import type { NativeViewElementNode } from 'svelte-native/dom';
    import HourlyItem from '~/components/HourlyItem.svelte';
    import { isEInk, onThemeChanged } from '~/helpers/theme';
    import { iconService } from '~/services/icon';
    import { colors, fontScale, onUnitsChanged } from '~/variables';

    let { colorBackground, colorOutline } = $colors;
    $: ({ colorBackground, colorOutline } = $colors);

    export let items: any[];
    let collectionView: NativeViewElementNode<CollectionView>;
    let showLeftShadowOpacity = 0;
    let showRightShadowOpacity = 1;

    function onDataPopulated() {
        showLeftShadowOpacity = 0;
        showRightShadowOpacity = 1;
        collectionView?.nativeView?.scrollToIndex(0, false);
    }

    function onScrollEvent(event) {
        showLeftShadowOpacity = Math.min(event.scrollOffset, 60) / 60;
        showRightShadowOpacity = Math.min(event.scrollSize - event.scrollOffset, 60) / 60;
    }

    function refreshVisibleItems() {
        collectionView?.nativeView?.refreshVisibleItems();
    }

    onUnitsChanged(refreshVisibleItems);
    onThemeChanged(refreshVisibleItems);

    function selectTemplate(item, index, items) {
        if (iconService.animated) {
            return 'animated';
        }
        return 'default';
    }
</script>

<gridlayout borderBottomColor={colorOutline} borderBottomWidth={isEInk ? 1 : 0} {...$$restProps}>
    <collectionview
        bind:this={collectionView}
        id="hourly"
        colWidth={68 * $fontScale}
        height="100%"
        iosOverflowSafeAreaEnabled="false"
        isBounceEnabled="false"
        itemIdGenerator={(_item, index) => index}
        itemTemplateSelector={selectTemplate}
        {items}
        nestedScrollingEnabled={false}
        orientation="horizontal"
        rowHeight="100%"
        on:dataPopulated={onDataPopulated}
        on:scroll={onScrollEvent}>
        <Template key="animated" let:item>
            <HourlyItem animated={true} {item} />
        </Template>
        <Template let:item>
            <HourlyItem {item} />
        </Template>
    </collectionview>
    <absolutelayout
        background={`linear-gradient(to right, ${colorBackground}, ${new Color(colorBackground).setAlpha(0)})`}
        height="100%"
        horizontalAlignment="left"
        isUserInteractionEnabled={false}
        opacity={showLeftShadowOpacity}
        width={40} />
    <absolutelayout
        background={`linear-gradient(to right, ${new Color(colorBackground).setAlpha(0)}, ${colorBackground})`}
        height="100%"
        horizontalAlignment="right"
        isUserInteractionEnabled={false}
        opacity={showRightShadowOpacity}
        width={40} />
</gridlayout>
