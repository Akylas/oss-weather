const mergeOptions = require('merge-options');
module.exports = mergeOptions(require('./nativescript.config'), {
    forceLog: true,
    android: {
        maxLogcatObjectSize: 4096,
        forceLog: true
    }
});
