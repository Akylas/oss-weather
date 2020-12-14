<script lang="ts">
    import { Alert } from '~/services/api';
    import { convertTime, titlecase } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
    import { mdiFontFamily } from '~/variables';

    export let alerts: Alert[];
</script>

<scrollview class="bottomsheet">
    <stackLayout>
        {#each alerts as alert}
            <gridLayout class="alertView" orientation="horizontal" columns="auto,*" rows="auto">
                <label col="0" verticalAlignment="top" marginLeft="10" color="#ff4f3c" fontSize="36" fontFamily={mdiFontFamily} text="mdi-alert" />
                <label col="1" fontSize="14" marginLeft="4" verticalAlignment="top" textWrap={true}>
                    <formattedString>
                        <span fontSize="17" text="{alert.event}{'\n'}" />
                        <span text="{titlecase(l('expires'))}: {convertTime(alert.end, 'HH:mm dddd')}{'\n'}" />
                        <span color="#aaa" text={alert.description} />
                    </formattedString>
                </label>
            </gridLayout>
        {/each}
    </stackLayout>
</scrollview>
