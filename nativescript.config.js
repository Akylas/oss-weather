module.exports = {
    id: 'com.akylas.weather',
    ignoredNativeDependencies: ['@nativescript-community/sentry'],
    appResourcesPath: 'App_Resources',
    webpackConfigPath: 'app.webpack.config.js',
    appPath: 'app',
    android: {
        markingMode: 'none',
        codeCache: true,
        maxLogcatObjectSize: 32768
    },
    cssParser: 'rework'
};
