const mergeOptions = require('merge-options');
module.exports = mergeOptions(require('./nativescript.config.logging'), {
    profiling: 'timeline',
});
