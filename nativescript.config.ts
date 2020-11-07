import { NativeScriptConfig } from '@nativescript/core';

export default {
    id: 'com.akylas.weather',
    appResourcesPath: 'app/App_Resources',
    android: {
        maxLogcatObjectSize: 2048,
        markingMode: 'none',
        v8Flags: '--expose_gc',
        codeCache: true,
        forceLog: true,
    },
    cssParser: 'rework',
    appPath: 'app',
    webpackConfigPath: './app.webpack.config.js',
} as NativeScriptConfig;
