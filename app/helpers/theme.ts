import { getString } from '@nativescript/core/application-settings';
export type Themes = 'auto' | 'light' | 'dark' | 'black';
import { Device } from '@nativescript/core/platform';
import Theme from '@nativescript-community/css-theme';

import { prefs } from '~/services/preferences';
import { android as androidApp, ios as iosApp, on as onApp, systemAppearance } from '@nativescript/core/application';
import { updateThemeColors } from '~/variables';

const ThemeBlack = 'ns-black';
export function applyTheme(theme: Themes) {
    const AppCompatDelegate = global.isAndroid ? androidx.appcompat.app.AppCompatDelegate : undefined;
    const window = global.isIOS ? iosApp.window : undefined;
    console.log('applyTheme', theme);
    switch (theme) {
        case 'auto':
            Theme.setMode(Theme.Auto);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Unspecified;
            }
            break;
        case 'light':
            Theme.setMode(Theme.Light);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Light;
            }
            break;
        case 'dark':
            Theme.setMode(Theme.Dark);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
        case 'black':
            Theme.setMode(ThemeBlack);
            if (global.isAndroid) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                window.overrideUserInterfaceStyle = UIUserInterfaceStyle.Dark;
            }
            break;
    }
}

export let theme: Themes;
if (global.isIOS) {
    const sdkVersion = Device.sdkVersion;
    if (parseFloat(sdkVersion) >= 13) {
        theme = getString('theme', 'dark') as Themes;
    } else {
        theme = 'light';
    }
} else {
    theme = getString('theme', 'dark') as Themes;
}

prefs.on('key:theme', () => {
    const newTheme = getString('theme') as Themes;
    // on pref change we are updating
    if (newTheme === theme) {
        return;
    }
    console.log('theme change', theme, newTheme);
    theme = newTheme;
    applyTheme(newTheme);
    updateThemeColors(newTheme);
    if (global.isAndroid) {
        // we recreate the activity to get the change
        const activity = androidApp.startActivity as androidx.appcompat.app.AppCompatActivity;
        activity.recreate();
    }
});
