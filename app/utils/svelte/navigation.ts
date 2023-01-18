import { BackstackEntry, Frame, NavigatedData, NavigationTransition, Page, View, ViewBase } from '@nativescript/core';
import { getRootView } from '@nativescript/core/application';
import type { SvelteComponent } from 'svelte';
import { document } from 'dominative';

export type ViewSpec = View;
export type FrameSpec = Frame | string;
export type PageSpec = typeof SvelteComponent;
export interface NavigationOptions {
    page: PageSpec;
    props?: any;
    frame?: FrameSpec;

    animated?: boolean;
    backstackVisible?: boolean;
    clearHistory?: boolean;
    transition?: NavigationTransition;
    transitionAndroid?: NavigationTransition;
    transitioniOS?: NavigationTransition;
}

function resolveFrame(frameSpec: FrameSpec): Frame {
    let targetFrame: Frame;
    if (!frameSpec) targetFrame = Frame.topmost();
    // if (frameSpec instanceof FrameElement) targetFrame = frameSpec.nativeView as Frame;
    if (frameSpec instanceof Frame) targetFrame = frameSpec;
    if (typeof frameSpec == 'string') {
        targetFrame = Frame.getFrameById(frameSpec);
        // if (!targetFrame) log.error(() => `Navigate could not find frame with id ${frameSpec}`);
    }
    return targetFrame;
}

function resolveTarget(viewSpec: ViewSpec): View {
    if (viewSpec instanceof View) {
        return viewSpec;
    }
    // return viewSpec?.nativeView;
}

interface ComponentInstanceInfo {
    element: View;
    viewInstance: SvelteComponent;
}

export function resolveComponentElement(pageSpec: PageSpec, props?: any): ComponentInstanceInfo {
    const dummy = document.createDocumentFragment();
    const viewInstance = new pageSpec({ target: dummy, props });
    const element = dummy.firstElementChild as any as View;
    return { element, viewInstance };
}

export function navigate(options: NavigationOptions): SvelteComponent {
    const { frame, page, props = {}, ...navOptions } = options;

    const targetFrame = resolveFrame(frame);

    if (!targetFrame) {
        throw new Error('navigate requires frame option to be a native Frame, a FrameElement, a frame Id, or null');
    }
    if (!page) {
        throw new Error('navigate requires page to be set to the svelte component class that implements the page or reference to a page element');
    }

    const { element, viewInstance } = resolveComponentElement(page, props);

    // if (!(element instanceof PageElement)) throw new Error('navigate requires a svelte component with a page element at the root');

    const nativePage = element.nativeView;

    const handler = (args: NavigatedData) => {
        if (args.isBackNavigation) {
            // we need to delay because it could create a crash in N as $destroy()
            // will remove all set `navigatedFrom` while we are enumerating to actually send them
            setTimeout(() => {
                nativePage.off('navigatedFrom', handler);
                viewInstance.$destroy();
            }, 0);
        }
    };
    nativePage.on('navigatedFrom', handler);

    targetFrame.navigate({
        ...navOptions,
        create: () => nativePage
    });

    return viewInstance;
}

export interface BackNavigationOptions {
    frame?: FrameSpec;
    to?: Page;
}

export function goBack(options: BackNavigationOptions = {}) {
    const targetFrame = resolveFrame(options.frame);
    if (!targetFrame) {
        throw new Error('goback requires frame option to be a native Frame, a FrameElement, a frame Id, or null');
    }
    let backStackEntry: BackstackEntry = null;
    if (options.to) {
        backStackEntry = targetFrame.backStack.find((e) => e.resolvedPage === options.to.nativeView);
        if (!backStackEntry) {
            throw new Error("Couldn't find the destination page in the frames backstack");
        }
    }
    return targetFrame.goBack(backStackEntry);
}

export interface ShowModalOptions {
    page: PageSpec;
    target?: ViewSpec;
    props?: any;
    android?: { cancelable: boolean };
    ios?: { presentationStyle: any };
    animated?: boolean;
    fullscreen?: boolean;
    stretched?: boolean;
}

const modalStack: ComponentInstanceInfo[] = [];

export function showModal<T>(modalOptions: ShowModalOptions): Promise<T> {
    const { page, props = {}, target, ...options } = modalOptions;

    const modalLauncher = resolveTarget(target) || getRootView();

    const componentInstanceInfo = resolveComponentElement(page, props);
    const modalView: ViewBase = componentInstanceInfo.element.nativeView;

    return new Promise((resolve, reject) => {
        let resolved = false;
        const closeCallback = (result: T) => {
            if (resolved) return;
            modalStack.pop();
            resolved = true;
            try {
                componentInstanceInfo.viewInstance.$destroy(); //don't let an exception in destroy kill the promise callback
            } finally {
                resolve(result);
            }
        };
        modalStack.push(componentInstanceInfo);
        modalLauncher.showModal(modalView, { ...options, context: {}, closeCallback });
    });
}

export function closeModal(result: any): void {
    const modalPageInstanceInfo = modalStack[modalStack.length - 1];
    modalPageInstanceInfo.element.nativeView.closeModal(result);
}

export function isModalOpened() {
    return modalStack.length > 0;
}
