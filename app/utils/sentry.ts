import { getAppId, getBuildNumber, getVersionName } from '@nativescript-community/extendedinfo';
import * as SentryType from '@nativescript-community/sentry';
import { Device } from '@nativescript/core/platform';

export let Sentry: typeof SentryType;
export let isSentryEnabled = false;

export async function startSentry() {
    try {
        if (PRODUCTION || gVars.sentry) {
            Sentry = require('@nativescript-community/sentry');
            const versionName = await getVersionName();
            const buildNumber = await getBuildNumber();
            const appId = await getAppId();
            Sentry.init({
                dsn: SENTRY_DSN,
                appPrefix: SENTRY_PREFIX,
                release: `${appId}@${versionName}+${buildNumber}`,
                dist: `${buildNumber}.${global.isAndroid ? 'android' : 'ios'}`
            });
            Sentry.setTag('locale', Device.language);
            isSentryEnabled = true;
        }
    } catch (err) {
        console.error(err);
    }
}
