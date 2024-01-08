<script lang="ts">
    import { titlecase } from '@nativescript-community/l';
    import { Template } from 'svelte-native/components';
    import { formatDate, l } from '~/helpers/locale';
    import type { Alert } from '~/services/openweathermap';

    export let alerts: Alert[];
</script>

<collectionview id="scrollView" class="bottomsheet" iosIgnoreSafeArea={true} items={alerts}>
    <Template let:item>
        <gridlayout>
            <gridlayout class="alertView" columns="auto,*" rows="auto">
                <label class="icon-btn" color="#EFB644" fontSize={36} marginLeft={10} text="mdi-alert" verticalAlignment="top" />
                <label col={1} fontSize={14} padding="0 4 4 0" textWrap={true}>
                    <cspan fontSize={17} text="{item.event}{'\n'}" visibility={item.event ? 'visible' : 'hidden'} />
                    <cspan fontSize={17} text="{item.sender_name}{'\n'}" visibility={item.sender_name ? 'visible' : 'hidden'} />
                    <cspan text="{titlecase(l('expires'))}: {formatDate(item.end, 'dddd LT')}{'\n'}" />
                    <cspan color="#aaa" text={item.description} />
                </label>
            </gridlayout>
        </gridlayout>
    </Template>
</collectionview>
