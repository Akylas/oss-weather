import { InAppBrowser } from '@akylas/nativescript-inappbrowser';
import { MDCAlertControlerOptions, alert } from '@nativescript-community/ui-material-dialogs';
import { HorizontalPosition, PopoverOptions, VerticalPosition } from '@nativescript-community/ui-popover';
import { closePopover, showPopover } from '@nativescript-community/ui-popover/svelte';
import { AlertOptions, Utils, View } from '@nativescript/core';
import { NativeViewElementNode, createElement } from 'svelte-native/dom';
import { get } from 'svelte/store';
import { lc } from '~/helpers/locale';
import { colors, systemFontScale } from '~/variables';

export async function openLink(url) {
    try {
        const { colorPrimary } = get(colors);
        const available = await InAppBrowser.isAvailable();
        if (available) {
            return InAppBrowser.open(url, {
                // iOS Properties
                dismissButtonStyle: 'close',
                preferredBarTintColor: colorPrimary,
                preferredControlTintColor: 'white',
                readerMode: false,
                animated: true,
                enableBarCollapsing: true,
                // Android Properties
                showTitle: true,
                toolbarColor: colorPrimary,
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

export async function showPopoverMenu<T = any>({ options, anchor, onClose, props, horizPos, vertPos }: { options; anchor; onClose?; props? } & Partial<PopoverOptions>) {
    const { colorSurfaceContainer } = get(colors);
    const OptionSelect = (await import('~/components/common/OptionSelect.svelte')).default;
    const rowHeight = (props?.rowHeight || 58) * get(systemFontScale);
    const result: T = await showPopover({
        backgroundColor: colorSurfaceContainer,
        view: OptionSelect,
        anchor,
        horizPos: horizPos ?? HorizontalPosition.ALIGN_LEFT,
        vertPos: vertPos ?? VerticalPosition.CENTER,
        props: {
            borderRadius: 10,
            elevation: 4,
            margin: 4,
            backgroundColor: colorSurfaceContainer,
            containerColumns: 'auto',
            rowHeight,
            height: Math.min(rowHeight * options.length, 400),
            width: 150,
            options,
            onClose: (item) => {
                closePopover();
                onClose?.(item);
            },
            ...(props || {})
        }
    });
    return result;
}
