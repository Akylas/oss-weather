import { getRootView } from '@akylas/nativescript/application';
import Theme from '@nativescript-community/css-theme';
import { Application, EventData, Utils } from '@nativescript/core';
import { getBoolean, getString, setString } from '@nativescript/core/application-settings';
import { iOSNativeHelper } from '@nativescript/core/utils';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable, updateThemeColors } from '~/variables';

export type Themes = 'auto' | 'light' | 'dark' | 'black';

export const onThemeChanged = createGlobalEventListener('theme');
export let theme: Themes;

let started = false;
let autoDarkToBlack = getBoolean('auto_black', false);
const ThemeBlack = 'ns-black';

Application.on(Application.systemAppearanceChangedEvent, (event: EventData & { newValue }) => {
    DEV_LOG && console.log('systemAppearanceChangedEvent', theme, event.newValue, autoDarkToBlack);
    if (theme === 'auto') {
        let theme = event.newValue;
        if (autoDarkToBlack && theme === 'dark') {
            theme = 'black';
        }
        updateThemeColors(theme);
        globalObservable.notify({ eventName: 'theme', data: theme });
    }
});

const AppCompatDelegate = __ANDROID__ ? androidx.appcompat.app.AppCompatDelegate : undefined;
export function applyTheme(theme: Themes) {
    try {
        DEV_LOG && console.log('applyTheme', theme);
        switch (theme) {
            case 'auto':
                Theme.setMode(Theme.Auto);
                if (__ANDROID__) {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
                } else {
                    if (Application.ios.window) {
                        //@ts-ignore
                        (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Unspecified;
                    }
                }
                break;
            case 'light':
                Theme.setMode(Theme.Light);
                if (__ANDROID__) {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
                } else {
                    if (Application.ios.window) {
                        //@ts-ignore
                        (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Light;
                    }
                }
                break;
            case 'dark':
                Theme.setMode(Theme.Dark);
                if (__ANDROID__) {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
                } else {
                    if (Application.ios.window) {
                        //@ts-ignore
                        (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
                    }
                }
                break;
            case 'black':
                Theme.setMode(ThemeBlack);
                if (__ANDROID__) {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
                } else {
                    if (Application.ios.window) {
                        //@ts-ignore
                        (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
                    }
                }
                break;
        }
    } catch (error) {
        console.error('applyTheme', error, error.stack);
    }
}

function getSystemAppearance() {
    if (typeof Application.systemAppearance === 'function') {
        return Application.systemAppearance();
    }
    return Application.systemAppearance;
}

function getRealTheme(theme) {
    DEV_LOG && console.log('getRealTheme', theme);
    if (theme === 'auto') {
        try {
            theme = getSystemAppearance();
            DEV_LOG && console.log('getSystemAppearance', theme);
            if (autoDarkToBlack && theme === 'dark') {
                theme = 'black';
            }
        } catch (err) {
            console.error('getRealTheme', err, err.stack);
        }
    }
    return theme;
}

export function start() {
    if (started) {
        return;
    }
    started = true;
    if (__IOS__ && iOSNativeHelper.MajorVersion < 13) {
        theme = 'light';
    } else {
        theme = getString('theme', DEFAULT_THEME) as Themes;
    }
    if (theme.length === 0) {
        theme = DEFAULT_THEME as Themes;
    }

    prefs.on('key:auto_black', () => {
        autoDarkToBlack = getBoolean('auto_black');
        DEV_LOG && console.log('key:auto_black', theme, autoDarkToBlack);
        if (theme === 'auto') {
            const realTheme = getRealTheme(theme);
            updateThemeColors(realTheme);
            globalObservable.notify({ eventName: 'theme', data: realTheme });
        }
    });

    prefs.on('key:theme', () => {
        let newTheme = getString('theme') as Themes;
        DEV_LOG && console.log('key:theme', theme, newTheme, autoDarkToBlack);
        if (__IOS__ && iOSNativeHelper.MajorVersion < 13) {
            newTheme = 'light';
        }
        // on pref change we are updating
        if (newTheme === theme) {
            return;
        }

        theme = newTheme;
        applyTheme(newTheme);
        const realTheme = getRealTheme(newTheme);
        updateThemeColors(realTheme);
        globalObservable.notify({ eventName: 'theme', data: realTheme });
        // if (__ANDROID__) {
        //     // we recreate the activity to get the change
        //     const activity = Application.android.startActivity as androidx.appcompat.app.AppCompatActivity;
        //     activity.recreate();
        //     if (Application.android.foregroundActivity !== activity) {
        //         (Application.android.foregroundActivity as androidx.appcompat.app.AppCompatActivity).recreate();
        //     }
        // }
    });
    const realTheme = getRealTheme(theme);
    if (__ANDROID__) {
        const context = Utils.ad.getApplicationContext();
        if (context) {
            applyTheme(theme);
        } else {
            Application.on(Application.launchEvent, () => {
                applyTheme(theme);
                updateThemeColors(realTheme);
            });
        }
        updateThemeColors(realTheme);
    } else {
        if (Application.ios && Application.ios.window) {
            applyTheme(theme);
            updateThemeColors(realTheme);
        } else {
            updateThemeColors(realTheme);
            Application.on(Application.displayedEvent, () => {
                applyTheme(theme);
                updateThemeColors(realTheme);
            });
        }
    }
}
