<script lang="ts">
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import { Template } from 'svelte-native/components';
    import { screenWidthDips } from '~/variables';
    export let items;
    let collectionView;
    export let scrollIndex = 0;

    function onDataPopulated() {
        collectionView.nativeView.scrollToIndex(scrollIndex, false);
    }
</script>

<collectionview
    {...$$restProps}
    bind:this={collectionView}
     itemIdGenerator={(_item, index) => index}
    orientation="horizontal"
    colWidth="60"
    rowHeight="100%"
    height="100%"
    isBounceEnabled="false"
    {items}
    on:dataPopulated={onDataPopulated}>
    <Template let:item>
        <WeatherCollectionItem {item} />
    </Template>
</collectionview>
