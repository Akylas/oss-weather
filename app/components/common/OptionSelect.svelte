<script context="module" lang="ts">
    import { openFilePicker } from '@nativescript-community/ui-document-picker';
    import { File, Utils, View } from '@nativescript/core';
    import { debounce } from '@nativescript/core/utils';
    import { onDestroy } from 'svelte';
    import { Template } from 'svelte-native/components';
    import { lc } from '~/helpers/locale';
    import { closeBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { CheckBox } from '@nativescript-community/ui-checkbox';
    import { colors } from '~/variables';
    import IconButton from './IconButton.svelte';
    import ListItem from './ListItem.svelte';
    export interface OptionType {
        name: string;
        isPick?: boolean;
        boxType?: string;
        type?: string;
        [k: string]: any;
    }
</script>

<script lang="ts">
    $: ({ colorOutlineVariant } = $colors);

    export let showFilter = false;
    export let showBorders = false;
    export let backgroundColor = null;
    export let borderRadius = null;
    export let rowHeight = 56;
    export let width: string | number = '*';
    export let containerColumns: string = '*';
    export let fontWeight = 'bold';
    export let options: OptionType[];
    export let onClose = null;
    export let height: number | string = null;
    export let fontSize = 16;
    export let iconFontSize = 24;
    export let onCheckBox: (item, value, e) => void = null;
    let filteredOptions: OptionType[] = null;
    let filter: string = null;

    // technique for only specific properties to get updated on store change

    function updateFiltered(filter) {
        if (filter) {
            filteredOptions = options.filter((d) => d.name.indexOf(filter) !== -1);
        } else {
            filteredOptions = options;
        }
    }
    const updateFilteredDebounce = debounce(updateFiltered, 500);
    updateFiltered(filter);
    $: updateFilteredDebounce(filter);

    function close(value?: OptionType) {
        (onClose || closeBottomSheet)(value);
    }

    let checkboxTapTimer;

    async function onTap(item: OptionType, event) {
        if (item.isPick) {
            try {
                const result = await openFilePicker({
                    extensions: ['file/*'],
                    multipleSelection: false,
                    pickerMode: 0
                });
                if (File.exists(result.files[0])) {
                    const file = File.fromPath(result.files[0]);
                    close({ name: file.name, data: { url: file.path }, isPick: true });
                } else {
                    close(null);
                }
            } catch (err) {
                close(null);
            }
        } else if (item.type === 'checkbox') {
            // we dont want duplicate events so let s timeout and see if we clicking diretly on the checkbox
            const checkboxView: CheckBox = ((event.object as View).parent as View).getViewById('checkbox');
            checkboxTapTimer = setTimeout(() => {
                checkboxView.checked = !checkboxView.checked;
            }, 10);
        } else {
            close(item);
        }
    }
    function onCheckedChanged(item, event) {
        if (checkboxTapTimer) {
            clearTimeout(checkboxTapTimer);
            checkboxTapTimer = null;
        }
        onCheckBox?.(item, event.value, event);
    }
    onDestroy(() => {
        blurTextField();
    });
    function blurTextField() {
        Utils.dismissSoftInput();
    }
</script>

<gesturerootview columns={containerColumns} rows="auto">
    <gridlayout {backgroundColor} {borderRadius} columns={`${width}`} {height} rows="auto,*" {...$$restProps}>
        {#if showFilter}
            <gridlayout margin="10 10 0 10" rows="auto">
                <textfield
                    autocapitalizationType="none"
                    floating={false}
                    hint={lc('search')}
                    paddingRight={30}
                    placeholder={lc('search')}
                    returnKeyType="search"
                    text={filter}
                    variant="outline"
                    on:returnPress={blurTextField}
                    on:textChange={(e) => (filter = e['value'])} />

                <IconButton gray={true} horizontalAlignment="right" isHidden={!filter || filter.length === 0} size={40} text="mdi-close" verticalAlignment="middle" on:tap={() => (filter = null)} />
            </gridlayout>
        {/if}
        <collectionView itemTemplateSelector={(item) => item.type || 'default'} items={filteredOptions} row={1} {rowHeight}>
            <Template key="checkbox" let:item>
                <ListItem
                    {borderRadius}
                    color={item.color}
                    columns="auto,*,auto"
                    {fontSize}
                    fontWeight={item.fontWeight || fontWeight}
                    {iconFontSize}
                    leftIcon={item.icon}
                    mainCol={1}
                    showBottomLine={showBorders}
                    subtitle={item.subtitle}
                    title={item.name}
                    on:tap={(event) => onTap(item, event)}>
                    <checkbox id="checkbox" boxType={item.boxType} checked={item.value} col={item.boxType === 'circle' ? 0 : 2} on:checkedChange={(e) => onCheckedChanged(item, e)} />
                </ListItem>
            </Template>
            <Template let:item>
                <ListItem
                    {borderRadius}
                    color={item.color}
                    {fontSize}
                    {fontWeight}
                    {iconFontSize}
                    leftIcon={item.icon}
                    showBottomLine={showBorders}
                    subtitle={item.subtitle}
                    title={item.name}
                    on:tap={(event) => onTap(item, event)}>
                </ListItem>
            </Template>
        </collectionView>
    </gridlayout>
</gesturerootview>