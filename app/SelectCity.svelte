<script lang="ts">
    import { closeModal } from 'svelte-native';
    import { Template } from 'svelte-native/components';
    import { l } from '~/helpers/locale';
    import { photonSearch } from '~/services/api';
    import { showError } from '~/utils/error';
    import { textColor, textLightColor } from '~/variables';
    import CActionBar from './CActionBar.svelte';

    let page;
    let textField;
    let loading = false;
    let searchResults = [];
    let searchAsTypeTimer;
    let currentSearchText;

    function focus() {
        textField && textField.nativeView.requestFocus();
        // alert('test')
    }
    function unfocus() {
        clearSearchTimeout();
    }
    function onTextChange(e) {
        const query = e.value;
        clearSearchTimeout();

        if (query && query.length > 2) {
            searchAsTypeTimer = setTimeout(() => {
                searchAsTypeTimer = null;
                searchCity(query);
            }, 500);
        } else if (currentSearchText && currentSearchText.length > 2) {
            unfocus();
        }
        currentSearchText = query;
    }

    async function searchCity(query) {
        try {
            loading = true;
            searchResults = await photonSearch(query);
        } catch (err) {
            showError(err);
        } finally {
            loading = false;
        }
    }

    function clearSearchTimeout() {
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
    }

    function close(item) {
        clearSearchTimeout();
        closeModal(item);
    }
    // onMount(() => {
    //     focus();
    // });
    function onNavigatingTo(e) {
        // console.log('onNavigatingTo', page && page.nativeView, e.object);
    }
</script>

<frame backgroundColor="transparent">
    <page bind:this={page} actionBarHidden={true} on:navigatingTo={onNavigatingTo}>
        <gridLayout rows="auto,auto,*">
            <CActionBar title={l('search_city')} modalWindow>
                <activityIndicator busy={loading} verticalAlignment="center" visibily={loading ? 'visible' : 'collapsed'} />
            </CActionBar>
            <textfield
                bind:this={textField}
                row="1"
                hint={l('search')}
                placeholder={l('search')}
                floating="false"
                returnKeyType="search"
                on:textChange={onTextChange}
                on:loaded={focus}
                color={$textColor}
            />
            <collectionview row="2" rowHeight="80" items={searchResults}>
                <Template let:item>
                    <gridLayout rippleColor="#aaa" on:tap={() => close(item)} columns="*" padding="10">
                        <gridLayout col="1" paddingLeft="10" verticalAlignment="center" rows="auto,auto,auto">
                            <label fontSize="18" text={item.name} />
                            <label row="1" color={$textLightColor} fontSize="14" text={item.sys.state || item.sys.country} />
                            <label row="2" color={$textLightColor} fontSize="14" text={item.sys.state ? item.sys.country : ''} />
                        </gridLayout>
                        <!-- <label fontSize="10" verticalAlignment="center" text={JSON.stringify(item.sys)} /> -->
                    </gridLayout>
                </Template>
            </collectionview>
        </gridLayout>
    </page>
</frame>
