import { lc } from '@nativescript-community/l';
import { setString } from '@nativescript/core/application-settings';
import { SDK_VERSION } from '@nativescript/core/utils';
import { ColorThemes, Themes, colorTheme, getColorThemeDisplayName, getThemeDisplayName, theme } from '@shared/helpers/theme';
import { showError } from '@shared/utils/showError';

export * from '@shared/helpers/theme';

// the shared pickers use the classic dialog: these use the app one (modern style), same as the other value pickers
export async function selectTheme() {
    try {
        const { selectValue } = await import('~/utils/ui');
        const actions: Themes[] = ['auto', 'light', 'dark', 'black'];
        const result = await selectValue(
            actions.map((data) => ({ data, title: getThemeDisplayName(data) })),
            theme,
            { title: lc('select_theme') }
        );
        if (result && actions.includes(result)) {
            setString('theme', result);
        }
    } catch (err) {
        showError(err);
    }
}

export async function selectColorTheme() {
    try {
        const { selectValue } = await import('~/utils/ui');
        const actions: ColorThemes[] = ['default', 'eink'];
        if (__ANDROID__ && SDK_VERSION >= 31) {
            actions.push('dynamic');
        }
        const result = await selectValue(
            actions.map((data) => ({ data, title: getColorThemeDisplayName(data) })),
            colorTheme,
            { title: lc('select_color_theme') }
        );
        if (result && actions.includes(result)) {
            setString('color_theme', result);
        }
    } catch (err) {
        showError(err);
    }
}
