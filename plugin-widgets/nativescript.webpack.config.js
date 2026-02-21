const nsWebpack = require('@akylas/nativescript-webpack');
const { basename, join, relative, resolve } = require('path');
const LiveWidgetPreviewPlugin = require('./scripts/LiveWidgetPreviewPlugin');
module.exports = (env, params = {}) => {
    const {
        appId,
        appPath,
        appResourcesPath,
        liveWidgetPreviews = false, // --env.liveWidgetPreviews
        production
    } = env;
    env.appComponents = env.appComponents || [];
    env.appComponents.push('~/android/widgetconfigactivity', '~/android/WidgetUpdateReceiver');

    const projectRoot = params.projectRoot || '../';
    const appResourcesFullPath = resolve(projectRoot, appResourcesPath);

    const globOptions = { dot: false, ignore: [`**/${relative(appPath, appResourcesFullPath)}/**`] };
    params.copyPatterns = [
        {
            context: join(__dirname, 'src', 'widgets'),
            from: 'samples/*.sample.json',
            to: 'widget-layouts/widgets/samples/[name][ext]',
            noErrorOnMissing: true,
            globOptions,
            transform: !!production
                ? {
                      transformer: (content, path) => Promise.resolve(Buffer.from(JSON.stringify(JSON.parse(content.toString())), 'utf8'))
                  }
                : undefined
        },
        {
            context: join(__dirname, 'src', 'widgets'),
            from: '*.json',
            to: 'widget-layouts/widgets/[name][ext]',
            noErrorOnMissing: true,
            globOptions,
            transform: !!production
                ? {
                      transformer: (content, path) => {
                          const { name, displayName, description, supportedSizes, ...rest } = JSON.parse(content.toString());

                          return Promise.resolve(Buffer.from(JSON.stringify({ name, displayName, description, supportedSizes }), 'utf8'));
                      }
                  }
                : undefined
        }
    ];

    nsWebpack.chainWebpack((config, env) => {
        config.externals([
            function ({ context, request }, cb) {
                if (/plugin-widgets\/data\/widgets\/samples/i.test(context)) {
                    return cb(null, join('plugin-widgets/widgets/data/samples', basename(request)));
                }
                if (/plugin-widgets\/data\/widgets/i.test(context)) {
                    return cb(null, join('plugin-widgets/widgets/data/widgets', basename(request)));
                }
                cb();
            }
        ]);
        // Add LiveWidgetPreviewPlugin for development
        if (liveWidgetPreviews) {
            config.plugin('livewidgets').use(LiveWidgetPreviewPlugin, [
                {
                    enabled: true,
                    widgetsDir: join(__dirname, 'widgets'),
                    generatorScript: join(__dirname, 'renderers', 'generate-svelte-components.ts'),
                    debounceMs: 0
                }
            ]);
            console.log('[LiveWidgetPreviews] Enabled - widget JSON changes will trigger Svelte component regeneration');
        }

        return config;
    });
};
