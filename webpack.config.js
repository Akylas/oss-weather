const { join, relative, resolve, sep } = require('path');

const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

const nsWebpack = require('nativescript-dev-webpack');
const nativescriptTarget = require('nativescript-dev-webpack/nativescript-target');
const { NativeScriptWorkerPlugin } = require('nativescript-worker-loader/NativeScriptWorkerPlugin');
const hashSalt = Date.now().toString();
const mergeOptions = require('merge-options');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const svelteNativePreprocessor = require('svelte-native-preprocessor');
const { existsSync, mkdirSync, readFileSync } = require('fs');
const SentryCliPlugin = require('@sentry/webpack-plugin');

module.exports = (env, params = {}) => {
    // Add your custom Activities, Services and other android app components here.
    const appComponents = ['tns-core-modules/ui/frame', 'tns-core-modules/ui/frame/activity'].concat(params.appComponents || []);
    console.log('appComponents', appComponents);

    const platform = env && ((env.android && 'android') || (env.ios && 'ios'));
    if (!platform) {
        throw new Error('You need to provide a target platform!');
    }

    const platforms = ['ios', 'android'];
    const projectRoot = params.projectRoot || __dirname;
    console.log('projectRoot', projectRoot);

    let tsconfig = params.tsconfig;
    if (!tsconfig) {
        tsconfig = 'tsconfig.json';
        if (existsSync(resolve(projectRoot, `tsconfig.${platform}.json`))) {
            tsconfig = `tsconfig.${platform}.json`;
        }
    }
    console.log('tsconfig', tsconfig);

    // Default destination inside platforms/<platform>/...
    const dist = resolve(projectRoot, nsWebpack.getAppPath(platform, projectRoot));
    // const appResourcesPlatformDir = platform === 'android' ? 'Android' : 'iOS';

    const {
        // The 'appPath' and 'appResourcesPath' values are fetched from
        // the nsconfig.json configuration file
        // when bundling with `tns run android|ios --bundle`.
        appPath = 'app',
        appResourcesPath = 'app/App_Resources',
        development = false,
        // You can provide the following flags when running 'tns run android|ios'
        snapshot, // --env.snapshot
        uglify, // --env.uglify
        production, // --env.production
        report, // --env.report
        hmr, // --env.hmr
        sourceMap, // --env.sourceMap
        hiddenSourceMap, // --env.hiddenSourceMap
        inlineSourceMap, // --env.inlineSourceMap
        unitTesting, // --env.unitTesting
        verbose, // --env.verbose
        snapshotInDocker, // --env.snapshotInDocker
        skipSnapshotTools, // --env.skipSnapshotTools
        compileSnapshot, // --env.compileSnapshots
        sentry, // --env.sentry
        devlog, // --env.devlog
        adhoc // --env.adhoc
    } = env;

    if (adhoc) {
        env = Object.assign({}, env, {
            production: true,
            sentry: true,
            sourceMap: true,
            uglify: true
        });
    }

    const useLibs = compileSnapshot;
    const isAnySourceMapEnabled = !!sourceMap || !!hiddenSourceMap || !!inlineSourceMap;
    const externals = nsWebpack.getConvertedExternals(env.externals);

    const mode = production ? 'production' : 'development';

    const appFullPath = resolve(projectRoot, appPath);
    const hasRootLevelScopedModules = nsWebpack.hasRootLevelScopedModules({
        projectDir: projectRoot
    });
    const alias = mergeOptions(
        {
            '~': appFullPath,
            '@': appFullPath,
            'svelte-native': 'svelte-native-akylas'
        },
        params.alias || {}
    );
    console.log('Aliases', alias);
    let coreModulesPackageName = 'tns-core-modules';

    if (hasRootLevelScopedModules) {
        coreModulesPackageName = '@nativescript/core';
        alias['tns-core-modules'] = coreModulesPackageName;
    }

    const appResourcesFullPath = resolve(projectRoot, appResourcesPath);

    const entryModule = nsWebpack.getEntryModule(appFullPath, platform);
    const entryPath = `.${sep}${entryModule}`;
    const entries = mergeOptions({ bundle: entryPath }, params.entries || {});
    const areCoreModulesExternal = Array.isArray(env.externals) && env.externals.some(e => e.indexOf('tns-core-modules') > -1);
    if (platform === 'ios' && !areCoreModulesExternal) {
        entries['tns_modules/tns-core-modules/inspector_modules'] = 'inspector_modules';
    }
    // if (platform === 'android') {
    //     entries['application'] = './application.android';
    // }
    console.log(`Bundling application for entryPath ${entryPath}...`);

    const itemsToClean = [`${dist}/**/*`];
    if (platform === 'android') {
        itemsToClean.push(`${join(projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'assets', 'snapshots')}`);
        itemsToClean.push(`${join(projectRoot, 'platforms', 'android', 'app', 'build', 'configurations', 'nativescript-android-snapshot')}`);
    }
    console.log('itemsToClean', itemsToClean);
    // const babelLoader = {
    //     loader: 'babel-loader',
    //     options: mergeOptions.call(
    //         { concatArrays: true },
    //         {
    //             cacheDirectory: true,
    //             presets: [
    //                 [
    //                     '@babel/preset-env',
    //                     {
    //                         modules: false,
    //                         targets: {
    //                             node: '8' // <--- this
    //                         }
    //                         // loose: true
    //                     }
    //                 ]
    //             ],
    //             plugins: ['@babel/plugin-syntax-dynamic-import']
    //         },
    //         params.babelOptions || {}
    //     )
    // };

    const defines = mergeOptions(
        {
            PRODUCTION: !!production,
            process: 'global.process',
            'global.TNS_WEBPACK': 'true',
            'gVars.platform': `"${platform}"`,
            'gVars.isIOS': platform === 'ios',
            'gVars.isAndroid': platform === 'android',
            TNS_ENV: JSON.stringify(mode),
            'gVars.sentry': !!sentry,
            SENTRY_DSN: `"${process.env.SENTRY_DSN}"`,
            SENTRY_PREFIX: `"${!!sentry ? process.env.SENTRY_PREFIX : ''}"`,
            OWM_KEY: `"${process.env.OWM_KEY}"`,
            DARK_SKY_KEY: `"${process.env.DARK_SKY_KEY}"`,
            LOG_LEVEL: devlog ? '"full"' : '""',
            TEST_LOGS: adhoc || !production
        },
        params.definePlugin || {}
    );
    console.log('defines', defines);

    const symbolsParser = require('scss-symbols-parser');
    const mdiSymbols = symbolsParser.parseSymbols(readFileSync(resolve(projectRoot, 'node_modules/@mdi/font/scss/_variables.scss')).toString());
    const mdiIcons = JSON.parse(`{${mdiSymbols.variables[mdiSymbols.variables.length - 1].value.replace(/" (F|0)(.*?)([,\n]|$)/g, '": "$1$2"$3')}}`);
    const forecastSymbols = symbolsParser.parseSymbols(readFileSync(resolve(projectRoot, 'app/css/forecastfont.scss')).toString());
    const forecastIcons = JSON.parse(`{${forecastSymbols.variables[forecastSymbols.variables.length - 1].value.replace(/'forecastfont-(\w+)' (F|f|0)(.*?)([,\n]|$)/g, '"$1": "$2$3"$4')}}`);

    const weatherIcons = JSON.parse(
        `{${[
            ...readFileSync(resolve(projectRoot, 'node_modules/weather-icons/weather-icons/variables.less'))
                .toString()
                .matchAll(/@(.*?)\s*:\s*"\\(.*?)"/g)
        ]
            .map(r => `"${r[1]}": "${r[2]}"`)
            .join(',')}}`
    );
    // console.log('weatherIcons', weatherIcons);

    const scssPrepend = `$lato-fontFamily: ${platform === 'android' ? 'res/lato' : 'Lato'};
$forecastfont-fontFamily: ${platform === 'android' ? 'iconvault_forecastfont' : 'iconvault'};
$wi-fontFamily: ${platform === 'android' ? 'weathericons-regular-webfont' : 'Weather Icons'};
$mdi-fontFamily: ${platform === 'android' ? 'materialdesignicons-webfont' : 'Material Design Icons'};`;

    console.log('scssPrepend', scssPrepend);
    nsWebpack.processAppComponents(appComponents, platform);
    const config = {
        mode,
        context: appFullPath,
        externals: externals.concat(params.externals || []),
        // stats: 'verbose',
        watchOptions: {
            ignored: [
                appResourcesFullPath,
                // Don't watch hidden files
                '**/.*'
            ]
        },
        target: nativescriptTarget,
        entry: entries,
        output: {
            pathinfo: false,
            path: dist,
            libraryTarget: 'commonjs2',
            filename: '[name].js',
            globalObject: 'global',
            hashSalt
        },
        resolve: {
            extensions: ['.ts', '.mjs', '.js', '.svelte', '.scss', '.css'],
            // Resolve {N} system modules from tns-core-modules
            modules: [resolve(projectRoot, `node_modules/${coreModulesPackageName}`), resolve(projectRoot, 'node_modules'), `node_modules/${coreModulesPackageName}`, 'node_modules'],
            alias,
            // resolve symlinks to symlinked modules
            symlinks: true
        },
        resolveLoader: {
            // don't resolve symlinks to symlinked loaders
            symlinks: false
        },
        node: {
            // Disable node shims that conflict with NativeScript
            http: false,
            timers: false,
            setImmediate: false,
            fs: 'empty',
            crypto: 'empty',
            __dirname: false
        },
        devtool: inlineSourceMap ? 'inline-cheap-source-map' : false,
        optimization: {
            runtimeChunk: 'single',
            noEmitOnErrors: true,
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        name: 'vendor',
                        chunks: 'all',
                        test: module => {
                            const moduleName = module.nameForCondition ? module.nameForCondition() : '';
                            return (
                                /[\\/]node_modules[\\/]/.test(moduleName) ||
                                /@nativescript\/core/.test(moduleName) ||
                                appComponents.some(comp => comp === moduleName) ||
                                (params.chunkTestCallback && params.chunkTestCallback(moduleName))
                            );
                        },
                        enforce: true
                    }
                }
            },
            minimize: uglify !== undefined ? uglify : production,
            minimizer: [
                new TerserPlugin(
                    mergeOptions(
                        {
                            parallel: true,
                            cache: true,
                            sourceMap: isAnySourceMapEnabled,
                            terserOptions: {
                                ecma: 6,
                                // warnings: true,
                                // toplevel: true,
                                output: {
                                    comments: false,
                                    semicolons: !isAnySourceMapEnabled
                                },
                                compress: {
                                    // The Android SBG has problems parsing the output
                                    // when these options are enabled
                                    collapse_vars: platform !== 'android',
                                    sequences: platform !== 'android',
                                    passes: 2
                                },
                                keep_fnames: true
                            }
                        },
                        params.terserOptions || {}
                    )
                )
            ]
        },
        module: {
            rules: [
                {
                    // test: new RegExp(entryPath + '.(js|ts)'),
                    include: [join(appFullPath, entryPath + '.js'), join(appFullPath, entryPath + '.ts')],

                    use: [
                        // Require all Android app components
                        platform === 'android' && {
                            loader: 'nativescript-dev-webpack/android-app-components-loader',
                            options: { modules: appComponents }
                        },

                        {
                            loader: 'nativescript-dev-webpack/bundle-config-loader',
                            options: {
                                // registerPages: true, // applicable only for non-angular apps
                                loadCss: !snapshot, // load the application css if in debug mode
                                unitTesting,
                                appFullPath,
                                projectRoot,
                                ignoredFiles: nsWebpack.getUserDefinedEntries(entries, platform)
                            }
                        }
                    ].filter(loader => Boolean(loader))
                },
                {
                    // rules to replace mdi icons and not use nativescript-font-icon
                    test: /\.(ts|js|css|svelte)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'mdi-([a-z-]+)',
                                replace: (match, p1, offset, string) => {
                                    if (mdiIcons[p1]) {
                                        return String.fromCharCode(parseInt(mdiIcons[p1], 16));
                                    }
                                    return match;
                                },
                                flags: 'g'
                            }
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'forecastfont-([a-z-]+)',
                                replace: (match, p1, offset, string) => {
                                    if (forecastIcons[p1]) {
                                        return String.fromCharCode(parseInt(forecastIcons[p1], 16));
                                    }
                                    return match;
                                },
                                flags: 'g'
                            }
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: 'wi-([a-z0-9-]+)',
                                replace: (match, p1, offset, string) => {
                                    if (weatherIcons[p1]) {
                                        return String.fromCharCode(parseInt(weatherIcons[p1], 16));
                                    }
                                    return match;
                                },
                                flags: 'g'
                            }
                        }
                    ]
                },
                {
                    test: /\.(ts|css|scss|html|xml)$/,
                    use: 'nativescript-dev-webpack/hmr/hot-loader'
                },

                { test: /\.(html|xml)$/, use: 'nativescript-dev-webpack/xml-namespace-loader' },

                {
                    test: /\.css$/,
                    use: 'nativescript-dev-webpack/css2json-loader'
                },

                {
                    test: /\.scss$/,
                    exclude: /\.module\.scss$/,
                    use: [
                        {
                            loader: 'nativescript-dev-webpack/css2json-loader',
                            options: { useForImports: true }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                data: scssPrepend
                            }
                        }
                    ]
                },
                {
                    test: /\.module\.scss$/,
                    use: [
                        { loader: 'css-loader', options: { url: false } },
                        {
                            loader: 'sass-loader',
                            options: {
                                data: scssPrepend
                            }
                        }
                    ]
                },
                // {
                //     test: /\.js$/,
                //     // exclude: /node_modules/,
                //     use: [
                //         {
                //             loader: 'string-replace-loader',
                //             options: {
                //                 search: '\\/\\*\\* @class \\*\\/',
                //                 replace: '/*@__PURE__*/',
                //                 flags: 'g'
                //             }
                //         }
                //     ]
                // },
                {
                    test: /\.mjs$/,
                    type: 'javascript/auto'
                },
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: resolve(tsconfig),
                            transpileOnly: true,
                            allowTsInNodeModules: true,
                            compilerOptions: {
                                sourceMap: isAnySourceMapEnabled,
                                declaration: false
                            }
                        }
                    }
                },
                {
                    test: /\.svelte$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'svelte-loader-hot',
                            options: {
                                preprocess: require('svelte-preprocess')(
                                    Object.assign(
                                        {
                                            typescript: {
                                                compilerOptions: {
                                                    module: 'es6'
                                                }
                                            }
                                        },
                                        svelteNativePreprocessor()
                                    )
                                ),
                                hotReload: hmr,
                                hotOptions: {
                                    native: hmr
                                }
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            // Define useful constants like TNS_WEBPACK
            new webpack.EnvironmentPlugin(
                mergeOptions(
                    {
                        NODE_ENV: JSON.stringify(mode), // use 'development' unless process.env.NODE_ENV is defined
                        DEBUG: false
                    },
                    params.environmentPlugin || {}
                )
            ),
            new webpack.DefinePlugin(defines),
            // Remove all files from the out dir.
            new CleanWebpackPlugin({
                dangerouslyAllowCleanPatternsOutsideProject: true,
                dry: false,
                verbose: !!verbose,
                cleanOnceBeforeBuildPatterns: itemsToClean
            }),
            // Copy assets to out dir. Add your own globs as needed.
            new CopyWebpackPlugin(
                [
                    { from: 'fonts/!(ios|android)/**/*', to: 'fonts', flatten: true },
                    { from: 'fonts/*', to: 'fonts', flatten: true },
                    { from: `fonts/${platform}/**/*`, to: 'fonts', flatten: true },
                    { from: '**/*.+(jpg|png)' },
                    { from: 'assets/**/*' },
                    {
                        from: '../node_modules/@mdi/font/fonts/materialdesignicons-webfont.ttf',
                        to: 'fonts'
                    },
                    {
                        from: '../node_modules/weather-icons/font/weathericons-regular-webfont.ttf',
                        to: 'fonts'
                    }
                ].concat(params.copyPlugin || []),
                {
                    ignore: [`${relative(appPath, appResourcesFullPath)}/**`]
                }
            ),
            // we use platform name to identify ios/android files in Sentry
            new nsWebpack.GenerateNativeScriptEntryPointsPlugin('bundle'),

            // For instructions on how to set up workers with webpack
            // check out https://github.com/nativescript/worker-loader
            new NativeScriptWorkerPlugin(),
            new nsWebpack.PlatformFSPlugin({
                platform,
                platforms
            }),
            // Does IPC communication with the {N} CLI to notify events when running in watch mode.
            new nsWebpack.WatchStateLoggerPlugin()
        ]
    };

    if (hiddenSourceMap || sourceMap) {
        if (!!sentry) {
            // const sourceMapFilename = nsWebpack.getSourceMapFilename(hiddenSourceMap, __dirname, dist);

            config.plugins.push(
                new webpack.SourceMapDevToolPlugin(
                    mergeOptions(
                        {
                            append: `\n//# sourceMappingURL=${process.env.SENTRY_PREFIX}[name].js.map`,
                            filename: join(process.env.SOURCEMAP_REL_DIR, '[name].js.map')
                        },
                        params.sourceMapPlugin || {}
                    )
                )
            );
            let appVersion;
            let buildNumber;
            if (platform === 'android') {
                appVersion = readFileSync('app/App_Resources/Android/app.gradle', 'utf8').match(/versionName "((?:[0-9]+\.?)+)"/)[1];
                buildNumber = readFileSync('app/App_Resources/Android/app.gradle', 'utf8').match(/versionCode ([0-9]+)/)[1];
            } else if (platform === 'ios') {
                appVersion = readFileSync('app/App_Resources/iOS/Info.plist', 'utf8').match(/<key>CFBundleShortVersionString<\/key>[\s\n]*<string>(.*?)<\/string>/)[1];
                buildNumber = readFileSync('app/App_Resources/iOS/Info.plist', 'utf8').match(/<key>CFBundleVersion<\/key>[\s\n]*<string>([0-9]*)<\/string>/)[1];
            }
            console.log('appVersion', appVersion, buildNumber);

            config.plugins.push(
                new SentryCliPlugin({
                    release: appVersion,
                    urlPrefix: 'app:///',
                    rewrite: true,
                    dist: `${buildNumber}.${platform}`,
                    ignore: ['tns-java-classes', 'hot-update'],
                    include: [dist, join(dist, process.env.SOURCEMAP_REL_DIR)]
                })
            );
        } else {
            config.plugins.push(
                new webpack.SourceMapDevToolPlugin(
                    mergeOptions(
                        {
                            noSources: true
                            //  fileContext:params.sourceMapPublicPath
                            // publicPath: params.sourceMapPublicPath || '~/',
                            // fileContext:sourceMapsDist,
                            // noSources:true,
                            // moduleFilenameTemplate: info => {
                            //     let filePath = info.identifier;
                            //     console.log( 'filePath', filePath);
                            //     if (filePath.startsWith('./')) {
                            //         filePath = './app' + filePath.slice(1);
                            //     }
                            //     // if (filePath.startsWith('file:///')) {
                            //     //     filePath = './app' + filePath.slice(1);
                            //     // }
                            //     return filePath.replace('file:///', '');
                            // }
                        },
                        params.sourceMapPlugin || {}
                    )
                )
            );
        }
    }

    if (unitTesting) {
        config.module.rules.push(
            {
                test: /-page\.js$/,
                use: 'nativescript-dev-webpack/script-hot-loader'
            },
            {
                test: /\.(ts|css|scss|html|xml)$/,
                use: 'nativescript-dev-webpack/hmr/hot-loader'
            },

            {
                test: /\.(html|xml)$/,
                use: 'nativescript-dev-webpack/xml-namespace-loader'
            }
        );
    }

    if (!!report) {
        // Generate report files for bundles content
        config.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: resolve(projectRoot, 'report', 'report.html')
            })
        );
    }

    if (!!snapshot) {
        const options = mergeOptions(
            {
                chunk: 'vendor',
                requireModules: ['tns-core-modules/bundle-entry-points'],
                projectRoot,
                targetArchs: params.targetArchs,
                snapshotInDocker,
                skipSnapshotTools,
                useLibs
            },
            params.snapshotPlugin
        );
        config.plugins.push(new nsWebpack.NativeScriptSnapshotPlugin(Object.assign(options, { webpackConfig: config })));
    }

    if (!!hmr) {
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    if (!!production) {
        config.plugins.push(
            new ForkTsCheckerWebpackPlugin({
                tsconfig: resolve(tsconfig),
                async: false,
                useTypescriptIncrementalApi: true,
                checkSyntacticErrors: true,
                memoryLimit: 4096,
                workers: 1
            })
        );
    }

    return config;
};
