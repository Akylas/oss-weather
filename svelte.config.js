// svelte options exported for svelte-vscode

// const { preprocess: makeTsPreprocess, createEnv, readConfigFile } = require('@pyoner/svelte-ts-preprocess');

// const env = createEnv();
// const compilerOptions = readConfigFile(env);
// const preprocessOptions = {
//     env,
//     compilerOptions: {
//         ...compilerOptions,
//         allowNonTsExtensions: true
//     }
// };
// const preprocess = makeTsPreprocess(preprocessOptions);

// module.exports = {
//     preprocess: [preprocess]
// };

// const svelte = require('svelte');
// const sveltePreprocess = require('svelte-preprocess');
// const options = {
//     postcss: true,
//     typescript: {
//         //     /**
//         //      * Optionally specify the full path to the tsconfig
//         //      */
//         tsconfigFile: './tsconfig.json'
//     }
// };
// const { preprocess } = require('@pyoner/svelte-ts-preprocess');
const sveltePreprocess = require('svelte-preprocess');
const svelteNativePreprocessor = require('svelte-native-preprocessor');

module.exports = {
    preprocess: [svelteNativePreprocessor(), sveltePreprocess()]
};
// const { preprocess: makeTsPreprocess, createEnv, readConfigFile } = require('@pyoner/svelte-ts-preprocess');

// const env = createEnv();
// const compilerOptions = readConfigFile(env);
// console.log(env, compilerOptions);
// const preprocessOptions = {
//     env,
//     compilerOptions: {
//         ...compilerOptions,
//         allowNonTsExtensions: true
//     }
// };
// const preprocess = makeTsPreprocess(preprocessOptions);

// module.exports = {
//     dev: process.env.NODE_ENV !== 'development',
//     preprocess
// };
