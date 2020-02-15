<script>
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    import { convertTime, titlecase } from '~/helpers/formatter';
    import { localize as l } from '~/helpers/formatter';
    export let alerts;
</script>

<scrollview height="300" backgroundColor="black">
    <stackLayout>
        {#each alerts as alert}
            <stacklayout row="2" colSpan="2" borderRadius="4" backgroundColor="#222" orientation="horizontal" margin="10" padding="10">
                <label color={alert.alertColor} colSpan="2" fontSize="36" fontFamily={mdiFontFamily} text="mdi-alert" />
                <label fontSize="14" paddingLeft="4" color="#aaa">
                    <span color="white" fontSize="17" text="{alert.title}{'\n'}" />
                    <span color="white" text="{titlecase(l('expires'))}: {convertTime(alert.expires, 'HH:mm dddd')}{'\n'}" />
                    <span text={alert.description} />
                </label>

            </stacklayout>
        {/each}

    </stackLayout>
</scrollview>
