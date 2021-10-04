module.exports = {
    id: 'com.akylas.weather',
    ignoredNativeDependencies: ['@nativescript-community/sentry'],
    appResourcesPath: 'App_Resources',
    webpackConfigPath: './app.webpack.config.js',
    appPath: 'app',
    forceLog: true,
    // profiling: 'timeline',
    android: {
        maxLogcatObjectSize: 4096,
        markingMode: 'none',
        // v8Flags: '--expose_gc',
        codeCache: true,
        enableMultithreadedJavascript: false,
        forceLog: true
    },
    cssParser: 'rework'
};
