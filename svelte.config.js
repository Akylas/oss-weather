const sveltePreprocess = require('svelte-preprocess');
module.exports = {
    compilerOptions: {
        namespace: 'foreign'
    },
    preprocess: [
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
