<script>
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    import { convertTime, titlecase } from '~/helpers/formatter';
    import { localize as l } from '~/helpers/formatter';
    export let alerts;
    $: {
        console.log('alerts', alerts);
    }
</script>

<scrollview>
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
