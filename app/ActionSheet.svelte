<script>
    import { onMount } from 'svelte';
    // import { Template } from 'svelte-native/components';
    import { closeBottomSheet } from '~/bottomsheet';
    export let options;
    export let title;

    function selectOption(option) {
        // console.log('selectOption', option);
        closeBottomSheet(option);
    }

    // $: {
        // console.log('showOptions', options, title);
    // }
</script>

<stacklayout paddingLeft="16">
    {#if title}
        <label fontSize="17" color="#757575" text={title} height="56" verticalTextAlignment="center" />
    {/if}
    {#each options as item}
        <stacklayout marginTop="10" orientation="horizontal" on:tap={() => selectOption(item)} height="56">
            <label class="mdi" fontSize="24" text={item.icon} width="56" verticalAlignment="center" />
            <label fontSize="17" text={item.text} verticalAlignment="center" />
        </stacklayout>
    {/each}
</stacklayout>
