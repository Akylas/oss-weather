#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Widget Image Generator
 * Generates preview images of widgets using Puppeteer and the HTML renderer
 */
var fs = require("fs");
var path = require("path");
var puppeteer_1 = require("puppeteer");
var html_renderer_1 = require("../renderers/html-renderer");
// Sample weather data for previews
var SAMPLE_DATA = {
    temperature: '8°C',
    locationName: 'Grenoble',
    description: 'Partly Cloudy',
    iconPath: 'partly_cloudy',
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
var WIDGET_SIZES = [
    { width: 80, height: 80, name: 'small' },
    { width: 120, height: 120, name: 'medium' },
    { width: 260, height: 120, name: 'wide' },
    { width: 360, height: 180, name: 'large' }
];
/**
 * Generate an image from a widget layout
 */
function generateWidgetImage(browser, layout, size, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var page, html, element;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 11, 13]);
                    // Set viewport slightly larger than widget for padding
                    return [4 /*yield*/, page.setViewport({
                            width: size.width + 40,
                            height: size.height + 40
                        })];
                case 3:
                    // Set viewport slightly larger than widget for padding
                    _a.sent();
                    html = (0, html_renderer_1.generateWidgetPreviewPage)(layout, SAMPLE_DATA, size);
                    // Set the content
                    return [4 /*yield*/, page.setContent(html, { waitUntil: 'networkidle0' })];
                case 4:
                    // Set the content
                    _a.sent();
                    // Wait for the widget container to be visible
                    return [4 /*yield*/, page.waitForSelector('.widget-container', { visible: true })];
                case 5:
                    // Wait for the widget container to be visible
                    _a.sent();
                    return [4 /*yield*/, page.$('.widget-container')];
                case 6:
                    element = _a.sent();
                    if (!element) return [3 /*break*/, 8];
                    return [4 /*yield*/, element.screenshot({
                            path: outputPath,
                            type: 'png'
                        })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 8: 
                // Fallback to full page screenshot
                return [4 /*yield*/, page.screenshot({
                        path: outputPath,
                        type: 'png',
                        clip: {
                            x: 20,
                            y: 20,
                            width: size.width,
                            height: size.height
                        }
                    })];
                case 9:
                    // Fallback to full page screenshot
                    _a.sent();
                    _a.label = 10;
                case 10:
                    console.log("Generated: ".concat(outputPath));
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, page.close()];
                case 12:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate all widget preview images
 */
function generateAllWidgetImages(layoutsDir, outputDir, sizes) {
    return __awaiter(this, void 0, void 0, function () {
        var sizesToUse, browser, widgetFiles, _i, widgetFiles_1, file, layoutPath, layout, widgetOutputDir, _a, sizesToUse_1, size, outputPath, _b, _c, supportedSize, sizeName, outputPath;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    sizesToUse = sizes || WIDGET_SIZES;
                    // Ensure output directory exists
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    return [4 /*yield*/, puppeteer_1.default.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 1:
                    browser = _d.sent();
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, , 13, 15]);
                    widgetFiles = fs.readdirSync(layoutsDir).filter(function (f) { return f.endsWith('.json'); });
                    _i = 0, widgetFiles_1 = widgetFiles;
                    _d.label = 3;
                case 3:
                    if (!(_i < widgetFiles_1.length)) return [3 /*break*/, 12];
                    file = widgetFiles_1[_i];
                    layoutPath = path.join(layoutsDir, file);
                    layout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
                    widgetOutputDir = path.join(outputDir, layout.name);
                    if (!fs.existsSync(widgetOutputDir)) {
                        fs.mkdirSync(widgetOutputDir, { recursive: true });
                    }
                    _a = 0, sizesToUse_1 = sizesToUse;
                    _d.label = 4;
                case 4:
                    if (!(_a < sizesToUse_1.length)) return [3 /*break*/, 7];
                    size = sizesToUse_1[_a];
                    outputPath = path.join(widgetOutputDir, "".concat(size.name, "-").concat(size.width, "x").concat(size.height, ".png"));
                    return [4 /*yield*/, generateWidgetImage(browser, layout, size, outputPath)];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    if (!layout.supportedSizes) return [3 /*break*/, 11];
                    _b = 0, _c = layout.supportedSizes;
                    _d.label = 8;
                case 8:
                    if (!(_b < _c.length)) return [3 /*break*/, 11];
                    supportedSize = _c[_b];
                    sizeName = "".concat(supportedSize.family, "-").concat(supportedSize.width, "x").concat(supportedSize.height);
                    outputPath = path.join(widgetOutputDir, "".concat(sizeName, ".png"));
                    if (!!fs.existsSync(outputPath)) return [3 /*break*/, 10];
                    return [4 /*yield*/, generateWidgetImage(browser, layout, supportedSize, outputPath)];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10:
                    _b++;
                    return [3 /*break*/, 8];
                case 11:
                    _i++;
                    return [3 /*break*/, 3];
                case 12: return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, browser.close()];
                case 14:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate a combined preview image showing multiple widgets
 */
function generateCombinedPreview(layoutsDir, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, widgetFiles, layouts, html, _i, layouts_1, layout, widgetHtml;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    })];
                case 1:
                    browser = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 9, 11]);
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _a.sent();
                    widgetFiles = fs.readdirSync(layoutsDir).filter(function (f) { return f.endsWith('.json'); });
                    layouts = widgetFiles.map(function (file) {
                        var layoutPath = path.join(layoutsDir, file);
                        return JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
                    });
                    html = "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Widget Preview Gallery</title>\n    <style>\n        * { box-sizing: border-box; margin: 0; padding: 0; }\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n            padding: 40px;\n            min-height: 100vh;\n        }\n        h1 {\n            color: #fff;\n            text-align: center;\n            margin-bottom: 40px;\n            font-size: 24px;\n        }\n        .gallery {\n            display: grid;\n            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n            gap: 40px;\n            max-width: 1200px;\n            margin: 0 auto;\n        }\n        .widget-item {\n            background: rgba(255,255,255,0.05);\n            border-radius: 16px;\n            padding: 20px;\n        }\n        .widget-name {\n            color: #fff;\n            font-size: 14px;\n            margin-bottom: 16px;\n            text-align: center;\n        }\n        .widget-preview {\n            display: flex;\n            justify-content: center;\n            align-items: center;\n        }\n    </style>\n</head>\n<body>\n    <h1>Weather Widgets Preview</h1>\n    <div class=\"gallery\">";
                    for (_i = 0, layouts_1 = layouts; _i < layouts_1.length; _i++) {
                        layout = layouts_1[_i];
                        widgetHtml = (0, html_renderer_1.renderWidgetToHtml)(layout, SAMPLE_DATA, { width: 200, height: 200 });
                        html += "\n        <div class=\"widget-item\">\n            <div class=\"widget-name\">".concat(layout.displayName || layout.name, "</div>\n            <div class=\"widget-preview\">").concat(widgetHtml, "</div>\n        </div>");
                    }
                    html += "\n    </div>\n</body>\n</html>";
                    return [4 /*yield*/, page.setViewport({ width: 1200, height: 800 })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.setContent(html, { waitUntil: 'networkidle0' })];
                case 5:
                    _a.sent();
                    // Wait for the gallery to be visible
                    return [4 /*yield*/, page.waitForSelector('.gallery', { visible: true })];
                case 6:
                    // Wait for the gallery to be visible
                    _a.sent();
                    return [4 /*yield*/, page.screenshot({
                            path: outputPath,
                            type: 'png',
                            fullPage: true
                        })];
                case 7:
                    _a.sent();
                    console.log("Generated combined preview: ".concat(outputPath));
                    return [4 /*yield*/, page.close()];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, browser.close()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// CLI entry point
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, command, layoutsDir, outputDir, _a, widgetName, layout, browser, _i, WIDGET_SIZES_1, size, output;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    args = process.argv.slice(2);
                    command = args[0] || 'all';
                    layoutsDir = path.join(__dirname, '..', 'widgets');
                    outputDir = path.join(__dirname, 'output');
                    _a = command;
                    switch (_a) {
                        case 'all': return [3 /*break*/, 1];
                        case 'combined': return [3 /*break*/, 3];
                        case 'single': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 12];
                case 1:
                    console.log('Generating all widget images...');
                    return [4 /*yield*/, generateAllWidgetImages(layoutsDir, outputDir)];
                case 2:
                    _b.sent();
                    console.log('Done!');
                    return [3 /*break*/, 13];
                case 3:
                    console.log('Generating combined preview...');
                    return [4 /*yield*/, generateCombinedPreview(layoutsDir, path.join(outputDir, 'widgets-preview.png'))];
                case 4:
                    _b.sent();
                    console.log('Done!');
                    return [3 /*break*/, 13];
                case 5:
                    widgetName = args[1];
                    if (!widgetName) {
                        console.error('Usage: generate-images.ts single <widgetName>');
                        process.exit(1);
                    }
                    console.log("Generating images for ".concat(widgetName, "..."));
                    layout = JSON.parse(fs.readFileSync(path.join(layoutsDir, "".concat(widgetName, ".json")), 'utf-8'));
                    return [4 /*yield*/, puppeteer_1.default.launch({ headless: true, args: ['--no-sandbox'] })];
                case 6:
                    browser = _b.sent();
                    _i = 0, WIDGET_SIZES_1 = WIDGET_SIZES;
                    _b.label = 7;
                case 7:
                    if (!(_i < WIDGET_SIZES_1.length)) return [3 /*break*/, 10];
                    size = WIDGET_SIZES_1[_i];
                    output = path.join(outputDir, widgetName, "".concat(size.name, ".png"));
                    if (!fs.existsSync(path.dirname(output))) {
                        fs.mkdirSync(path.dirname(output), { recursive: true });
                    }
                    return [4 /*yield*/, generateWidgetImage(browser, layout, size, output)];
                case 8:
                    _b.sent();
                    _b.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10: return [4 /*yield*/, browser.close()];
                case 11:
                    _b.sent();
                    console.log('Done!');
                    return [3 /*break*/, 13];
                case 12:
                    console.log("\nWidget Image Generator\n\nUsage:\n  npx ts-node generate-images.ts [command]\n\nCommands:\n  all       Generate images for all widgets (default)\n  combined  Generate a combined gallery preview\n  single    Generate images for a single widget\n            Usage: single <widgetName>\n\nExamples:\n  npx ts-node generate-images.ts all\n  npx ts-node generate-images.ts combined\n  npx ts-node generate-images.ts single SimpleWeatherWidget\n");
                    _b.label = 13;
                case 13: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
