import Theme from '@nativescript-community/css-theme';
import { Application } from '@nativescript/core';
import { getString, setString } from '@nativescript/core/application-settings';
import { iOSNativeHelper } from '@nativescript/core/utils';
import { get_current_component } from 'svelte/internal';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable, updateThemeColors } from '~/variables';

export type Themes = 'auto' | 'light' | 'dark' | 'black';

export const onThemeChanged = createGlobalEventListener('theme');

Application.on(Application.systemAppearanceChangedEvent, (event) => {
    // console.log('systemAppearanceChangedEvent', theme, event.newValue);
    if (theme === 'auto') {
        updateThemeColors(event.newValue);
        globalObservable.notify({ eventName: 'theme', data: event.newValue });
    }
});

const ThemeBlack = 'ns-black';
export function applyTheme(theme: Themes) {
    const AppCompatDelegate = global.isAndroid ? androidx.appcompat.app.AppCompatDelegate : undefined;
    // console.log('applyTheme', theme);
    switch (theme) {
        case 'auto':
            Theme.setMode(Theme.Auto);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            } else {
                if (Application.ios.window) {
                    (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Unspecified;
                }
            }
            break;
        case 'light':
            Theme.setMode(Theme.Light);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                if (Application.ios.window) {
                    (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Light;
                }
            }
            break;
        case 'dark':
            Theme.setMode(Theme.Dark);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                if (Application.ios.window) {
                    (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
                }
            }
            break;
        case 'black':
            Theme.setMode(ThemeBlack);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                if (Application.ios.window) {
                    (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
                }
            }
            break;
    }
}

export let theme: Themes;

export function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setString('theme', newTheme);
}

let started = false;
export function start() {
    if (started) {
        return;
    }
    started = true;
    if (global.isIOS && iOSNativeHelper.MajorVersion < 13) {
        theme = 'light';
    } else {
        theme = (getString('theme', DEFAULT_THEME) || 'auto') as Themes;
    }

    prefs.on('key:theme', () => {
        let newTheme = getString('theme') as Themes;
        // console.log('key:theme', newTheme);
        if (global.isIOS && iOSNativeHelper.MajorVersion < 13) {
            newTheme = 'light';
        }
        // on pref change we are updating
        if (newTheme === theme) {
            return;
        }

        theme = newTheme;

        applyTheme(newTheme);
        updateThemeColors(newTheme, newTheme !== 'auto');
        globalObservable.notify({ eventName: 'theme', data: theme });
    });
    if (global.isAndroid) {
        updateThemeColors(theme, theme !== 'auto');
        if (Application.android && Application.android.context) {
            applyTheme(theme);
        } else {
            Application.on(Application.launchEvent, () => {
                updateThemeColors(theme, theme !== 'auto');
                applyTheme(theme);
            });
        }
    } else {
        updateThemeColors(theme, theme !== 'auto');
        if (Application.ios && Application.ios.window) {
            applyTheme(theme);
        } else {
            Application.on(Application.displayedEvent, () => {
                updateThemeColors(theme, theme !== 'auto');
                applyTheme(theme);
            });
        }
    }
}
