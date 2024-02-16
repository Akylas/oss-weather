const timelineEnabled = !!process.env['NS_TIMELINE'];
const sentryEnabled = !!process.env['NS_SENTRY'];
const loggingEnabled = !!process.env['NS_LOGGING'];

module.exports = {
    ignoredNativeDependencies: ['@nativescript/detox'].concat(sentryEnabled ? [] : ['@nativescript-community/sentry']),
    id: 'com.akylas.weather',
    appResourcesPath: 'App_Resources',
    buildPath: 'platforms',
    webpackConfigPath: 'app.webpack.config.js',
    appPath: 'app',
    forceLog: loggingEnabled,
    profiling: timelineEnabled ? 'timeline' : undefined,
    i18n: {
        defaultLanguage: 'en'
    },
    android: {
        gradleVersion: '8.3',
        markingMode: 'none',
        codeCache: true,
        enableMultithreadedJavascript: false,
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
            type: 'after-prepareNativeApp',
            script: 'scripts/after-prepareNativeApp.js'
        }
    ]
};
