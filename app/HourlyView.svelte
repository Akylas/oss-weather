<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { backgroundColor } from './variables';
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';

    export let items;
    let collectionView;
    export let scrollIndex = 0;

    function onDataPopulated() {
        collectionView.nativeView.scrollToIndex(scrollIndex, false);
    }

    let showLeftShadow = false;
    let showRightShadow = true;
    function onScrollEvent(event) {
        showLeftShadow = event.scrollOffsetPercentage > 0;
        showRightShadow = event.scrollOffsetPercentage < 1;
    }
</script>

<gridlayout {...$$restProps}>
    <collectionview
        bind:this={collectionView}
        itemIdGenerator={(_item, index) => index}
        orientation="horizontal"
        colWidth="61"
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
    <absolutelayout visibility={showLeftShadow ? 'visible' : 'hidden'} background={`linear-gradient(to right, ${$backgroundColor}, transparent)`} height="100%" width={40} horizontalAlignment="left" />
    <absolutelayout
        visibility={showRightShadow ? 'visible' : 'hidden'}
        background={`linear-gradient(to right, transparent, ${$backgroundColor})`}
        height="100%"
        width={40}
        horizontalAlignment="right"
    />
</gridlayout>
