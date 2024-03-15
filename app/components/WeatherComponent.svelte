<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Application } from '@nativescript/core';
    import { createEventDispatcher } from '~/utils/svelte/ui';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import DailyView from '~/components/DailyView.svelte';
    import TopWeatherView from '~/components/TopWeatherView.svelte';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { WeatherLocation } from '~/services/api';
    import { prefs } from '~/services/preferences';
    import { actionBarHeight, fontScale, navigationBarHeight, onImperialChanged, screenHeightDips, statusBarHeight } from '~/variables';
    import { onThemeChanged } from '~/helpers/theme';
    import { iconService } from '~/services/icon';

    export let items: any[];
    export let weatherLocation: WeatherLocation;
    export let fakeNow = null;

    const dispatch = createEventDispatcher();
    let collectionView: NativeViewElementNode<CollectionView>;
    let topHeight = 0;
    $: topHeight = Math.max(Math.min(screenHeightDips - $actionBarHeight - $navigationBarHeight - $statusBarHeight - 100 * $fontScale, 470 * $fontScale), 370 * $fontScale);

    function itemTemplateSelector(item, index, items) {}
    let isLayedout = false;
    function onCollectionViewLayoutCompleted() {
        if (!isLayedout) {
            isLayedout = true;
            try {
                (Application.android.foregroundActivity as android.app.Activity).reportFullyDrawn();
            } catch (err) {}
        }
    }

    onThemeChanged(() => {
        collectionView.nativeView.refreshVisibleItems();
    });
    onImperialChanged(() => {
        collectionView?.nativeView?.refreshVisibleItems();
    });
    function onTap(item) {
        dispatch('tap', item);
    }
    function selectTemplate(item, index, items) {
        if (iconService.animated) {
            return index === 0 ? 'topView_animated' : 'animated';
        }
        return index === 0 ? 'topView' : 'default';
    }
</script>

<collectionview
    bind:this={collectionView}
    id="main"
    {...$$restProps}
    iosOverflowSafeAreaEnabled="false"
    itemIdGenerator={(_item, index) => index}
    itemTemplateSelector={selectTemplate}
    {items}
    on:layoutCompleted={onCollectionViewLayoutCompleted}>
    <Template key="topView" let:item>
        <TopWeatherView {fakeNow} height={topHeight} {item} {weatherLocation} on:tap={() => onTap(item)} />
    </Template>
    <Template key="topView_animated" let:item>
        <TopWeatherView animated={true} {fakeNow} height={topHeight} {item} {weatherLocation} on:tap={() => onTap(item)} />
    </Template>
    <Template key="animated" let:item>
        <DailyView animated={true} {item} on:tap={() => onTap(item)} />
    </Template>
    <Template let:item>
        <DailyView {item} on:tap={() => onTap(item)} />
    </Template>
</collectionview>
