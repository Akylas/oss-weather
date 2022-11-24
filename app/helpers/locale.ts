import { capitalize, l, lc, loadLocaleJSON, lt, lu, overrideNativeLocale } from '@nativescript-community/l';
import { getString, setString } from '@nativescript/core/application-settings';
import { Application, ApplicationSettings, Device } from '@nativescript/core';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { derived, writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
import { createGlobalEventListener, globalObservable } from '~/variables';
import { titlecase } from './formatter';
import { ad } from '@nativescript/core/utils';
const supportedLanguages = SUPPORTED_LOCALES;
dayjs.extend(LocalizedFormat);

export let lang;
export const $lang = writable(null);
let default24Clock = false;
if (__ANDROID__) {
    default24Clock = android.text.format.DateFormat.is24HourFormat(ad.getApplicationContext());
}
export let clock_24 = ApplicationSettings.getBoolean('clock_24', default24Clock);
export const clock_24Store = writable(null);

console.log('clock_24', clock_24);

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
        case 'cs':
            return 'cz';
        case 'jp':
            return 'ja';
        case 'lv':
            return 'la';
        default:
            return language;
    }
}

// const rtf = new Intl.RelativeTimeFormat('es');

export function formatDate(date: number | string | dayjs.Dayjs, formatStr: string) {
    if (date) {
        if (!date['format']) {
            date = dayjs(date);
        }

        if (clock_24 && formatStr.indexOf('LT') >= 0) {
            formatStr.replaceAll('LT', 'HH:mm');
        } else if (clock_24 && formatStr.indexOf('LTS') >= 0) {
            formatStr = 'HH:mm:ss';
            formatStr.replaceAll('LTS', 'HH:mm:ss');
        }
        return capitalize((date as dayjs.Dayjs).format(formatStr));
    }
    return '';
}
export function formatTime(date: number | dayjs.Dayjs | string | Date, formatStr: string = 'LT') {
    if (date) {
        if (!date['format']) {
            date = dayjs(date);
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

prefs.on('key:language', () => {
    const newLanguage = getString('language');
    DEV_LOG && console.log('language changed', newLanguage);
    // on pref change we are updating
    if (newLanguage === lang) {
        return;
    }
    setLang(newLanguage);
});

prefs.on('key:clock_24', () => {
    const newValue = ApplicationSettings.getBoolean('clock_24', default24Clock);
    DEV_LOG && console.log('clock_24 changed', newValue);
    clock_24 = newValue;
    clock_24Store.set(newValue);
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
export const scformatDate = derived($lang, () => formatDate);
export const scformatTime = derived([$lang, clock_24Store], () => formatTime);
export const sgetLocaleDisplayName = derived([$lang], () => getLocaleDisplayName);
