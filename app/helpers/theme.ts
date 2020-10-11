import { getString, setString } from '@akylas/nativescript/application-settings';
import { iOSNativeHelper } from '@akylas/nativescript/utils';
import Theme from '@nativescript-community/css-theme';
import { Application } from '@nativescript/core';
import { prefs } from '~/services/preferences';
import { updateThemeColors } from '~/variables';

export type Themes = 'auto' | 'light' | 'dark' | 'black';

Application.on(Application.systemAppearanceChangedEvent, (event) => {
    updateThemeColors(theme);
});

const ThemeBlack = 'ns-black';
export function applyTheme(theme: Themes) {
    const AppCompatDelegate = global.isAndroid ? androidx.appcompat.app.AppCompatDelegate : undefined;
    switch (theme) {
        case 'auto':
            Theme.setMode(Theme.Auto);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            } else {
                (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Unspecified;
            }
            break;
        case 'light':
            Theme.setMode(Theme.Light);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Light;
            }
            break;
        case 'dark':
            Theme.setMode(Theme.Dark);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
        case 'black':
            Theme.setMode(ThemeBlack);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                (Application.ios.window as UIWindow).overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
    }
}

export let theme: Themes;

export function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setString('theme', newTheme);
}

export function start() {
    if (global.isIOS) {
        if (iOSNativeHelper.MajorVersion >= 13) {
            theme = getString('theme', 'auto') as Themes;
        } else {
            theme = 'light';
        }
    } else {
        theme = getString('theme', 'dark') as Themes;
    }

    prefs.on('key:theme', () => {
        let newTheme = getString('theme') as Themes;
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

        // android activity will be restarted
    });

    applyTheme(theme);
    updateThemeColors(theme, theme !== 'auto');
}
