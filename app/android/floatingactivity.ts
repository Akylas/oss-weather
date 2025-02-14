import { showBottomSheet } from '@nativescript-community/ui-material-bottomsheet/svelte';
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
import { start as startThemeHelper } from '~/helpers/theme';
import { WeatherLocation } from '~/services/api';
import { onInitRootView } from '~/variables';

const CALLBACKS = '_callbacks';
const ROOT_VIEW_ID_EXTRA = 'com.tns.activity.rootViewId';
const activityRootViewsMap = new Map<number, WeakRef<View>>();
const INTENT_EXTRA = 'com.tns.activity';

declare module '@nativescript/core/ui/frame' {
    interface Frame {
        _getFragmentManager();
    }
}
export function setActivityCallbacks(activity: androidx.appcompat.app.AppCompatActivity): void {
    activity[CALLBACKS] = new CustomActivityCallbacksImplementation();
}

export let moduleLoaded: boolean;

class CustomActivityCallbacksImplementation implements AndroidActivityCallbacks {
    private _rootView: View;

    public getRootView(): View {
        return this._rootView;
    }

    public onCreate(activity: androidx.appcompat.app.AppCompatActivity, savedInstanceState: android.os.Bundle, intentOrSuperFunc: android.content.Intent | Function, superFunc?: Function): void {
        const intent: android.content.Intent = superFunc ? (intentOrSuperFunc as android.content.Intent) : undefined;
        if (!superFunc) {
            superFunc = intentOrSuperFunc as Function;
        }

        // If there is savedInstanceState this call will recreate all fragments that were previously in the navigation.
        // We take care of associating them with a Page from our backstack in the onAttachFragment callback.
        // If there is savedInstanceState and moduleLoaded is false we are restarted but process was killed.
        // For now we treat it like first run (e.g. we are not passing savedInstanceState so no fragments are being restored).
        // When we add support for Application save/load state - revise this logic.
        const isRestart = !!savedInstanceState && moduleLoaded;
        superFunc.call(activity, isRestart ? savedInstanceState : null);

        // Try to get the rootViewId form the saved state in case the activity
        // was destroyed and we are now recreating it.
        if (savedInstanceState) {
            const rootViewId = savedInstanceState.getInt(ROOT_VIEW_ID_EXTRA, -1);
            if (rootViewId !== -1 && activityRootViewsMap.has(rootViewId)) {
                this._rootView = activityRootViewsMap.get(rootViewId).get();
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
            outState.putInt(INTENT_EXTRA, rootView.android['frameId']);
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
            Trace.write('FloatingActivity.onStart();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && !rootView.isLoaded) {
            rootView.callLoaded();
        }
    }

    public onStop(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('FloatingActivity.onStop();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && rootView.isLoaded) {
            rootView.callUnloaded();
        }
    }

    public onPostResume(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('FloatingActivity.onPostResume();', Trace.categories.NativeLifecycle);
        }
    }

    public onDestroy(activity: any, superFunc: Function): void {
        try {
            if (Trace.isEnabled()) {
                Trace.write('FloatingActivity.onDestroy();', Trace.categories.NativeLifecycle);
            }

            const rootView = this._rootView;
            if (rootView) {
                rootView._tearDownUI(true);
            }

            // const exitArgs = { eventName: Application.exitEvent, object: Application.android, android: activity };
            // Application.notify(exitArgs);
        } catch (error) {
            console.error(error, error.stack);
        } finally {
            superFunc.call(activity);
        }
    }

    public onBackPressed(activity: any, superFunc: Function): void {
        if (Trace.isEnabled()) {
            Trace.write('FloatingActivity.onBackPressed;', Trace.categories.NativeLifecycle);
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
            Trace.write('FloatingActivity.onRequestPermissionsResult;', Trace.categories.NativeLifecycle);
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
            Trace.write(`FloatingActivity.onActivityResult(${requestCode}, ${resultCode}, ${data})`, Trace.categories.NativeLifecycle);
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
        // Delete previously cached root view in order to recreate it.
        this._rootView = null;
        this.setActivityContent(activity, null, false, null);
        this._rootView.callLoaded();
    }

    // Paths that go trough this method:
    // 1. Application initial start - there is no rootView in callbacks.
    // 2. Application revived after Activity is destroyed. this._rootView should have been restored by id in onCreate.
    // 3. Livesync if rootView has no custom _onLivesync. this._rootView should have been cleared upfront. Launch event should not fired
    // 4. _resetRootView method. this._rootView should have been cleared upfront. Launch event should not fired
    private async setActivityContent(activity: androidx.appcompat.app.AppCompatActivity, savedInstanceState: android.os.Bundle, fireLaunchEvent: boolean, intent: android.content.Intent) {
        let rootView = this._rootView;
        DEV_LOG && console.log('setActivityContent');
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
            //ensure theme is started
            startThemeHelper(true);
            onInitRootView(true);
            const uri = intent.getData();
            const lat = parseFloat(uri.getQueryParameter('lat'));
            const lon = parseFloat(uri.getQueryParameter('lon'));
            if (isNaN(lat) || isNaN(lon)) {
                android.widget.Toast.makeText(Utils.android.getApplicationContext(), 'wrong_parameters', android.widget.Toast.LENGTH_LONG);
                activity.finish();
                return;
            }
            const name = uri.getQueryParameter('name');
            const address = JSON.parse(uri.getQueryParameter('address') || '{}');
            const BottomSheetWeatherPage = (await import('~/components/BottomSheetWeatherPage.svelte')).default;
            await showBottomSheet({
                parent: rootView,
                view: BottomSheetWeatherPage,
                peekHeight: 600,
                // skipCollapsedState: isLandscape(),
                dismissOnBackgroundTap: true,
                dismissOnDraggingDownSheet: true,
                props: {
                    weatherLocation: {
                        name,
                        coord: { lat, lon },
                        sys: { ...address, name }
                    } as WeatherLocation,
                    name
                }
            });
        } catch (err) {
            console.error('error retreiving data', err, err.stack);
        } finally {
            // timeout to let the bottomsheet hide animation go
            setTimeout(() => {
                activity.finishAndRemoveTask();
            }, 300);
        }
    }
}

@JavaProxy('__PACKAGE__.FloatingActivity')
@NativeClass
class Activity extends androidx.appcompat.app.AppCompatActivity {
    isFloatingActivity: boolean;
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
        // we still ensure the app is good.
        // wont do anything is already done
        Application.android.init(this.getApplication());

        // Set isFloatingActivity in onCreate.
        this.isFloatingActivity = false;

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
        this._callbacks.onRequestPermissionsResult(this, requestCode, permissions, grantResults, undefined /*TODO: Enable if needed*/);
    }

    public onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
        this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
    }
}
