<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import { Template } from 'svelte-native/components';
    import { screenWidthDips } from '~/variables';
    export let items;
    let collectionView;
    export let scrollIndex;

    function onDataPopulated() {
        // console.log('onDataPopulated', scrollIndex);
        collectionView.nativeView.scrollToIndex(scrollIndex, false);
    }
</script>

<collectionview
    {...$$restProps}
    bind:this={collectionView}
    orientation="horizontal"
    colWidth="60"
    rowHeight="100%"
    height="100%"
    isBounceEnabled="false"
    {items}
    on:dataPopulated={onDataPopulated}
    extraLayoutSpace={screenWidthDips / 2}>
    <Template let:item>
        <WeatherCollectionItem {item} />
    </Template>
</collectionview>
