import { capitalize, l, lc, loadLocaleJSON, lt, lu, overrideNativeLocale } from '@nativescript-community/l';
import { getString, setString } from '@nativescript/core/application-settings';
import { Application, Device } from '@nativescript/core';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { derived, writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable } from '~/variables';
import { titlecase } from './formatter';
const supportedLanguages = SUPPORTED_LOCALES;
dayjs.extend(LocalizedFormat);

export let lang;
export const $lang = writable(null);

export const onLanguageChanged = createGlobalEventListener('language');

$lang.subscribe((newLang: string) => {
    lang = newLang;
    if (!lang) {
        return;
    }
    // console.log('changed lang', lang, Device.region);
    try {
        require(`dayjs/locale/${newLang}`);
    } catch (err) {
        console.error('failed to load dayjs locale', lang, `dayjs/locale/${newLang}`, err);
    }
    dayjs.locale(lang); // switch back to default English locale globally
    try {
        const localeData = require(`~/i18n/${lang}.json`);
        loadLocaleJSON(localeData);
    } catch (err) {
        console.error('failed to load lang json', lang, `~/i18n/${lang}.json`, err);
    }
    globalObservable.notify({ eventName: 'language', data: lang });
});
function setLang(newLang) {
    newLang = getActualLanguage(newLang);
    if (supportedLanguages.indexOf(newLang) === -1) {
        newLang = 'en';
    }
    if (__IOS__) {
        overrideNativeLocale(newLang);
    } else {
        // Application.android.foregroundActivity?.recreate();
        const appLocale = androidx.core.os.LocaleListCompat.forLanguageTags(newLang);
        // Call this on the main thread as it may require Activity.restart()
        androidx.appcompat.app.AppCompatDelegate['setApplicationLocales'](appLocale);
    }
    $lang.set(newLang);
}

const deviceLanguage = getString('language', DEFAULT_LOCALE);
function getActualLanguage(language) {
    if (language === 'auto') {
        language = Device.language;
    }
    language = language.split('-')[0].toLowerCase();
    switch (language) {
        case 'en':
            return 'en';
        case 'cs':
            return 'cz';
        case 'jp':
            return 'ja';
        case 'kr':
            return 'kr';
        case 'lv':
            return 'la';
        default:
            return language;
    }
}

// const rtf = new Intl.RelativeTimeFormat('es');

export function convertTime(date: number | string | dayjs.Dayjs, formatStr: string) {
    if (date) {
        if (!date['format']) {
            date = dayjs(date);
        }
        return capitalize((date as dayjs.Dayjs).format(formatStr));
    }
    return '';
}

prefs.on('key:language', () => {
    const newLanguage = getString('language');
    DEV_LOG && console.log('language changed', newLanguage);
    // on pref change we are updating
    if (newLanguage === lang) {
        return;
    }
    setLang(newLanguage);
});

let currentLocale = null;
export function getLocaleDisplayName(locale?) {
    if (__IOS__) {
        if (!currentLocale) {
            //@ts-ignore
            currentLocale = NSLocale.alloc().initWithLocaleIdentifier(lang);
        }
        return titlecase(currentLocale.localizedStringForLanguageCode(locale || lang));
    } else {
        if (!currentLocale) {
            currentLocale = java.util.Locale.forLanguageTag(lang);
        }
        return titlecase(java.util.Locale.forLanguageTag(locale || lang).getDisplayLanguage(currentLocale));
    }
}

setLang(deviceLanguage);

export { l, lc, lt, lu };
export const sl = derived([$lang], () => l);
export const slc = derived([$lang], () => lc);
export const slt = derived([$lang], () => lt);
export const slu = derived([$lang], () => lu);
// export const sconvertDuration = derived([$lang], () => convertDuration);
export const scconvertTime = derived([$lang], () => convertTime);
export const sgetLocaleDisplayName = derived([$lang], () => getLocaleDisplayName);
