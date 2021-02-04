<script lang="ts">
    import { closeBottomSheet } from '~/bottomsheet';
    import { accentColor } from '~/variables';

    export let options: { text: string; icon: string }[];
    export let title = null;

    function selectOption(option) {
        closeBottomSheet(option);
    }
</script>

<stacklayout id="actionSheet" class="bottomsheet" iosIgnoreSafeArea={true}>
    {#if title}<label paddingLeft="16" fontSize="17" color="#757575" text={title} height="56" verticalTextAlignment="center" />{/if}
    {#each options as item}
        <stacklayout rippleColor={accentColor} paddingTop="5" paddingBottom="5" orientation="horizontal" on:tap={() => selectOption(item)} height="56">
            <label paddingLeft="16" class="mdi" fontSize="24" text={item.icon} width="56" verticalAlignment="center" />
            <label fontSize="17" text={item.text} verticalAlignment="center" />
        </stacklayout>
    {/each}
</stacklayout>
