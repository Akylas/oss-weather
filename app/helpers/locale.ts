import { l, lc, loadLocaleJSON, lt, lu } from '@nativescript-community/l';
import { getString, setString } from '@nativescript/core/application-settings';
import { Device } from '@nativescript/core/platform';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { derived, writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
const supportedLanguages = SUPPORTED_LOCALES;
dayjs.extend(LocalizedFormat);

export let lang;
export const $lang = writable(null);
const onLanguageChangedCallbacks = [];
export function onLanguageChanged(callback) {
    onLanguageChangedCallbacks.push(callback);
}
$lang.subscribe((newLang: string) => {
    lang = newLang;
    if (!lang) {
        return;
    }
    // console.log('changed lang', lang, Device.region);
    try {
        require(`dayjs/locale/${newLang}`);
    } catch (err) {
        console.log('failed to load dayjs locale', lang, `dayjs/locale/${newLang}`, err);
    }
    dayjs.locale(lang); // switch back to default English locale globally
    try {
        const localeData = require(`~/i18n/${lang}.json`);
        loadLocaleJSON(localeData);
    } catch (err) {
        console.log('failed to load lang json', lang, `~/i18n/${lang}.json`, err);
    }
    onLanguageChangedCallbacks.forEach((c) => c(lang));
});
function setLang(newLang) {
    newLang = getOwmLanguage(newLang);
    if (supportedLanguages.indexOf(newLang) === -1) {
        newLang = 'en';
    }
    $lang.set(newLang);
}

let deviceLanguage = getString('language');
if (!deviceLanguage) {
    deviceLanguage = Device.language.split('-')[0].toLowerCase();
    setString('language', deviceLanguage);
    // console.log('prefs language not set', deviceLanguage, getString('language'));
}
// console.log('deviceLanguage', deviceLanguage);
function getOwmLanguage(language) {
    if (language === 'cs') {
        // Czech
        return 'cz';
    } else if (language === 'ko') {
        // Korean
        return 'kr';
    } else if (language === 'lv') {
        // Latvian
        return 'la';
    } else {
        return language;
    }
}

// const rtf = new Intl.RelativeTimeFormat('es');

export function convertTime(date: number | string | dayjs.Dayjs, formatStr: string) {
    if (date) {
        if (!date['format']) {
            date = dayjs(date);
        }
        return (date as dayjs.Dayjs).format(formatStr);
    }
    return '';
}

prefs.on('key:language', () => {
    const newLanguage = getString('language');
    console.log('language changed', newLanguage);
    // on pref change we are updating
    if (newLanguage === lang) {
        return;
    }
    setLang(newLanguage);
});

setLang(deviceLanguage);

export { l, lc, lt, lu };
export const $l = derived([$lang], () => l);
export const $lc = derived([$lang], () => lc);
export const $lt = derived([$lang], () => lt);
export const $lu = derived([$lang], () => lu);
