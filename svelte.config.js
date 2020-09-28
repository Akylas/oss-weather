const sveltePreprocess = require('svelte-preprocess');
const svelteNativePreprocessor = require('svelte-native-preprocessor');

module.exports = {
    preprocess: [
        sveltePreprocess({
            typescript: {
                compilerOptions: {
                    module: 'es6',
                },
            },
        }),
        svelteNativePreprocessor(),
    ],
};
