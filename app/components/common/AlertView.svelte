<script lang="ts">
    import { titlecase } from '@nativescript-community/l';
    import { Template } from 'svelte-native/components';
    import { formatDate, l } from '~/helpers/locale';
    import type { Alert } from '~/services//providers/weather';
    import { colors } from '~/variables';

    export let alerts: Alert[];
    $: ({ colorSurface, colorOnSurface, colorOnSurfaceVariant, colorPrimary, colorOutlineVariant } = $colors);
</script>

<collectionview id="scrollView" iosIgnoreSafeArea={true} items={alerts}>
    <Template let:item>
        <gridlayout>
            <gridlayout backgroundColor={colorSurface} borderRadius={20} columns="auto,*" margin={10} padding="10 0 10 0" rows="auto">
                <label class="icon-btn" color="#EFB644" fontSize={36} marginLeft={10} text="mdi-alert" verticalAlignment="top" />
                <label col={1} fontSize={14} padding="0 4 4 0" textWrap={true}>
                    <cspan fontSize={17} text={item.event} visibility={item.event ? 'visible' : 'hidden'} />
                    <cspan fontSize={17} text={'\n' + item.sender_name} visibility={item.sender_name ? 'visible' : 'hidden'} />
                    <cspan color={colorOnSurfaceVariant} text="{'\n' + titlecase(l('expires'))}: {formatDate(item.end, 'dddd LT', item.timezoneOffset)}" />
                    <cspan color={colorOutlineVariant} text={'\n' + item.description} visibility={item.description?.length ? 'visible' : 'hidden'} />
                </label>
            </gridlayout>
        </gridlayout>
    </Template>
</collectionview>
