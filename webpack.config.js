const webpack = require('@nativescript/webpack');
module.exports = (env) => {
    webpack.init(env);
    webpack.chainWebpack((config, env) => {
        config.module
            .rule('svelte')
            .use('string-replace-loader')
            .loader('string-replace-loader')
            .options({
                search: 'createElementNS\\("https:\\/\\/svelte\\.dev\\/docs#svelte_options"',
                replace: 'createElementNS(svN',
                flags: 'gm'
            })
            .end();
        return config;
    });
    return webpack.resolveConfig();
};
