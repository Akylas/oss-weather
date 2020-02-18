<script>
    import { mdiFontFamily, wiFontFamily } from '~/variables';
    import { convertTime, titlecase } from '~/helpers/formatter';
    import { localize as l } from '~/helpers/formatter';
    export let alerts;
</script>

<scrollview height="300" backgroundColor="black">
    <stackLayout>
        {#each alerts as alert}
            <stacklayout class="alertView" row="2" colSpan="2" orientation="horizontal">
                <label color={alert.alertColor} colSpan="2" fontSize="36" fontFamily={mdiFontFamily} text="mdi-alert" />
                <label fontSize="14" paddingLeft="4">
                    <span fontSize="17" text="{alert.title}{'\n'}" />
                    <span text="{titlecase(l('expires'))}: {convertTime(alert.expires, 'HH:mm dddd')}{'\n'}" />
                    <span color="#aaa" text={alert.description} />
                </label>

            </stacklayout>
        {/each}

    </stackLayout>
</scrollview>
