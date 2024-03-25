declare namespace com {
    export namespace tns {
        export class NativeScriptException {
            static getStackTraceAsString(ex): String;
        }
    }
}

declare namespace com {
    export namespace akylas {
        export namespace weather {
            class Utils {
                static applyDayNight(context: android.content.Context, applyDynamicColors: boolean);
                static applyDynamicColors(context: android.content.Context);
                static getDimensionFromInt(context: android.content.Context, intToGet);
                static getColorFromInt(context: android.content.Context, intToGet);
                static getColorFromName(context: android.content.Context, intToGet);
                static restartApp(context: android.content.Context, activity: android.app.Activity);
                static getSystemLocale(): java.util.Locale;
            }
        }
    }
}
