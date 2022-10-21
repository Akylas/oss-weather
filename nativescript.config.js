module.exports = {
    id: 'com.akylas.weather',
    appResourcesPath: 'App_Resources',
    webpackConfigPath: 'app.webpack.config.js',
    appPath: 'app',
    android: {
        markingMode: 'none',
        codeCache: true,
        enableMultithreadedJavascript: false,
        enableTimers: true
    },
    cssParser: 'rework',
    hooks: [
        {
            type: 'after-prepareNativeApp',
            script: 'scripts/after-prepareNativeApp.js'
        }
    ]
};
