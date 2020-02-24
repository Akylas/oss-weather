import { device } from '@nativescript/core/platform';
import { loadLocaleJSON } from 'nativescript-l';
export { l } from 'nativescript-l';
import dayjs from 'dayjs';
const supportedLanguages = ['en', 'fr'];

function setLang(newLang) {
    if (supportedLanguages.indexOf(newLang) === -1) {
        newLang = 'en';
    }
    lang = newLang;
    require(`dayjs/locale/${newLang}`);
    dayjs.locale(lang); // switch back to default English locale globally
    const localeData = require(`~/i18n/${lang}.json`);
    // console.log('setLang', lang);
    loadLocaleJSON(localeData);
}

const deviceLanguage =  device.language.split('-')[0].toLowerCase();;
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
export let lang = getOwmLanguage(deviceLanguage);

// const rtf = new Intl.RelativeTimeFormat('es');

setLang(lang);
