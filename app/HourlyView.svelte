<script>
    import WeatherCollectionItem from './WeatherCollectionItem.svelte';
    import { Template } from 'svelte-native/components';
    export let items;
    let collectionView;
    export let scrollIndex;

    function onDataPopulated() {
        console.log('onDataPopulated', scrollIndex);
        collectionView.nativeView.scrollToIndex(scrollIndex, false);
    }
</script>

<collectionview {...$$props} bind:this={collectionView} orientation="horizontal" colWidth="80" rowHeight="100%" height="170" isBounceEnabled="false" {items} on:dataPopulated={onDataPopulated}>
    <Template let:item>
        <WeatherCollectionItem {item} />
    </Template>
</collectionview>
