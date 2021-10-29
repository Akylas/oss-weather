<script lang="ts">
    import { Template } from 'svelte-native/components';
    import { openLink } from '~/utils/ui';
    import { primaryColor } from './variables';

    let items = null;
    (async () => {
        if (global.isAndroid) {
            //@ts-ignore
            const licences = await import('~/android/licenses.json');
            items = licences.dependencies;
        } else {
            //@ts-ignore
            const licences = await import('~/ios/licenses.json');
            items = licences.dependencies;
        }
    })();
    function onTap(item) {
        if (item.moduleUrl) {
            openLink(item.moduleUrl);
        }
    }
</script>

<collectionView id="trackingScrollView" {items} rowHeight={60} itemIdGenerator={(item, i) => i} class="bottomsheet" height={300}>
    <Template let:item>
        <stackLayout padding="0 16 0 16" rippleColor={primaryColor} on:tap={() => onTap(item)} verticalAlignment="center">
            <label text={item.moduleName} verticalAlignment="top" fontSize={17} maxLines={1}/>
            <label text={item.moduleUrl} color="#aaaaaa" verticalAlignment="bottom" fontSize={14} />
        </stackLayout>
    </Template>
</collectionView>
