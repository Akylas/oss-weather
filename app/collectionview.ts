import { ItemEventData, ItemsSource } from '@nativescript/core/ui/list-view';
import { View } from '@nativescript/core/ui/core/view';
import { ViewBase } from '@nativescript/core/ui/core/view-base';
import { NativeViewElementNode, TemplateElement, ViewNode, createElement, logger, registerElement } from 'svelte-native/dom';
import { flush } from 'svelte/internal';
import { CollectionView } from 'nativescript-collectionview';
import { profile } from '@nativescript/core/profiling';

declare module '@nativescript/core/ui/core/view-base' {
    interface ViewBase {
        _recursiveSuspendNativeUpdates(type);
        _recursiveResumeNativeUpdates(type);
        _recursiveBatchUpdates<T>(callback: () => T): T;
    }
}
ViewBase.prototype._recursiveSuspendNativeUpdates = profile('_recursiveSuspendNativeUpdates', function (type) {
    // console.log('_recursiveSuspendNativeUpdates', this, this._suspendNativeUpdatesCount);
    this._suspendNativeUpdates(type);
    this.eachChild((c) => c._recursiveSuspendNativeUpdates(type));
});
ViewBase.prototype._recursiveResumeNativeUpdates = profile('_recursiveResumeNativeUpdates', function (type) {
    // console.log('_recursiveResumeNativeUpdates', this, this._suspendNativeUpdatesCount);
    this._resumeNativeUpdates(type);
    this.eachChild((c) => c._recursiveResumeNativeUpdates(type));
});

// right now _recursiveBatchUpdates suppose no view is added in the callback. If so it will crash from _resumeNativeUpdates
ViewBase.prototype._recursiveBatchUpdates = profile('_recursiveBatchUpdates', function <T>(callback: () => T): T {
    try {
        this._recursiveSuspendNativeUpdates(0);

        return callback();
    } finally {
        this._recursiveResumeNativeUpdates(0);
    }
});

class SvelteKeyedTemplate {
    _key: string;
    _templateEl: TemplateElement;
    constructor(key: string, templateEl: TemplateElement) {
        this._key = key;
        this._templateEl = templateEl;
    }
    get component() {
        return this._templateEl.component;
    }
    get key() {
        return this._key;
    }
    createView() {
        // create a proxy element to eventually contain our item (once we have one to render)
        // TODO is StackLayout the best choice here?
        const wrapper = createElement('StackLayout') as NativeViewElementNode<View>;

        const nativeEl = wrapper.nativeView;

        // because of the way {N} works we cant use that wrapper as the target for the component
        // it will trigger uncessary {N} component updates because the parent view is already attached

        (nativeEl as any).__SvelteComponentBuilder__ = (parentView, props) => {
            profile('__SvelteComponentBuilder__', () => {
                (nativeEl as any).__SvelteComponent__ = new this.component({
                    target: parentView,
                    props,
                });
            })();
        };
        return nativeEl;
    }
}

export default class CollectionViewViewElement extends NativeViewElementNode<CollectionView> {
    constructor() {
        super('collectionview', CollectionView);
        const nativeView = this.nativeView;
        nativeView.itemViewLoader = (viewType: any): View => this.loadView(viewType);
        this.nativeView.on(CollectionView.itemLoadingEvent, this.updateListItem, this);
    }

    private loadView(viewType: string): View {
        if (Array.isArray(this.nativeElement.itemTemplates)) {
            const keyedTemplate = this.nativeElement.itemTemplates.find((t) => t.key === 'default');
            if (keyedTemplate) {
                return keyedTemplate.createView();
            }
        }

        const componentClass = this.getComponentForView(viewType);
        if (!componentClass) return null;

        const wrapper = createElement('StackLayout') as NativeViewElementNode<View>;
        const nativeEl = wrapper.nativeView;

        const builder = (parentView, props: any) => {
            (nativeEl as any).__SvelteComponent__ = new componentClass({
                target: parentView,
                props,
            });
        };
        // in svelte we want to add the wrapper as a child of the collectionview ourselves
        (nativeEl as any).__SvelteComponentBuilder__ = builder;
        return nativeEl;
    }

    // For some reason itemTemplateSelector isn't defined as a "property" on radListView, so when we set the property, it is lowercase (due to svelte's forced downcasing)
    // we intercept and fix the case here.
    setAttribute(fullkey: string, value: any): void {
        if (fullkey.toLowerCase() === 'itemtemplateselector') {
            fullkey = 'itemTemplateSelector';
        }
        super.setAttribute(fullkey, value);
    }

    private getComponentForView(viewType: string) {
        const normalizedViewType = viewType.toLowerCase();
        const templateEl = this.childNodes.find((n) => n.tagName === 'template' && String(n.getAttribute('type')).toLowerCase() === normalizedViewType) as any;
        if (!templateEl) return null;
        return templateEl.component;
    }

    onInsertedChild(childNode: ViewNode, index: number) {
        super.onInsertedChild(childNode, index);
        if (childNode instanceof TemplateElement) {
            const key = childNode.getAttribute('key') || 'default';
            // const templates = !this.nativeView.itemTemplates || typeof this.nativeView.itemTemplates === 'string' ? [] : (this.nativeView.itemTemplates as any[]);
            // we need to reassign or the update wont be seen
            this.nativeView.addTemplate(key, new SvelteKeyedTemplate(key, childNode));
            // = templates.concat([new SvelteKeyedTemplate(key, childNode)]);
        }
    }

    onRemovedChild(childNode: ViewNode) {
        super.onRemovedChild(childNode);
        if (childNode instanceof TemplateElement) {
            const key = childNode.getAttribute('key') || 'default';
            this.nativeView.removeTemplate(key);
        }
    }
    private updateListItem(args: ItemEventData & { bindingContext }) {
        const _view = args.view as any;
        const props = { item: args.bindingContext };
        const componentInstance = _view.__SvelteComponent__;
        if (!componentInstance) {
            if (_view.__SvelteComponentBuilder__) {
                const dummy = createElement('fragment');
                _view.__SvelteComponentBuilder__(dummy, props);
                _view.__SvelteComponentBuilder__ = null;
                _view.__CollectionViewCurrentIndex__ = args.index;
                const nativeEl = (dummy.firstElement() as NativeViewElementNode<View>).nativeView;
                _view.addChild(nativeEl);
            }
        } else {
            // ensure we dont do unnecessary tasks if index did not change
            // console.log('updateListItem', args.index,  _view.__CollectionViewCurrentIndex__);
            _view.__CollectionViewCurrentIndex__ = args.index;
            _view._recursiveBatchUpdates(() => {
                componentInstance.$set(props);
                flush(); // we need to flush to make sure update is applied right away
            });
        }
    }

    static register() {
        registerElement('collectionview', () => new CollectionViewViewElement());
    }
}
