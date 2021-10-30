import { InAppBrowser } from '@akylas/nativescript-inappbrowser';
import { primaryColor } from '~/variables';
import { openUrl } from '@nativescript/core/utils/utils';

export async function openLink(url) {
    try {
        const available = await InAppBrowser.isAvailable();
        if (available) {
            return InAppBrowser.open(url, {
                // iOS Properties
                dismissButtonStyle: 'close',
                preferredBarTintColor: primaryColor,
                preferredControlTintColor: 'white',
                readerMode: false,
                animated: true,
                enableBarCollapsing: true,
                // Android Properties
                showTitle: true,
                toolbarColor: primaryColor,
                secondaryToolbarColor: 'white',
                enableUrlBarHiding: true,
                enableDefaultShare: true,
                forceCloseOnRedirection: false
            });
        } else {
            openUrl(url);
        }
    } catch (error) {
        alert({
            title: 'Error',
            message: error.message,
            okButtonText: 'Ok'
        });
    }
}
