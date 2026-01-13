import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { generateWidgetPreviewPage, renderWidgetToHtml } from './renderers/html-renderer'; // added import

const rootDir = path.resolve(__dirname);
const widgetsDir = path.join(rootDir, 'widgets');
const widgetsSamplesDir = path.join(widgetsDir, 'samples');
const appAssetsBase = path.join(rootDir, '..', 'app', 'assets');
const iconImagesPath = path.join(appAssetsBase, 'icon_themes', 'meteocons', 'images');

// Custom sizes per widget for testing (beyond supportedSizes in JSON)
// Add additional test sizes for any widget here
const customSizes: Record<string, Array<{ width: number; height: number }>> = {
    // Example: test SimpleWeatherWidget at additional sizes
    // SimpleWeatherWidget: [
    //     { width: 100, height: 100 },
    //     { width: 250, height: 120 },
    //     { width: 300, height: 200 }
    // ]
};

function safeReadJSON(filePath: string) {
    try {
        const raw = fsSync.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

async function ensureSampleFile(widgetPath: string, widgetName: string) {
    const samplePath = path.join(widgetPath, 'samples', `${widgetName}.sample.json`);
    const exists = fsSync.existsSync(samplePath);
    console.log('ensureSampleFile', samplePath, exists);
    const raw = await fs.readFile(samplePath, 'utf-8');
    return JSON.parse(raw);
}

export default defineConfig({
    root: rootDir,
    server: {
        host: true,
        port: 5174
    },
    plugins: [
        {
            name: 'widget-preview-api',
            async configureServer(server) {
                // On start, make sure all widgets have sample file
                try {
                    const widgetFiles = (await fs.readdir(widgetsDir)).filter((f) => f.endsWith('.json'));
                    for (const file of widgetFiles) {
                        const raw = await fs.readFile(path.join(widgetsDir, file), 'utf-8');
                        const layout = JSON.parse(raw);
                        if (layout?.name) {
                            await ensureSampleFile(widgetsDir, layout.name);
                        }
                    }
                } catch (err) {
                    // no-op on error
                }

                // virtual assets endpoint to serve icons and static assets
                server.middlewares.use(async (req, res, next) => {
                    try {
                        if (!req.url) return next();
                        const url = new URL(req.url, `http://${req.headers.host}`);

                        // serve icon images: /assets/icon_themes/meteocons/images/<id>.png
                        if (url.pathname.startsWith('/assets/')) {
                            const rel = url.pathname.replace('/assets/', '');
                            const filePath = path.join(appAssetsBase, rel);
                            if (fsSync.existsSync(filePath)) {
                                const ext = path.extname(filePath).slice(1) || 'png';
                                const buffer = fsSync.readFileSync(filePath);
                                res.setHeader('Content-Type', `image/${ext}`);
                                res.end(buffer);
                                return;
                            }
                        }

                        // list widgets
                        if (url.pathname === '/api/widgets') {
                            const files = await fs.readdir(widgetsDir);
                            const widgets: any[] = [];
                            for (const f of files.filter((f) => f.endsWith('.json'))) {
                                try {
                                    const raw = await fs.readFile(path.join(widgetsDir, f), 'utf-8');
                                    const layout = JSON.parse(raw);
                                    // Merge supportedSizes from JSON with customSizes from config
                                    const baseSizes = layout.supportedSizes || [];
                                    const extraSizes = customSizes[layout.name] || [];
                                    const allSizes = [...baseSizes, ...extraSizes];
                                    widgets.push({
                                        name: layout.name,
                                        displayName: layout.displayName,
                                        supportedSizes: allSizes
                                    });
                                } catch (e) {
                                    // ignore parse errors
                                }
                            }
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(widgets));
                            return;
                        }

                        // list sample sets for a widget
                        if (url.pathname === '/api/samples') {
                            const widgetName = url.searchParams.get('name') || '';
                            const widgetFile = (await fs.readdir(widgetsDir)).find((f) => f.endsWith('.json') && safeReadJSON(path.join(widgetsDir, f))?.name === widgetName);
                            if (!widgetFile) {
                                res.statusCode = 404;
                                res.end(`Widget ${widgetName} not found`);
                                return;
                            }
                            // await ensureSampleFile(widgetsSamplesDir, widgetName); // ensure exists
                            const samplePath = path.join(widgetsSamplesDir, `${widgetName}.sample.json`);
                            const raw = await fs.readFile(samplePath, 'utf-8');
                            const samples = JSON.parse(raw);
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ sets: Object.keys(samples) }));
                            return;
                        }

                        // Render a widget HTML for preview
                        if (url.pathname === '/api/widget') {
                            const params = url.searchParams;
                            const name = params.get('name') || '';
                            const width = parseInt(params.get('width') || '160', 10);
                            const height = parseInt(params.get('height') || '160', 10);
                            const setName = params.get('set') || 'default';
                            const theme = params.get('theme') || 'dark'; // default dark as app has dark theme

                            // read widget layout json
                            const files = await fs.readdir(widgetsDir);
                            let foundLayout: any = null;
                            for (const f of files.filter((f) => f.endsWith('.json'))) {
                                const raw = await fs.readFile(path.join(widgetsDir, f), 'utf-8');
                                const layout = JSON.parse(raw);
                                if (layout.name === name) {
                                    foundLayout = layout;
                                    break;
                                }
                            }
                            if (!foundLayout) {
                                res.statusCode = 404;
                                res.end(`Widget ${name} not found`);
                                return;
                            }

                            // ensure sample file exists and load the requested set
                            const sampleObj = await ensureSampleFile(widgetsDir, name);
                            const sampleData = sampleObj[setName] || sampleObj.default || Object.values(sampleObj)[0];

                            // create a preview HTML using html-renderer and pass a base path for icons
                            const assetsBaseUrl = '/assets/icon_themes/meteocons/images';
                            const html = generateWidgetPreviewPage(foundLayout, sampleData, { width, height }, assetsBaseUrl, theme);
                            res.setHeader('Content-Type', 'text/html');
                            res.end(html);
                            return;
                        }

                        // New endpoint: /api/widget-fragment returns the widget HTML fragment to be inserted in page
                        if (url.pathname === '/api/widget-fragment') {
                            const params = url.searchParams;
                            const name = params.get('name') || '';
                            const width = parseInt(params.get('width') || '160', 10);
                            const height = parseInt(params.get('height') || '160', 10);
                            const setName = params.get('set') || 'default';
                            const theme = params.get('theme') || 'dark';

                            const files = await fs.readdir(widgetsDir);
                            let foundLayout: any = null;
                            for (const f of files.filter((f) => f.endsWith('.json'))) {
                                try {
                                    const raw = await fs.readFile(path.join(widgetsDir, f), 'utf-8');
                                    const layout = JSON.parse(raw);
                                    if (layout.name === name) {
                                        foundLayout = layout;
                                        break;
                                    }
                                } catch {
                                    // skip invalid json
                                }
                            }
                            if (!foundLayout) {
                                // Return an empty fragment so the client can simply omit this column
                                res.setHeader('Content-Type', 'text/html');
                                res.end('');
                                return;
                            }

                            // Load sample set
                            let sampleData: any = {};
                            try {
                                const samplePath = path.join(widgetsDir, 'samples', `${name}.sample.json`);
                                const sampleRaw = await fs.readFile(samplePath, 'utf-8');
                                const sampleParsed = JSON.parse(sampleRaw);
                                sampleData = sampleParsed[setName] ?? sampleParsed.default ?? Object.values(sampleParsed)[0] ?? {};
                            } catch {
                                sampleData = {};
                            }

                            try {
                                // Use renderWidgetToHtml which returns the wrapper div fragment (no full page)
                                const fragment = renderWidgetToHtml(
                                    foundLayout,
                                    sampleData,
                                    { width, height },
                                    theme === 'light'
                                        ? {
                                              onSurface: '#0b2736',
                                              onSurfaceVariant: '#2a3940',
                                              primary: '#0ea5b7',
                                              widgetBackground: '#ffffff',
                                              surface: '#f6f7f9'
                                          }
                                        : {
                                              onSurface: '#E6E1E5',
                                              onSurfaceVariant: '#CAC4D0',
                                              primary: '#D0BCFF',
                                              widgetBackground: '#1C1B1F',
                                              surface: '#2B2930'
                                          }
                                );

                                res.setHeader('Content-Type', 'text/html');
                                res.end(fragment);
                            } catch (e) {
                                // On render errors, return empty fragment so no error shows in the page
                                res.setHeader('Content-Type', 'text/html');
                                res.end('');
                            }
                            return;
                        }
                        return next();
                    } catch (e) {
                        // fallback to next on error
                        return next();
                    }
                });

                // watch widgets directory and trigger full reload when JSON changes
                server.watcher.add(widgetsDir);
                server.watcher.on('change', (p) => {
                    if (p.startsWith(widgetsDir)) {
                        server.ws.send({ type: 'full-reload' });
                    }
                });
                // Also watch assets folder to reload when icons change
                server.watcher.add(iconImagesPath);
            }
        }
    ]
});
