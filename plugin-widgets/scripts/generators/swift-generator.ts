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
import { Expression, compileExpression, compilePropertyValue as compilePropValue } from './expression-compiler';
import { BaseLayoutElement, getSettingKey, getSingleBinding, hasTemplateBinding, isExpression, isSettingReference, toPlatformFontWeight } from './shared-utils';
import { DEFAULT_COLOR_MAPS } from './modifier-builders';
import { compilePropertyValue } from './expression-compiler';

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
    color?: Expression; // Top-level default color for all text elements
    background?: {
        type: string;
        color?: string;
    };
    variants?: {
        condition: string;
        layout: BaseLayoutElement;
    }[];
    layout: BaseLayoutElement;
    generatePreviews?: boolean;
    preview?: {
        sizes?: { width: number; height: number; category: string }[];
        fakeData?: Record<string, any>;
    };
}

// ============================================================================
// EXPRESSION & TEMPLATE HANDLING
// ============================================================================

/**
 * Compile an expression or value to Swift code
 */
function compileToSwift(value: Expression | undefined, defaultValue: string = '""', literalHandler?: Function): string {
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
        if (literalHandler) {
            return literalHandler(value);
        }
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
 * Supports both literal values and expressions (including config.settings.*)
 */
function toSwiftFontWeight(weight?: Expression, fallback: string = 'normal'): string {
    if (weight === undefined) {
        return toPlatformFontWeight(fallback, 'swift');
    }

    // Use compileExpression for all non-literal values (expressions, config.settings, etc.)
    if (isExpression(weight)) {
        return compilePropValue(
            weight,
            {
                platform: 'swift',
                formatter: (v: string) => toPlatformFontWeight(v, 'swift')
            },
            toPlatformFontWeight(fallback, 'swift')
        );
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
 * Also handles expression-based alignments (case/conditional expressions)
 */
function toSwiftAlignment(alignment?: any, crossAlignment?: any, isVertical: boolean = true): string {
    if (isVertical) {
        // For VStack: crossAlignment is horizontal
        const hAlign = crossAlignment;
        if (isExpression(hAlign)) {
            // Compile the expression and map enum values to SwiftUI alignment
            const compiled = compileExpression(hAlign, {
                platform: 'swift',
                context: 'value',
                formatter: (v: string) => {
                    switch (v) {
                        case 'start':
                            return '.leading';
                        case 'end':
                            return '.trailing';
                        case 'center':
                            return '.center';
                        default:
                            return '.center';
                    }
                }
            });
            return compiled;
        }
        const h = (hAlign as string) || 'center';
        switch (h) {
            case 'start':
                return '.leading';
            case 'center':
                return '.center';
            case 'end':
                return '.trailing';
            case 'stretch':
                return '.leading';
            default:
                return '.center';
        }
    } else {
        // For HStack: crossAlignment is vertical
        const vAlign = crossAlignment;
        if (isExpression(vAlign)) {
            const compiled = compileExpression(vAlign, {
                platform: 'swift',
                context: 'value',
                formatter: (v: string) => {
                    switch (v) {
                        case 'start':
                            return '.top';
                        case 'end':
                            return '.bottom';
                        case 'center':
                            return '.center';
                        default:
                            return '.center';
                    }
                }
            });
            return compiled;
        }
        const v = (vAlign as string) || 'center';
        switch (v) {
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
 * Convert vertical alignment to SwiftUI frame alignment
 */
function toSwiftVerticalFrameAlignment(alignment: string): string {
    switch (alignment) {
        case 'start':
        case 'top':
            return '.top';
        case 'center':
            return '.center';
        case 'end':
        case 'bottom':
            return '.bottom';
        default:
            return '.center';
    }
}

/**
 * Convert horizontal alignment to SwiftUI frame alignment
 */
function toSwiftHorizontalFrameAlignment(alignment: string): string {
    switch (alignment) {
        case 'start':
            return '.leading';
        case 'center':
            return '.center';
        case 'end':
            return '.trailing';
        default:
            return '.center';
    }
}

/**
 * Convert color reference to Swift
 */
function toSwiftColor(color?: Expression): string {
    if (color === undefined) return 'WidgetColorProvider.onSurface(for: colorScheme)';

    // Handle string colors
    if (typeof color === 'string') {
        if (color.startsWith('#')) {
            return `Color(hex: "${color}")`;
        }
        return DEFAULT_COLOR_MAPS.swift[color] || 'WidgetColorProvider.onSurface(for: colorScheme)';
    }

    // Handle expressions
    if (isExpression(color)) {
        // For expressions, compile and handle color mapping inline
        const compiled = compileExpression(color, {
            platform: 'swift',
            context: 'value'
        });

        // If the compiled expression references config.settings, it needs hex color parsing
        // Otherwise, handle color theme lookups
        return compiled;
    }

    return 'WidgetColorProvider.onSurface(for: colorScheme)';
}

/**
 * Wrap color expression with proper Swift color handling
 */
function wrapColorParsingSwift(colorExpr: string): string {
    // Check if expression contains config.settings - needs runtime color parsing
    if (colorExpr.includes('config.settings')) {
        // For simple config.settings?["key"] as? String expressions, wrap with Color parsing
        // For complex expressions (ternaries), they already handle the mapping via case expressions

        // Check if this is already a complex ternary with WidgetColorProvider fallback
        if (colorExpr.includes('?') && colorExpr.includes(':')) {
            // Complex expression - already handles conditional logic
            // Just ensure colors are properly parsed at runtime
            // The expression structure is: condition ? fallback : config.settings?["key"] as? String
            // We need to wrap just the config.settings part
            // Since the expression is complex, return it as-is and let the .map handle hex parsing
            const match = colorExpr.match(/config\.settings\?\["([^"]+)"\]\s+as\?\s+String/);
            if (match) {
                const key = match[1];
                // Replace the matched pattern with a color-parsed version
                return `(config.settings?["${key}"] as? String).map { Color(hex: $0) } ?? WidgetColorProvider.onSurface(for: colorScheme)`;
            }
        }

        // Simple config.settings reference - extract key and wrap with hex parsing
        const keyMatch = colorExpr.match(/config\.settings\?\["([^"]+)"\]/);
        if (keyMatch) {
            const settingKey = keyMatch[1];
            return `(config.settings?["${settingKey}"] as? String).map { Color(hex: $0) } ?? WidgetColorProvider.onSurface(for: colorScheme)`;
        }

        // Fallback: if we can't extract the key, wrap the entire expression
        return `(${colorExpr} as? String).map { Color(hex: $0) } ?? WidgetColorProvider.onSurface(for: colorScheme)`;
    }

    // Check if expression contains theme color references that need mapping
    if (colorExpr.includes('color.')) {
        // Theme color references should already be mapped by DEFAULT_COLOR_MAPS
        return colorExpr;
    }

    return colorExpr;
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

/**
 * Compile a size (fontSize, size, etc.) to Swift
 * Handles both literal numbers and expressions
 */
function compileSizeToSwift(value: any, defaultVal: number): string {
    if (value === undefined) return String(defaultVal);
    if (typeof value === 'number') return String(value);
    if (isExpression(value)) {
        return compileExpression(value, { platform: 'swift', context: 'value' });
    }
    return String(value);
}

/**
 * Compile a dimension to Swift dp/pt value (no .dp suffix needed in Swift)
 */
function compileDimToSwift(value: any, defaultVal: number): string {
    if (value === undefined) return String(defaultVal);
    if (typeof value === 'number') return String(value);
    if (isExpression(value)) {
        return compileExpression(value, { platform: 'swift', context: 'value' });
    }
    return String(value);
}

/**
 * Build SwiftUI view modifiers for sizing (fill/frame/flex)
 * Returns array of modifier strings like ".frame(maxWidth: .infinity)"
 */
function buildSwiftSizeModifiers(element: BaseLayoutElement): string[] {
    const mods: string[] = [];
    if (element.fillMaxSize) {
        mods.push('.frame(maxWidth: .infinity, maxHeight: .infinity)');
    } else {
        if (element.fillWidth) {
            mods.push('.frame(maxWidth: .infinity)');
        } else if (element.width !== undefined && !isExpression(element.width)) {
            mods.push(`.frame(width: ${element.width})`);
        }
        if (element.fillHeight) {
            mods.push('.frame(maxHeight: .infinity)');
        } else if (element.height !== undefined && !isExpression(element.height)) {
            mods.push(`.frame(height: ${element.height})`);
        }
    }
    return mods;
}

/**
 * Build a SwiftUI padding modifier string from element padding properties
 */
function buildSwiftPaddingModifier(element: BaseLayoutElement): string[] {
    const mods: string[] = [];

    if (element.padding !== undefined) {
        const v = compileDimToSwift(element.padding, 0);
        mods.push(`.padding(${v})`);
    }
    if (element.paddingHorizontal !== undefined && element.paddingVertical !== undefined) {
        const h = compileDimToSwift(element.paddingHorizontal, 0);
        const v2 = compileDimToSwift(element.paddingVertical, 0);
        mods.push(`.padding(.horizontal, ${h})`);
        mods.push(`.padding(.vertical, ${v2})`);
    } else {
        if (element.paddingHorizontal !== undefined) {
            const h = compileDimToSwift(element.paddingHorizontal, 0);
            mods.push(`.padding(.horizontal, ${h})`);
        }
        if (element.paddingVertical !== undefined) {
            const v2 = compileDimToSwift(element.paddingVertical, 0);
            mods.push(`.padding(.vertical, ${v2})`);
        }
    }
    if (element.paddingTop !== undefined) {
        const v = compileDimToSwift(element.paddingTop, 0);
        mods.push(`.padding(.top, ${v})`);
    }
    if (element.paddingBottom !== undefined) {
        const v = compileDimToSwift(element.paddingBottom, 0);
        mods.push(`.padding(.bottom, ${v})`);
    }
    if (element.paddingLeft !== undefined) {
        const v = compileDimToSwift(element.paddingLeft, 0);
        mods.push(`.padding(.leading, ${v})`);
    }
    if (element.paddingRight !== undefined) {
        const v = compileDimToSwift(element.paddingRight, 0);
        mods.push(`.padding(.trailing, ${v})`);
    }

    return mods;
}

/**
 * Apply all visual modifiers (size, padding, background, cornerRadius, opacity) to a view's last line
 */
function applySwiftModifiers(lines: string[], element: BaseLayoutElement): void {
    const sizeModifiers = buildSwiftSizeModifiers(element);
    const paddingModifiers = buildSwiftPaddingModifier(element);
    const allMods = [...sizeModifiers, ...paddingModifiers];

    if (element.backgroundColor) {
        const bgColor = toSwiftColor(element.backgroundColor);
        allMods.push(`.background(${bgColor})`);
    }
    if (element.cornerRadius) {
        const radius = compileDimToSwift(element.cornerRadius, 0);
        allMods.push(`.cornerRadius(${radius})`);
    }
    if (element.flex !== undefined) {
        // In SwiftUI, flex is handled by Spacer() inside containers, but when set on a
        // container element itself it means it should expand. Use layoutPriority for this.
        allMods.push('.layoutPriority(1)');
    }

    // Add opacity modifier (only this new modifier to avoid duplicates)
    if (element.opacity !== undefined) {
        const opacityExpr = compilePropertyValue(element.opacity, {
            platform: 'swift',
            context: 'value',
            formatter: (v: number) => `${v}`
        });
        if (opacityExpr) {
            allMods.push(`.opacity(${opacityExpr})`);
        }
    }

    if (allMods.length > 0) {
        // Append all modifiers to the last line
        lines[lines.length - 1] += allMods.join('');
    }
}

// ============================================================================
// ELEMENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate Swift code for an element with parent context
 */
function generateElementWithParent(element: BaseLayoutElement, indent: string = '                ', defaultColor?: string, parentType?: string): string {
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
            lines.push(...generateColumn(element, currentIndent, defaultColor, parentType));
            break;
        case 'row':
            lines.push(...generateRow(element, currentIndent, defaultColor, parentType));
            break;
        case 'stack':
            lines.push(...generateStack(element, currentIndent, defaultColor));
            break;
        case 'label':
            lines.push(...generateLabel(element, currentIndent, defaultColor, parentType));
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
            lines.push(...generateScrollView(element, currentIndent, defaultColor));
            break;
        case 'forEach':
            lines.push(...generateForEach(element, currentIndent, defaultColor));
            break;
        case 'conditional':
            lines.push(...generateConditional(element, currentIndent, defaultColor));
            break;
        case 'clock':
            lines.push(...generateClock(element, currentIndent, defaultColor));
            break;
        case 'date':
            lines.push(...generateDate(element, currentIndent, defaultColor));
            break;
        default:
            lines.push(`${currentIndent}// Unknown element type: ${element.type}`);
    }

    // Apply alignment frame modifier based on parent type
    if (parentType && element.alignment) {
        const lastLineIndex = lines.length - 1;
        if (parentType === 'row') {
            // In a row, child alignment affects vertical position
            const vAlign = toSwiftVerticalFrameAlignment(element.alignment);
            if (vAlign) {
                lines[lastLineIndex] += `.frame(maxHeight: .infinity, alignment: ${vAlign})`;
            }
        } else if (parentType === 'column') {
            // In a column, child alignment affects horizontal position
            const hAlign = toSwiftHorizontalFrameAlignment(element.alignment);
            if (hAlign) {
                lines[lastLineIndex] += `.frame(maxWidth: .infinity, alignment: ${hAlign})`;
            }
        }
    }

    // Apply flex modifier based on parent type
    if (parentType && element.flex !== undefined) {
        const lastLineIndex = lines.length - 1;
        if (parentType === 'row') {
            lines[lastLineIndex] += `.frame(maxWidth: .infinity)`;
        } else if (parentType === 'column') {
            lines[lastLineIndex] += `.frame(maxHeight: .infinity)`;
        }
    }

    if (wrapWithIf) {
        lines.push(`${indent}}`);
    }

    return lines.join('\n');
}

/**
 * Generate Swift code for an element (without parent context)
 */
function generateElement(element: BaseLayoutElement, indent: string = '                ', defaultColor?: string): string {
    return generateElementWithParent(element, indent, defaultColor, undefined);
}

function generateColumn(element: BaseLayoutElement, indent: string, defaultColor?: string, parentType?: string): string[] {
    const lines: string[] = [];
    const spacing = calculateSpacing(element);
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, true);

    lines.push(`${indent}VStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            // flex: 1 child in a column = flexible vertical spacer → Spacer()
            if (child.type === 'spacer' && child.flex !== undefined) {
                lines.push(`${indent}    Spacer()`);
            } else {
                // Pass parent type to child so it knows it's in a column
                lines.push(generateElementWithParent(child, indent + '    ', defaultColor, 'column'));
            }
        }
    }

    lines.push(`${indent}}`);

    // Add .fixedSize for VStack
    if (parentType) {
        lines[lines.length - 1] += '.fixedSize(horizontal: true, vertical: false)';
    }

    applySwiftModifiers(lines, element);

    return lines;
}

function generateRow(element: BaseLayoutElement, indent: string, defaultColor?: string, parentType?: string): string[] {
    const lines: string[] = [];
    const spacing = calculateSpacing(element);
    const alignment = toSwiftAlignment(element.alignment, element.crossAlignment, false);

    lines.push(`${indent}HStack(alignment: ${alignment}, spacing: ${spacing}) {`);

    if (element.children) {
        for (const child of element.children) {
            // flex: 1 child in a row = flexible horizontal spacer → Spacer()
            if (child.type === 'spacer' && child.flex !== undefined) {
                lines.push(`${indent}    Spacer()`);
            } else {
                // Pass parent type to child so it knows it's in a row
                lines.push(generateElementWithParent(child, indent + '    ', defaultColor, 'row'));
            }
        }
    }

    lines.push(`${indent}}`);

    // Add .fixedSize for HStack
    if (parentType) {
        lines[lines.length - 1] += '.fixedSize(horizontal: false, vertical: true)';
    }

    applySwiftModifiers(lines, element);

    return lines;
}

function generateStack(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
    const lines: string[] = [];

    // Convert contentAlignment to SwiftUI ZStack alignment
    const contentAlignment = (element as any).contentAlignment as string | undefined;
    let stackAlignment = '';
    if (contentAlignment) {
        const alignMap: Record<string, string> = {
            TopStart: '.topLeading',
            TopCenter: '.top',
            TopEnd: '.topTrailing',
            CenterStart: '.leading',
            Center: '.center',
            CenterEnd: '.trailing',
            BottomStart: '.bottomLeading',
            BottomCenter: '.bottom',
            BottomEnd: '.bottomTrailing'
        };
        const mapped = alignMap[contentAlignment];
        if (mapped) stackAlignment = `alignment: ${mapped}`;
    }

    lines.push(`${indent}ZStack${stackAlignment ? `(${stackAlignment})` : ''} {`);

    if (element.children) {
        for (const child of element.children) {
            if (child.type === 'spacer' && child.flex !== undefined) {
                lines.push(`${indent}    Spacer()`);
            } else {
                lines.push(generateElement(child, indent + '    ', defaultColor));
            }
        }
    }

    lines.push(`${indent}}`);
    applySwiftModifiers(lines, element);

    return lines;
}

function generateLabel(element: BaseLayoutElement, indent: string, defaultColor?: string, parentType?: string): string[] {
    const lines: string[] = [];

    // Compile text expression
    const textExpr = compileToSwift(element.text, '""', (value: string) => `WidgetLocalizedStrings.${value}`);

    lines.push(`${indent}Text(${textExpr})`);

    // Font size - supports expressions (min/max)
    const fontSize = compileSizeToSwift(element.fontSize, DEFAULT_FONT_SIZE);
    const fontWeight = toSwiftFontWeight(element.fontWeight);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);

    // Color - use element color if defined, otherwise fall back to defaultColor, otherwise use theme default
    let color: string;
    if (element.color !== undefined && element.color !== null) {
        color = toSwiftColor(element.color);
    } else if (defaultColor && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(defaultColor)) {
        // defaultColor is a simple identifier (variable name) - use directly
        color = defaultColor;
    } else if (defaultColor) {
        // defaultColor is an expression - compile it
        color = toSwiftColor(defaultColor);
    } else {
        color = 'WidgetColorProvider.onSurface(for: colorScheme)';
    }
    lines.push(`${indent}    .foregroundColor(${color})`);

    // Text alignment - use frame alignment instead of multilineTextAlignment
    if (element.textAlign !== undefined) {
        if (isExpression(element.textAlign)) {
            const compiled = compileExpression(element.textAlign, {
                platform: 'swift',
                context: 'value',
                formatter: (v: string) => {
                    if (v === 'center') return '.center';
                    if (v === 'right' || v === 'end') return '.trailing';
                    return '.leading';
                }
            });
            lines.push(`${indent}    .frame(maxWidth: .infinity, alignment: ${compiled})`);
        } else {
            let alignment = '.leading';
            if (element.textAlign === 'center') alignment = '.center';
            else if (element.textAlign === 'right' || element.textAlign === 'end') alignment = '.trailing';
            lines.push(`${indent}    .frame(maxWidth: .infinity, alignment: ${alignment})`);
        }
    }

    // Line limit
    if (element.maxLines) {
        const maxLines = typeof element.maxLines === 'number' ? element.maxLines : compileToSwift(element.maxLines, '1');
        lines.push(`${indent}    .lineLimit(${maxLines})`);
    }

    // Apply padding/background/cornerRadius modifiers
    applySwiftModifiers(lines, element);

    return lines;
}

function generateImage(element: BaseLayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const size = compileSizeToSwift(element.size, DEFAULT_IMAGE_SIZE);

    // Compile src expression
    const srcExpr = compileToSwift(element.src, '"default_icon"');

    lines.push(`${indent}WeatherIconView(${srcExpr}, description: data.description, size: ${size})`);
    applySwiftModifiers(lines, element);

    return lines;
}

function generateSpacer(element: BaseLayoutElement, indent: string): string[] {
    if (element.size !== undefined) {
        const size = typeof element.size === 'number' ? element.size : compileToSwift(element.size, '8');
        // Use width for horizontal spacers, height for vertical spacers
        const dimension = element.direction === 'horizontal' ? 'width' : 'height';
        return [`${indent}Spacer().frame(${dimension}: ${size})`];
    }
    return [`${indent}Spacer()`];
}

function generateDivider(element: BaseLayoutElement, indent: string): string[] {
    const color = toSwiftColor(element.color || 'onSurfaceVariant');
    const thickness = typeof element.thickness === 'number' ? element.thickness : element.thickness ? compileToSwift(element.thickness, '1') : 1;
    return [`${indent}Divider().frame(height: ${thickness}).background(${color}.opacity(0.3))`];
}

function generateScrollView(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
    const lines: string[] = [];
    const axis = element.direction === 'horizontal' ? '.horizontal' : '.vertical';

    lines.push(`${indent}ScrollView(${axis}, showsIndicators: false) {`);

    if (element.children) {
        const containerType = element.direction === 'horizontal' ? 'HStack' : 'VStack';
        lines.push(`${indent}    ${containerType}(spacing: 8) {`);
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '        ', defaultColor));
        }
        lines.push(`${indent}    }`);
    }

    lines.push(`${indent}}`);

    return lines;
}

function generateForEach(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
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
        lines.push(generateElement(element.itemTemplate, indent + '    ', defaultColor));
    }

    lines.push(`${indent}}`);

    return lines;
}

function generateConditional(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
    const lines: string[] = [];
    const condition = compileConditionToSwift(element.condition);

    lines.push(`${indent}if ${condition} {`);
    if (element.then) {
        lines.push(generateElement(element.then, indent + '    ', defaultColor));
    }
    lines.push(`${indent}}`);

    if (element.else) {
        lines.push(`${indent}else {`);
        lines.push(generateElement(element.else, indent + '    ', defaultColor));
        lines.push(`${indent}}`);
    }

    return lines;
}

function generateClock(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
    const fontSize = compileSizeToSwift(element.fontSize, 24);
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'bold');
    // Use element color if defined, otherwise fall back to defaultColor, otherwise use theme default
    let color: string;
    if (element.color !== undefined && element.color !== null) {
        color = toSwiftColor(element.color);
    } else if (defaultColor && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(defaultColor)) {
        color = defaultColor;
    } else if (defaultColor) {
        color = toSwiftColor(defaultColor);
    } else {
        color = 'WidgetColorProvider.onSurface';
    }

    const lines: string[] = [];
    // Always use locale-aware time (respects system 24h/12h and AM/PM preference)
    lines.push(`${indent}Text(Date(), style: .time)`);
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    lines.push(`${indent}    .foregroundColor(${color})`);

    return lines;
}

function generateDate(element: BaseLayoutElement, indent: string, defaultColor?: string): string[] {
    const fontSize = compileSizeToSwift(element.fontSize, 14);
    const fontWeight = toSwiftFontWeight(element.fontWeight, 'normal');
    // Use element color if defined, otherwise fall back to defaultColor, otherwise use theme default
    let color: string;
    if (element.color !== undefined && element.color !== null) {
        color = toSwiftColor(element.color);
    } else if (defaultColor && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(defaultColor)) {
        color = defaultColor;
    } else if (defaultColor) {
        color = toSwiftColor(defaultColor);
    } else {
        color = 'WidgetColorProvider.onSurface';
    }
    const style = (element as any).style as string | undefined;

    const lines: string[] = [];

    if (style === 'dayMonth') {
        lines.push(`${indent}Text({`);
        lines.push(`${indent}    let f = DateFormatter()`);
        lines.push(`${indent}    f.setLocalizedDateFormatFromTemplate("MMMd")`);
        lines.push(`${indent}    return f.string(from: Date())`);
        lines.push(`${indent}}())`);
    } else if (style === 'fullDate') {
        lines.push(`${indent}Text({`);
        lines.push(`${indent}    let f = DateFormatter()`);
        lines.push(`${indent}    f.dateStyle = .long`);
        lines.push(`${indent}    f.timeStyle = .none`);
        lines.push(`${indent}    return f.string(from: Date())`);
        lines.push(`${indent}}())`);
    } else if (style === 'year') {
        lines.push(`${indent}Text({`);
        lines.push(`${indent}    let f = DateFormatter()`);
        lines.push(`${indent}    f.dateFormat = "yyyy"`);
        lines.push(`${indent}    return f.string(from: Date())`);
        lines.push(`${indent}}())`);
    } else if (style === 'month') {
        lines.push(`${indent}Text({`);
        lines.push(`${indent}    let f = DateFormatter()`);
        lines.push(`${indent}    f.dateFormat = "MMMM"`);
        lines.push(`${indent}    return f.string(from: Date())`);
        lines.push(`${indent}}())`);
    } else {
        lines.push(`${indent}Text(Date(), style: .date)`);
    }
    lines.push(`${indent}    .font(.system(size: ${fontSize}, weight: ${fontWeight}))`);
    lines.push(`${indent}    .foregroundColor(${color})`);

    return lines;
}

/**
 * Generate preview block for a widget (similar to Android glance generator)
 */
function generateSwiftPreviewBlock(layout: WidgetLayout, viewName: string): string[] {
    const lines: string[] = [];

    // Check if previews should be generated
    if (layout.generatePreviews !== true || !layout.preview) {
        return lines;
    }

    // Determine preview sizes
    let sizes: { width: number; height: number; category: string }[];
    if (layout.preview.sizes && layout.preview.sizes.length > 0) {
        sizes = layout.preview.sizes;
    } else {
        sizes = [{ width: 260, height: 120, category: 'medium' }];
    }

    // Build fakeData Swift constructor arguments
    const fakeData = layout.preview.fakeData;
    const fakeDataLines: string[] = [];

    if (fakeData) {
        const scalar = (key: string, v: any) => `            ${key}: "${v}"`;

        const hourlyItem = (item: any) => {
            const props = [
                item.time !== undefined ? `time: "${item.time}"` : null,
                item.temperature !== undefined ? `temperature: "${item.temperature}"` : null,
                item.iconPath !== undefined ? `iconPath: "app/assets/icon_themes/meteocons/images/${item.iconPath}.png"` : null,
                item.description !== undefined ? `description: "${item.description}"` : null,
                item.precipAccumulation !== undefined ? `precipAccumulation: "${item.precipAccumulation}"` : null,
                item.windSpeed !== undefined ? `windSpeed: "${item.windSpeed}"` : null,
                item.precipitation !== undefined ? `precipitation: "${item.precipitation}"` : null
            ].filter(Boolean);
            return `HourlyData(${props.join(', ')})`;
        };

        const dailyItem = (item: any) => {
            const props = [
                item.day !== undefined ? `day: "${item.day}"` : null,
                item.temperatureHigh !== undefined ? `temperatureHigh: "${item.temperatureHigh}"` : null,
                item.temperatureLow !== undefined ? `temperatureLow: "${item.temperatureLow}"` : null,
                item.iconPath !== undefined ? `iconPath: "app/assets/icon_themes/meteocons/images/${item.iconPath}.png"` : null,
                item.description !== undefined ? `description: "${item.description}"` : null,
                item.precipitation !== undefined ? `precipitation: "${item.precipitation}"` : null,
                item.windSpeed !== undefined ? `windSpeed: "${item.windSpeed}"` : null,
                item.precipAccumulation !== undefined ? `precipAccumulation: "${item.precipAccumulation}"` : null
            ].filter(Boolean);
            return `DailyData(${props.join(', ')})`;
        };

        const WeatherWidgetDataKeys = ['temperature', 'locationName', 'iconPath', 'description', 'hourlyData', 'dailyData'];
        WeatherWidgetDataKeys.forEach((key) => {
            const value = fakeData[key];
            if (value) {
                switch (key) {
                    case 'temperature':
                    case 'description':
                    case 'locationName':
                    case 'date':
                        fakeDataLines.push(`${scalar(key, value)},`);
                        break;
                    case 'iconPath':
                        fakeDataLines.push(`${scalar(key, `app/assets/icon_themes/meteocons/images/${value}.png`)},`);
                        break;
                    case 'hourlyData':
                        fakeDataLines.push(`            hourlyData: [${(value as any[]).map(hourlyItem).join(', ')}],`);
                        break;
                    case 'dailyData':
                        fakeDataLines.push(`            dailyData: [${(value as any[]).map(dailyItem).join(', ')}],`);
                        break;
                }
            }
        });
    }

    fakeDataLines.push(`            loadingState: .loaded,`);
    fakeDataLines.push(`            errorMessage: nil`);

    lines.push(`\n// MARK: - Previews`);

    // Generate preview for each size
    const handledCategories = new Set<string>();
    for (const size of sizes) {
        const category = size.category;
        if (!handledCategories.has(category)) {
            handledCategories.add(category);
            const system = `system${category[0].toUpperCase()}${category.slice(1)}`;
            lines.push(`@available(iOS 17.0, *)`);
            lines.push(`#Preview ("Preview ${category}", as: .${system}) {`);
            lines.push(`    ${layout.name}()`);
            lines.push(`} timeline: {`);
            lines.push(`    let fakeData = WeatherWidgetData(`);
            lines.push(...fakeDataLines);
            lines.push(`    )`);
            lines.push(`    WeatherEntry(date: .now, data: fakeData, widgetFamily: .${system}, widgetKind: "${layout.name}", config: WidgetConfig())`);
            lines.push(`}\n`);
        }
    }

    // Error preview
    // lines.push(`#Preview("Error", as: .systemMedium) {`);
    // lines.push(`    ${layout.name}()`);
    // lines.push(`} timeline: {`);
    // lines.push(`    let errorData = WeatherWidgetData(`);
    // lines.push(`            loadingState: .error,`);
    // lines.push(`            errorMessage: "Unable to fetch weather data"`);
    // lines.push(`    )`);
    // lines.push(`    WeatherEntry(date: .now, data: errorData, widgetFamily: .systemMedium, widgetKind: "${layout.name}", config: WidgetConfig())`);
    // lines.push(`}`);

    return lines;
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
    @Environment(\\.colorScheme) var colorScheme
    
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let height = geometry.size.height
            let config = entry.config ?? WidgetConfig()
            `;

    // Compile top-level color if present
    let defaultColorRef: string | undefined;
    if (layout.color !== undefined) {
        const colorExpr = toSwiftColor(layout.color);
        const wrappedColor = wrapColorParsingSwift(colorExpr);
        code += `let widgetColor = ${wrappedColor}\n            `;
        defaultColorRef = 'widgetColor';
    }

    code += `
            if let data = entry.data, entry.data?.loadingState == WeatherWidgetData.LoadingState.loaded {
                WidgetContainer {
`;

    // Generate variant conditions
    if (layout.variants && layout.variants.length > 0) {
        for (let i = 0; i < layout.variants.length; i++) {
            const variant = layout.variants[i];
            const condition = compileConditionToSwift(variant.condition);
            const keyword = i === 0 ? 'if' : '} else if';

            code += `                    ${keyword} ${condition} {\n`;
            code += generateElement(variant.layout, '                        ', defaultColorRef) + '\n';
        }

        // Default layout
        code += `                    } else {\n`;
        code += generateElement(layout.layout, '                        ', defaultColorRef) + '\n';
        code += `                    }\n`;
    } else {
        code += generateElement(layout.layout, '                    ', defaultColorRef) + '\n';
    }

    code += `                }
            } else {
                NoDataView(state: entry.data?.loadingState ?? WeatherWidgetData.LoadingState.none, errorMessage: entry.data?.errorMessage)
            }
        }
    }
}
`;

    // Add preview block
    const previewLines = generateSwiftPreviewBlock(layout, viewName);
    if (previewLines.length > 0) {
        code += previewLines.join('\n') + '\n';
    }

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
