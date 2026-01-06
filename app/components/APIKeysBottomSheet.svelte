<script lang="ts">
    import { getString } from '@nativescript/core/application-settings';
    import { debounce } from '@nativescript/core/utils';
    import { l } from '~/helpers/locale';
    import { OWMProvider } from '~/services/providers/owm';
    import { closeBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
    import { openLink } from '~/utils/ui';
    import { Providers, getProviderClass } from '~/services/providers/weatherproviderfactory';

    let canClose = false;
    export let provider: Providers;
    const providerClass = getProviderClass(provider);
    let apiKey = providerClass.getApiKey();

    function openWebsite() {
        openLink(providerClass.getUrl());
    }

    function save() {
        providerClass.setApiKey(apiKey);
        closeBottomSheet(true);
    }

    const onKeyChange = debounce((e) => {
        apiKey = e.value;
    }, 1000);

    $: {
        canClose = !!apiKey && apiKey.length > 0;
    }
</script>

<gesturerootview rows="auto">
    <stacklayout iosIgnoreSafeArea={true} padding="10">
        <label text={l('api_key_required')} textWrap={true} />
        <gridlayout columns="auto,*, auto" marginTop={5} rows="auto">
            <!-- <image width={100} src="https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png" marginRight="10"/> -->
            <textfield col={1} hint={l('api_key')} placeholder={l('api_key')} text={apiKey} on:textChange={onKeyChange} />
            <mdbutton class="icon-btn" col={2} text="mdi-open-in-app" variant="text" on:tap={openWebsite} />
        </gridlayout>
        <stacklayout horizontalAlignment="right" marginTop={15} orientation="horizontal">
            <mdbutton text={l('save')} variant="text" visibility={canClose ? 'visible' : 'collapse'} on:tap={save} />
        </stacklayout>
    </stacklayout>
</gesturerootview>
