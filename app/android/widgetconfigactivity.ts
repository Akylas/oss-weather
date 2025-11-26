import {
    AndroidActivityBackPressedEventData,
    AndroidActivityCallbacks,
    AndroidActivityNewIntentEventData,
    AndroidActivityRequestPermissionsEventData,
    AndroidActivityResultEventData,
    Application,
    Frame,
    GridLayout,
    Trace,
    Utils,
    View
} from '@nativescript/core';
import { CSSUtils } from '@nativescript/core/css/system-classes';
import { ComponentInstanceInfo } from 'svelte-native/dom';
import { start as startThemeHelper } from '~/helpers/theme';
import { onInitRootView } from '~/variables';
import type ConfigWidget__SvelteComponent_ from '~/components/settings/ConfigWidget.svelte';

const TAG = '[WidgetConfActivity]';
const CALLBACKS = '_callbacks';
const ROOT_VIEW_ID_EXTRA = 'com.tns.activity.rootViewId';
const activityRootViewsMap = new Map<number, WeakRef<View>>();

export function setActivityCallbacks(activity: androidx.appcompat.app.AppCompatActivity): void {
    activity[CALLBACKS] = new WidgetConfigActivityCallbacksImplementation();
}

export let moduleLoaded: boolean;

class WidgetConfigActivityCallbacksImplementation implements AndroidActivityCallbacks {
    private _rootView: View;
    private widgetId: number = -1;
    private widgetClass: string = '';

    public getRootView(): View {
        return this._rootView;
    }

    public onCreate(activity: androidx.appcompat.app.AppCompatActivity, savedInstanceState: android.os.Bundle, intentOrSuperFunc: android.content.Intent | Function, superFunc?: Function): void {
        const intent: android.content.Intent = superFunc ? (intentOrSuperFunc as android.content.Intent) : undefined;
        if (!superFunc) {
            superFunc = intentOrSuperFunc as Function;
        }

        const isRestart = !!savedInstanceState && moduleLoaded;
        superFunc.call(activity, isRestart ? savedInstanceState : null);

        if (savedInstanceState) {
            const rootViewId = savedInstanceState.getInt(ROOT_VIEW_ID_EXTRA, -1);
            if (rootViewId !== -1 && activityRootViewsMap.has(rootViewId)) {
                this._rootView = activityRootViewsMap.get(rootViewId).get();
            }
        }

        // Parse widget ID and class from intent
        if (intent) {
            const extras = intent.getExtras();
            if (extras) {
                this.widgetId = extras.getInt(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID, android.appwidget.AppWidgetManager.INVALID_APPWIDGET_ID);
                this.widgetClass = extras.getString('widget_class') || '';
                DEV_LOG && console.log(TAG, 'Widget ID:', this.widgetId, 'Widget Class:', this.widgetClass);
            }
        }

        if (intent && intent.getAction()) {
            Application.android.notify({
                eventName: Application.android.activityNewIntentEvent,
                object: Application.android,
                activity,
                intent
            } as AndroidActivityNewIntentEventData);
        }

        this.setActivityContent(activity, savedInstanceState, true, intent);
        moduleLoaded = true;
    }

    public onSaveInstanceState(activity: androidx.appcompat.app.AppCompatActivity, outState: android.os.Bundle, superFunc: Function): void {
        superFunc.call(activity, outState);
        const rootView = this._rootView;
        if (rootView instanceof Frame) {
            outState.putInt('com.tns.activity', rootView.android['frameId']);
            rootView._saveFragmentsState();
        }

        outState.putInt(ROOT_VIEW_ID_EXTRA, rootView._domId);
    }

    public onNewIntent(activity: androidx.appcompat.app.AppCompatActivity, intent: android.content.Intent, superSetIntentFunc: Function, superFunc: Function): void {
        superFunc.call(activity, intent);
        superSetIntentFunc.call(activity, intent);

        Application.android.notify({
            eventName: Application.android.activityNewIntentEvent,
            object: Application.android,
            activity,
            intent
        } as AndroidActivityNewIntentEventData);
    }

    public onStart(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('WidgetConfActivity.onStart();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && !rootView.isLoaded) {
            rootView.callLoaded();
        }
    }

    public onStop(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('WidgetConfActivity.onStop();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && rootView.isLoaded) {
            rootView.callUnloaded();
        }
    }

    public onPostResume(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('WidgetConfActivity.onPostResume();', Trace.categories.NativeLifecycle);
        }
    }
    componentInstanceInfo: ComponentInstanceInfo<GridLayout, ConfigWidget__SvelteComponent_>;
    public onDestroy(activity: any, superFunc: Function): void {
        try {
            if (Trace.isEnabled()) {
                Trace.write('WidgetConfActivity.onDestroy();', Trace.categories.NativeLifecycle);
            }

            if (this.componentInstanceInfo) {
                this.componentInstanceInfo.element.nativeElement._tearDownUI();
                this.componentInstanceInfo.viewInstance.$destroy();
                this.componentInstanceInfo = null;
            }

            const rootView = this._rootView;
            if (rootView) {
                rootView._tearDownUI(true);
            }
        } catch (error) {
            console.error(error, error.stack);
        } finally {
            superFunc.call(activity);
        }
    }

    public onBackPressed(activity: any, superFunc: Function): void {
        if (Trace.isEnabled()) {
            Trace.write('WidgetConfActivity.onBackPressed;', Trace.categories.NativeLifecycle);
        }

        const args = {
            eventName: 'activityBackPressed',
            object: Application.android,
            activity,
            cancel: false
        } as AndroidActivityBackPressedEventData;
        Application.android.notify(args);
        if (args.cancel) {
            return;
        }

        const view = this._rootView;
        let callSuper = false;
        if (view instanceof Frame) {
            callSuper = !view.goBack();
        } else {
            const viewArgs = {
                eventName: 'activityBackPressed',
                object: view,
                activity,
                cancel: false
            } as AndroidActivityBackPressedEventData;
            view.notify(viewArgs);

            if (!viewArgs.cancel && !view.onBackPressed()) {
                callSuper = true;
            }
        }

        if (callSuper) {
            superFunc.call(activity);
        }
    }

    public onRequestPermissionsResult(activity: any, requestCode: number, permissions: string[], grantResults: number[], superFunc: Function): void {
        if (Trace.isEnabled()) {
            Trace.write('WidgetConfActivity.onRequestPermissionsResult;', Trace.categories.NativeLifecycle);
        }

        Application.android.notify({
            eventName: 'activityRequestPermissions',
            object: Application.android,
            activity,
            requestCode,
            permissions,
            grantResults
        } as AndroidActivityRequestPermissionsEventData);
    }

    public onActivityResult(activity: any, requestCode: number, resultCode: number, data: android.content.Intent, superFunc: Function): void {
        superFunc.call(activity, requestCode, resultCode, data);
        if (Trace.isEnabled()) {
            Trace.write(`WidgetConfActivity.onActivityResult(${requestCode}, ${resultCode}, ${data})`, Trace.categories.NativeLifecycle);
        }

        Application.android.notify({
            eventName: 'activityResult',
            object: Application.android,
            activity,
            requestCode,
            resultCode,
            intent: data
        } as AndroidActivityResultEventData);
    }

    public resetActivityContent(activity: androidx.appcompat.app.AppCompatActivity): void {
        if (this._rootView) {
            const manager = this._rootView._getFragmentManager();
            manager.executePendingTransactions();

            this._rootView._onRootViewReset();
        }
        this._rootView = null;
        this.setActivityContent(activity, null, false, null);
        this._rootView.callLoaded();
    }

    private async setActivityContent(activity: androidx.appcompat.app.AppCompatActivity, savedInstanceState: android.os.Bundle, fireLaunchEvent: boolean, intent: android.content.Intent) {
        let rootView = this._rootView;
        DEV_LOG && console.log(TAG, 'setActivityContent');
        if (!rootView) {
            rootView = new GridLayout();
            this._rootView = rootView;

            activityRootViewsMap.set(rootView._domId, new WeakRef(rootView));
            const rootViewCssClasses = CSSUtils.getSystemCssClasses();
            rootViewCssClasses.forEach((c) => this._rootView.cssClasses.add(c));
        }

        // setup view as styleScopeHost
        rootView._setupAsRootView(activity);
        // sets root classes once rootView is ready...
        Application.initRootView(rootView);

        activity.setContentView(rootView.nativeViewProtected, new org.nativescript.widgets.CommonLayoutParams());

        try {
            // Ensure theme is started
            startThemeHelper(true);
            onInitRootView(true);

            // Check for valid widget ID
            if (this.widgetId === android.appwidget.AppWidgetManager.INVALID_APPWIDGET_ID) {
                DEV_LOG && console.log(TAG, 'Invalid widget ID');
                activity.setResult(android.app.Activity.RESULT_CANCELED);
                activity.finish();
                return;
            }

            // Mount ConfigWidget component
            const { resolveComponentElement } = await import('@shared/utils/ui');
            const ConfigWidget = (await import('~/components/settings/ConfigWidget.svelte')).default;

            this.componentInstanceInfo = resolveComponentElement(ConfigWidget, {
                widgetClass: this.widgetClass,
                widgetId: String(this.widgetId),
                modalMode: true
            }) as ComponentInstanceInfo<GridLayout, ConfigWidget__SvelteComponent_>;

            const configView = this.componentInstanceInfo.element.nativeView;
            (rootView as GridLayout).addChild(configView);

            // Listen for back button to finish activity with result
            rootView.on('activityBackPressed', (args: AndroidActivityBackPressedEventData) => {
                args.cancel = true;
                // Set result OK when closing
                const resultIntent = new android.content.Intent();
                resultIntent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID, this.widgetId);
                activity.setResult(android.app.Activity.RESULT_OK, resultIntent);
                activity.finish();
            });
        } catch (err) {
            console.error(TAG, 'Error mounting ConfigWidget:', err, err.stack);
            activity.setResult(android.app.Activity.RESULT_CANCELED);
            activity.finish();
        }
    }
}

@JavaProxy('__PACKAGE__.WidgetConfActivity')
@NativeClass
class Activity extends androidx.appcompat.app.AppCompatActivity {
    isWidgetConfigActivity: boolean;
    private _callbacks: AndroidActivityCallbacks;
    constructor() {
        super();

        return global.__native(this);
    }

    finish() {
        super.finish();
        this.overridePendingTransition(0, 0);
    }

    public onCreate(savedInstanceState: android.os.Bundle): void {
        // Ensure the app is initialized
        Application.android.init(this.getApplication());

        this.isWidgetConfigActivity = true;

        if (!this._callbacks) {
            setActivityCallbacks(this);
        }

        this._callbacks.onCreate(this, savedInstanceState, this.getIntent(), super.onCreate);
    }

    public onNewIntent(intent: android.content.Intent): void {
        this._callbacks.onNewIntent(this, intent, super.setIntent, super.onNewIntent);
    }

    public onSaveInstanceState(outState: android.os.Bundle): void {
        this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
    }

    public onStart(): void {
        this._callbacks.onStart(this, super.onStart);
        this.overridePendingTransition(0, 0);
    }

    public onStop(): void {
        this._callbacks.onStop(this, super.onStop);
    }

    public onDestroy(): void {
        this._callbacks.onDestroy(this, super.onDestroy);
    }

    public onPostResume(): void {
        this._callbacks.onPostResume(this, super.onPostResume);
    }

    public onBackPressed(): void {
        this._callbacks.onBackPressed(this, super.onBackPressed);
    }

    public onRequestPermissionsResult(requestCode: number, permissions: string[], grantResults: number[]): void {
        this._callbacks.onRequestPermissionsResult(this, requestCode, permissions, grantResults, undefined);
    }

    public onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
        this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
    }
}
