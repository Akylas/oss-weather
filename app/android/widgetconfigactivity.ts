import { AndroidActivityCallbacks, Application, Frame, Utils, setActivityCallbacks } from '@nativescript/core';
import { showModal } from '@shared/utils/svelte/ui';

const TAG = '[WidgetConfActivity]';
@NativeClass()
@JavaProxy('__PACKAGE__.WidgetConfActivity')
export class WidgetConfActivity extends androidx.appcompat.app.AppCompatActivity {
    public isNativeScriptActivity;

    private _callbacks: AndroidActivityCallbacks;
    private widgetId: number = -1;
    private widgetClass: string = '';

    public onCreate(savedInstanceState: android.os.Bundle): void {
        DEV_LOG && console.log(TAG, 'onCreate');
        Application.android.init(this.getApplication());
        // Set the isNativeScriptActivity in onCreate (as done in the original NativeScript activity code)
        // The JS constructor might not be called because the activity is created from Android.
        this.isNativeScriptActivity = true;
        if (!this._callbacks) {
            setActivityCallbacks(this);
        }

        // Parse widget ID from intent
        const intent = this.getIntent();
        if (intent) {
            const extras = intent.getExtras();
            if (extras) {
                this.widgetId = extras.getInt(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID, android.appwidget.AppWidgetManager.INVALID_APPWIDGET_ID);
                this.widgetClass = extras.getString('widget_class') || '';
                DEV_LOG && console.log(TAG, 'Widget ID:', this.widgetId, 'Widget Class:', this.widgetClass);
            }
        }

        this._callbacks.onCreate(this, savedInstanceState, this.getIntent(), super.onCreate);

        // Open ConfigWidget page after activity is created
        if (this.widgetId !== android.appwidget.AppWidgetManager.INVALID_APPWIDGET_ID) {
            this.openConfigWidget();
        }
    }

    private async openConfigWidget() {
        try {
            const ConfigWidget = (await import('~/components/settings/ConfigWidget.svelte')).default;
            const result = await showModal({
                page: ConfigWidget,
                props: {
                    widgetClass: this.widgetClass,
                    widgetId: String(this.widgetId),
                    modalMode: true
                },
                fullscreen: true
            });

            // Set result OK when modal is closed to confirm widget configuration
            const resultIntent = new android.content.Intent();
            resultIntent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID, this.widgetId);
            this.setResult(android.app.Activity.RESULT_OK, resultIntent);
            this.finish();
        } catch (error) {
            console.error(TAG, 'Error opening ConfigWidget:', error);
            // Set result CANCELED on error
            this.setResult(android.app.Activity.RESULT_CANCELED);
            this.finish();
        }
    }

    public onNewIntent(intent: android.content.Intent): void {
        this._callbacks.onNewIntent(this, intent, super.setIntent, super.onNewIntent);
    }

    public onSaveInstanceState(outState: android.os.Bundle): void {
        this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
    }

    public onStart(): void {
        DEV_LOG && console.log(TAG, 'onStart');
        this._callbacks.onStart(this, super.onStart);
    }

    public onStop(): void {
        DEV_LOG && console.log(TAG, 'onStop');
        this._callbacks.onStop(this, super.onStop);
    }

    public onDestroy(): void {
        DEV_LOG && console.log(TAG, 'onDestroy');
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
