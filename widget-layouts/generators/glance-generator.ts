#!/usr/bin/env node
/**
 * Android Glance Code Generator
 * Generates Glance composables from JSON layout definitions
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
const GLANCE_COLORS: Record<string, string> = {
    'onSurface': 'GlanceTheme.colors.onSurface',
    'onSurfaceVariant': 'GlanceTheme.colors.onSurfaceVariant',
    'primary': 'GlanceTheme.colors.primary',
    'error': 'GlanceTheme.colors.error',
    'widgetBackground': 'GlanceTheme.colors.background',
    'surface': 'GlanceTheme.colors.surface'
};

// Font weight mapping
const KOTLIN_FONT_WEIGHTS: Record<string, string> = {
    'normal': 'FontWeight.Normal',
    'medium': 'FontWeight.Medium',
    'bold': 'FontWeight.Bold'
};

/**
 * Convert alignment to Glance alignment
 */
function toGlanceVerticalAlignment(alignment?: string): string {
    switch (alignment) {
        case 'start': return 'Alignment.Vertical.Top';
        case 'center': return 'Alignment.Vertical.CenterVertically';
        case 'end': return 'Alignment.Vertical.Bottom';
        case 'spaceBetween': return 'Alignment.Vertical.CenterVertically';
        default: return 'Alignment.Vertical.CenterVertically';
    }
}

function toGlanceHorizontalAlignment(alignment?: string): string {
    switch (alignment) {
        case 'start': return 'Alignment.Start';
        case 'center': return 'Alignment.CenterHorizontally';
        case 'end': return 'Alignment.End';
        default: return 'Alignment.CenterHorizontally';
    }
}

/**
 * Convert color reference to Kotlin/Glance
 */
function toGlanceColor(color?: string): string {
    if (!color) return 'GlanceTheme.colors.onSurface';
    if (color.startsWith('#')) {
        return `Color(android.graphics.Color.parseColor("${color}"))`;
    }
    return GLANCE_COLORS[color] || 'GlanceTheme.colors.onSurface';
}

/**
 * Convert data binding {{path}} to Kotlin string interpolation
 */
function convertBinding(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, pathStr) => {
        const parts = pathStr.trim().split('.');
        if (parts[0] === 'item') {
            return `\${item.${parts.slice(1).join('.')}}`;
        }
        return `\${data.${pathStr.trim()}}`;
    });
}

/**
 * Convert condition expression to Kotlin
 * Note: Most operators are identical between JS and Kotlin
 */
function toKotlinCondition(condition: string): string {
    return condition
        .replace(/size\.width/g, 'size.width.value')
        .replace(/size\.height/g, 'size.height.value');
    // Operators &&, ||, ==, != are the same in Kotlin
}

/**
 * Generate Kotlin code for an element
 */
function generateElement(element: LayoutElement, indent: string = '            '): string {
    const lines: string[] = [];
    
    // Handle visibility condition
    const wrapWithIf = element.visibleIf ? true : false;
    const currentIndent = wrapWithIf ? indent + '    ' : indent;
    
    if (wrapWithIf) {
        // For simple property checks like "iconPath" or "description", check if not empty
        const propName = element.visibleIf!.trim();
        const isPropCheck = /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(propName);
        
        if (isPropCheck) {
            // Simple property check - wrap with isNotEmpty
            const parts = propName.split('.');
            if (parts[0] === 'item') {
                lines.push(`${indent}if (${propName}.isNotEmpty()) {`);
            } else {
                lines.push(`${indent}if (data.${propName}.isNotEmpty()) {`);
            }
        } else {
            // Complex condition - use as-is
            const condition = element.visibleIf!
                .replace(/size\.width/g, 'size.width.value')
                .replace(/size\.height/g, 'size.height.value');
            lines.push(`${indent}if (${condition}) {`);
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
    const vertAlign = toGlanceVerticalAlignment(element.alignment);
    const horizAlign = toGlanceHorizontalAlignment(element.crossAlignment);
    
    let modifier = 'GlanceModifier.fillMaxSize()';
    
    lines.push(`${indent}Column(`);
    lines.push(`${indent}    modifier = ${modifier},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign},`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign}`);
    lines.push(`${indent}) {`);
    
    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
            // Add spacing between children if specified
            if (element.spacing && element.children.indexOf(child) < element.children.length - 1) {
                lines.push(`${indent}    Spacer(modifier = GlanceModifier.height(${element.spacing}.dp))`);
            }
        }
    }
    
    lines.push(`${indent}}`);
    
    return lines;
}

function generateRow(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const horizAlign = element.alignment === 'center' ? 'Arrangement.Center' : 
                      element.alignment === 'end' ? 'Arrangement.End' : 
                      element.alignment === 'spaceBetween' ? 'Arrangement.SpaceBetween' : 'Arrangement.Start';
    const vertAlign = element.crossAlignment === 'start' ? 'Alignment.Vertical.Top' :
                     element.crossAlignment === 'end' ? 'Alignment.Vertical.Bottom' : 'Alignment.Vertical.CenterVertically';
    
    lines.push(`${indent}Row(`);
    lines.push(`${indent}    modifier = GlanceModifier.fillMaxWidth(),`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign}`);
    lines.push(`${indent}) {`);
    
    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
            if (element.spacing && element.children.indexOf(child) < element.children.length - 1) {
                lines.push(`${indent}    Spacer(modifier = GlanceModifier.width(${element.spacing}.dp))`);
            }
        }
    }
    
    lines.push(`${indent}}`);
    
    return lines;
}

function generateStack(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    
    lines.push(`${indent}Box(`);
    lines.push(`${indent}    modifier = GlanceModifier.fillMaxSize(),`);
    lines.push(`${indent}    contentAlignment = Alignment.Center`);
    lines.push(`${indent}) {`);
    
    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }
    
    lines.push(`${indent}}`);
    
    return lines;
}

function escapeKotlinString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
}

function generateLabel(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const rawText = convertBinding(element.text || '');
    // Don't escape $ for string interpolation, but escape quotes
    const text = rawText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const fontSize = element.fontSize || 14;
    const fontWeight = KOTLIN_FONT_WEIGHTS[element.fontWeight || 'normal'] || 'FontWeight.Normal';
    const color = toGlanceColor(element.color);
    
    let style = `style = TextStyle(fontSize = ${fontSize}.sp, fontWeight = ${fontWeight}, color = ${color})`;
    
    if (element.maxLines) {
        lines.push(`${indent}Text(`);
        lines.push(`${indent}    text = "${text}",`);
        lines.push(`${indent}    ${style},`);
        lines.push(`${indent}    maxLines = ${element.maxLines}`);
        lines.push(`${indent})`);
    } else {
        lines.push(`${indent}Text(text = "${text}", ${style})`);
    }
    
    return lines;
}

function generateImage(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const src = element.src || '';
    const size = element.size || 24;
    
    // For weather icons, use the WidgetComposables helper
    if (src.includes('iconPath')) {
        lines.push(`${indent}WidgetComposables.WeatherIcon(data.iconPath, data.description, ${size}.dp)`);
    } else {
        const imageSrc = escapeKotlinString(convertBinding(src));
        lines.push(`${indent}Image(`);
        lines.push(`${indent}    provider = ImageProvider(R.drawable.${imageSrc}),`);
        lines.push(`${indent}    contentDescription = null,`);
        lines.push(`${indent}    modifier = GlanceModifier.size(${size}.dp)`);
        lines.push(`${indent})`);
    }
    
    return lines;
}

function generateSpacer(element: LayoutElement, indent: string): string[] {
    if (element.size !== undefined) {
        return [`${indent}Spacer(modifier = GlanceModifier.height(${element.size}.dp))`];
    }
    if (element.flex) {
        return [`${indent}Spacer(modifier = GlanceModifier.defaultWeight())`];
    }
    return [`${indent}Spacer(modifier = GlanceModifier.defaultWeight())`];
}

function generateDivider(element: LayoutElement, indent: string): string[] {
    const thickness = element.thickness || 1;
    const color = toGlanceColor(element.color || 'onSurfaceVariant');
    return [
        `${indent}Box(`,
        `${indent}    modifier = GlanceModifier.fillMaxWidth().height(${thickness}.dp).background(${color}.copy(alpha = 0.3f))`,
        `${indent}) {}`
    ];
}

function generateScrollView(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const isHorizontal = element.direction === 'horizontal';
    
    if (isHorizontal) {
        lines.push(`${indent}LazyRow {`);
    } else {
        lines.push(`${indent}LazyColumn {`);
    }
    
    if (element.children) {
        lines.push(`${indent}    items(1) {`);
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
    const collection = limit ? `${dataPath}.take(${limit})` : dataPath;
    
    lines.push(`${indent}${collection}.forEachIndexed { index, item ->`);
    
    if (element.itemTemplate) {
        lines.push(generateElement(element.itemTemplate, indent + '    '));
    }
    
    lines.push(`${indent}}`);
    
    return lines;
}

function generateConditional(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const condition = toKotlinCondition(element.condition || 'true');
    
    lines.push(`${indent}if (${condition}) {`);
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
    const fontWeight = KOTLIN_FONT_WEIGHTS[element.fontWeight || 'bold'] || 'FontWeight.Bold';
    const color = toGlanceColor(element.color);
    
    return [
        `${indent}// TextClock for live time display`,
        `${indent}WidgetComposables.ClockText(${fontSize}.sp, ${fontWeight}, ${color})`
    ];
}

function generateDate(element: LayoutElement, indent: string): string[] {
    const fontSize = element.fontSize || 14;
    const fontWeight = KOTLIN_FONT_WEIGHTS[element.fontWeight || 'normal'] || 'FontWeight.Normal';
    const color = toGlanceColor(element.color);
    
    return [
        `${indent}// Date text`,
        `${indent}WidgetComposables.DateText(${fontSize}.sp, ${fontWeight}, ${color})`
    ];
}

/**
 * Generate the complete Kotlin widget content composable
 */
function generateWidgetContent(layout: WidgetLayout): string {
    const name = layout.name;
    
    let code = `// Auto-generated from ${name}.json - DO NOT EDIT MANUALLY
// Generated by widget-layouts/generators/glance-generator.ts

package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WidgetComposables

/**
 * Generated content composable for ${name}
 */
object ${name}Content {
    
    @Composable
    fun Content(
        modifier: GlanceModifier = GlanceModifier,
        data: WeatherWidgetData,
        size: DpSize
    ) {
        val padding = when {
            size.width < 100.dp -> 4.dp
            size.width < 150.dp -> 6.dp
            else -> ${layout.defaultPadding || 8}.dp
        }
        
        WidgetComposables.WidgetContainer(padding = padding) {
`;
    
    // Generate variant conditions
    if (layout.variants && layout.variants.length > 0) {
        for (let i = 0; i < layout.variants.length; i++) {
            const variant = layout.variants[i];
            const condition = toKotlinCondition(variant.condition);
            const keyword = i === 0 ? 'if' : '} else if';
            
            code += `            ${keyword} (${condition}) {\n`;
            code += generateElement(variant.layout, '                ') + '\n';
        }
        
        // Default layout
        code += `            } else {\n`;
        code += generateElement(layout.layout, '                ') + '\n';
        code += `            }\n`;
    } else {
        code += generateElement(layout.layout, '            ') + '\n';
    }
    
    code += `        }
    }
}
`;
    
    return code;
}

/**
 * Generate all widget content composables from JSON layouts
 */
export function generateAllWidgets(layoutsDir: string, outputDir: string): void {
    const widgetFiles = fs.readdirSync(layoutsDir).filter(f => f.endsWith('.json'));
    
    for (const file of widgetFiles) {
        const layoutPath = path.join(layoutsDir, file);
        const layout: WidgetLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
        
        const kotlinCode = generateWidgetContent(layout);
        const outputPath = path.join(outputDir, `${layout.name}Content.generated.kt`);
        
        fs.writeFileSync(outputPath, kotlinCode);
        console.log(`Generated: ${outputPath}`);
    }
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    const layoutsDir = args[0] || path.join(__dirname, '..', 'widgets');
    const outputDir = args[1] || path.join(__dirname, '..', '..', 'App_Resources', 'Android', 'src', 'main', 'java', 'com', 'akylas', 'weather', 'widgets', 'generated');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    generateAllWidgets(layoutsDir, outputDir);
    console.log('Glance widget generation complete!');
}

export { generateWidgetContent, WidgetLayout, LayoutElement };
