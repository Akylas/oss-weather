<script lang="ts">
    import { titlecase } from '~/helpers/formatter';
    import { formatDate, l } from '~/helpers/locale';
    import type { Alert } from '~/services/openweathermap';

    export let alerts: Alert[];
</script>

<scrollview id="scrollView" class="bottomsheet" iosIgnoreSafeArea={true}>
    <stackLayout>
        {#each alerts as alert}
            <gridLayout class="alertView" columns="auto,*" rows="auto">
                <label verticalAlignment="top" marginLeft={10} color="#EFB644" fontSize={36} class="icon-btn" text="mdi-alert" />
                <label col={1} fontSize={14} padding="0 4 4 0" textWrap={true}>
                    <span fontSize={17} text="{alert.event}{'\n'}" />
                    <span fontSize={17} text="{alert.sender_name}{'\n'}" />
                    <span text="{titlecase(l('expires'))}: {formatDate(alert.end, 'HH:mm dddd')}{'\n'}" />
                    <span color="#aaa" text={alert.description} />
                </label>
            </gridLayout>
        {/each}
    </stackLayout>
</scrollview>
