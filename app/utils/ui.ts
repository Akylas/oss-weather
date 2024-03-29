import { InAppBrowser } from '@akylas/nativescript-inappbrowser';
import { AlertDialog, MDCAlertControlerOptions, alert } from '@nativescript-community/ui-material-dialogs';
import { HorizontalPosition, PopoverOptions, VerticalPosition } from '@nativescript-community/ui-popover';
import { closePopover, showPopover } from '@nativescript-community/ui-popover/svelte';
import { ActivityIndicator, AlertOptions, StackLayout, Utils, View } from '@nativescript/core';
import { NativeViewElementNode, createElement } from 'svelte-native/dom';
import { get } from 'svelte/store';
import { lc } from '~/helpers/locale';
import { colors, fontScale, systemFontScale } from '~/variables';
import { showError } from './error';
import { Label } from '@nativescript-community/ui-label';

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

let loadingIndicator: AlertDialog & { label?: Label };
let showLoadingStartTime: number = null;
function getLoadingIndicator() {
    if (!loadingIndicator) {
        const stack = new StackLayout();
        stack.padding = 10;
        stack.orientation = 'horizontal';
        const activityIndicator = new ActivityIndicator();
        activityIndicator.className = 'activity-indicator';
        activityIndicator.busy = true;
        stack.addChild(activityIndicator);
        const label = new Label();
        label.paddingLeft = 15;
        label.textWrap = true;
        label.verticalAlignment = 'middle';
        label.fontSize = 16;
        stack.addChild(label);
        loadingIndicator = new AlertDialog({
            view: stack,
            cancelable: false
        });
        loadingIndicator.label = label;
    }
    return loadingIndicator;
}
export function showLoading(msg: string = lc('loading')) {
    const loadingIndicator = getLoadingIndicator();
    // console.log('showLoading', msg, !!loadingIndicator);
    loadingIndicator.label.text = msg + '...';
    showLoadingStartTime = Date.now();
    loadingIndicator.show();
}
export function hideLoading() {
    if (!loadingIndicator) {
        return;
    }
    const delta = showLoadingStartTime ? Date.now() - showLoadingStartTime : -1;
    if (delta >= 0 && delta < 1000) {
        setTimeout(() => hideLoading(), 1000 - delta);
        return;
    }
    // log('hideLoading', !!loadingIndicator);
    if (loadingIndicator) {
        loadingIndicator.hide();
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

export async function showPopoverMenu<T = any>({
    options,
    anchor,
    onClose,
    onLongPress,
    props,
    horizPos,
    vertPos,
    closeOnClose = true
}: { options; anchor; onClose?; onLongPress?; props?; closeOnClose? } & Partial<PopoverOptions>) {
    const { colorSurfaceContainer } = get(colors);
    const OptionSelect = (await import('~/components/common/OptionSelect.svelte')).default;
    const rowHeight = (props?.rowHeight || 58) * get(fontScale);
    DEV_LOG && console.log('showPopoverMenu', props?.maxHeight, rowHeight, rowHeight * options.length);
    const result: T = await showPopover({
        backgroundColor: colorSurfaceContainer,
        view: OptionSelect,
        anchor,
        horizPos: horizPos ?? HorizontalPosition.ALIGN_LEFT,
        vertPos: vertPos ?? VerticalPosition.CENTER,
        props: {
            borderRadius: 10,
            elevation: 3,
            margin: 4,
            fontWeight: 500,
            backgroundColor: colorSurfaceContainer,
            containerColumns: 'auto',
            rowHeight: !!props?.autoSizeListItem ? null : rowHeight,
            height: Math.min(rowHeight * options.length, props?.maxHeight || 400),
            width: 200 * get(fontScale),
            options,
            onLongPress,
            onClose: async (item) => {
                if (closeOnClose) {
                    if (__IOS__) {
                        // on iOS we need to wait or if onClose shows an alert dialog it wont work
                        await closePopover();
                    } else {
                        closePopover();
                    }
                }
                try {
                    await onClose?.(item);
                } catch (error) {
                    showError(error);
                } finally {
                    hideLoading();
                }
            },
            ...(props || {})
        }
    });
    return result;
}
