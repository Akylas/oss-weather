<script lang="ts">
    import { CollectionView } from '@nativescript-community/ui-collectionview';
    import { Application } from '@nativescript/core';
    import { Template } from 'svelte-native/components';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import DailyView from '~/components/DailyView.svelte';
    import { prefs } from '~/services/preferences';
    import TopWeatherView from '~/components/TopWeatherView.svelte';
    import { actionBarHeight, navigationBarHeight, screenHeightDips, statusBarHeight } from '~/variables';
    import WeatherIcon from '~/components/WeatherIcon.svelte';

    export let items: any[];

    let collectionView: NativeViewElementNode<CollectionView>;
    const topHeight = Math.max(Math.min(screenHeightDips - actionBarHeight - navigationBarHeight - statusBarHeight - 100, 500), 400);

    function itemTemplateSelector(item, index, items) {
        // return index === 0 ? 'topView' : index === 1 ? 'info' : 'daily';
        return index === 0 ? 'topView' : 'daily';
    }
    let isLayedout = false;
    function onCollectionViewLayoutCompleted() {
        if (!isLayedout) {
            isLayedout = true;
            if (global.isAndroid) {
                // this is to test app runtime
                Application.android.startActivity.reportFullyDrawn();
            }
        }
    }

    prefs.on('key:animations', () => {
        collectionView.nativeView.refresh();
    });

    // onThemeChanged(() => {
    // console.log('onThemeChanged');
    // collectionView.nativeView.refresh();
    // });
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
        <TopWeatherView {item} height={topHeight} />
    </Template>
    <Template key="info" let:item>
        <gridLayout rows="auto" columns="auto,*" class="alertView" verticalAlignment="center" paddingLeft={20}>
            <WeatherIcon col={0} verticalAlignment="middle" fontSize={50} icon={item.icon} />
            <label col={1} fontSize={16} paddingLeft={4} verticalAlignment="middle" text={item.summary} maxLines={2} />
        </gridLayout>
    </Template>
    <Template key="daily" let:item>
        <DailyView {item} />
    </Template>
</collectionview>