<script lang="ts">
    import { getString } from '@nativescript/core/application-settings';
    import { closeBottomSheet } from '~/utils/svelte/bottomsheet';
    import { l } from '~/helpers/locale';
    import { OWMProvider } from '~/services/owm';
    import { openLink } from '~/utils/ui';
    import { ApplicationSettings } from '@akylas/nativescript';

    let owmApiKey = getString('owmApiKey');
    let canClose = false;

    function openWeatherMap() {
        openLink('https://openweathermap.org/api');
    }

    function start() {
        OWMProvider.setOWMApiKey(owmApiKey);
        closeBottomSheet(true);
    }

    $: {
        canClose = !!owmApiKey && owmApiKey.length === 32;
    }
</script>

<stacklayout padding="10" iosIgnoreSafeArea={true}>
    <label text={l('api_key_required_description')} />
    <gridlayout rows="auto" columns="auto,*, auto" marginTop={5}>
        <!-- <image width={100} src="https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png" marginRight="10"/> -->
        <textfield text={owmApiKey} on:textChange={(e) => (owmApiKey = e.value)} col={1} hint={l('api_key')} placeholder={l('api_key')} placeholderColor="lightgray" />
        <mdbutton variant="text" class="icon-btn" text="mdi-open-in-app" col={2} on:tap={openWeatherMap} />
    </gridlayout>
    <stacklayout orientation="horizontal" horizontalAlignment="right" marginTop={15}>
        <mdbutton visibility={canClose ? 'visible' : 'collapsed'} variant="text" text={l('save')} on:tap={start} />
    </stacklayout>
</stacklayout>
