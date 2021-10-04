const sveltePreprocess = require('svelte-preprocess');
const svelteNativePreprocessor = require('svelte-native-preprocessor');

module.exports = {
    compilerOptions: {
        namespace: 'foreign',
    },
    preprocess: [
        sveltePreprocess({
            typescript: {
                compilerOptions: {
                    target: 'es2017'
                }
            }
        }),
        svelteNativePreprocessor()
    ]
};
