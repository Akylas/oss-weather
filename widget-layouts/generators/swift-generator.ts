#!/usr/bin/env node
/**
 * iOS SwiftUI Code Generator
 * Generates SwiftUI widget views from JSON layout definitions
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
    supportedSizes?: Array<{ width: number; height: number; family: string }>;
    defaultPadding?: number;
    background?: {
        type: string;
        color?: string;
    };
    variants?: Array<{
        condition: string;
        layout: LayoutElement;
    }>;
    layout: LayoutElement;
}

// Color mapping for theme colors
const SWIFT_COLORS: Record<string, string> = {
    'onSurface': 'WidgetColorProvider.onSurface',
    'onSurfaceVariant': 'WidgetColorProvider.onSurfaceVariant',
    'primary': 'WidgetColorProvider.primary',
    'error': 'WidgetColorProvider.error',
    'widgetBackground': 'WidgetColorProvider.background',
    'surface': 'WidgetColorProvider.surface'
};

// Font weight mapping
const SWIFT_FONT_WEIGHTS: Record<string, string> = {
    'normal': '.regular',
    'medium': '.medium',
    'bold': '.bold'
};

/**
 * Convert alignment to SwiftUI alignment
 */
function toSwiftAlignment(alignment?: string, crossAlignment?: string, isVertical: boolean = true): string {
    if (isVertical) {
        // For VStack: alignment is horizontal, crossAlignment is vertical
        const hAlign = crossAlignment || 'center';
        switch (hAlign) {
            case 'start': return '.leading';
            case 'center': return '.center';
            case 'end': return '.trailing';
            default: return '.center';
        }
    } else {
        // For HStack: alignment is vertical
        const vAlign = crossAlignment || 'center';
        switch (vAlign) {
            case 'start': return '.top';
            case 'center': return '.center';
            case 'end': return '.bottom';
            default: return '.center';
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
    return condition
        .replace(/size\.width/g, 'width')
        .replace(/size\.height/g, 'height');
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
        const propName = element.visibleIf!.trim();
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
            const condition = element.visibleIf!
                .replace(/size\.width/g, 'width')
                .replace(/size\.height/g, 'height');
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
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generateLabel(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const rawText = convertBinding(element.text || '');
    const text = escapeSwiftString(rawText);
    const fontSize = element.fontSize || 14;
    const fontWeight = SWIFT_FONT_WEIGHTS[element.fontWeight || 'normal'] || '.regular';
    const color = toSwiftColor(element.color);
    
    lines.push(`${indent}Text("${text}")`);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    lines.push(`${indent}    .foregroundColor(${color})`);
    
    if (element.maxLines) {
        lines.push(`${indent}    .lineLimit(${element.maxLines})`);
    }
    
    if (element.textAlign) {
        const alignment = element.textAlign === 'center' ? '.center' : 
                         element.textAlign === 'right' ? '.trailing' : '.leading';
        lines.push(`${indent}    .multilineTextAlignment(${alignment})`);
    }
    
    return lines;
}

function generateImage(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const src = element.src || '';
    const size = element.size || 24;
    
    // For weather icons, use the WeatherIconView helper
    if (src.includes('iconPath')) {
        lines.push(`${indent}WeatherIconView(data.iconPath, description: data.description, size: ${size})`);
    } else {
        const imageSrc = escapeSwiftString(convertBinding(src));
        lines.push(`${indent}Image("${imageSrc}")`);
        lines.push(`${indent}    .resizable()`);
        lines.push(`${indent}    .frame(width: ${size}, height: ${size})`);
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
    const fontWeight = SWIFT_FONT_WEIGHTS[element.fontWeight || 'bold'] || '.bold';
    const color = toSwiftColor(element.color);
    
    return [
        `${indent}Text(Date(), style: .time)`,
        `${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`,
        `${indent}    .foregroundColor(${color})`
    ];
}

function generateDate(element: LayoutElement, indent: string): string[] {
    const fontSize = element.fontSize || 14;
    const fontWeight = SWIFT_FONT_WEIGHTS[element.fontWeight || 'normal'] || '.regular';
    const color = toSwiftColor(element.color);
    
    return [
        `${indent}Text(Date(), style: .date)`,
        `${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`,
        `${indent}    .foregroundColor(${color})`
    ];
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
 * Generate all widget views from JSON layouts
 */
export function generateAllWidgets(layoutsDir: string, outputDir: string): void {
    const widgetFiles = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
    
    for (const file of widgetFiles) {
        const layoutPath = path.join(layoutsDir, file);
        const layout: WidgetLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
        
        const swiftCode = generateWidgetView(layout);
        const outputPath = path.join(outputDir, `${layout.name}View.generated.swift`);
        
        fs.writeFileSync(outputPath, swiftCode);
        console.log(`Generated: ${outputPath}`);
    }
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const layoutsDir = args[0] || path.join(__dirname, '..', 'widgets');
    const outputDir = args[1] || path.join(__dirname, '..', '..', 'App_Resources', 'iOS', 'extensions', 'widgets', 'generated');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    generateAllWidgets(layoutsDir, outputDir);
    console.log('SwiftUI widget generation complete!');
}

export { generateWidgetView, WidgetLayout, LayoutElement };
