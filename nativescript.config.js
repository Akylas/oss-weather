module.exports = {
    id: 'akylas.alpi.maps',
    appResourcesPath: 'app/App_Resources',
    webpackConfigPath: './app.webpack.config.js',
    appPath: 'app',
    // profiling: 'timeline',
    android: {
        maxLogcatObjectSize: 4096,
        markingMode: 'none',
        v8Flags: '--expose_gc',
        codeCache: true,
        enableMultithreadedJavascript: false,
        forceLog: true
    },
    cssParser: 'rework'
};
