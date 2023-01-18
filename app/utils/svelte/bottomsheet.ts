import { GestureRootView } from '@nativescript-community/gesturehandler';
import type { BottomSheetOptions } from '@nativescript-community/ui-material-bottomsheet';
import { Frame, View } from '@nativescript/core';
import { SvelteComponent } from 'svelte';
import { PageSpec, resolveComponentElement } from './navigation';

export interface ShowBottomSheetOptions extends Omit<BottomSheetOptions, 'view'> {
    view: PageSpec;
    parent?: View | View;
    props?: any;
}
interface ComponentInstanceInfo {
    element: View;
    viewInstance: SvelteComponent;
}

const modalStack: ComponentInstanceInfo[] = [];

export function showBottomSheet<T>(modalOptions: ShowBottomSheetOptions): Promise<T> {
    const { view, parent, props = {}, ...options } = modalOptions;
    // Get this before any potential new frames are created by component below
    const modalLauncher: View = parent || Frame.topmost().currentPage;

    const componentInstanceInfo = resolveComponentElement(view, props);
    let modalView: View = componentInstanceInfo.element.nativeView;

    if (!(modalView instanceof GestureRootView)) {
        const gestureView = new GestureRootView();
        gestureView.height = modalView.height;
        gestureView.addChild(modalView);
        modalView = gestureView;
    }

    return new Promise(async (resolve, reject) => {
        let resolved = false;
        const closeCallback = (result: T) => {
            if (resolved) return;
            modalStack.pop();
            resolved = true;
            resolve(result);
            modalView._tearDownUI();
            componentInstanceInfo.viewInstance.$destroy(); // don't let an exception in destroy kill the promise callback
        };
        try {
            modalLauncher.showBottomSheet({ view: modalView, ...options, context: {}, closeCallback });
            modalStack.push(componentInstanceInfo);
        } catch (err) {
            reject(err);
        }
    });
}

export function closeBottomSheet(result?: any): void {
    const modalPageInstanceInfo = modalStack[modalStack.length - 1];
    if (modalPageInstanceInfo) {
        modalPageInstanceInfo.element.closeBottomSheet(result);
    }
}
export function isBottomSheetOpened() {
    return modalStack.length > 0;
}
