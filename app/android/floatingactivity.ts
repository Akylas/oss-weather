import {
    AndroidActivityBackPressedEventData,
    AndroidActivityCallbacks,
    AndroidActivityNewIntentEventData,
    AndroidActivityRequestPermissionsEventData,
    AndroidActivityResultEventData,
    AndroidApplication,
    Application,
    ApplicationEventData,
    Device,
    Frame,
    GridLayout,
    Trace,
    View,
    profile
} from '@nativescript/core';
import { CSSUtils } from '@nativescript/core/css/system-classes';
import { showBottomSheet } from '~/bottomsheet';
import { getFromLocation } from '@nativescript-community/geocoding';
import Theme from '@nativescript-community/css-theme';

const CALLBACKS = '_callbacks';
const ROOT_VIEW_ID_EXTRA = 'com.tns.activity.rootViewId';
const activityRootViewsMap = new Map<number, WeakRef<View>>();
const INTENT_EXTRA = 'com.tns.activity';

declare module '@nativescript/core/ui/core/view' {
    interface View {
        _saveFragmentsState();
        _getFragmentManager();
    }
}
declare module '@nativescript/core/ui/frame' {
    interface AndroidFrame {
        frameId: number;
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

    @profile
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
                eventName: AndroidApplication.activityNewIntentEvent,
                object: Application.android,
                activity,
                intent
            } as AndroidActivityNewIntentEventData);
        }

        this.setActivityContent(activity, savedInstanceState, true, intent);
        moduleLoaded = true;
    }

    @profile
    public onSaveInstanceState(activity: androidx.appcompat.app.AppCompatActivity, outState: android.os.Bundle, superFunc: Function): void {
        superFunc.call(activity, outState);
        const rootView = this._rootView;
        if (rootView instanceof Frame) {
            outState.putInt(INTENT_EXTRA, rootView.android.frameId);
            rootView._saveFragmentsState();
        }

        outState.putInt(ROOT_VIEW_ID_EXTRA, rootView._domId);
    }

    @profile
    public onNewIntent(activity: androidx.appcompat.app.AppCompatActivity, intent: android.content.Intent, superSetIntentFunc: Function, superFunc: Function): void {
        superFunc.call(activity, intent);
        superSetIntentFunc.call(activity, intent);

        Application.android.notify({
            eventName: AndroidApplication.activityNewIntentEvent,
            object: Application.android,
            activity,
            intent
        } as AndroidActivityNewIntentEventData);

        // const data = JSON.parse(intent.getStringExtra('data'));
        // if (this.navEntryInstance) {
        //     const floating = this.navEntryInstance.$children[0] ;
        //     floating.handleFloatingQRData(data);
        // }
    }

    @profile
    public onStart(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('NativeScriptActivity.onStart();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && !rootView.isLoaded) {
            rootView.callLoaded();
        }
    }

    @profile
    public onStop(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('NativeScriptActivity.onStop();', Trace.categories.NativeLifecycle);
        }

        const rootView = this._rootView;
        if (rootView && rootView.isLoaded) {
            rootView.callUnloaded();
        }
    }

    @profile
    public onPostResume(activity: any, superFunc: Function): void {
        superFunc.call(activity);

        if (Trace.isEnabled()) {
            Trace.write('NativeScriptActivity.onPostResume();', Trace.categories.NativeLifecycle);
        }

        // NOTE: activity.onPostResume() is called when activity resume is complete and we can
        // safely raise the Application resume event;
        // onActivityResumed(...) lifecycle callback registered in Application is called too early
        // and raising the Application resume event there causes issues like
        // https://github.com/NativeScript/NativeScript/issues/6708
        if (activity.isNativeScriptActivity) {
            const args = {
                eventName: Application.resumeEvent,
                object: Application.android,
                android: activity
            } as ApplicationEventData;
            Application.notify(args);
            Application.android.paused = false;
        }
    }

    @profile
    public onDestroy(activity: any, superFunc: Function): void {
        try {
            if (Trace.isEnabled()) {
                Trace.write('NativeScriptActivity.onDestroy();', Trace.categories.NativeLifecycle);
            }

            const rootView = this._rootView;
            if (rootView) {
                rootView._tearDownUI(true);
            }

            const exitArgs = { eventName: Application.exitEvent, object: Application.android, android: activity };
            Application.notify(exitArgs);
        } finally {
            superFunc.call(activity);
        }
    }

    @profile
    public onBackPressed(activity: any, superFunc: Function): void {
        if (Trace.isEnabled()) {
            Trace.write('NativeScriptActivity.onBackPressed;', Trace.categories.NativeLifecycle);
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

    @profile
    public onRequestPermissionsResult(activity: any, requestCode: number, permissions: String[], grantResults: number[], superFunc: Function): void {
        if (Trace.isEnabled()) {
            Trace.write('NativeScriptActivity.onRequestPermissionsResult;', Trace.categories.NativeLifecycle);
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

    @profile
    public onActivityResult(activity: any, requestCode: number, resultCode: number, data: android.content.Intent, superFunc: Function): void {
        superFunc.call(activity, requestCode, resultCode, data);
        if (Trace.isEnabled()) {
            Trace.write(`NativeScriptActivity.onActivityResult(${requestCode}, ${resultCode}, ${data})`, Trace.categories.NativeLifecycle);
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
        if (!rootView) {
            rootView = new GridLayout();
            this._rootView = rootView;

            activityRootViewsMap.set(rootView._domId, new WeakRef(rootView));

            // const deviceType = Device.deviceType.toLowerCase();
            // CSSUtils.pushToSystemCssClasses(`${CSSUtils.CLASS_PREFIX}${gVars.platform}`);
            // CSSUtils.pushToSystemCssClasses(`${CSSUtils.CLASS_PREFIX}${deviceType}`);
            // CSSUtils.pushToSystemCssClasses(`${CSSUtils.CLASS_PREFIX}${Application.android.orientation}`);
            // CSSUtils.pushToSystemCssClasses(`${CSSUtils.CLASS_PREFIX}${Application.android.systemAppearance}`);
            // this._rootView.cssClasses.add(CSSUtils.ROOT_VIEW_CSS_CLASS);
            const rootViewCssClasses = CSSUtils.getSystemCssClasses();
            rootViewCssClasses.forEach((c) => this._rootView.cssClasses.add(c));
            // console.log('theme', Theme.getMode(), Application.android.systemAppearance, rootViewCssClasses, Array.from(this._rootView.cssClasses), this._rootView);
        }

        // setup view as styleScopeHost
        rootView._setupAsRootView(activity);

        activity.setContentView(rootView.nativeViewProtected, new org.nativescript.widgets.CommonLayoutParams());

        try {
            const uri = intent.getData();
            const lat = parseFloat(uri.getQueryParameter('lat'));
            const lon = parseFloat(uri.getQueryParameter('lon'));
            let name = uri.getQueryParameter('name');
            if (isNaN(lat) || isNaN(lon)) {
                android.widget.Toast.makeText(Application.android.context, 'wrong_parameters', android.widget.Toast.LENGTH_LONG);
                activity.finish();
                return;
            }
            if (!name || name.length === 0) {
                name = lat.toFixed(2) + ',' + lon.toFixed(2);
            }
            try {
                const results = await getFromLocation(lat, lon, 10);
                if (results?.length > 0) {
                    name = results[0].name;
                }
            } catch (err) {
                console.log('geocoding error', err);
            }
            const BottomSheetWeatherPage = (await import('~/BottomSheetWeatherPage.svelte')).default;
            await showBottomSheet({
                parent: rootView,
                view: BottomSheetWeatherPage,
                dismissOnBackgroundTap: true,
                dismissOnDraggingDownSheet: true,
                props: {
                    weatherLocation: {
                        coord: { lat, lon },
                        name
                    }
                }
            });
        } catch (err) {
            console.error('error retreiving data', err);
        } finally {
            activity.finish();
        }
    }
}

@JavaProxy('com.akylas.weather.FloatingActivity')
@NativeClass
class Activity extends androidx.appcompat.app.AppCompatActivity {
    isNativeScriptActivity: boolean;
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

        // Set isNativeScriptActivity in onCreate.
        this.isNativeScriptActivity = false;

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
