import Theme from '@nativescript-community/css-theme';
import { Application } from '@nativescript/core';
import { getString, setString } from '@nativescript/core/application-settings';
import { iOSNativeHelper } from '@nativescript/core/utils';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable, updateThemeColors } from '~/variables';

export type Themes = 'auto' | 'light' | 'dark' | 'black';

export const onThemeChanged = createGlobalEventListener('theme');

Application.on(Application.systemAppearanceChangedEvent, (event) => {
    if (theme === 'auto') {
        updateThemeColors(event.newValue);
        globalObservable.notify({ eventName: 'theme', data: event.newValue });
    }
});

const ThemeBlack = 'ns-black';
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

export let theme: Themes;

let started = false;
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
        // sTheme.set(newTheme);
        applyTheme(newTheme);
        updateThemeColors(newTheme, newTheme !== 'auto');
        globalObservable.notify({ eventName: 'theme', data: theme });
    });
    const force = theme !== 'auto';
    if (__ANDROID__) {
        applyTheme(theme);
        if (Application.android && Application.android.context) {
            updateThemeColors(theme, force);
        } else {
            Application.on(Application.launchEvent, () => updateThemeColors(theme, force));
        }
    } else {
        if (Application.ios && Application.ios.window) {
            applyTheme(theme);
            updateThemeColors(theme, force);
        } else {
            updateThemeColors(theme, force);
            Application.on(Application.displayedEvent, () => {
                applyTheme(theme);
                updateThemeColors(theme, force);
            });
        }
    }
}
