<script lang="ts">
    import { openUrl } from '@nativescript/core/utils/utils';
    import { showBottomSheet } from '~/bottomsheet';
    import { lc } from '~/helpers/locale';
    import { share } from '~/utils/share';
    import { openLink } from '~/utils/ui';
    import CActionBar from '~/components/CActionBar.svelte';
    import SettingLabelIcon from '~/components/SettingLabelIcon.svelte';

    const appVersion = __APP_VERSION__ + '.' + __APP_BUILD_NUMBER__;

    async function onTap(command) {
        switch (command) {
            case 'github':
                openLink(GIT_URL);
                break;
            case 'share':
                share({
                    message: STORE_LINK
                });
                break;
            case 'review':
                openUrl(STORE_REVIEW_LINK);
                break;
            case 'third_party':
                const ThirdPartySoftwareBottomSheet = (await import('~/components/ThirdPartySoftwareBottomSheet.svelte')).default;
                showBottomSheet({
                    parent: this,
                    view: ThirdPartySoftwareBottomSheet,
                    ignoreTopSafeArea: true,
                    trackingScrollView: 'trackingScrollView'
                });
                break;
        }
    }
</script>

<page actionBarHidden={true}>
    <gridlayout rows="auto,*">
        <CActionBar title={lc('about')} />
        <scrollView row={1}>
            <stackLayout>
                <SettingLabelIcon title={lc('version')} subtitle={appVersion} />
                <SettingLabelIcon title={lc('source_code')} subtitle={lc('source_code_desc')} icon="mdi-chevron-right" on:tap={() => onTap('github')} />
                <SettingLabelIcon title={lc('third_parties')} subtitle={lc('third_parties_desc')} icon="mdi-chevron-right" on:tap={() => onTap('third_party')} />
                <SettingLabelIcon title={lc('share_application')} icon="mdi-chevron-right" on:tap={() => onTap('share')} />
                <SettingLabelIcon title={lc('review_application')} icon="mdi-chevron-right" on:tap={() => onTap('review')} />
            </stackLayout>
        </scrollView>
    </gridlayout>
</page>
