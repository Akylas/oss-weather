<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Application } from '@nativescript/core';
    import { createEventDispatcher } from 'svelte';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import DailyView from '~/components/DailyView.svelte';
    import TopWeatherView from '~/components/TopWeatherView.svelte';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { WeatherLocation } from '~/services/api';
    import { prefs } from '~/services/preferences';
    import { actionBarHeight, navigationBarHeight, screenHeightDips, statusBarHeight } from '~/variables';

    export let items: any[];
    export let weatherLocation: WeatherLocation;
    export let fakeNow = null;
    export let fontScale = 1;

    const dispatch = createEventDispatcher();
    let collectionView: NativeViewElementNode<CollectionView>;
    let topHeight = 0;
    $: topHeight = Math.max(Math.min(screenHeightDips - actionBarHeight - $navigationBarHeight - $statusBarHeight - 100, 500), 400);

    function itemTemplateSelector(item, index, items) {
        // return index === 0 ? 'topView' : index === 1 ? 'info' : 'daily';
        return index === 0 ? 'topView' : 'daily';
    }
    let isLayedout = false;
    function onCollectionViewLayoutCompleted() {
        if (!isLayedout) {
            isLayedout = true;
            try {
                (Application.android.foregroundActivity as android.app.Activity).reportFullyDrawn();
            } catch (err) {}
        }
    }

    prefs.on('key:animations', () => {
        collectionView?.nativeView?.refresh();
    });

    // onThemeChanged(() => {
    //     console.log('onThemeChanged');
    //     collectionView.nativeView.refreshVisibleItems();
    // });

    function onTap(item) {
        dispatch('tap', item);
    }

</script>

<collectionview
    bind:this={collectionView}
    {...$$restProps}
    {items}
    {itemTemplateSelector}
    itemIdGenerator={(_item, index) => index}
    iosOverflowSafeAreaEnabled="false"
    on:layoutCompleted={onCollectionViewLayoutCompleted}
>
    <Template key="topView" let:item>
        <TopWeatherView {weatherLocation} {item} height={topHeight} on:tap={() => onTap(item)} {fakeNow}/>
    </Template>
    <Template key="daily" let:item>
        <DailyView {item} on:tap={() => onTap(item)}/>
    </Template>
</collectionview>
