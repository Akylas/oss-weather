import { getBuildNumber, getVersionName } from '@nativescript-community/extendedinfo';
import * as SentryType from '@nativescript-community/sentry';
import { Device } from '@nativescript/core/platform';

export let Sentry: typeof SentryType;
export let isSentryEnabled = false;

export async function startSentry() {
    try {
        if (PRODUCTION || gVars.sentry) {
            const version = await getVersionName();
            const versionCode = await getBuildNumber();
            Sentry = require('@nativescript-community/sentry');
            Sentry.init({
                dsn: SENTRY_DSN,
                appPrefix: SENTRY_PREFIX,
                release: `${version}`,
                dist: `${versionCode}.${gVars.platform}`,
            });
            Sentry.setTag('locale', Device.language);
            isSentryEnabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
