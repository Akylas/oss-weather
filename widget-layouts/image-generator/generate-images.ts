#!/usr/bin/env node
/**
 * Widget Image Generator
 * Generates preview images of widgets using Puppeteer and the HTML renderer
 */
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { pathToFileURL } from 'url'; // << add this
// Import HTML renderer (will be compiled from html-renderer.ts)
import type { WidgetData, WidgetLayout } from '../renderers/html-renderer';
import { generateWidgetPreviewPage, renderWidgetToHtml } from '../renderers/html-renderer';

// Convert local path into embedded data URI so puppeteer can render it inside page.setContent()
function toDataUrlIfLocal(p: string | undefined): string | undefined {
    if (!p) return p;
    try {
        const abs = path.isAbsolute(p) ? p : path.resolve(__dirname, '..', '..', p);
        if (!fs.existsSync(abs)) return p;
        const ext = path.extname(abs).slice(1).toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
        const buff = fs.readFileSync(abs);
        return `data:${mime};base64,${buff.toString('base64')}`;
    } catch {
        return p;
    }
}

// Sample weather data for previews
const SAMPLE_DATA: WidgetData = {
    temperature: '8°C',
    locationName: 'Grenoble',
    description: 'Partly Cloudy',
    // Convert local path into embedded data URI so puppeteer can render it inside page.setContent()
    iconPath: toDataUrlIfLocal(path.resolve(__dirname, '../../app/assets/icon_themes/meteocons/images/200d.png')),
    hourlyData: [
        { hour: '12:00', temperature: '8°C', iconPath: 'partly_cloudy', precipAccumulation: '' },
        { hour: '13:00', temperature: '9°C', iconPath: 'sunny', precipAccumulation: '' },
        { hour: '14:00', temperature: '10°C', iconPath: 'sunny', precipAccumulation: '' },
        { hour: '15:00', temperature: '10°C', iconPath: 'cloudy', precipAccumulation: '' },
        { hour: '16:00', temperature: '9°C', iconPath: 'cloudy', precipAccumulation: '2mm' },
        { hour: '17:00', temperature: '8°C', iconPath: 'rainy', precipAccumulation: '5mm' },
        { hour: '18:00', temperature: '7°C', iconPath: 'rainy', precipAccumulation: '3mm' },
        { hour: '19:00', temperature: '6°C', iconPath: 'cloudy', precipAccumulation: '' }
    ],
    dailyData: [
        { day: 'Today', temperatureHigh: '10°C', temperatureLow: '5°C', iconPath: 'partly_cloudy', precipAccumulation: '' },
        { day: 'Tomorrow', temperatureHigh: '12°C', temperatureLow: '6°C', iconPath: 'sunny', precipAccumulation: '' },
        { day: 'Wednesday', temperatureHigh: '8°C', temperatureLow: '4°C', iconPath: 'rainy', precipAccumulation: '8mm' },
        { day: 'Thursday', temperatureHigh: '9°C', temperatureLow: '5°C', iconPath: 'cloudy', precipAccumulation: '' },
        { day: 'Friday', temperatureHigh: '11°C', temperatureLow: '6°C', iconPath: 'sunny', precipAccumulation: '' }
    ]
};

// Widget sizes to generate
interface WidgetSize {
    width: number;
    height: number;
    name: string;
}

const WIDGET_SIZES: WidgetSize[] = [
    { width: 80, height: 80, name: 'small' },
    { width: 120, height: 120, name: 'medium' },
    { width: 260, height: 120, name: 'wide' },
    { width: 360, height: 180, name: 'large' }
];

/**
 * Generate an image from a widget layout
 */
async function generateWidgetImage(browser: Browser, layout: WidgetLayout, size: { width: number; height: number }, outputPath: string): Promise<void> {
    const page = await browser.newPage();

    // Debug logging for resource failures
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('requestfailed', (req) => console.warn('Request failed:', req.url(), req.failure()?.errorText));

    try {
        // Set viewport slightly larger than widget for padding
        await page.setViewport({
            width: size.width + 40,
            height: size.height + 40
        });

        // Generate HTML content
        const html = generateWidgetPreviewPage(layout, SAMPLE_DATA, size);

        // Set the content and provide a base URL so relative asset paths inside HTML resolve (if the renderer uses relative paths)
        const baseUrl = pathToFileURL(path.resolve(__dirname, '../../app')).href;
        await page.setContent(html, { waitUntil: 'networkidle0', url: baseUrl });

        // Wait for the widget container to be visible
        await page.waitForSelector('.widget-container', { visible: true });

        // Take screenshot
        const element = await page.$('.widget-container');
        if (element) {
            await element.screenshot({
                path: outputPath,
                type: 'png'
            });
        } else {
            // Fallback to full page screenshot
            await page.screenshot({
                path: outputPath,
                type: 'png',
                clip: {
                    x: 20,
                    y: 20,
                    width: size.width,
                    height: size.height
                }
            });
        }

        console.log(`Generated: ${outputPath}`);
    } finally {
        await page.close();
    }
}

/**
 * Generate all widget preview images
 */
async function generateAllWidgetImages(layoutsDir: string, outputDir: string, sizes?: WidgetSize[]): Promise<void> {
    const sizesToUse = sizes || WIDGET_SIZES;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Get all widget layout files
        const widgetFiles = fs.readdirSync(layoutsDir).filter((f) => f.endsWith('.json'));

        for (const file of widgetFiles) {
            const layoutPath = path.join(layoutsDir, file);
            const layout: WidgetLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));

            // Create widget-specific output directory
            const widgetOutputDir = path.join(outputDir, layout.name);
            if (!fs.existsSync(widgetOutputDir)) {
                fs.mkdirSync(widgetOutputDir, { recursive: true });
            }

            // Generate images for each size
            for (const size of sizesToUse) {
                const outputPath = path.join(widgetOutputDir, `${size.name}-${size.width}x${size.height}.png`);
                await generateWidgetImage(browser, layout, size, outputPath);
            }

            // Also generate images for the widget's supported sizes if specified
            if (layout.supportedSizes) {
                for (const supportedSize of layout.supportedSizes) {
                    const sizeName = `${supportedSize.family}-${supportedSize.width}x${supportedSize.height}`;
                    const outputPath = path.join(widgetOutputDir, `${sizeName}.png`);

                    // Skip if already generated
                    if (!fs.existsSync(outputPath)) {
                        await generateWidgetImage(browser, layout, supportedSize, outputPath);
                    }
                }
            }
        }
    } finally {
        await browser.close();
    }
}

/**
 * Generate a combined preview image showing multiple widgets
 */
async function generateCombinedPreview(layoutsDir: string, outputPath: string): Promise<void> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
        page.on('requestfailed', (req) => console.warn('Request failed:', req.url(), req.failure()?.errorText));

        // Get all widget layouts
        const widgetFiles = fs.readdirSync(layoutsDir).filter((f) => f.endsWith('.json'));
        const layouts: WidgetLayout[] = widgetFiles.map((file) => {
            const layoutPath = path.join(layoutsDir, file);
            return JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
        });

        // Generate HTML with all widgets
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Widget Preview Gallery</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 40px;
            min-height: 100vh;
        }
        h1 {
            color: #fff;
            text-align: center;
            margin-bottom: 40px;
            font-size: 24px;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .widget-item {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 20px;
        }
        .widget-name {
            color: #fff;
            font-size: 14px;
            margin-bottom: 16px;
            text-align: center;
        }
        .widget-preview {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    </style>
</head>
<body>
    <h1>Weather Widgets Preview</h1>
    <div class="gallery">`;

        for (const layout of layouts) {
            const widgetHtml = renderWidgetToHtml(layout, SAMPLE_DATA, { width: 200, height: 200 });
            html += `
        <div class="widget-item">
            <div class="widget-name">${layout.displayName || layout.name}</div>
            <div class="widget-preview">${widgetHtml}</div>
        </div>`;
        }

        html += `
    </div>
</body>
</html>`;

        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Wait for the gallery to be visible
        await page.waitForSelector('.gallery', { visible: true });

        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: true
        });

        console.log(`Generated combined preview: ${outputPath}`);

        await page.close();
    } finally {
        await browser.close();
    }
}

// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    const layoutsDir = path.join(__dirname, '..', 'widgets');
    const outputDir = path.join(__dirname, 'output');

    switch (command) {
        case 'all':
            console.log('Generating all widget images...');
            await generateAllWidgetImages(layoutsDir, outputDir);
            console.log('Done!');
            break;

        case 'combined':
            console.log('Generating combined preview...');
            await generateCombinedPreview(layoutsDir, path.join(outputDir, 'widgets-preview.png'));
            console.log('Done!');
            break;

        case 'single':
            const widgetName = args[1];
            if (!widgetName) {
                console.error('Usage: generate-images.ts single <widgetName>');
                process.exit(1);
            }
            console.log(`Generating images for ${widgetName}...`);
            const layout: WidgetLayout = JSON.parse(fs.readFileSync(path.join(layoutsDir, `${widgetName}.json`), 'utf-8'));
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
            for (const size of WIDGET_SIZES) {
                const output = path.join(outputDir, widgetName, `${size.name}.png`);
                if (!fs.existsSync(path.dirname(output))) {
                    fs.mkdirSync(path.dirname(output), { recursive: true });
                }
                await generateWidgetImage(browser, layout, size, output);
            }
            await browser.close();
            console.log('Done!');
            break;

        default:
            console.log(`
Widget Image Generator

Usage:
  npx ts-node generate-images.ts [command]

Commands:
  all       Generate images for all widgets (default)
  combined  Generate a combined gallery preview
  single    Generate images for a single widget
            Usage: single <widgetName>

Examples:
  npx ts-node generate-images.ts all
  npx ts-node generate-images.ts combined
  npx ts-node generate-images.ts single SimpleWeatherWidget
`);
    }
}

main().catch(console.error);

