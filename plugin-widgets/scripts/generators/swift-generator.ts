#!/usr/bin/env node
/**
 * iOS SwiftUI Code Generator
 * Generates SwiftUI widget views from JSON layout definitions with Mapbox expression support
 *
 * CLI:
 *  -i, --input <layoutsDir>    Input directory with .json layouts (default: ../widgets)
 *  -o, --output <outputDir>    Output directory for generated Swift files (default: App_Resources iOS widgets generated)
 *  -w, --widget <widgetName>   Only generate a single widget (by layout.name or filename). If omitted, generate all.
 *  -h, --help                  Show usage
 */

import * as fs from 'fs';
import * as path from 'path';
import { compileExpression, Expression } from './expression-compiler';
import {
    BaseLayoutElement,
    getSingleBinding,
    getSettingKey,
    hasTemplateBinding,
    isExpression,
    isSettingReference,
    toPlatformFontWeight
} from './shared-utils';
import { DEFAULT_COLOR_MAPS } from './modifier-builders';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_FONT_SIZE = 12;
const DEFAULT_IMAGE_SIZE = 48;
const DEFAULT_LOOP_LIMIT = 10;
const DEFAULT_PADDING = 8;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WidgetLayout {
    name: string;
    displayName?: string;
    description?: string;
    supportedSizes?: { width: number; height: number; family: string }[];
    defaultPadding?: number;
    background?: {
        type: string;
        color?: string;
    };
    variants?: {
        condition: string;
        layout: BaseLayoutElement;
    }[];
    layout: BaseLayoutElement;
}

// ============================================================================
// EXPRESSION & TEMPLATE HANDLING
// ============================================================================

/**
 * Compile an expression or value to Swift code
 */
function compileToSwift(value: Expression | undefined, defaultValue: string = '""'): string {
    if (value === undefined) return defaultValue;

    // Handle template strings with {{}} bindings
    if (typeof value === 'string' && hasTemplateBinding(value)) {
        return convertTemplateToSwift(value);
    }

    // Handle Mapbox expressions
    if (isExpression(value)) {
        return compileExpression(value, {
            platform: 'swift',
            context: 'value'
        });
    }

    // Handle literal values
    if (typeof value === 'string') {
        return `"${escapeSwiftString(value)}"`;
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'boolean') {
        return String(value);
    }

    return defaultValue;
}

/**
 * Compile an expression to Swift condition (for if statements)
 */
function compileConditionToSwift(condition: Expression | undefined): string {
    if (condition === undefined) return 'true';

    // Handle Mapbox expressions
    if (isExpression(condition)) {
        return compileExpression(condition, {
            platform: 'swift',
            context: 'condition'
        });
    }

    // Handle string conditions (legacy format)
    if (typeof condition === 'string') {
        // Replace size.width/height references
        return condition.replace(/size\.width/g, 'width').replace(/size\.height/g, 'height');
    }

    return 'true';
}

/**
 * Convert template string {{property}} to Swift string interpolation
 */
function convertTemplateToSwift(template: string): string {
    // Check if it's a single binding
    const singleBinding = getSingleBinding(template);
    if (singleBinding) {
        const normalized = normalizeDataPath(singleBinding);
        return `String(describing: ${normalized})`;
    }

    // Multiple bindings or mixed text - convert to Swift string interpolation
    const swiftString = template.replace(/\{\{([^}]+)\}\}/g, (_, prop) => {
        const normalized = normalizeDataPath(prop.trim());
        return `\\(String(describing: ${normalized}))`;
    });

    return `"${escapeSwiftString(swiftString)}"`;
}

/**
 * Normalize a property path for Swift
 * - 'temperature' -> 'data.temperature'
 * - 'item.hour' -> 'item.hour'
 * - 'data.temperature' -> 'data.temperature'
 * - 'size.width' -> 'width'
 */
function normalizeDataPath(raw: string): string {
    const p = raw.trim();

    // Size properties map to geometry variables
    if (p === 'size.width') return 'width';
    if (p === 'size.height') return 'height';
    if (p.startsWith('size.')) return p.replace('size.', '');

    // Item and data paths are already prefixed
    if (p.startsWith('data.') || p.startsWith('item.') || p.startsWith('config.')) {
        return p;
    }

    // Add data prefix
    return `data.${p}`;
}

/**
 * Escape string for Swift string literals
 */
function escapeSwiftString(str: string): string {
    // Handle Swift interpolation specially
    const placeholder = '__SWIFT_INTERP__';
    const withPlaceholders = str.replace(/\\\(/g, placeholder);
    const escaped = withPlaceholders.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return escaped.replace(new RegExp(placeholder, 'g'), '\\(');
}

// ============================================================================
// PROPERTY COMPILATION HELPERS
// ============================================================================

/**
 * Convert font weight to Swift weight token
 * Supports both literal values and config.settings.* references
 */
function toSwiftFontWeight(weight?: Expression, fallback: string = 'normal'): string {
    if (weight === undefined) {
        return toPlatformFontWeight(fallback, 'swift');
    }

    // Handle config settings reference
    if (isSettingReference(weight as string)) {
        const settingKey = getSettingKey(weight as string);
        return `(config.settings?["${settingKey}"] as? Bool ?? true) ? .bold : .regular`;
    }

    // Handle string literals (including numeric weight values like '700')
    if (typeof weight === 'string') {
        const key = weight.toLowerCase();
        if (/^(700|800|900)$/.test(key)) return toPlatformFontWeight('bold', 'swift');
        if (/^(500|600)$/.test(key)) return toPlatformFontWeight('medium', 'swift');
        return toPlatformFontWeight(key, 'swift');
    }

    // Handle expressions
    if (isExpression(weight)) {
        return compileExpression(weight, {
            platform: 'swift',
            context: 'value'
        });
    }

    return toPlatformFontWeight(fallback, 'swift');
}

/**
 * Convert alignment to SwiftUI alignment
 */
function toSwiftAlignment(alignment?: string, crossAlignment?: string, isVertical: boolean = true): string {
    if (isVertical) {
        // For VStack: crossAlignment is horizontal
        const hAlign = crossAlignment || 'center';
        switch (hAlign) {
            case 'start':
                return '.leading';
            case 'center':
                return '.center';
            case 'end':
                return '.trailing';
            default:
                return '.center';
        }
    } else {
        // For HStack: crossAlignment is vertical
        const vAlign = crossAlignment || 'center';
        switch (vAlign) {
            case 'start':
                return '.top';
            case 'center':
                return '.center';
            case 'end':
                return '.bottom';
            default:
                return '.center';
        }
    }
}

/**
 * Convert color reference to Swift
 */
function toSwiftColor(color?: Expression): string {
    if (color === undefined) return 'WidgetColorProvider.onSurface';

    // Handle string colors
    if (typeof color === 'string') {
        if (color.startsWith('#')) {
            return `Color(hex: "${color}")`;
        }
        return DEFAULT_COLOR_MAPS.swift[color] || 'WidgetColorProvider.onSurface';
    }

    // Handle expressions
    if (isExpression(color)) {
        return compileExpression(color, {
            platform: 'swift',
            context: 'value',
            formatter: (v: string) => {
                if (v.startsWith('#')) {
                    return `Color(hex: "${v}")`;
                }
                return DEFAULT_COLOR_MAPS.swift[v] || 'WidgetColorProvider.onSurface';
            }
        });
    }

    return 'WidgetColorProvider.onSurface';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate spacing value from element property
 * Handles both literal numbers and expressions
 */
function calculateSpacing(element: BaseLayoutElement): number | string {
    if (element.spacing === undefined) return 0;
    if (typeof element.spacing === 'number') return element.spacing;
    return compileToSwift(element.spacing, '0');
}

// ============================================================================
// ELEMENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate Swift code for an element
 */
function generateElement(element: BaseLayoutElement, indent: string = '                '): string {
    const lines: string[] = [];

    // Handle visibility condition
    const wrapWithIf = element.visibleIf !== undefined;
    const currentIndent = wrapWithIf ? indent + '    ' : indent;

    if (wrapWithIf) {
        const condition = compileConditionToSwift(element.visibleIf);
        lines.push(`${indent}if ${condition} {`);
    }

    switch (element.type) {
        case 'column':
            lines.push(...generateColumn(element, currentIndent));
            break;
        case 'row':
            lines.push(...generateRow(element, currentIndent));
            break;
        case 'stack':
            lines.push(...generateStack(element, currentIndent));
            break;
        case 'label':
            lines.push(...generateLabel(element, currentIndent));
            break;
        case 'image':
            lines.push(...generateImage(element, currentIndent));
            break;
        case 'spacer':
            lines.push(...generateSpacer(element, currentIndent));
            break;
        case 'divider':
            lines.push(...generateDivider(element, currentIndent));
            break;
        case 'scrollView':
            lines.push(...generateScrollView(element, currentIndent));
            break;
        case 'forEach':
            lines.push(...generateForEach(element, currentIndent));
            break;
        case 'conditional':
            lines.push(...generateConditional(element, currentIndent));
            break;
        case 'clock':
            lines.push(...generateClock(element, currentIndent));
            break;
        case 'date':
            lines.push(...generateDate(element, currentIndent));
            break;
        default:
            lines.push(`${currentIndent}// Unknown element type: ${element.type}`);
    }

    if (wrapWithIf) {
        lines.push(`${indent}}`);
    }

    return lines.join('\n');
}

function generateColumn(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const spacing = calculateSpacing(element);
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, true);

    lines.push(`${indent}VStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    // Add modifiers for padding, background, corner radius
    if (element.padding) {
        const paddingValue = typeof element.padding === 'number' ? element.padding : compileToSwift(element.padding, '0');
        lines[lines.length - 1] += `.padding(${paddingValue})`;
    }

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        lines[lines.length - 1] += `.background(${bgColor})`;
    }

    if (element.cornerRadius) {
        const radius = typeof element.cornerRadius === 'number' ? element.cornerRadius : compileToSwift(element.cornerRadius, '0');
        lines[lines.length - 1] += `.cornerRadius(${radius})`;
    }

    return lines;
}

function generateRow(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const spacing = calculateSpacing(element);
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, false);

    lines.push(`${indent}HStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    // Add modifiers for padding, background, corner radius
    if (element.padding) {
        const paddingValue = typeof element.padding === 'number' ? element.padding : compileToSwift(element.padding, '0');
        lines[lines.length - 1] += `.padding(${paddingValue})`;
    }

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        lines[lines.length - 1] += `.background(${bgColor})`;
    }

    if (element.cornerRadius) {
        const radius = typeof element.cornerRadius === 'number' ? element.cornerRadius : compileToSwift(element.cornerRadius, '0');
        lines[lines.length - 1] += `.cornerRadius(${radius})`;
    }

    return lines;
}

function generateStack(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];

    lines.push(`${indent}ZStack {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    // Add modifiers for padding, background, corner radius
    if (element.padding) {
        const paddingValue = typeof element.padding === 'number' ? element.padding : compileToSwift(element.padding, '0');
        lines[lines.length - 1] += `.padding(${paddingValue})`;
    }

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        lines[lines.length - 1] += `.background(${bgColor})`;
    }

    if (element.cornerRadius) {
        const radius = typeof element.cornerRadius === 'number' ? element.cornerRadius : compileToSwift(element.cornerRadius, '0');
        lines[lines.length - 1] += `.cornerRadius(${radius})`;
    }

    return lines;
}

function generateLabel(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];

    // Compile text expression
    const textExpr = compileToSwift(element.text, '""');

    lines.push(`${indent}Text(${textExpr})`);

    // Font size
    const fontSize = typeof element.fontSize === 'number' ? element.fontSize : DEFAULT_FONT_SIZE;
    const fontWeight = toSwiftFontWeight(element.fontWeight);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);

    // Color
    const color = toSwiftColor(element.color);
    lines.push(`${indent}    .foregroundColor(${color})`);

    // Text alignment
    if (element.textAlign) {
        const align = element.textAlign === 'center' ? 'center' : element.textAlign === 'end' ? 'trailing' : 'leading';
        lines.push(`${indent}    .multilineTextAlignment(.${align})`);
    }

    // Line limit
    if (element.maxLines) {
        const maxLines = typeof element.maxLines === 'number' ? element.maxLines : compileToSwift(element.maxLines, '1');
        lines.push(`${indent}    .lineLimit(${maxLines})`);
    }

    // Add modifiers for padding, background, corner radius
    if (element.padding) {
        const paddingValue = typeof element.padding === 'number' ? element.padding : compileToSwift(element.padding, '0');
        lines[lines.length - 1] += `.padding(${paddingValue})`;
    }

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        lines[lines.length - 1] += `.background(${bgColor})`;
    }

    if (element.cornerRadius) {
        const radius = typeof element.cornerRadius === 'number' ? element.cornerRadius : compileToSwift(element.cornerRadius, '0');
        lines[lines.length - 1] += `.cornerRadius(${radius})`;
    }

    return lines;
}

function generateImage(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const size = typeof element.size === 'number' ? element.size : DEFAULT_IMAGE_SIZE;

    // Compile src expression
    const srcExpr = compileToSwift(element.src, '"default_icon"');

    lines.push(`${indent}WeatherIconView(${srcExpr}, description: data.description, size: ${size})`);

    // Add modifiers for padding, background, corner radius
    if (element.padding) {
        const paddingValue = typeof element.padding === 'number' ? element.padding : compileToSwift(element.padding, '0');
        lines[lines.length - 1] += `.padding(${paddingValue})`;
    }

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        lines[lines.length - 1] += `.background(${bgColor})`;
    }

    if (element.cornerRadius) {
        const radius = typeof element.cornerRadius === 'number' ? element.cornerRadius : compileToSwift(element.cornerRadius, '0');
        lines[lines.length - 1] += `.cornerRadius(${radius})`;
    }

    return lines;
}

function generateSpacer(element: BaseLayoutElement, indent: string): string[] {
    if (element.size !== undefined) {
        const size = typeof element.size === 'number' ? element.size : compileToSwift(element.size, '8');
        return [`${indent}Spacer().frame(height: ${size})`];
    }
    return [`${indent}Spacer()`];
}

function generateDivider(element: BaseLayoutElement, indent: string): string[] {
    const color = toSwiftColor(element.color || 'onSurfaceVariant');
    const thickness = typeof element.thickness === 'number' ? element.thickness : element.thickness ? compileToSwift(element.thickness, '1') : 1;
    return [`${indent}Divider().frame(height: ${thickness}).background(${color}.opacity(0.3))`];
}

function generateScrollView(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const axis = element.direction === 'horizontal' ? '.horizontal' : '.vertical';

    lines.push(`${indent}ScrollView(${axis}, showsIndicators: false) {`);

    if (element.children) {
        const containerType = element.direction === 'horizontal' ? 'HStack' : 'VStack';
        lines.push(`${indent}    ${containerType}(spacing: 8) {`);
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '        '));
        }
        lines.push(`${indent}    }`);
    }

    lines.push(`${indent}}`);

    return lines;
}

function generateForEach(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const items = element.items || 'items';
    const limit = element.limit;

    const dataPath = items.includes('.') ? items : `data.${items}`;

    // Handle limit expression
    let prefix: string;
    if (limit !== undefined) {
        const limitValue = typeof limit === 'number' ? limit : compileToSwift(limit, String(DEFAULT_LOOP_LIMIT));
        prefix = `${dataPath}.prefix(${limitValue})`;
    } else {
        prefix = dataPath;
    }

    lines.push(`${indent}ForEach(Array(${prefix}.enumerated()), id: \\.offset) { index, item in`);

    if (element.itemTemplate) {
        lines.push(generateElement(element.itemTemplate, indent + '    '));
    }

    lines.push(`${indent}}`);

    return lines;
}

function generateConditional(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const condition = compileConditionToSwift(element.condition);

    lines.push(`${indent}if ${condition} {`);
    if (element.then) {
        lines.push(generateElement(element.then, indent + '    '));
    }
    lines.push(`${indent}}`);

    if (element.else) {
        lines.push(`${indent}else {`);
        lines.push(generateElement(element.else, indent + '    '));
        lines.push(`${indent}}`);
    }

    return lines;
}

function generateClock(element: BaseLayoutElement, indent: string): string[] {
    const fontSize = typeof element.fontSize === 'number' ? element.fontSize : 24;
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'bold');
    const color = toSwiftColor(element.color);

    const lines: string[] = [];
    lines.push(`${indent}Text(Date(), style: .time)`);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    lines.push(`${indent}    .foregroundColor(${color})`);

    return lines;
}

function generateDate(element: BaseLayoutElement, indent: string): string[] {
    const fontSize = typeof element.fontSize === 'number' ? element.fontSize : 14;
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'normal');
    const color = toSwiftColor(element.color);

    const lines: string[] = [];
    lines.push(`${indent}Text(Date(), style: .date)`);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    lines.push(`${indent}    .foregroundColor(${color})`);

    return lines;
}

/**
 * Generate the complete Swift widget view file
 */
function generateWidgetView(layout: WidgetLayout): string {
    const name = layout.name;
    const viewName = `${name}View`;

    // Handle default padding - it could be an expression
    let defaultPadding = String(DEFAULT_PADDING);
    if (layout.defaultPadding !== undefined) {
        if (typeof layout.defaultPadding === 'number') {
            defaultPadding = String(layout.defaultPadding);
        } else if (isExpression(layout.defaultPadding)) {
            defaultPadding = compileExpression(layout.defaultPadding, {
                platform: 'swift',
                context: 'value'
            });
        }
    }

    let code = `// Auto-generated from ${name}.json - DO NOT EDIT MANUALLY
// Generated by widget-layouts/generators/swift-generator.ts

import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct ${viewName}: View {
    let entry: WeatherEntry
    @Environment(\\.widgetFamily) var family
    
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            let config = entry.config ?? WidgetConfig()
            
            if let data = entry.data, entry.data?.loadingState == WeatherWidgetData.LoadingState.loaded {
                WidgetContainer(padding: ${defaultPadding}) {
`;

    // Generate variant conditions
    if (layout.variants && layout.variants.length > 0) {
        for (let i = 0; i < layout.variants.length; i++) {
            const variant = layout.variants[i];
            const condition = compileConditionToSwift(variant.condition);
            const keyword = i === 0 ? 'if' : '} else if';

            code += `                    ${keyword} ${condition} {\n`;
            code += generateElement(variant.layout, '                        ') + '\n';
        }

        // Default layout
        code += `                    } else {\n`;
        code += generateElement(layout.layout, '                        ') + '\n';
        code += `                    }\n`;
    } else {
        code += generateElement(layout.layout, '                    ') + '\n';
    }

    code += `                }
            } else {
                NoDataView(state: entry.data?.loadingState ?? WeatherWidgetData.LoadingState.none, errorMessage: entry.data?.errorMessage)
            }
        }
    }
}
`;

    return code;
}

/**
 * Find all .json files recursively under `dir`.
 */
function findJsonFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findJsonFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(full);
        }
    }
    return files;
}

/**
 * Generate all widget views from JSON layouts
 */
export function generateAllWidgets(layoutsDir: string, outputDir: string, widgetName?: string): void {
    console.log(`Swift generator: scanning layouts in ${layoutsDir}`);
    // let widgetFiles = findJsonFiles(layoutsDir);
    let widgetFiles = fs.readdirSync(layoutsDir).filter((f) => f.endsWith('.json'));

    // Inform the user
    console.log(`Swift generator: found ${widgetFiles.length} layout JSON file(s) under ${layoutsDir}`);
    if (widgetFiles.length === 0) {
        console.warn(`No layout JSON files found in ${layoutsDir}. Nothing to do.`);
        return;
    }

    // If a widgetName is provided, try to resolve to 1+ JSON files:
    if (widgetName) {
        const matches: string[] = [];

        // First, exact filename match among discovered files
        for (const filepath of widgetFiles) {
            if (path.basename(filepath) === `${widgetName}.json` || path.basename(filepath, '.json') === widgetName) {
                matches.push(filepath);
            }
        }

        // If none by filename, look inside JSON layout.name to find a matching layout
        if (matches.length === 0) {
            for (const f of widgetFiles) {
                try {
                    const layout: WidgetLayout = JSON.parse(fs.readFileSync(f, 'utf-8'));
                    if (layout.name === widgetName) {
                        matches.push(f);
                    }
                } catch {
                    // ignore parse error for this lookup
                }
            }
        }

        if (matches.length === 0) {
            console.error(`No widget named "${widgetName}" found under ${layoutsDir}`);
            return;
        }

        // Replace widgetFiles with absolute paths we've resolved
        widgetFiles = matches.map((p) => (path.isAbsolute(p) ? p : path.join(layoutsDir, p)));
    } else {
        // Already absolute paths from findJsonFiles
        widgetFiles = widgetFiles.map((f) => (path.isAbsolute(f) ? f : path.join(layoutsDir, f)));
    }

    console.log(`Swift generator: generating ${widgetFiles.length} widget(s) to ${outputDir}`);

    for (const layoutFilePath of widgetFiles) {
        try {
            const layout: WidgetLayout = JSON.parse(fs.readFileSync(layoutFilePath, 'utf-8'));

            const swiftCode = generateWidgetView(layout);
            const fileName = `${layout.name}View.generated.swift`;
            const outputPath = path.join(outputDir, fileName);

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputPath, swiftCode);
            console.log(`Generated: ${outputPath}`);
        } catch (e) {
            console.error(`Failed to generate widget from ${layoutFilePath}:`, (e as Error).message);
        }
    }
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    let layoutsDir = path.join(__dirname, '..', '..', 'src', 'widgets');
    let outputDir = path.join(__dirname, '..', '..', 'platforms', 'ios', 'extensions', 'widgets', 'generated');
    let widgetName: string | undefined;
    let showHelp = false;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        switch (a) {
            case '-i':
            case '--input':
                layoutsDir = args[++i] ?? layoutsDir;
                break;
            case '-o':
            case '--output':
                outputDir = args[++i] ?? outputDir;
                break;
            case '-w':
            case '--widget':
            case '--single':
            case '-s':
                widgetName = args[++i];
                break;
            case '-h':
            case '--help':
                showHelp = true;
                break;
            default:
                // allow some positional args: first arg could be layoutsDir, second is outputDir
                if (!layoutsDir || layoutsDir === path.join(__dirname, '..', '..', 'src', 'widgets')) {
                    layoutsDir = a;
                } else if (!outputDir || outputDir === path.join(__dirname, '..', '..', 'platforms', 'ios', 'extensions', 'widgets', 'generated')) {
                    outputDir = a;
                } else {
                    // ignore unknown
                }
                break;
        }
    }

    if (showHelp) {
        console.log(`Usage: ${path.basename(process.argv[1])} [--input <layoutsDir>] [--output <outputDir>] [--widget <widgetName>]
Options:
    -i, --input     Layouts directory (default: ../widgets)
    -o, --output    Output directory (default: App_Resources iOS widgets generated)
    -w, --widget    Only generate single widget by name or filename (without .json)
    -h, --help      Show this help
        `);
        process.exit(0);
    }

    if (!fs.existsSync(layoutsDir)) {
        console.error(`Layouts directory does not exist: ${layoutsDir}`);
        process.exit(2);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    generateAllWidgets(layoutsDir, outputDir, widgetName);
    console.log('SwiftUI widget generation complete!');
}
