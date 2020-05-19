<script>
    import Vue from 'nativescript-vue';
    import { Component, Prop } from 'vue-property-decorator';
    import { openUrl } from '@nativescript/core/utils/utils';
    import BaseVueComponent from '~/components/BaseVueComponent';
    import ThirdPartySoftwareBottomSheet from './ThirdPartySoftwareBottomSheet.vue';
    import SettingLabelIcon from './SettingLabelIcon';
    import { share } from '~/utils/share';
    import InAppBrowser from 'nativescript-inappbrowser';
    import { mdiFontFamily, primaryColor } from '~/variables';
    import * as EInfo from 'nativescript-extendedinfo';

    const appVersion = EInfo.getVersionNameSync() + '.' + EInfo.getBuildNumberSync();

    async function openLink(url) {
        try {
            const available = await InAppBrowser.isAvailable();
            if (available) {
                const result = await InAppBrowser.open(url, {
                    // iOS Properties
                    dismissButtonStyle: 'close',
                    preferredBarTintColor: primaryColor,
                    preferredControlTintColor: 'white',
                    readerMode: false,
                    animated: true,
                    enableBarCollapsing: false,
                    // Android Properties
                    showTitle: true,
                    toolbarColor: primaryColor,
                    secondaryToolbarColor: 'white',
                    enableUrlBarHiding: true,
                    enableDefaultShare: true,
                    forceCloseOnRedirection: false,
                });
            } else {
                openUrl(url);
            }
        } catch (error) {
            alert({
                title: 'Error',
                message: error.message,
                okButtonText: 'Ok',
            });
        }
    }
    function onTap(command) {
        switch (command) {
            case 'back': {
                this.$navigateBack();
                return;
            }
            case 'github':
                this.openLink(GIT_URL);
                break;
            case 'share':
                share({
                    message: STORE_LINK,
                });
                break;
            case 'review':
                openUrl(STORE_REVIEW_LINK);
                break;
            case 'third_party':
                this.$showBottomSheet(ThirdPartySoftwareBottomSheet, {
                    ignoreTopSafeArea: true,
                    trackingScrollView: 'trackingScrollView',
                });
                break;
        }
    }
</script>

<frame backgroundColor="transparent">
    <page >
        <scrollView>
            <stackLayout>
                <settingLabelIcon title="version" :subtitle="appVersion" />
                <settingLabelIcon title="code source" subtitle="obtenir le code source de l'application sur Github" rightIcon="mdi-chevron-right" on:tap={onTap('github')} />
                <settingLabelIcon title="logiciel tiers" subtitle="les logiciels que nous aimons et utilisons" icon="mdi-chevron-right" on:tap={onTap('third_party')} />
                <settingLabelIcon title="partager cette application" icon="mdi-chevron-right" on:tap={onTap('share')} />
                <settingLabelIcon title="noter l'application" icon="mdi-chevron-right" on:tap={onTap('review')} />
            </stackLayout>
        </scrollView>
</page>
</frame>
