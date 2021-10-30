const TerserPlugin = require('terser-webpack-plugin');
const esbuild = require('esbuild');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = (env, params = {}) => {
    Object.keys(env).forEach((k) => {
        if (env[k] === 'false' || env[k] === '0') {
            env[k] = false;
        } else if (env[k] === 'true' || env[k] === '1') {
            env[k] = true;
        }
    });

    const {
        production, // --env.production
        noconsole = true // --env.noconsole
    } = env;
    const mode = production ? 'production' : 'development';
    const platform = env && ((env.android && 'android') || (env.ios && 'ios'));

    return {
        entry: resolve(__dirname, 'map/index.ts'),
        devtool: false,
        target: 'web',
        mode,
        optimization: {
            usedExports: true,
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        ecma: 2015,
                        module: true,
                        toplevel: false,
                        keep_classnames: false,
                        keep_fnames: false,
                        compress: {
                            sequences: platform !== 'android',
                            passes: 5,
                            drop_console: production && noconsole
                        }
                    }
                })
            ]
        },
        resolve: {
            exportsFields: [],
            mainFields: ['browser', 'module', 'main'],
            extensions: ['.css', '.ts', '.js', '.json']
        },
        output: {
            pathinfo: false,
            path: resolve(__dirname, 'app/assets/map'),
            // path: resolve(join(dist, 'assets', 'map')),
            library: {
                name: 'webapp',
                type: 'global'
            },
            filename: 'index.js'
        },
        plugins: [
            new HtmlWebpackPlugin({
                templateContent: '<html><body><div class="map" id="map"></div></body></html>',
                meta: {
                    viewport: 'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no'
                },
                minify: {
                    collapseWhitespace: true,
                    keepClosingSlash: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true
                }
            }),
            new MiniCssExtractPlugin()
        ],
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        allowTsInNodeModules: true,
                        configFile: resolve(__dirname, 'tsconfig.webmap.json'),
                        compilerOptions: {
                            sourceMap: false,
                            declaration: false
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                url: false
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        [
                                            'cssnano',
                                            {
                                                preset: 'advanced'
                                            }
                                        ],
                                        ['postcss-combine-duplicated-selectors', { removeDuplicatedProperties: true }]
                                    ]
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    loader: 'esbuild-loader',
                    options: {
                        target: 'es2015',
                        implementation: esbuild
                        // sourceMaps: false,
                        // plugins: ['@babel/plugin-transform-runtime'],
                        // presets: [
                        //     [
                        //         '@babel/env',
                        //         {
                        //             modules: false,
                        //             targets: {
                        //                 chrome: '70'
                        //             }
                        //         }
                        //     ]
                        // ]
                    }
                }
            ]
        }
    };
};
