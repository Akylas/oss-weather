import { l, lc, loadLocaleJSON, lt, lu } from '@nativescript-community/l';
import { getString, setString } from '@nativescript/core/application-settings';
import { Device } from '@nativescript/core/platform';
import { format as formatDate } from 'date-fns'
// import dayjs from 'dayjs';
// import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { derived, writable } from 'svelte/store';
import { prefs } from '~/services/preferences';
const supportedLanguages = SUPPORTED_LOCALES;
// dayjs.extend(LocalizedFormat);

export let lang;
export const $lang = writable(null);
const onLanguageChangedCallbacks = [];
export function onLanguageChanged(callback) {
    onLanguageChangedCallbacks.push(callback);
}
let dateFnsLocale;
$lang.subscribe((newLang: string) => {
    lang = newLang;
    if (!lang) {
        return;
    }
    // console.log('changed lang', lang, Device.region);
    try {
        // require(`dayjs/locale/${newLang}`);
        require(`date-fns/locale/${newLang}`);
    } catch (err) {
        // console.log('failed to load dayjs locale', lang, `dayjs/locale/${newLang}`, err);
        console.log('failed to load date-fns locale', lang, err);
    }
    // dateFnsLocale = require('date-fns/locale')[lang]
    // dayjs.locale(lang); // switch back to default English locale globally
    try {
        const localeData = require(`~/i18n/${lang}.json`);
        loadLocaleJSON(localeData);
    } catch (err) {
        console.log('failed to load lang json', lang, `~/i18n/${lang}.json`, err);
    }
    onLanguageChangedCallbacks.forEach((c) => c(lang));
});
function setLang(newLang) {
    newLang = getActualLanguage(newLang);
    if (supportedLanguages.indexOf(newLang) === -1) {
        newLang = 'en-US';
    }
    $lang.set(newLang);
}

const deviceLanguage = getString('language', 'auto');
function getActualLanguage(language) {
    switch (language) {
        case 'en':
            return 'en-US';
        case 'cs':
            return 'cz';
        case 'jp':
            return 'ja';
        case 'kr':
            return 'kr';
        case 'lv':
            return 'la';
        case 'auto':
            return Device.language.split('-')[0].toLowerCase();
        default:
            return language;
    }
}

// const rtf = new Intl.RelativeTimeFormat('es');

const getLocale = (locale) => require(`date-fns/locale/${locale}/index.js`);
export function convertTime(date: number | string | Date, formatStr: string) {
    if (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        // if (!date['format']) {
        //     date = dayjs(date);
        // }
        // return (date as dayjs.Dayjs).format(formatStr);
        return formatDate(date, formatStr, {
            locale:getLocale(lang)
        });
    }
    return '';
}
// export function convertDuration(date, formatStr: string) {
//     const test = new Date(date);
//     test.setTime(test.getTime() + test.getTimezoneOffset() * 60 * 1000);
//     const result = dayjs(test).format(formatStr);
//     return result;
// }

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
