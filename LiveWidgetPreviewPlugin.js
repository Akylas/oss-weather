/**
 * Webpack plugin for live widget preview development
 * Watches widget JSON files and regenerates Svelte components on change
 */
const { join } = require('path');
const { watch } = require('fs');
const { exec } = require('child_process');

class LiveWidgetPreviewPlugin {
    constructor(options = {}) {
        this.widgetsDir = options.widgetsDir || join(__dirname, 'widget-layouts/widgets');
        this.generatorScript = options.generatorScript || join(__dirname, 'widget-layouts/renderers/generate-svelte-components.ts');
        this.enabled = options.enabled || false;
        this.debounceMs = options.debounceMs || 300;
        this.watchers = [];
        this.debounceTimers = new Map();
    }

    apply(compiler) {
        if (!this.enabled) {
            return;
        }

        compiler.hooks.watchRun.tapAsync('LiveWidgetPreviewPlugin', (compilation, callback) => {
            if (this.watchers.length === 0) {
                this.startWatching();
            }
            callback();
        });

        compiler.hooks.shutdown.tap('LiveWidgetPreviewPlugin', () => {
            this.stopWatching();
        });
    }

    startWatching() {
        console.log('[LiveWidgetPreview] Starting to watch widget JSON files...');
        
        try {
            const watcher = watch(
                this.widgetsDir,
                { recursive: false },
                (eventType, filename) => {
                    if (filename && filename.endsWith('.json') && !filename.includes('.sample.')) {
                        this.handleFileChange(filename);
                    }
                }
            );

            this.watchers.push(watcher);
            console.log('[LiveWidgetPreview] Watching:', this.widgetsDir);
        } catch (error) {
            console.error('[LiveWidgetPreview] Error starting watcher:', error);
        }
    }

    stopWatching() {
        this.watchers.forEach(watcher => {
            try {
                watcher.close();
            } catch (error) {
                console.error('[LiveWidgetPreview] Error stopping watcher:', error);
            }
        });
        this.watchers = [];
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
    }

    handleFileChange(filename) {
        const widgetName = filename.replace('.json', '');
        
        // Clear existing debounce timer for this file
        if (this.debounceTimers.has(filename)) {
            clearTimeout(this.debounceTimers.get(filename));
        }

        // Set new debounce timer
        const timer = setTimeout(() => {
            this.regenerateComponent(widgetName, filename);
            this.debounceTimers.delete(filename);
        }, this.debounceMs);

        this.debounceTimers.set(filename, timer);
    }

    regenerateComponent(widgetName, filename) {
        console.log(`[LiveWidgetPreview] Regenerating component for: ${filename}`);

        // Use the nativescript-svelte-generator with tsx (faster and no compilation needed)
        const widgetsDir = join(__dirname, 'widget-layouts/widgets');
        const outputDir = join(__dirname, 'app/components/widgets/generated');
        const generatorPath = join(__dirname, 'widget-layouts/generators/nativescript-svelte-generator.ts');
        const command = `cd ${join(__dirname, 'widget-layouts')} && npx tsx "${generatorPath}" "${widgetsDir}" "${outputDir}" "${widgetName}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`[LiveWidgetPreview] Error regenerating ${widgetName}:`, error.message);
                if (stderr) console.error(stderr);
                return;
            }

            if (stdout) {
                // Filter out npm warnings and debug console.logs
                const cleanOutput = stdout
                    .split('\n')
                    .filter(line => !line.includes('npm warn') && !line.includes('attrName'))
                    .join('\n')
                    .trim();
                if (cleanOutput) {
                    console.log(cleanOutput);
                }
            }
            console.log(`[LiveWidgetPreview] ✓ ${widgetName} component regenerated`);
        });
    }
}

module.exports = LiveWidgetPreviewPlugin;
