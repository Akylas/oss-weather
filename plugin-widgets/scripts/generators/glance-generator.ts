#!/usr/bin/env node
/**
 * Android Glance Code Generator with Mapbox-Style Expressions
 * Generates Glance composables from JSON layout definitions using Mapbox expression syntax
 */

import * as fs from 'fs';
import * as path from 'path';
import { compileExpression as compileExpr, compilePropertyValue as compilePropValue, Expression } from './expression-compiler';
import { isExpression, toPlatformVerticalAlignment, toPlatformHorizontalAlignment, toPlatformFontWeight } from './shared-utils';
import { buildGlanceModifier, formatColor } from './modifier-builders';

interface LayoutElement {
    type: string;
    id?: string;
    visible?: boolean;
    visibleIf?: Expression;
    padding?: Expression;
    paddingHorizontal?: Expression;
    paddingVertical?: Expression;
    margin?: Expression;
    marginHorizontal?: Expression;
    marginVertical?: Expression;
    spacing?: Expression;
    alignment?: string;
    crossAlignment?: string;
    width?: Expression;
    height?: Expression;
    fillWidth?: boolean;
    fillHeight?: boolean;
    fillMaxSize?: boolean;
    flex?: Expression;
    backgroundColor?: Expression;
    cornerRadius?: Expression;
    children?: LayoutElement[];
    // Element-specific
    text?: Expression;
    fontSize?: Expression;
    fontWeight?: Expression;
    color?: Expression;
    textAlign?: string;
    maxLines?: Expression;
    src?: Expression;
    size?: Expression;
    thickness?: Expression;
    direction?: string;
    items?: string;
    limit?: number;
    itemTemplate?: LayoutElement;
    condition?: Expression;
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
    layout: LayoutElement;
}



/**
 * Format a color value for use as a Glance text color (requires ColorProvider wrapper for hex colors)
 */
function formatTextColor(v: string): string {
    const color = formatColor(v, 'kotlin');
    if (color.startsWith('Color(')) {
        return `ColorProvider(${color})`;
    }
    return color;
}

/**
 * Generate Kotlin code for an element
 */
function generateElement(element: LayoutElement, indent: string = '            '): string {
    const lines: string[] = [];

    // Handle visibility condition
    const wrapWithIf = element.visibleIf !== undefined;
    const currentIndent = wrapWithIf ? indent + '    ' : indent;

    if (wrapWithIf && element.visibleIf !== undefined) {
        const condition = compileExpr(element.visibleIf, { platform: 'kotlin', context: 'condition' });
        lines.push(`${indent}if (${condition}) {`);
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
    const vertAlign = toPlatformVerticalAlignment(element.alignment, 'glance');
    const horizAlign = toPlatformHorizontalAlignment(element.crossAlignment, 'glance');

    const modifier = buildGlanceModifier(element);

    lines.push(`${indent}Column(`);
    lines.push(`${indent}    modifier = ${modifier},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign},`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign}`);
    lines.push(`${indent}) {`);

    if (element.children) {
        // Insert Spacer composables between children if spacing is defined
        const spacingValue = element.spacing;
        for (let i = 0; i < element.children.length; i++) {
            const child = element.children[i];

            // Add spacer before child (except first)
            if (i > 0 && spacingValue !== undefined) {
                const spacingExpr = compilePropValue(spacingValue, { platform: 'kotlin', formatter: (v: number) => `${v}.dp` }, undefined);
                if (spacingExpr) {
                    lines.push(`${indent}    Spacer(modifier = GlanceModifier.height(${spacingExpr}))`);
                }
            }

            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);
    return lines;
}

function generateRow(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const horizAlign = toPlatformHorizontalAlignment(element.alignment, 'glance');
    const vertAlign = toPlatformVerticalAlignment(element.crossAlignment, 'glance');
    const isSpaceBetween = element.alignment === 'space-between' || element.alignment === 'spaceBetween';

    const modifier = buildGlanceModifier(element);

    lines.push(`${indent}Row(`);
    lines.push(`${indent}    modifier = ${modifier},`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign}`);
    lines.push(`${indent}) {`);

    if (element.children) {
        // Handle space-between by inserting Spacer between children
        if (isSpaceBetween && element.children.length > 1) {
            for (let i = 0; i < element.children.length; i++) {
                const child = element.children[i];

                // Add spacer before child (except first)
                if (i > 0) {
                    lines.push(`${indent}    Spacer(modifier = GlanceModifier.defaultWeight())`);
                }

                lines.push(generateElement(child, indent + '    '));
            }
        } else {
            // Normal layout with optional spacing
            const spacingValue = element.spacing;
            for (let i = 0; i < element.children.length; i++) {
                const child = element.children[i];

                // Add spacer before child (except first)
                if (i > 0 && spacingValue !== undefined) {
                    const spacingExpr = compilePropValue(spacingValue, { platform: 'kotlin', formatter: (v: number) => `${v}.dp` }, undefined);
                    if (spacingExpr) {
                        lines.push(`${indent}    Spacer(modifier = GlanceModifier.width(${spacingExpr}))`);
                    }
                }

                lines.push(generateElement(child, indent + '    '));
            }
        }
    }

    lines.push(`${indent}}`);
    return lines;
}

function generateStack(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    lines.push(`${indent}Box(`);
    lines.push(`${indent}    modifier = GlanceModifier.fillMaxSize()`);
    lines.push(`${indent}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);
    return lines;
}

function generateLabel(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    // Compile text (might be template string or expression)
    let textExpr: string;
    if (typeof element.text === 'string' && element.text.includes('{{')) {
        // Template string like "{{temperature}}" or "{{item.temperature}}"
        // Check if it's a simple single substitution
        const singleMatch = element.text.match(/^\{\{([^}]+)\}\}$/);
        if (singleMatch) {
            // Single property substitution - use directly without string interpolation
            const prop = singleMatch[1];
            if (prop.startsWith('item.')) {
                textExpr = prop;
            } else {
                textExpr = `data.${prop}`;
            }
        } else {
            // Complex template with multiple substitutions or text
            textExpr = element.text.replace(/\{\{([^}]+)\}\}/g, (_, prop) => {
                // If it's an item property, don't add data. prefix
                if (prop.startsWith('item.')) {
                    return `\${${prop}}`;
                }
                return `\${data.${prop}}`;
            });
            textExpr = `"${textExpr}"`;
        }
    } else if (Array.isArray(element.text)) {
        // Mapbox expression
        const compiled = compileExpr(element.text, { platform: 'kotlin', context: 'value' });
        // If the compiled result is a direct property access (no quotes), don't wrap in string interpolation
        // This handles ["get", "item.precipAccumulation"] -> item.precipAccumulation (not "${item.precipAccumulation}")
        if (compiled.match(/^(data\.|item\.|size\.)/)) {
            textExpr = compiled;
        } else {
            textExpr = compiled;
        }
    } else if (typeof element.text === 'string' && !element.text.includes('data.') && !element.text.includes('item.')) {
        // Static text string - should be localized
        // Convert to snake_case for resource name (e.g., "Hourly" -> "hourly")
        const resourceKey = element.text.toLowerCase().replace(/\s+/g, '_');
        textExpr = `context.getString(context.resources.getIdentifier("${resourceKey}", "string", context.packageName))`;
    } else {
        textExpr = compilePropValue(element.text, { platform: 'kotlin', formatter: (v: string) => `"${v}"` }, '""');
    }

    const fontSizeExpr = compilePropValue(element.fontSize, { platform: 'kotlin', formatter: (v: number) => `${v}.sp` }, undefined);
    const colorExpr = compilePropValue(element.color, { platform: 'kotlin', formatter: (v: string) => formatTextColor(v) }, 'ColorProvider(WidgetTheme.onSurface)');

    // Handle fontWeight - check for config.settings
    let fontWeightExpr: string | undefined;
    if (typeof element.fontWeight === 'string' && element.fontWeight.startsWith('config.settings.')) {
        // It's a config setting reference
        const settingName = element.fontWeight.substring(16); // Remove 'config.settings.' prefix
        if (settingName === 'clockBold') {
            fontWeightExpr = 'if (config.settings?.get("clockBold") as? Boolean ?: true) FontWeight.Bold else FontWeight.Normal';
        }
    } else {
        fontWeightExpr = compilePropValue(element.fontWeight, { platform: 'kotlin', formatter: (v: string) => toPlatformFontWeight(v, 'glance') }, undefined);
    }

    const maxLinesExpr = compilePropValue(element.maxLines, { platform: 'kotlin', formatter: (v: number) => String(v) }, undefined);

    lines.push(`${indent}Text(`);
    lines.push(`${indent}    text = ${textExpr},`);

    // Build style
    const styleProps: string[] = [];
    if (fontSizeExpr) {
        styleProps.push(`fontSize = ${fontSizeExpr}`);
    }
    if (fontWeightExpr) {
        styleProps.push(`fontWeight = ${fontWeightExpr}`);
    }
    if (colorExpr) {
        styleProps.push(`color = ${colorExpr}`);
    }
    if (element.textAlign) {
        const alignMap: Record<string, string> = {
            left: 'TextAlign.Start',
            center: 'TextAlign.Center',
            right: 'TextAlign.End'
        };
        styleProps.push(`textAlign = ${alignMap[element.textAlign] || 'TextAlign.Start'}`);
    }

    if (styleProps.length > 0) {
        const styleStr = styleProps.join(', ');
        lines.push(`${indent}    style = TextStyle(${styleStr}),`);
    }

    if (maxLinesExpr) {
        lines.push(`${indent}    maxLines = ${maxLinesExpr}`);
    } else {
        // Remove trailing comma from style line if no maxLines
        const lastIdx = lines.length - 1;
        if (lines[lastIdx].endsWith(',')) {
            lines[lastIdx] = lines[lastIdx].slice(0, -1);
        }
    }

    lines.push(`${indent})`);
    return lines;
}

function generateImage(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    // Compile src - it's a path string, not a resource ID
    let srcExpr: string;
    if (typeof element.src === 'string' && element.src.includes('{{')) {
        // Template string like "{{iconPath}}" or "{{item.iconPath}}"
        const propName = element.src.replace(/\{\{([^}]+)\}\}/g, '$1');
        // If it's an item property, don't add data. prefix
        if (propName.startsWith('item.')) {
            srcExpr = propName;
        } else {
            srcExpr = `data.${propName}`;
        }
    } else {
        srcExpr = compilePropValue(element.src, { platform: 'kotlin', formatter: (v: string) => `data.${v}` }, 'data.iconPath');
    }

    const sizeExpr = compilePropValue(element.size, { platform: 'kotlin', formatter: (v: number) => `${v}.dp` }, '24.dp');

    lines.push(`${indent}WeatherWidgetManager.getIconImageProviderFromPath(${srcExpr})?.let { provider ->`);
    lines.push(`${indent}    Image(`);
    lines.push(`${indent}       provider = provider,`);
    lines.push(`${indent}       contentDescription = ${srcExpr},`);
    lines.push(`${indent}       modifier = GlanceModifier.size(${sizeExpr})`);
    lines.push(`${indent}    )`);
    lines.push(`${indent}}`);

    return lines;
}

function generateSpacer(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    const sizeExpr = compilePropValue(element.size, { platform: 'kotlin', formatter: (v: number) => `${v}.dp` }, undefined);
    const flexExpr = compilePropValue(element.flex, { platform: 'kotlin', formatter: (v: number) => String(v) }, undefined);

    // If flex is defined, use defaultWeight() modifier
    if (flexExpr && flexExpr !== 'null') {
        lines.push(`${indent}Spacer(modifier = GlanceModifier.defaultWeight())`);
        return lines;
    }

    // Check if sizeExpr contains 'when' with 'null' as a possibility
    if (sizeExpr && sizeExpr.includes('when') && sizeExpr.includes('null')) {
        // For conditional spacers that can be null, only generate if condition is true
        lines.push(`${indent}if (${sizeExpr.match(/when \{ (.+?) ->/)?.[1] || 'true'}) {`);
        const nonNullSize = sizeExpr.replace(/when \{[^}]+\}/, (match) => {
            // Extract the first non-null value
            const firstValue = match.match(/-> ([^;]+\.dp)/)?.[1] || '8.dp';
            return firstValue;
        });
        lines.push(`${indent}    Spacer(modifier = GlanceModifier.height(${nonNullSize}))`);
        lines.push(`${indent}}`);
    } else if (sizeExpr && sizeExpr !== 'null' && sizeExpr !== 'undefined') {
        lines.push(`${indent}Spacer(modifier = GlanceModifier.height(${sizeExpr}))`);
    }
    // If both are null/undefined, don't generate anything

    return lines;
}

function generateDivider(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const thicknessExpr = compilePropValue(element.thickness, { platform: 'kotlin', formatter: (v: number) => `${v}.dp` }, '1.dp');
    const colorExpr = compilePropValue(element.color, { platform: 'kotlin', formatter: (v: string) => formatColor(v, 'kotlin') }, 'GlanceTheme.colors.onSurfaceVariant');

    lines.push(`${indent}Box(`);
    lines.push(`${indent}    modifier = GlanceModifier.fillMaxWidth().height(${thicknessExpr})`);
    lines.push(`${indent}        .background(${colorExpr})`);
    lines.push(`${indent}) {}`);

    return lines;
}

function generateScrollView(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    const direction = element.direction || 'vertical';

    if (direction === 'horizontal') {
        // Generate Row with forEach for horizontal scrolling
        // Note: Glance does not support LazyRow - only LazyColumn exists
        lines.push(`${indent}Row {`);
        if (element.children && element.children.length > 0) {
            // Check if children contain a forEach, if so handle specially
            const hasForEach = element.children.some((child) => child.type === 'forEach' || (child.children && child.children.some((c) => c.type === 'forEach')));

            if (hasForEach) {
                // Find the forEach element (may be nested in row/column)
                for (const child of element.children) {
                    if (child.type === 'forEach') {
                        // Generate items directly from forEach
                        if (child.items && child.itemTemplate) {
                            const limitValue = child.limit || 10;
                            const limitCode = isExpression(limitValue) ? compileExpr(limitValue, { platform: 'kotlin', context: 'value' }) : limitValue;

                            lines.push(`${indent}    data.${child.items}.take(${limitCode}).forEach { item ->`);
                            lines.push(generateElement(child.itemTemplate, indent + '        '));
                            lines.push(`${indent}    }`);
                        }
                    } else if (child.children) {
                        // Check nested children for forEach
                        for (const nestedChild of child.children) {
                            if (nestedChild.type === 'forEach') {
                                if (nestedChild.items && nestedChild.itemTemplate) {
                                    const limitValue = nestedChild.limit || 10;
                                    const limitCode = isExpression(limitValue) ? compileExpr(limitValue, { platform: 'kotlin', context: 'value' }) : limitValue;

                                    lines.push(`${indent}    data.${nestedChild.items}.take(${limitCode}).forEach { item ->`);
                                    lines.push(generateElement(nestedChild.itemTemplate, indent + '        '));
                                    lines.push(`${indent}    }`);
                                }
                            }
                        }
                    }
                }
            } else {
                // No forEach, wrap each child in item{}
                for (const child of element.children) {
                    lines.push(`${indent}    item {`);
                    lines.push(generateElement(child, indent + '        '));
                    lines.push(`${indent}    }`);
                }
            }
        }
        lines.push(`${indent}}`);
    } else {
        // Generate LazyColumn for vertical scrolling
        lines.push(`${indent}LazyColumn {`);
        if (element.children && element.children.length > 0) {
            // Check if children contain a forEach, if so handle specially
            const hasForEach = element.children.some((child) => child.type === 'forEach' || (child.children && child.children.some((c) => c.type === 'forEach')));

            if (hasForEach) {
                // Find the forEach element (may be nested in row/column)
                for (const child of element.children) {
                    if (child.type === 'forEach') {
                        // Generate items directly from forEach
                        if (child.items && child.itemTemplate) {
                            const limitValue = child.limit || 10;
                            const limitCode = isExpression(limitValue) ? compileExpr(limitValue, { platform: 'kotlin', context: 'value' }) : limitValue;

                            lines.push(`${indent}    items(data.${child.items}.take(${limitCode})) { item ->`);
                            lines.push(generateElement(child.itemTemplate, indent + '        '));
                            lines.push(`${indent}    }`);
                        }
                    } else if (child.children) {
                        // Check nested children for forEach
                        for (const nestedChild of child.children) {
                            if (nestedChild.type === 'forEach') {
                                if (nestedChild.items && nestedChild.itemTemplate) {
                                    const limitValue = nestedChild.limit || 10;
                                    const limitCode = isExpression(limitValue) ? compileExpr(limitValue, { platform: 'kotlin', context: 'value' }) : limitValue;

                                    lines.push(`${indent}    items(data.${nestedChild.items}.take(${limitCode})) { item ->`);
                                    lines.push(generateElement(nestedChild.itemTemplate, indent + '        '));
                                    lines.push(`${indent}    }`);
                                }
                            }
                        }
                    }
                }
            } else {
                // No forEach, wrap each child in item{}
                for (const child of element.children) {
                    lines.push(`${indent}    item {`);
                    lines.push(generateElement(child, indent + '        '));
                    lines.push(`${indent}    }`);
                }
            }
        }
        lines.push(`${indent}}`);
    }

    return lines;
}

function generateForEach(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    if (!element.items || !element.itemTemplate) {
        lines.push(`${indent}// forEach requires items and itemTemplate`);
        return lines;
    }

    // Compile limit expression if it's a Mapbox expression, otherwise use literal value
    const limitValue = element.limit || 10;
    const limitCode = isExpression(limitValue) ? compileExpr(limitValue, { platform: 'kotlin', context: 'value' }) : limitValue;

    lines.push(`${indent}data.${element.items}.take(${limitCode}).forEach { item ->`);
    lines.push(generateElement(element.itemTemplate, indent + '    '));
    lines.push(`${indent}}`);

    return lines;
}

function generateConditional(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    if (!element.condition) {
        lines.push(`${indent}// conditional requires condition property`);
        return lines;
    }

    const condition = compileExpr(element.condition, { platform: 'kotlin', context: 'condition' });

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
    const lines: string[] = [];

    const format24 = element.format24Hour || 'HH:mm';
    const format12 = element.format12Hour || 'h:mm a';

    const fontSizeExpr = compilePropValue(element.fontSize, { platform: 'kotlin', formatter: (v: number) => `${v}.sp` }, undefined);
    const colorExpr = compilePropValue(element.color, { platform: 'kotlin', formatter: (v: string) => formatColor(v, 'kotlin') }, 'GlanceTheme.colors.onSurface');

    // Handle fontWeight - check for config.settings
    let fontWeightExpr: string | undefined;
    if (typeof element.fontWeight === 'string') {
        if (element.fontWeight.startsWith('config.settings.')) {
            // It's a config setting reference
            const settingName = element.fontWeight.substring(16); // Remove 'config.settings.' prefix
            if (settingName === 'clockBold') {
                fontWeightExpr = 'if (config.settings?.get("clockBold") as? Boolean ?: true) FontWeight.Bold else FontWeight.Normal';
            }
        } else {
            fontWeightExpr = toPlatformFontWeight(element.fontWeight as string, 'glance');
        }
    } else if (element.fontWeight) {
        fontWeightExpr = compilePropValue(element.fontWeight, { platform: 'kotlin', formatter: (v: string) => toPlatformFontWeight(v, 'glance') }, undefined);
    }

    lines.push(`${indent}Text(`);
    lines.push(`${indent}    text = android.text.format.DateFormat.format("${format24}", System.currentTimeMillis()).toString(),`);

    const styleProps: string[] = [];
    if (fontSizeExpr) {
        styleProps.push(`fontSize = ${fontSizeExpr}`);
    }
    if (fontWeightExpr) {
        styleProps.push(`fontWeight = ${fontWeightExpr}`);
    }
    if (colorExpr) {
        styleProps.push(`color = ${colorExpr}`);
    }

    if (styleProps.length > 0) {
        lines.push(`${indent}    style = TextStyle(${styleProps.join(', ')})`);
    }

    lines.push(`${indent})`);

    return lines;
}

function generateDate(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    const format = element.format || 'MMM dd, yyyy';

    const fontSizeExpr = compilePropValue(element.fontSize, { platform: 'kotlin', formatter: (v: number) => `${v}.sp` }, undefined);
    const colorExpr = compilePropValue(element.color, { platform: 'kotlin', formatter: (v: string) => formatColor(v, 'kotlin') }, 'GlanceTheme.colors.onSurface');

    lines.push(`${indent}Text(`);
    lines.push(`${indent}    text = android.text.format.DateFormat.format("${format}", System.currentTimeMillis()).toString(),`);

    const styleProps: string[] = [];
    if (fontSizeExpr) {
        styleProps.push(`fontSize = ${fontSizeExpr}`);
    }
    if (colorExpr) {
        styleProps.push(`color = ${colorExpr}`);
    }

    if (styleProps.length > 0) {
        lines.push(`${indent}    style = TextStyle(${styleProps.join(', ')})`);
    }

    lines.push(`${indent})`);

    return lines;
}

/**
 * Generate the complete Kotlin file
 */
function generateKotlinFile(layout: WidgetLayout): string {
    const className = `${layout.name}Content`;
    const packageName = 'com.akylas.weather.widgets.generated';

    const lines: string[] = [];

    lines.push(`package ${packageName}`);
    lines.push('');
    lines.push('import androidx.compose.runtime.Composable');
    lines.push('import android.content.Context');
    lines.push('import androidx.compose.ui.graphics.Color');
    lines.push('import androidx.compose.ui.unit.dp');
    lines.push('import androidx.compose.ui.unit.sp');
    lines.push('import androidx.compose.ui.unit.DpSize');
    lines.push('import androidx.glance.GlanceModifier');
    lines.push('import androidx.glance.GlanceTheme');
    lines.push('import androidx.glance.appwidget.cornerRadius');
    lines.push('import androidx.glance.Image');
    lines.push('import androidx.glance.ImageProvider');
    lines.push('import androidx.glance.LocalSize');
    lines.push('import androidx.glance.background');
    lines.push('import androidx.glance.layout.*');
    lines.push('import androidx.glance.appwidget.lazy.LazyColumn');
    lines.push('import androidx.glance.appwidget.lazy.items');
    lines.push('import androidx.glance.text.FontWeight');
    lines.push('import androidx.glance.text.Text');
    lines.push('import androidx.glance.text.TextAlign');
    lines.push('import androidx.glance.text.TextStyle');
    lines.push('import androidx.glance.unit.ColorProvider');
    lines.push('import com.akylas.weather.R');
    lines.push('import com.akylas.weather.widgets.WeatherWidgetData');
    lines.push('import com.akylas.weather.widgets.WeatherWidgetManager');
    lines.push('import com.akylas.weather.widgets.WidgetTheme');
    lines.push('import com.akylas.weather.widgets.WidgetConfig');
    lines.push('');
    lines.push('/**');
    lines.push(` * Generated content for ${layout.displayName || layout.name}`);
    lines.push(' * DO NOT EDIT - This file is auto-generated from JSON layout definitions');
    lines.push(' */');
    lines.push('');
    lines.push('@Composable');
    lines.push(`fun ${className}(context: Context, config: WidgetConfig, data: WeatherWidgetData, size: DpSize) {`);
    // lines.push('    val size = LocalSize.current');
    lines.push('');

    // Generate the main content
    lines.push(generateElement(layout.layout, '    '));

    lines.push('}');
    lines.push('');

    // Don't generate data classes - they already exist in WeatherWidgetManager
    lines.push('// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager');

    return lines.join('\n');
}

/**
 * Main function
 */
function main() {
    const widgetsDir = path.join(__dirname, '../../src/widgets');
    const outputDir = path.join(__dirname, '../../platforms/android/java/com/akylas/weather/widgets/generated');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process all widget JSON files (excluding backups and test files)
    const files = fs.readdirSync(widgetsDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(widgetsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const layout: WidgetLayout = JSON.parse(content);

        console.log(`Generating Glance code for ${layout.name}...`);

        const kotlinCode = generateKotlinFile(layout);
        const outputPath = path.join(outputDir, `${layout.name}Content.generated.kt`);
        fs.writeFileSync(outputPath, kotlinCode, 'utf-8');

        console.log(`  → ${outputPath}`);
    }

    console.log('\nGlance code generation complete!');
}

if (require.main === module) {
    main();
}

export { compileExpr as compileExpression, generateElement, generateKotlinFile };
