import { ApplicationSettings } from '@nativescript/core';
import { SETTINGS_COLOR_THEME } from '@shared/constants';
import { DEFAULT_COLOR_THEME } from '~/helpers/constants';

// @shared defaults to the dynamic colors on android and reads it as soon as its theme module loads:
// seed the app default before that (first import of main.ts)
if (!ApplicationSettings.hasKey(SETTINGS_COLOR_THEME)) {
    ApplicationSettings.setString(SETTINGS_COLOR_THEME, DEFAULT_COLOR_THEME);
}
