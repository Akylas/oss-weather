module.exports = {
    testRunner: 'jest',
    runnerConfig: './e2e/jest.config.js',
    configurations: {
        'screenshots.ios': {
            binaryPath: 'platforms/ios/build/Debug-iphonesimulator/Elichens.app',
            build: 'ns build ios',
            type: 'ios.simulator',
            device: {
                type: 'iPhone 11 Pro Max',
            },
        },
        'screenshots.android': {
            binaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'ns build android --detox',
            type: 'android.emulator',
            device: {
                avdName: 'Pixel_2_XL_API_29',
            },
        },
    },
};
