<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { openLink } from '~/utils/ui';
    import SettingLabelIcon from './SettingLabelIcon.svelte';

    let licences = require(`~/licenses.json`);
    let items = licences.dependencies;
    function onTap(item) {
        if (item.moduleUrl) {
            openLink(item.moduleUrl);
        }
    }
</script>

<collectionView id="trackingScrollView" {items} rowHeight="70" itemIdGenerator={(item, i) => i} class="bottomsheet" height="300">
    <Template let:item>
        <SettingLabelIcon title={item.moduleName} subtitle={item.moduleUrl} on:tap={() => onTap(item)} />
    </Template>
</collectionView>
