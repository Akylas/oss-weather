<script lang="ts">
    import { convertTime, titlecase } from '~/helpers/formatter';
    import { l } from '~/helpers/locale';
    import { mdiFontFamily } from '~/variables';

    export let alerts: any[];
    $: {
        console.log('alerts', alerts);
    }
</script>

<scrollview class="bottomsheet">
    <stackLayout>
        {#each alerts as alert}
            <gridLayout class="alertView" orientation="horizontal" columns="auto,*">
                <label col="0" verticalAlignment="top" marginLeft="10" color={alert.alertColor} fontSize="36" fontFamily={mdiFontFamily} text="mdi-alert" />
                <label col="1" fontSize="14" marginLeft="4" verticalAlignment="top">
                    <span fontSize="17" text="{alert.title}{'\n'}" />
                    <span text="{titlecase(l('expires'))}: {convertTime(alert.expires, 'HH:mm dddd')}{'\n'}" />
                    <span color="#aaa" text={alert.description} />
                </label>
            </gridLayout>
        {/each}
    </stackLayout>
</scrollview>
