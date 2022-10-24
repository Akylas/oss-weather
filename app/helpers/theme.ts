import Theme from '@nativescript-community/css-theme';
import { Application, Utils } from '@nativescript/core';
import { getBoolean, getString, setString } from '@nativescript/core/application-settings';
import { iOSNativeHelper } from '@nativescript/core/utils';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable, updateThemeColors } from '~/variables';

export type Themes = 'auto' | 'light' | 'dark' | 'black';

export const onThemeChanged = createGlobalEventListener('theme');
export let theme: Themes;

let started = false;
const autoDarkToBlack = getBoolean('auto_black', false);
const ThemeBlack = 'ns-black';

Application.on(Application.systemAppearanceChangedEvent, (event) => {
    if (theme === 'auto') {
        let theme = event.newValue;
        if (autoDarkToBlack && theme === 'dark') {
            theme = 'black';
        }
        updateThemeColors(theme);
        globalObservable.notify({ eventName: 'theme', data: theme });
    }
});

export function applyTheme(theme: Themes) {
    const AppCompatDelegate = __ANDROID__ ? androidx.appcompat.app.AppCompatDelegate : undefined;
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
}

function getRealTheme(theme) {
    if (theme === 'auto') {
        try {
            theme = Application.systemAppearance();
            if (autoDarkToBlack && theme === 'dark') {
                theme = 'black';
            }
        } catch (err) {
            console.error('updateThemeColors', err);
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
        if (theme === 'auto') {
            const realTheme = getRealTheme(theme);
            updateThemeColors(realTheme);
            globalObservable.notify({ eventName: 'theme', data: realTheme });
        }
    });

    prefs.on('key:theme', () => {
        let newTheme = getString('theme') as Themes;
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
    });
    const realTheme = getRealTheme(theme);
    if (__ANDROID__) {
        applyTheme(theme);
        const context = Utils.ad.getApplicationContext();
        if (context) {
            updateThemeColors(realTheme);
        } else {
            Application.on(Application.launchEvent, () => updateThemeColors(realTheme));
        }
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
