const timelineEnabled = !!process.env['NS_TIMELINE'];
const sentryEnabled = !!process.env['NS_SENTRY'];
const loggingEnabled = !!process.env['NS_LOGGING'];
const playstoreBuild = !!process.env['PLAY_STORE_BUILD'];

module.exports = {
    ignoredNativeDependencies: [].concat(sentryEnabled ? [] : ['@nativescript-community/sentry']).concat(playstoreBuild ? [] : ['@akylas/nativescript-inapp-purchase']),
    id: process.env['APP_ID'],
    appResourcesPath: 'App_Resources',
    buildPath: 'platforms',
    webpackPackageName: '@akylas/nativescript-webpack',
    corePackageName: '@akylas/nativescript',
    webpackConfigPath: 'app.webpack.config.js',
    appPath: 'app',
    forceLog: loggingEnabled,
    profiling: timelineEnabled ? 'timeline' : undefined,
    i18n: {
        defaultLanguage: 'en'
    },
    ios: {
        // runtimePackageName: '@akylas/nativescript-ios-runtime',
        ignoredNativeDependencies: ['plugin-widgets'],
        // ui-snackbar publishes without its nativescript.config.ts (.npmignore *.ts): declare its package here
        // until a release ships it
        SPMPackages: [
            {
                name: 'liquid-toasts',
                libs: ['LiquidToasts'],
                repositoryURL: 'https://github.com/SimplifyJobs/liquid-toasts.git',
                version: '0.8.1'
            }
        ]
        // SPMPackages: [
        //     {
        //         name: 'IQKeyboardManagerSwift',
        //         libs: ['IQKeyboardManagerSwift'],
        //         repositoryURL: 'https://github.com/hackiftekhar/IQKeyboardManager.git',
        //         version: '8.0.2'
        //     }
        // ]
    },
    android: {
        ignoredNativeDependencies: ['@akylas/nativescript-inapp-purchase'],
        runtimePackageName: '@nativescript/android-quickjs-ng',
        gradleVersion: '9.7.1',
        markingMode: 'none',
        codeCache: true,
        enableMultithreadedJavascript: false,
        handleTimeZoneChanges: true,
        ...(loggingEnabled
            ? {
                  forceLog: true,
                  maxLogcatObjectSize: 40096
              }
            : {})
    },
    cssParser: 'rework',
    hooks: [
        {
            type: 'before-prepareNativeApp',
            script: 'tools/scripts/after-prepareNativeApp.js'
        }
    ]
};
