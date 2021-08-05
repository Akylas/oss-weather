const webpack = require('@nativescript/webpack');
const sveltePreprocess = require('svelte-preprocess');
const svelteNativePreprocessor = require('svelte-native-preprocessor');
module.exports = (env) => {
    webpack.init(env);
    webpack.useConfig('svelte');
    // We want to use svelte-loader for now
    webpack.chainWebpack((config, env) => {
        // target('node') is the default and causes svelte-loader to detect it as a "server" render, disabling HMR
        config.target('electron-main');

        // svelte-hmr references tns-core-modules, so we shim it here for now
        config.resolve.alias.set('tns-core-modules', '@nativescript/core');

        // the default svelte config uses deprecated svelte-loader-hot, we replace it here while keeping the preprocessor config.
        let opts = null;
        config.module
            .rule('svelte')
            .uses.get('svelte-loader-hot')
            .tap((opt) => (opts = opt));

        config.module.rule('svelte').clear();
        config.module.rule('svelte').uses.clear();
        const production = !!env.production;
        const isAnySourceMapEnabled = !!env.sourceMap || !!env.hiddenSourceMap || !!env.inlineSourceMap;
        config.module
            .rule('svelte')
            .test(/\.svelte$/)
            .exclude.add(/node_modules/)
            .end()
            .use('string-replace-loader')
            .loader('string-replace-loader')
            .options({
                search: 'createElementNS\\("https:\\/\\/svelte\\.dev\\/docs#svelte_options"',
                replace: 'createElementNS(svN',
                flags: 'gm'
            })
            .end()
            .use('svelte-loader')
            .loader('svelte-loader')
            .options({
                compilerOptions: {
                    dev: !production,
                    namespace: 'foreign'
                },
                preprocess: [
                    sveltePreprocess({
                        defaults: {
                            script: 'typescript',
                            style: 'scss'
                        },
                        typescript: {
                            compilerOptions: {
                                target: 'es2017'
                            }
                        },

                        sourceMap: isAnySourceMapEnabled
                    }),
                    svelteNativePreprocessor()
                ],
                hotReload: !production,
                hotOptions: {
                    injectCss: false,
                    native: true
                }
            })
            .end();
        return config;
    });
    return webpack.resolveConfig();
};
