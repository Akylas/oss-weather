import { by, device, element, expect, waitFor } from 'detox';
import { copyFile } from 'fs';
import { basename, dirname, join } from 'path';

const platform = gVars.platform;
describe('Screenshots', () => {
    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('scree', async () => {
        await saveScreenshot('screen1');
        await element(by.label('skip')).tap();
        await expect(element(by.label('skip'))).not.toBeVisible();
        await saveScreenshot('screen2');
    });
});
async function saveScreenshot(lang, screenshotName) {
    const imagePath = (await device.takeScreenshot(screenshotName)) as any;
    return new Promise<void>(async (resolve, reject) => {
        copyFile(imagePath, `./fastlane/metadata/${platform}/${lang}/screenshots/${screenshotName}.png`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
