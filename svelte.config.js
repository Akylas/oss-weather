const sveltePreprocess = require('svelte-preprocess');
const svelteNativePreprocessor = require('svelte-native-preprocessor');

module.exports = {
    preprocess: [sveltePreprocess(), svelteNativePreprocessor()],
};
