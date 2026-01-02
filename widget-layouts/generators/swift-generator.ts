#!/usr/bin/env node
/**
 * iOS SwiftUI Code Generator
 * Generates SwiftUI widget views from JSON layout definitions
 *
 * CLI:
 *  -i, --input <layoutsDir>    Input directory with .json layouts (default: ../widgets)
 *  -o, --output <outputDir>    Output directory for generated Swift files (default: App_Resources iOS widgets generated)
 *  -w, --widget <widgetName>   Only generate a single widget (by layout.name or filename). If omitted, generate all.
 *  -h, --help                  Show usage
 */

import * as fs from 'fs';
import * as path from 'path';

interface LayoutElement {
    type: string;
    id?: string;
    visible?: boolean;
    visibleIf?: string;
    padding?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    margin?: number;
    spacing?: number;
    alignment?: string;
    crossAlignment?: string;
    width?: number | string;
    height?: number | string;
    flex?: number;
    backgroundColor?: string;
    cornerRadius?: number;
    children?: LayoutElement[];
    // Element-specific
    text?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    maxLines?: number;
    src?: string;
    size?: number;
    thickness?: number;
    direction?: string;
    items?: string;
    limit?: number;
    itemTemplate?: LayoutElement;
    condition?: string;
    then?: LayoutElement;
    else?: LayoutElement;
    format24Hour?: string;
    format12Hour?: string;
    format?: string;
    style?: string;
}

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
        layout: LayoutElement;
    }[];
    layout: LayoutElement;
}

// Color mapping for theme colors
const SWIFT_COLORS: Record<string, string> = {
    onSurface: 'WidgetColorProvider.onSurface',
    onSurfaceVariant: 'WidgetColorProvider.onSurfaceVariant',
    primary: 'WidgetColorProvider.primary',
    error: 'WidgetColorProvider.error',
    widgetBackground: 'WidgetColorProvider.background',
    surface: 'WidgetColorProvider.surface'
};

// Font weight mapping
const SWIFT_FONT_WEIGHTS: Record<string, string> = {
    normal: '.regular',
    medium: '.medium',
    bold: '.bold'
};

// Helper to check if a value is a settings reference
function isSetting(value?: string): boolean {
    return typeof value === 'string' && value.startsWith('config.settings.');
}

// Helper to get setting key from config.settings.* syntax
function getSettingKey(value: string): string {
    const settingKey = value.substring(16); // Remove 'config.settings.' prefix
    return settingKey;
}

// Map a font weight string to a Swift weight token; provide a fallback if missing
// Now supports config.settings.* syntax for dynamic weight from config
function toSwiftFontWeight(weight?: string, fallback: string = 'normal'): string {
    if (isSetting(weight)) {
        const settingKey = getSettingKey(weight!);
        return `(config.settings?["${settingKey}"] as? Bool ?? true) ? .bold : .regular`;
    }
    const key = (weight ?? fallback ?? 'normal').toLowerCase();
    if (SWIFT_FONT_WEIGHTS[key]) return SWIFT_FONT_WEIGHTS[key];
    if (/(bold|700|800|900)/i.test(key)) return SWIFT_FONT_WEIGHTS['bold'];
    if (/(med|500|600)/i.test(key)) return SWIFT_FONT_WEIGHTS['medium'];
    return SWIFT_FONT_WEIGHTS['normal'];
}

/**
 * Convert alignment to SwiftUI alignment
 */
function toSwiftAlignment(alignment?: string, crossAlignment?: string, isVertical: boolean = true): string {
    if (isVertical) {
        // For VStack: alignment is horizontal, crossAlignment is vertical
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
        // For HStack: alignment is vertical
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
function toSwiftColor(color?: string): string {
    if (!color) return 'WidgetColorProvider.onSurface';
    if (color.startsWith('#')) {
        // Convert hex to SwiftUI Color
        return `Color(hex: "${color}")`;
    }
    return SWIFT_COLORS[color] || 'WidgetColorProvider.onSurface';
}

/**
 * Convert data binding {{path}} to Swift string interpolation
 */
function convertBinding(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const parts = path.trim().split('.');
        if (parts[0] === 'item') {
            // For forEach item context
            return `\\(item.${parts.slice(1).join('.')})`;
        }
        return `\\(data.${path.trim()})`;
    });
}

/**
 * Convert condition expression to Swift
 * Note: Most operators are identical between JS and Swift
 */
function toSwiftCondition(condition: string): string {
    return condition.replace(/size\.width/g, 'width').replace(/size\.height/g, 'height');
    // Operators &&, ||, ==, != are the same in Swift
}

/**
 * Generate Swift code for an element
 */
function generateElement(element: LayoutElement, indent: string = '                '): string {
    const lines: string[] = [];

    // Handle visibility condition
    const wrapWithIf = element.visibleIf ? true : false;
    const currentIndent = wrapWithIf ? indent + '    ' : indent;

    if (wrapWithIf) {
        // For simple property checks like "iconPath" or "description", check if not empty
        const propName = element.visibleIf.trim();
        const isPropCheck = /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(propName);

        if (isPropCheck) {
            // Simple property check - wrap with isEmpty
            const parts = propName.split('.');
            if (parts[0] === 'item') {
                lines.push(`${indent}if !${propName}.isEmpty {`);
            } else {
                lines.push(`${indent}if !data.${propName}.isEmpty {`);
            }
        } else {
            // Complex condition - use as-is
            const condition = element.visibleIf.replace(/size\.width/g, 'width').replace(/size\.height/g, 'height');
            lines.push(`${indent}if ${condition} {`);
        }
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

function generateColumn(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const spacing = element.spacing ?? 0;
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, true);

    lines.push(`${indent}VStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    // Add padding if specified
    if (element.padding) {
        lines[lines.length - 1] += `.padding(${element.padding})`;
    }

    return lines;
}

function generateRow(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const spacing = element.spacing ?? 0;
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, false);

    lines.push(`${indent}HStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    if (element.padding) {
        lines[lines.length - 1] += `.padding(${element.padding})`;
    }

    return lines;
}

function generateStack(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    lines.push(`${indent}ZStack {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);

    if (element.padding) {
        lines[lines.length - 1] += `.padding(${element.padding})`;
    }

    return lines;
}

function escapeSwiftString(str: string): string {
    // Escape backslashes and quotes—but avoid escaping the Swift interpolation marker `\(`.
    // We temporarily replace any `\(` we might have (should only exist for interpolation)
    // with a placeholder, escape, then restore the interpolation marker.
    const placeholder = '__SWIFT_INTERP__';
    // Replace existing \(`s with placeholder (unlikely in user text), to avoid double-escaping
    const withPlaceholders = str.replace(/\\\(/g, placeholder);
    // Escape remaining backslashes and double quotes
    const escaped = withPlaceholders.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    // Restore the \(
    return escaped.replace(new RegExp(placeholder, 'g'), '\\(');
}

/**
 * Normalize a short path into a full path reference for Swift code.
 * - 'temperature' -> 'data.temperature'
 * - 'item.hour' -> 'item.hour'
 * - 'data.temperature' -> 'data.temperature'
 * - 'size.width' -> 'size.width'
 */
function normalizeDataPath(raw: string): string {
    const p = raw.trim();
    if (p.startsWith('data.') || p.startsWith('item.') || p.startsWith('size.')) return p;
    return `data.${p}`;
}

// New helper: return single binding content or null if not a pure single binding
function getSingleBindingPath(text?: string): string | null {
    if (!text) return null;
    const m = text.trim().match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    return m ? m[1].trim() : null;
}

// Helper to check if text should be localized
function shouldLocalizeText(text?: string): boolean {
    if (!text || typeof text !== 'string') return false;
    // Don't localize if it's a data binding
    if (text.startsWith('data.') || text.startsWith('item.') || text.startsWith('size.')) return false;
    // Don't localize if it contains binding syntax
    if (text.includes('{') || text.includes('}')) return false;
    // Don't localize numbers or very short strings
    if (/^\d+$/.test(text) || text.length <= 1) return false;
    return true;
}

/**
 * Convert text (with optional {{binding}} placeholders) into either:
 * - a pure Swift expression (e.g. `String(describing: data.temperature)`) when the text is a single binding,
 * - or a Swift string literal with interpolations (e.g. `"Temperature: \(String(describing: data.temperature))°"`)
 * - or a localized string (e.g. `NSLocalizedString("Hourly", comment: "")`) for static text
 *
 * Returns `{ expr, isExpression }`
 */
function convertBindingToSwift(text: string | undefined): { expr: string; isExpression: boolean } {
    if (!text) return { expr: '""', isExpression: false };

    const trimmed = text.trim();

    // Check if this is static text that should be localized
    if (shouldLocalizeText(trimmed)) {
        // Convert to lowercase for resource key
        const key = trimmed.toLowerCase().replace(/\s+/g, '_');
        return { expr: `NSLocalizedString("${key}", comment: "")`, isExpression: true };
    }

    // Single binding only -> return expression (no quotes)
    const singleMatch = trimmed.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (singleMatch) {
        const path = normalizeDataPath(singleMatch[1]);
        return { expr: `String(describing: ${path})`, isExpression: true };
    }

    // Mixed content -> split into plain segments and binding segments
    const parts = trimmed.split(/(\{\{\s*[^}]+\s*\}\})/g).filter(Boolean);
    const convertedParts: string[] = parts.map(part => {
        const m = part.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
        if (m) {
            const path = normalizeDataPath(m[1]);
            // We want final emitted Swift file to contain `\(String(describing: data.x))` inside a Swift string literal.
            // Represent that here with a single backslash so that the generator writes `\(` in the file.
            // In JS source this must be written as '\\(' to represent a single backslash char in the runtime string.
            return `\\(String(describing: ${path}))`;
        } else {
            return escapeSwiftString(part);
        }
    });

    return { expr: `"${convertedParts.join('')}"`, isExpression: false };
}

function generateLabel(element: LayoutElement, indent: string): string[] {
    const color = toSwiftColor(element.color);
    const fontWeight = toSwiftFontWeight(element.fontWeight);
    const fontSize = element.fontSize ?? 12;

    const lines: string[] = [];

    // If the text is a single binding like "{{temperature}}" emit a bare Swift expression
    const singleBindingPath = getSingleBindingPath(element.text);
    if (singleBindingPath) {
        const path = normalizeDataPath(singleBindingPath);
        lines.push(`${indent}Text(String(describing: ${path}))`);
    } else {
        const binding = convertBindingToSwift(element.text ?? '');
        lines.push(`${indent}Text(${binding.expr})`);
    }

    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    if (color) lines.push(`${indent}    .foregroundColor(${color})`);
    if (element.textAlign) {
        const align = element.textAlign === 'center' ? 'center' : element.textAlign === 'end' ? 'trailing' : 'leading';
        lines.push(`${indent}    .multilineTextAlignment(.${align})`);
    }
    if (element.maxLines) {
        lines.push(`${indent}    .lineLimit(${element.maxLines})`);
    }

    return lines;
}

// For images we also prefer to use a direct expression when src is a single binding:
function generateImage(element: LayoutElement, indent: string): string[] {
    const size = element.size ?? 48;
    const lines: string[] = [];

    const singleBinding = getSingleBindingPath(element.src);
    if (singleBinding) {
        const path = normalizeDataPath(singleBinding);
        // Use WeatherIconView(data.iconPath, description: ..., size: ...)
        // If you prefer using a different initializer, adapt accordingly
        lines.push(`${indent}WeatherIconView(${path}, description: data.description, size: ${size})`);
    } else {
        // If src is a string literal or mixed content, use the generated approach (escape as necessary)
        const binding = convertBindingToSwift(element.src ?? '');
        // In Swift, the icon view expects a normal string or resource name; we pass String(describing:) to be safe in mixed cases.
        // Use a string literal if binding.isExpression is false (it will be a quoted string)
        if (binding.isExpression) {
            lines.push(`${indent}WeatherIconView(${binding.expr}, description: data.description, size: ${size})`);
        } else {
            // binding.expr is a quoted string: Text("..."), we need to remove the surrounding quotes to pass to the icon view initializer
            // strip leading & trailing quotes
            const quoted = binding.expr;
            const bare = quoted.startsWith('"') && quoted.endsWith('"') ? quoted.slice(1, -1) : quoted;
            // escape the string so Swift sees the right content
            lines.push(`${indent}WeatherIconView(${bare}, description: data.description, size: ${size})`);
        }
    }

    return lines;
}

function generateSpacer(element: LayoutElement, indent: string): string[] {
    if (element.size !== undefined) {
        return [`${indent}Spacer().frame(height: ${element.size})`];
    }
    return [`${indent}Spacer()`];
}

function generateDivider(element: LayoutElement, indent: string): string[] {
    const color = toSwiftColor(element.color || 'onSurfaceVariant');
    return [`${indent}Divider().background(${color}.opacity(0.3))`];
}

function generateScrollView(element: LayoutElement, indent: string): string[] {
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

function generateForEach(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const items = element.items || 'items';
    const limit = element.limit;

    const dataPath = items.includes('.') ? items : `data.${items}`;
    const prefix = limit ? `${dataPath}.prefix(${limit})` : dataPath;

    lines.push(`${indent}ForEach(Array(${prefix}.enumerated()), id: \\.offset) { index, item in`);

    if (element.itemTemplate) {
        lines.push(generateElement(element.itemTemplate, indent + '    '));
    }

    lines.push(`${indent}}`);

    return lines;
}

function generateConditional(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const condition = toSwiftCondition(element.condition || 'true');

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

function generateClock(element: LayoutElement, indent: string): string[] {
    const fontSize = element.fontSize || 24;
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'bold');
    const color = toSwiftColor(element.color);

    return [`${indent}Text(Date(), style: .time)`, `${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`, `${indent}    .foregroundColor(${color})`];
}

function generateDate(element: LayoutElement, indent: string): string[] {
    const fontSize = element.fontSize || 14;
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'normal');
    const color = toSwiftColor(element.color);

    return [`${indent}Text(Date(), style: .date)`, `${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`, `${indent}    .foregroundColor(${color})`];
}

/**
 * Generate the complete Swift widget view file
 */
function generateWidgetView(layout: WidgetLayout): string {
    const name = layout.name;
    const viewName = `${name}View`;

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
                WidgetContainer(padding: ${layout.defaultPadding || 8}) {
`;

    // Generate variant conditions
    if (layout.variants && layout.variants.length > 0) {
        for (let i = 0; i < layout.variants.length; i++) {
            const variant = layout.variants[i];
            const condition = toSwiftCondition(variant.condition);
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
    let widgetFiles = findJsonFiles(layoutsDir);

    // Inform the user
    console.log(`Swift generator: found ${widgetFiles.length} layout JSON file(s) under ${layoutsDir}`);
    if (widgetFiles.length === 0) {
        console.warn(`No layout JSON files found in ${layoutsDir}. Nothing to do.`);
        return;
    }

    // If a widgetName is provided, try to resolve to 1+ JSON files:
    if (widgetName) {
        const matches: string[] = [];

        // If widgetName looks like a path to a directory: find .json inside it
        const candidatePath = path.isAbsolute(widgetName) ? widgetName : path.join(process.cwd(), widgetName);
        if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
            matches.push(...findJsonFiles(candidatePath));
        } else if (widgetName.includes(path.sep) || widgetName.endsWith('.json')) {
            // If widgetName looks like a file path
            const candidate = path.isAbsolute(widgetName) ? widgetName : path.resolve(widgetName);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                matches.push(candidate);
            } else {
                console.error(`Widget file not found: ${candidate}`);
            }
        } else {
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
        }

        if (matches.length === 0) {
            console.error(`No widget named "${widgetName}" found under ${layoutsDir}`);
            return;
        }

        // Replace widgetFiles with absolute paths we've resolved
        widgetFiles = matches.map(p => path.isAbsolute(p) ? p : path.join(layoutsDir, p));
    } else {
        // Already absolute paths from findJsonFiles
        widgetFiles = widgetFiles.map(f => path.isAbsolute(f) ? f : path.join(layoutsDir, f));
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
    let layoutsDir = path.join(__dirname, '..', 'widgets');
    let outputDir = path.join(__dirname, '..', '..', 'App_Resources', 'iOS', 'extensions', 'widgets', 'generated');
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
                if (!layoutsDir || layoutsDir === path.join(__dirname, '..', 'widgets')) {
                    layoutsDir = a;
                } else if (!outputDir || outputDir === path.join(__dirname, '..', '..', 'App_Resources', 'iOS', 'extensions', 'widgets', 'generated')) {
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
