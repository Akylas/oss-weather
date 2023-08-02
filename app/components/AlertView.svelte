<script lang="ts">
    import { titlecase } from '@nativescript-community/l';
    import { Template } from 'svelte-native/components';
    import { formatDate, l } from '~/helpers/locale';
    import type { Alert } from '~/services/openweathermap';

    export let alerts: Alert[];
</script>

<collectionview id="scrollView" class="bottomsheet" iosIgnoreSafeArea={true} items={alerts}>
    <Template let:item>
        <gridLayout>
            <gridLayout class="alertView" columns="auto,*" rows="auto">
                <label verticalAlignment="top" marginLeft={10} color="#EFB644" fontSize={36} class="icon-btn" text="mdi-alert" />
                <label col={1} fontSize={14} padding="0 4 4 0" textWrap={true}>
                    <span fontSize={17} text="{item.event}{'\n'}" visibility={item.event ? 'visible' : 'hidden'} />
                    <span fontSize={17} text="{item.sender_name}{'\n'}" visibility={item.sender_name ? 'visible' : 'hidden'} />
                    <span text="{titlecase(l('expires'))}: {formatDate(item.end, 'dddd LT')}{'\n'}" />
                    <span color="#aaa" text={item.description} />
                </label>
            </gridLayout>
        </gridLayout>
    </Template>
</collectionview>
