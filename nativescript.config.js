
module.exports = {
    id: 'com.akylas.weather',
    appResourcesPath: 'app/App_Resources',
    android: {
        maxLogcatObjectSize: 2048,
        markingMode: 'none',
        v8Flags: '--expose_gc',
        codeCache: true,
    },
    appPath: 'app',
    profiling: 'none',
    webpackConfigPath:'./app.webpack.config.js'
};
