import { InAppBrowser } from '@akylas/nativescript-inappbrowser';
import { Utils } from '@nativescript/core';
import { primaryColor } from '~/variables';

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
            Utils.openUrl(url);
        }
    } catch (error) {
        alert({
            title: 'Error',
            message: error.message,
            okButtonText: 'Ok'
        });
    }
}
