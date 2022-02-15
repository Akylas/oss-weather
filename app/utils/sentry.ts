import * as SentryType from '@nativescript-community/sentry';
import { Device } from '@nativescript/core/platform';

export let Sentry: typeof SentryType;
export let isSentryEnabled = false;

export async function startSentry() {
    try {
        if (PRODUCTION || gVars.sentry) {
            Sentry = require('@nativescript-community/sentry');
            Sentry.init({
                dsn: SENTRY_DSN,
                appPrefix: SENTRY_PREFIX,
                release: `${__APP_ID__}@${__APP_VERSION__}+${__APP_BUILD_NUMBER__}`,
                dist: `${__APP_BUILD_NUMBER__}.${global.isAndroid ? 'android' : 'ios'}`
            });
            Sentry.setTag('locale', Device.language);
            isSentryEnabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
