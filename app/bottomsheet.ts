import { PageSpec } from 'svelte-native-akylas/dom/navigation';
import { NativeViewElementNode, createElement } from 'svelte-native-akylas/dom';
import { Frame, View, ViewBase } from '@nativescript/core/ui/frame/frame';
import { BottomSheetOptions } from 'nativescript-material-bottomsheet';

export interface ShowBottomSheetOptions extends Omit<BottomSheetOptions, 'view'> {
    page: PageSpec;
    props?: any;
    // android?: { cancelable: boolean };
    // // ios?: { presentationStyle: any };
    // animated?: boolean;
    // fullscreen?: boolean;
    // stretched: boolean;
}
interface ComponentInstanceInfo {
    element: NativeViewElementNode<View>;
    pageInstance: SvelteComponent;
}

const modalStack: ComponentInstanceInfo[] = [];

function resolveComponentElement(pageSpec: PageSpec, props?: any): ComponentInstanceInfo {
    const dummy = createElement('fragment');
    const pageInstance = new pageSpec({ target: dummy, props });
    const element = dummy.firstElement() as NativeViewElementNode<View>;
    return { element, pageInstance };
}
export function showBottomSheet<T>(modalOptions: ShowBottomSheetOptions): Promise<T> {
    const { page, props = {}, ...options } = modalOptions;

    // Get this before any potential new frames are created by component below
    const modalLauncher = Frame.topmost().currentPage;

    const componentInstanceInfo = resolveComponentElement(page, props);
    const modalView: ViewBase = componentInstanceInfo.element.nativeView;

    return new Promise((resolve, reject) => {
        let resolved = false;
        const closeCallback = (result: T) => {
            if (resolved) return;
            resolved = true;
            try {
                componentInstanceInfo.pageInstance.$destroy(); // don't let an exception in destroy kill the promise callback
            } finally {
                resolve(result);
            }
        };
        modalStack.push(componentInstanceInfo);
        modalLauncher.showBottomSheet({ view: modalView, ...options, context: {}, closeCallback });
    });
}

export function closeModal(result: any): void {
    const modalPageInstanceInfo = modalStack.pop();
    (modalPageInstanceInfo.element.nativeView as any).closeBottomSheet(result);
}
