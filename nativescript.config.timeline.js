const mergeOptions = require('merge-options');
module.exports = mergeOptions(require('./nativescript.config'), {
    forceLog: false,
    profiling: 'timeline',
    android: {
        maxLogcatObjectSize: 4096,
        forceLog: true
    }
});
