<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { openLink } from '~/utils/ui';
    import ListItemAutoSize from '~/components/common/ListItemAutoSize.svelte';
    // technique for only specific properties to get updated on store change

    const licences = require('~/licenses.json');

    const items = [
        {
            moduleName: 'Material Design Icons',
            moduleUrl: 'https://pictogrammers.com/library/mdi/'
        },
        {
            moduleName: 'Weather Icons',
            moduleUrl: 'https://erikflowers.github.io/weather-icons/'
        }
    ].concat(licences.dependencies);

    function onTap(item) {
        if (item.moduleUrl) {
            openLink(item.moduleUrl);
        }
    }
</script>

<gesturerootview rows="auto">
    <collectionView id="trackingScrollView" height="300" itemIdGenerator={(item, i) => i} {items}>
        <Template let:item>
            <ListItemAutoSize subtitle={item.moduleUrl} title={item.moduleName} on:tap={() => onTap(item)} />
        </Template>
    </collectionView>
</gesturerootview>
