<script>
    import { onMount } from 'svelte';
    import { Template } from 'svelte-native/components';
</script>

<collectionView row="1" :items="options" @itemTap="onItemTap">
    <Template>
        <ListItem :title="item.title" :subtitle="item.subtitle" @tap="onItemTap(item)" />
    </Template>
</collectionView>
