import { capitalize, l, lc, loadLocaleJSON, lt, lu, overrideNativeLocale, titlecase } from '@nativescript-community/l';
import { Application, ApplicationSettings, Device, File, Utils } from '@nativescript/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import Timezone from 'dayjs/plugin/timezone';
import { derived, get, writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
import { showError } from '@shared/utils/showError';
import { showAlertOptionSelect } from '~/utils/ui';
import { createGlobalEventListener, globalObservable } from '@shared/utils/svelte/ui';
import { DEFAULT_LOCALE, SETTINGS_IMPERIAL, SETTINGS_LANGUAGE } from './constants';
import { imperialUnits } from '~/variables';
import { getISO3Language } from '@akylas/nativescript-app-utils';
const supportedLanguages = SUPPORTED_LOCALES;
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(LocalizedFormat);
dayjs.extend(utc);
dayjs.extend(Timezone);
export let lang;
export const $lang = writable(null);
let default24Clock = false;
if (__ANDROID__) {
    default24Clock = android.text.format.DateFormat.is24HourFormat(Utils.android.getApplicationContext());
}
export let clock_24 = ApplicationSettings.getBoolean('clock_24', default24Clock) || default24Clock;
export const clock_24Store = writable(null);

export const onLanguageChanged = createGlobalEventListener(SETTINGS_LANGUAGE);
export const onTimeChanged = createGlobalEventListener('time');

async function loadDayjsLang(newLang: string) {
    const toLoad = newLang.replace('_', '-');
    try {
        await import(`dayjs/locale/${toLoad}.js`);
        dayjs.locale(toLoad);
        DEV_LOG && console.log('dayjs loaded', toLoad, dayjs().format('llll'));
    } catch (err) {
        if (toLoad.indexOf('-') !== -1) {
            loadDayjsLang(toLoad.split('-')[0]);
        } else {
            DEV_LOG && console.error(lang, `~/dayjs/${toLoad}`, err, err.stack);
        }
    }
}

$lang.subscribe((newLang: string) => {
    lang = newLang;
    if (!lang) {
        return;
    }
    DEV_LOG && console.log('changed lang', lang, Device.region);
    loadDayjsLang(lang);
    try {
        // const localeData = require(`~/i18n/${lang}.json`);
        loadLocaleJSON(`~/i18n/${lang}.json`, `~/i18n/${FALLBACK_LOCALE}.json`);
    } catch (err) {
        console.error(lang, `~/i18n/${lang}.json`, File.exists(`~/i18n/${lang}.json`), err, err.stack);
    }
    globalObservable.notify({ eventName: SETTINGS_LANGUAGE, data: lang });
});
function setLang(newLang) {
    let actualNewLang = getActualLanguage(newLang);
    DEV_LOG && console.log('setLang', newLang, actualNewLang);
    if (__IOS__) {
        overrideNativeLocale(actualNewLang);
        currentLocale = null;
    } else {
        // Application.android.foregroundActivity?.recreate();
        try {
            let appLocale: androidx.core.os.LocaleListCompat;
            if (newLang === 'auto') {
                appLocale = androidx.core.os.LocaleListCompat.getEmptyLocaleList();
            } else {
                const langs = [...new Set([actualNewLang, actualNewLang.split('_')[0]])].join(',');
                DEV_LOG && console.log('forLanguageTags', langs);
                appLocale = androidx.core.os.LocaleListCompat.forLanguageTags(langs);
                const strLangTags = appLocale
                    .toLanguageTags()
                    .split(',')
                    .filter((s) => s !== 'und');
                if (strLangTags.length !== appLocale.size()) {
                    appLocale = androidx.core.os.LocaleListCompat.forLanguageTags(strLangTags.join(','));
                }
            }
            DEV_LOG && console.log('appLocale', appLocale.toLanguageTags(), actualNewLang);
            // Call this on the main thread as it may require Activity.restart()
            androidx.appcompat.app.AppCompatDelegate['setApplicationLocales'](appLocale);
            currentLocale = null;
            // TODO: check why getEmptyLocaleList does not reset the locale to system
            actualNewLang = getActualLanguage(newLang);
        } catch (error) {
            console.error(error);
        }
    }
    $lang.set(actualNewLang);
}

const deviceLanguage = ApplicationSettings.getString(SETTINGS_LANGUAGE, DEFAULT_LOCALE);
function getActualLanguage(language) {
    if (language === 'auto') {
        if (__ANDROID__) {
            // N Device.language reads app config which thus does return locale app language and not device language
            language = java.util.Locale.getDefault().getLanguage();
        } else {
            language = Device.language;
        }
    }
    switch (language) {
        // case 'cs':
        //     language = 'cz';
        //     break;
        case 'jp':
            language = 'ja';
            break;
        case 'lv':
            language = 'la';
            break;
    }

    if (supportedLanguages.indexOf(language) === -1) {
        language = language.split('-')[0].toLowerCase();
        if (supportedLanguages.indexOf(language) === -1) {
            language = 'en';
        }
    }
    return language;
}

// const rtf = new Intl.RelativeTimeFormat('es');

export function getLocalTime(timestamp?: number | string | dayjs.Dayjs | Date, timezoneOffset?: number) {
    return timezoneOffset !== undefined ? dayjs.utc(timestamp).utcOffset(timezoneOffset) : dayjs(timestamp);
}

export function getStartOfDay(timestamp?: number | string | dayjs.Dayjs | Date, timezoneOffset?: number) {
    return dayjs.utc(timestamp).utcOffset(timezoneOffset).startOf('d');
}
export function getEndOfDay(timestamp?: number | string | dayjs.Dayjs | Date, timezoneOffset?: number) {
    return dayjs.utc(timestamp).utcOffset(timezoneOffset).endOf('d');
}
export function isSameDay(timestamp1?: number | string | dayjs.Dayjs | Date, timestamp2?: number | string | dayjs.Dayjs | Date, timezoneOffset?: number) {
    return dayjs.utc(timestamp1).utcOffset(timezoneOffset).isSame(dayjs.utc(timestamp2).utcOffset(timezoneOffset), 'd');
}

export function formatDate(date: number | string | dayjs.Dayjs | Date, formatStr: string = 'dddd LT', timezoneOffset?: number) {
    if (date) {
        if (!date['format']) {
            date = getLocalTime(date, timezoneOffset);
        }

        if (clock_24 && formatStr.indexOf('LT') >= 0) {
            formatStr.replace(/LT/g, 'HH:mm');
        } else if (clock_24 && formatStr.indexOf('LTS') >= 0) {
            // formatStr = 'HH:mm:ss';
            formatStr.replace(/LTS/g, 'HH:mm:ss');
        }
        return capitalize((date as dayjs.Dayjs).format(formatStr));
    }
    return '';
}
export function formatTime(date: number | dayjs.Dayjs | string | Date, formatStr: string = 'LT', timezoneOffset?: number) {
    if (date) {
        if (!date['format']) {
            date = getLocalTime(date, timezoneOffset);
        }
        if (clock_24 && formatStr === 'LT') {
            formatStr = 'HH:mm';
        } else if (clock_24 && formatStr === 'LTS') {
            formatStr = 'HH:mm:ss';
        }
        return (date as dayjs.Dayjs).format(formatStr);
    }
    return '';
}

prefs.on(`key:${SETTINGS_LANGUAGE}`, () => {
    const newLanguage = ApplicationSettings.getString(SETTINGS_LANGUAGE, DEFAULT_LOCALE);
    DEV_LOG && console.log('language changed', newLanguage);
    // on pref change we are updating
    if (newLanguage === lang) {
        return;
    }
    setLang(newLanguage);
});

prefs.on('key:clock_24', () => {
    const newValue = ApplicationSettings.getBoolean('clock_24', default24Clock);
    // DEV_LOG && console.log('clock_24 changed', newValue);
    clock_24 = newValue;
    clock_24Store.set(newValue);
    // we fake a language change to update the UI
    globalObservable.notify({ eventName: SETTINGS_IMPERIAL, data: imperialUnits });
});

let currentLocale: any = null;
export function getLocaleDisplayName(locale?, canReturnEmpty = false) {
    if (__IOS__) {
        if (!currentLocale) {
            currentLocale = NSLocale.alloc().initWithLocaleIdentifier(lang);
        }
        const localeStr = (currentLocale as NSLocale).displayNameForKeyValue(NSLocaleIdentifier, locale || lang);
        return localeStr ? capitalize(localeStr) : canReturnEmpty ? undefined : locale || lang;
    } else {
        if (!currentLocale) {
            currentLocale = java.util.Locale.forLanguageTag(lang);
        }
        return capitalize(java.util.Locale.forLanguageTag(locale || lang).getDisplayName(currentLocale as java.util.Locale));
    }
}
export function getCurrentISO3Language() {
    return getISO3Language(lang);
}
async function internalSelectLanguage() {
    // try {
    const actions = SUPPORTED_LOCALES;
    const currentLanguage = ApplicationSettings.getString(SETTINGS_LANGUAGE, DEFAULT_LOCALE);
    let selectedIndex = -1;
    const options = [{ name: lc('auto'), data: 'auto' }].concat(actions.map((k) => ({ name: getLocaleDisplayName(k.replace('_', '-')), data: k }))).map((d, index) => {
        const selected = currentLanguage === d.data;
        if (selected) {
            selectedIndex = index;
        }
        return {
            ...d,
            boxType: 'circle',
            type: 'checkbox',
            value: selected
        };
    });
    return showAlertOptionSelect(
        {
            height: Math.min(actions.length * 56, 400),
            rowHeight: 56,
            selectedIndex,
            options
        },
        {
            title: lc('select_language')
        }
    );
}
export async function selectLanguage() {
    try {
        const result = await internalSelectLanguage();
        DEV_LOG && console.log('selectLanguage', result);
        if (result?.data) {
            ApplicationSettings.setString(SETTINGS_LANGUAGE, result.data);
        }
    } catch (err) {
        showError(err);
    }
}

// TODO: on android 13 check for per app language, we dont need to store it
setLang(deviceLanguage);

if (__ANDROID__) {
    Application.android.on(Application.android.activityStartedEvent, () => {
        // on android after switching to auto we dont get the actual language
        // before an activity restart
        const lang = ApplicationSettings.getString(SETTINGS_LANGUAGE, DEFAULT_LOCALE);
        if (lang === 'auto') {
            const actualNewLang = getActualLanguage(lang);
            if (actualNewLang !== get($lang)) {
                $lang.set(actualNewLang);
            }
        }
    });
}

export { l, lc, lt, lu };
export const sl = derived([$lang], () => l);
export const slc = derived([$lang], () => lc);
export const slt = derived([$lang], () => lt);
export const slu = derived([$lang], () => lu);
// export const sconvertDuration = derived([$lang], () => convertDuration);
export const scformatDate = derived($lang, () => formatDate);
export const scformatTime = derived([$lang, clock_24Store], () => formatTime);
export const sgetLocaleDisplayName = derived([$lang], () => getLocaleDisplayName);
