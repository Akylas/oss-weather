import { getBuildNumber, getVersionName } from 'nativescript-extendedinfo';
import * as SentryType from 'nativescript-akylas-sentry';
import { device } from '@nativescript/core/platform';

export let Sentry: typeof SentryType;
export let isSentryEnabled = false;

export async function startSentry() {
    try {
        console.log('sentry startup', PRODUCTION, gVars.sentry);

        if (PRODUCTION || gVars.sentry) {
            Sentry = require('nativescript-akylas-sentry');
            console.log('required sentry', PRODUCTION, gVars.sentry);
            const version = await getVersionName();
            console.log('version', version);
            const versionCode = await getBuildNumber();
            console.log(' sentry init', gVars.platform, SENTRY_DSN, SENTRY_PREFIX, version, versionCode);
            Sentry.init({
                dsn: SENTRY_DSN,
                appPrefix: SENTRY_PREFIX,
                release: `${version}`,
                dist: `${versionCode}.${gVars.platform}`
            });
            Sentry.setTag('locale', device.language);
            isSentryEnabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
