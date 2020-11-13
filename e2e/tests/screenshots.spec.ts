import { by, device, element, expect, waitFor } from 'detox';
import { copyFile } from 'fs';
import { join, dirname , basename} from 'path';

describe('Screenshots', () => {
    beforeEach(async () => {
        await device.reloadReactNative();
    });


    it('scree', async () => {
        await saveScreenshot('screen1');  
        await element(by.label('skip')).tap();
        await waitFor(element(by.label('skip'))).toBeNotVisible();
        await saveScreenshot('screen2');  

    });  
});
async function saveScreenshot(screenshotName) {
    const imagePath = await device.takeScreenshot(screenshotName) as any;
    return new Promise(async (resolve,reject)=>{
        copyFile(imagePath, `./fastlane/screenshots/${screenshotName}.png`, (err)=>{
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        });
    })
    
  }