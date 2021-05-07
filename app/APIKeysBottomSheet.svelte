<script lang="ts">
    import { android as androidApp } from '@nativescript/core/application';
    import { getString } from '@nativescript/core/application-settings';
    import { closeBottomSheet } from '~/bottomsheet';
    import { l } from '~/helpers/locale';
    import { setCCApiKey, setOWMApiKey } from '~/services/api';
    import { openLink } from './utils/ui';

    let ccApiKey = getString('ccApiKey');
    let owmApiKey = getString('owmApiKey');
    let canClose = false;

    function quitApp() {
        if (global.isIOS) {
            exit(0);
        } else {
            androidApp.startActivity.finish();
        }
    }
    function onTextChange() {}
    function openWeatherMap() {
        openLink('https://openweathermap.org/api');
    }
    function openClimaCell() {
        openLink('https://developer.climacell.co/sign-up');
    }

    function start() {
        setOWMApiKey(owmApiKey);
        if (ccApiKey) {
            setCCApiKey(ccApiKey);
        }
        closeBottomSheet(true);
    }

    $: {
        canClose = !!owmApiKey && owmApiKey.length === 32;
    }
</script>

<!-- <scrollview> -->
<stacklayout class="bottomsheet" padding="10" iosIgnoreSafeArea={true}>
    <label text={l('api_key_required_description')} />
    <gridlayout rows="auto" columns="auto,*, auto" marginTop="5">
        <image width="100" src="https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png" marginRight="10" />
        <textfield text={owmApiKey} on:textChange={(e) => (owmApiKey = e.value)} col="1" hint={l('api_key')} placeholder={l('api_key')} placeholderColor="lightgray" />
        <mdbutton variant="text" class="icon-btn" text="mdi-open-in-app" col="2" on:tap={openWeatherMap} />
    </gridlayout>
    <label text={l('climal_cell_api_key_optional_description')} marginTop="10" />
    <gridlayout rows="auto" columns="auto,*, auto" marginTop="5" marginBottom="10">
        <image width="100" src="https://startupexchange.mit.edu/sites/default/files/2019-01/climacell_color.png" marginRight="10" />
        <textfield text={ccApiKey} on:textChange={(e) => (ccApiKey = e.value)} col="1" hint={l('api_key')} placeholder={l('api_key')} placeholderColor="lightgray" />
        <mdbutton variant="text" class="icon-btn" text="mdi-open-in-app" col="2" on:tap={openClimaCell} />
    </gridlayout>
    <stacklayout orientation="horizontal" horizontalAlignment="right" marginTop="15">
        <mdbutton visibility={canClose ? 'visible' : 'collapsed'} variant="text" text={l('save')} on:tap={start} />
        <!-- <mdbutton variant="text" text={l('quit')} on:tap={quitApp} /> -->
    </stacklayout>
</stacklayout>
<!-- </scrollview> -->
