const sveltePreprocess = require('svelte-preprocess');
// const svelteNativePreprocessor = require('svelte-native-preprocessor');
// const { transformSync } = require('@swc/core');
// const { typescript } = require('svelte-preprocess-esbuild');

module.exports = {
    compilerOptions: {
        namespace: 'foreign'
    },
    preprocess: [
        // typescript({
        //     target: 'es2019'
        // }),
        // sveltePreprocess({
        //     typescript: false
        // })
        sveltePreprocess({
            typescript: {
                compilerOptions: {
                    target: 'es2020'
                }
            }
        })
        // svelteNativePreprocessor()
    ]
};
