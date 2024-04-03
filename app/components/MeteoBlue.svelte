<script context="module" lang="ts">
    import { getString } from '@nativescript/core/application-settings';
    import { lc, lu } from '~/helpers/locale';
    import CActionBar from '~/components/common/CActionBar.svelte';
    import { ApplicationSettings } from '@akylas/nativescript';
    import { WEATHER_MAP_COLORS } from '~/helpers/constants';
    import { NativeViewElementNode } from 'svelte-native/dom';
    import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';
    import { FailureEventData, FinalEventData, getImagePipeline } from '@nativescript-community/ui-image';
    import { ZoomImg } from '@nativescript-community/ui-zoomimage';
    import { showError } from '~/utils/error';
    import { NetworkConnectionStateEvent, NetworkConnectionStateEventData, getCacheControl, networkService, request } from '~/services/api';
    import { FavoriteLocation } from '~/helpers/favorites';
    import { actionBarButtonHeight, colors } from '~/variables';
    import { openLink } from '~/utils/ui';
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';
</script>

<script lang="ts">
    let { colorOnPrimary, colorOnSurface, colorOnSurfaceVariant } = $colors;
    $: ({ colorOnPrimary, colorOnSurface, colorOnSurfaceVariant } = $colors);
    let currentUrl = null;
    let currentImageSrc = null;
    // let pullRefresh: NativeViewElementNode<PullToRefresh>;
    let zoomImageView: NativeViewElementNode<ZoomImg>;
    let loading = false;
    let tabIndex = 0;
    let networkConnected = networkService.connected;
    export let weatherLocation: FavoriteLocation;
    export const maxAge = dayjs.duration({ days: 1 }).asSeconds();

    async function refresh() {
        try {
            loading = true;
            currentUrl = `https://www.meteoblue.com/fr/meteo/prevision/${tabs[tabIndex].urlId}/${weatherLocation.coord.lat.toFixed(3)}N${weatherLocation.coord.lon.toFixed(3)}E`;
            const result = await request<string>({
                url: currentUrl,
                method: 'GET',
                offlineSupport: true, // not to throw error when no network
                headers: {
                    'Cache-Control': networkConnected ? 'max-age=86400' : 'only-if-cached',
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0' // meteoblue wants this
                },
                noJSON: true
            });
            const match = result.match(/(?:data-(?:href|original)=)["'](\/\/my\.meteoblue\.com\/images\/.*?["'])/);
            if (match) {
                const newImageSrc = 'https:' + match[1].slice(1, -1).replace(/&amp;/g, '&');
                if (networkConnected) {
                    getImagePipeline().evictFromCache(newImageSrc);
                }
                if (currentImageSrc !== newImageSrc) {
                    currentImageSrc = newImageSrc;
                } else {
                    zoomImageView.nativeElement.updateImageUri();
                }
            } else {
                currentImageSrc = null;
            }
        } catch (error) {
            showError(error);
            loading = false
        }
    }
    onMount(() => {
        networkService.on(NetworkConnectionStateEvent, (event: NetworkConnectionStateEventData) => {
            try {
                if (networkConnected !== event.data.connected) {
                    networkConnected = event.data.connected;
                }
            } catch (error) {
                showError(error);
            }
        });
    });

    // async function onPullToRefresh() {
    //     try {
    //         if (pullRefresh) {
    //             pullRefresh.nativeView.refreshing = false;
    //         }
    //         await refresh();
    //     } catch (error) {
    //         showError(error);
    //     }
    // }
    function onNavigatedTo() {
        refresh();
    }

    const tabs = [
        {
            name: lu('meteogram'),
            urlId: 'meteogram'
        },
        {
            name: lu('all_in_one'),
            urlId: 'meteogramone'
        },
        {
            name: lu('seven_days'),
            urlId: 'meteogramextended'
        }
    ];
    function setTabIndex(value: number) {
        if (tabIndex !== value) {
            tabIndex = value;
            refresh();
        }
    }
    function onImageFailure(event: FailureEventData) {
        showError(event.error);
        loading = false;
    }
    function onImageLoaded(event: FinalEventData) {
        const imageRatio = event.imageInfo.getWidth() / event.imageInfo.getHeight();
        const viewRatio = event.object.getMeasuredWidth() / event.object.getMeasuredHeight();
        let zoomScale = 1;
        if (imageRatio > viewRatio) {
            zoomScale = 1 / viewRatio;
        }
        zoomImageView.nativeElement.setZoom(zoomScale, false);
        loading = false;
    }
    function openInBrowser() {
        try {
            openLink(currentUrl);
        } catch (error) {
            showError(error);
        }
    }
</script>

<page actionBarHidden={true} on:navigatedTo={onNavigatedTo}>
    <gridlayout rows="auto,auto,*">
        <CActionBar titleProps={{ visibility: 'visible' }}>
            <span slot="subtitle" text={'meteoblue'} />
            <span slot="subtitle2" color={colorOnSurfaceVariant} fontSize={12} text={'\n' + weatherLocation.name} />
            <activityIndicator busy={loading} height={$actionBarButtonHeight} verticalAlignment="middle" visibility={loading ? 'visible' : 'collapse'} width={$actionBarButtonHeight} />
            <mdbutton class="actionBarButton" text="mdi-refresh" variant="text" verticalAlignment="middle" on:tap={refresh} />
            <mdbutton class="actionBarButton" text="mdi-web" variant="text" verticalAlignment="middle" on:tap={openInBrowser} />
        </CActionBar>
        <gridlayout colSpan={3} columns={new Array(tabs.length).fill('*').join(',')} height={48} row={1}>
            {#each tabs as tab, index}
                <canvaslabel
                    col={index}
                    color={colorOnSurface}
                    disableCss={true}
                    fontSize={15}
                    fontWeight="500"
                    text={tab.name}
                    textAlignment="center"
                    verticalTextAlignment="center"
                    on:tap={() => setTabIndex(index)} />
            {/each}
            <absolutelayout backgroundColor={colorOnSurface} col={tabIndex} height={3} verticalAlignment="bottom" width="50%" />
        </gridlayout>
        <!-- <pullrefresh bind:this={pullRefresh} row={2} on:refresh={onPullToRefresh}> -->
        <zoomimage
            bind:this={zoomImageView}
            height="100%"
            maxZoom={10}
            noCache={networkConnected}
            row={2}
            src={currentImageSrc}
            android:stretch="fitStart"
            ios:stretch="aspectFit"
            width="100%"
            on:finalImageSet={onImageLoaded}
            on:failure={onImageFailure} />
        <!-- </pullrefresh> -->
    </gridlayout>
</page>
