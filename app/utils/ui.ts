import { InAppBrowser } from '@akylas/nativescript-inappbrowser';
import { MDCAlertControlerOptions } from '@nativescript-community/ui-material-dialogs';
import { AlertOptions, Utils, View } from '@nativescript/core';
import { NativeViewElementNode, createElement } from 'svelte-native/dom';
import { primaryColor } from '~/variables';
import { l, lc } from '~/helpers/locale';

export interface ComponentInstanceInfo {
    element: NativeViewElementNode<View>;
    viewInstance: SvelteComponent;
}

export function resolveComponentElement<T>(viewSpec: typeof SvelteComponent<T>, props?: T): ComponentInstanceInfo {
    const dummy = createElement('fragment', window.document as any);
    const viewInstance = new viewSpec({ target: dummy, props });
    const element = dummy.firstElement() as NativeViewElementNode<View>;
    return { element, viewInstance };
}


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


export async function showAlertOptionSelect<T>(viewSpec: typeof SvelteComponent<T>, props?: T, options?: Partial<AlertOptions & MDCAlertControlerOptions>) {
    let componentInstanceInfo: ComponentInstanceInfo;
    try {
        componentInstanceInfo = resolveComponentElement(viewSpec, {
            onClose: (result) => {
                view.bindingContext.closeCallback(result);
            },
            onCheckBox(item, value, e) {
                view.bindingContext.closeCallback(item);
            },
            trackingScrollView: 'collectionView',
            ...props
        });
        const view: View = componentInstanceInfo.element.nativeView;
        const result = await alert({
            view,
            okButtonText: lc('cancel'),
            ...(options ? options : {})
        });
        return result;
    } catch (err) {
        throw err;
    } finally {
        componentInstanceInfo.element.nativeElement._tearDownUI();
        componentInstanceInfo.viewInstance.$destroy();
        componentInstanceInfo = null;
    }
}