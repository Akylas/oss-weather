<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { openLink } from '~/utils/ui';
    import { primaryColor } from './variables';

    let licences = require(`~/licenses.json`);
    let items = licences.dependencies;
    function onTap(item) {
        if (item.moduleUrl) {
            openLink(item.moduleUrl);
        }
    }
</script>

<collectionView id="trackingScrollView" {items} rowHeight={60} itemIdGenerator={(item, i) => i} class="bottomsheet" height={300}>
    <Template let:item>
        <canvaslabel padding="12 16 12 16" rippleColor={primaryColor} on:tap={() => onTap(item)}>
            <cspan text={item.moduleName} verticalAlignment="top" fontSize={17} />
            <cspan text={item.moduleUrl} color="#aaaaaa" verticalAlignment="bottom" fontSize={14} />
        </canvaslabel>
    </Template>
</collectionView>
