<script lang="ts">
    import { openUrl } from '@nativescript/core/utils/utils';
    import { Template } from 'svelte-native/components';
    import SettingLabelIcon from './SettingLabelIcon.svelte';
    import { openLink } from '~/utils/ui';
    let licences = require(`~/${gVars.platform}/licenses.json`);
    let items = licences.dependencies;
    // console.log('licences', items);
    function onShownInBottomSheet() {
        // console.log('onShownInBottomSheet');
    }
    function onTap(item) {
        if (item.moduleUrl) {
            openLink(item.moduleUrl);
        }
    }
</script>

<collectionView id="trackingScrollView" {items} rowHeight="60" itemIdGenerator={(item, i) => i} class="bottomsheet" on:shownInBottomSheet={onShownInBottomSheet} height="300">
    <Template let:item>
        <SettingLabelIcon title={item.moduleName} subtitle={item.moduleUrl} on:tap={() => onTap(item)} />
    </Template>
</collectionView>
