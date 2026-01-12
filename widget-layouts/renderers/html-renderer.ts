/**
 * Widget Layout Renderer for HTML
 * Parses JSON widget layouts and renders them as HTML for preview generation
 */

import { evaluateExpression, isExpression } from '../mapbox-expressions';

// Color mapping for theme colors
const THEME_COLORS: Record<string, string> = {
    onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0',
    primary: '#D0BCFF',
    error: '#F2B8B5',
    widgetBackground: '#1C1B1F',
    surface: '#2B2930'
};

// Font weight mapping
const FONT_WEIGHTS: Record<string, string> = {
    normal: '400',
    medium: '500',
    bold: '700'
};

export interface WidgetLayout {
    name: string;
    displayName?: string;
    description?: string;
    supportedSizes?: { width: number; height: number; family: string }[];
    defaultPadding?: number;
    background?: {
        type: string;
        color?: string;
        image?: string;
    };
    variants?: {
        condition: string;
        layout: LayoutElement;
    }[];
    layout: LayoutElement;
}

export interface LayoutElement {
    type: string;
    id?: string;
    visible?: boolean;
    visibleIf?: string;
    padding?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    margin?: number;
    marginHorizontal?: number;
    marginVertical?: number;
    width?: number | string;
    height?: number | string;
    fillWidth?: boolean;
    fillHeight?: boolean;
    flex?: number;
    backgroundColor?: string;
    cornerRadius?: number;
    children?: LayoutElement[];
    spacing?: number;
    alignment?: string;
    crossAlignment?: string;
    [key: string]: any;
}

export interface WidgetData {
    temperature?: string;
    locationName?: string;
    description?: string;
    iconPath?: string;
    hourlyData?: {
        hour: string;
        temperature: string;
        iconPath?: string;
        description?: string;
        precipAccumulation?: string;
    }[];
    dailyData?: {
        day: string;
        temperatureHigh: string;
        temperatureLow: string;
        iconPath?: string;
        description?: string;
        precipAccumulation?: string;
    }[];
}

export interface RenderContext {
    data?: WidgetData;
    size: { width: number; height: number };
    item?: any;
    index?: number;
    assetsBaseUrl?: string;
    themeVars?: Record<string, string>;
}

/**
 * Resolve a property value that might be a Mapbox expression or literal
 */
function resolveValue(value: any, context: RenderContext): any {
    if (isExpression(value)) {
        return evaluateExpression(value, context);
    }
    return value;
}

/**
 * Resolve a color value (theme color or hex)
 */
function resolveColor(color: string | undefined, themeVars: Record<string, string> = THEME_COLORS): string {
    if (!color) return 'transparent';
    if (color.startsWith('#')) return color;
    // theme color like onSurface -> map from themeVars
    return themeVars[color] ?? color;
}

/**
 * Resolve a data binding like "{{temperature}}" or "{{item.hour}}"
 */
function formatDataValue(v: any): string {
    // Accept: "12 °C" (string), 12 (number), or { value: 12, unit: "°C" }
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object' && 'value' in v) {
        const val = v.value;
        const unit = v.unit ?? '';
        return `${val}${unit ? ' ' + unit : ''}`;
    }
    return String(v);
}

// Convert a binding "{{...}}" into a resolved string/number value
function resolveBinding(text: string, context: RenderContext): string {
    if (!text) return '';
    // Replace all occurrences of mustache bindings with resolved data values
    // e.g. "Max {{item.temperatureHigh}} / Min {{item.temperatureLow}}"
    const replaced = text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, expr) => {
        const parts = (expr || '').trim().split('.');
        let current: any;
        if (parts[0] === 'data') {
            current = context.data;
            parts.shift();
        } else if (parts[0] === 'item') {
            current = context.item;
            parts.shift();
        } else if (parts[0] === 'size') {
            current = context.size;
            parts.shift();
        } else {
            current = context.data;
        }
        for (const p of parts) {
            if (current === undefined || current === null) break;
            current = current[p];
        }
        return formatDataValue(current);
    });
    return replaced;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Safely evaluate a simple comparison expression
 * Only supports: number comparisons with <, >, <=, >=, ==, !=
 */
function safeEvaluateExpression(expr: string): boolean {
    // Remove whitespace
    expr = expr.trim();

    // Handle boolean literals
    if (expr === 'true') return true;
    if (expr === 'false') return false;

    // Match simple comparison: number op number
    const comparisonMatch = expr.match(/^(\d+(?:\.\d+)?)\s*(<=|>=|<|>|==|!=)\s*(\d+(?:\.\d+)?)$/);
    if (comparisonMatch) {
        const left = parseFloat(comparisonMatch[1]);
        const op = comparisonMatch[2];
        const right = parseFloat(comparisonMatch[3]);

        switch (op) {
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            case '==':
                return left === right;
            case '!=':
                return left !== right;
        }
    }

    // Handle && and || by splitting and recursing
    if (expr.includes('&&')) {
        const parts = expr.split('&&');
        return parts.every((part) => safeEvaluateExpression(part));
    }
    if (expr.includes('||')) {
        const parts = expr.split('||');
        return parts.some((part) => safeEvaluateExpression(part));
    }

    // Default to true for unrecognized expressions
    return true;
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition: string, context: RenderContext): boolean {
    try {
        let expr = condition.replace(/size\.width/g, context.size.width.toString()).replace(/size\.height/g, context.size.height.toString());

        expr = expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g, (match) => {
            if (['true', 'false', 'null', 'undefined'].includes(match)) return match;
            if (/^\d+$/.test(match)) return match;
            if (['<', '>', '<=', '>=', '==', '!=', '&&', '||'].some((op) => match === op)) return match;

            const parts = match.split('.');
            let value: any = context;

            for (const part of parts) {
                if (part === 'item' && context.item) {
                    value = context.item;
                } else if (value && typeof value === 'object') {
                    value = value[part] ?? value.data?.[part];
                } else {
                    value = undefined;
                    break;
                }
            }

            if (value === undefined || value === null || value === '') {
                return 'false';
            }
            return 'true';
        });

        // Use safe expression evaluator instead of Function constructor
        return safeEvaluateExpression(expr);
    } catch {
        return true;
    }
}

/**
 * Select the appropriate layout variant based on size
 */
function selectLayout(widget: WidgetLayout, context: RenderContext): LayoutElement {
    if (widget.variants) {
        for (const variant of widget.variants) {
            if (evaluateCondition(variant.condition, context)) {
                return variant.layout;
            }
        }
    }
    return widget.layout;
}

/**
 * Build CSS styles object
 */
function buildStyles(element: LayoutElement, context?: RenderContext): Record<string, string> {
    const styles: Record<string, string> = {};
    const themeVars = context?.themeVars ?? THEME_COLORS;

    // Padding
    if (element.padding !== undefined) {
        const paddingValue = resolveValue(element.padding, context);
        styles['padding'] = `${paddingValue}px`;
    }
    if (element.paddingHorizontal !== undefined) {
        const paddingValue = resolveValue(element.paddingHorizontal, context);
        styles['padding-left'] = `${paddingValue}px`;
        styles['padding-right'] = `${paddingValue}px`;
    }
    if (element.paddingVertical !== undefined) {
        const paddingValue = resolveValue(element.paddingVertical, context);
        styles['padding-top'] = `${paddingValue}px`;
        styles['padding-bottom'] = `${paddingValue}px`;
    }

    // Margin
    if (element.margin !== undefined) {
        const marginValue = resolveValue(element.margin, context);
        styles['margin'] = `${marginValue}px`;
    }
    if (element.marginHorizontal !== undefined) {
        const marginValue = resolveValue(element.marginHorizontal, context);
        styles['margin-left'] = `${marginValue}px`;
        styles['margin-right'] = `${marginValue}px`;
    }
    if (element.marginVertical !== undefined) {
        const marginValue = resolveValue(element.marginVertical, context);
        styles['margin-top'] = `${marginValue}px`;
        styles['margin-bottom'] = `${marginValue}px`;
    }

    // Size - handle fillWidth/fillHeight, expressions, and literal values
    if (element.fillWidth) {
        styles['width'] = '100%';
    } else if (element.width !== undefined) {
        const widthValue = resolveValue(element.width, context);
        if (typeof widthValue === 'number') {
            styles['width'] = `${widthValue}px`;
        } else if (widthValue === 'fill') {
            styles['width'] = '100%';
        } else if (typeof widthValue === 'string') {
            styles['width'] = widthValue;
        }
    }
    
    if (element.fillHeight) {
        styles['height'] = '100%';
    } else if (element.height !== undefined) {
        const heightValue = resolveValue(element.height, context);
        if (typeof heightValue === 'number') {
            styles['height'] = `${heightValue}px`;
        } else if (heightValue === 'fill') {
            styles['height'] = '100%';
        } else if (typeof heightValue === 'string') {
            styles['height'] = heightValue;
        }
    }

    // Flex
    if (element.flex !== undefined) {
        const flexValue = resolveValue(element.flex, context);
        styles['flex'] = flexValue.toString();
    }

    // Background
    if (element.backgroundColor) {
        styles['background-color'] = resolveColor(element.backgroundColor, themeVars);
    }

    // Corner radius
    if (element.cornerRadius !== undefined) {
        const radiusValue = resolveValue(element.cornerRadius, context);
        styles['border-radius'] = `${radiusValue}px`;
    }

    return styles;
}

/**
 * Convert styles object to CSS string
 */
function stylesToString(styles: Record<string, string>): string {
    return Object.entries(styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
}

/**
 * Render a layout element to HTML
 */
function renderElement(element: LayoutElement, context: RenderContext): string {
    if (element.visible === false) return '';
    
    // Handle visibleIf with Mapbox expressions
    if (element.visibleIf !== undefined) {
        let visible = false;
        if (isExpression(element.visibleIf)) {
            const result = evaluateExpression(element.visibleIf, context);
            visible = Boolean(result);
        } else if (typeof element.visibleIf === 'string') {
            visible = evaluateCondition(element.visibleIf, context);
        } else {
            visible = Boolean(element.visibleIf);
        }
        if (!visible) return '';
    }

    switch (element.type) {
        case 'column':
            return renderColumn(element, context);
        case 'row':
            return renderRow(element, context);
        case 'stack':
            return renderStack(element, context);
        case 'label':
            return renderLabel(element, context);
        case 'image':
            return renderImage(element, context);
        case 'spacer':
            return renderSpacer(element, context);
        case 'divider':
            return renderDivider(element, context);
        case 'scrollView':
            return renderScrollView(element, context);
        case 'forEach':
            return renderForEach(element, context);
        case 'conditional':
            return renderConditional(element, context);
        case 'clock':
            return renderClock(element, context);
        case 'date':
            return renderDate(element, context);
        default:
            console.warn(`Unknown element type: ${element.type}`);
            return '';
    }
}

function renderColumn(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);
    styles['display'] = 'flex';
    styles['flex-direction'] = 'column';
    
    // Ensure column stretches if fillHeight is true
    if (element.fillHeight) {
        styles['height'] = '100%';
    }
    if (element.fillWidth) {
        styles['width'] = '100%';
    }

    // Alignment
    if (element.alignment) {
        const alignment = resolveValue(element.alignment, context);
        switch (alignment) {
            case 'start':
                styles['justify-content'] = 'flex-start';
                break;
            case 'center':
                styles['justify-content'] = 'center';
                break;
            case 'end':
                styles['justify-content'] = 'flex-end';
                break;
            case 'spaceBetween':
                styles['justify-content'] = 'space-between';
                break;
            case 'spaceAround':
                styles['justify-content'] = 'space-around';
                break;
            case 'spaceEvenly':
                styles['justify-content'] = 'space-evenly';
                break;
        }
    }
    if (element.crossAlignment) {
        const crossAlignment = resolveValue(element.crossAlignment, context);
        switch (crossAlignment) {
            case 'start':
                styles['align-items'] = 'flex-start';
                break;
            case 'center':
                styles['align-items'] = 'center';
                break;
            case 'end':
                styles['align-items'] = 'flex-end';
                break;
            case 'stretch':
                styles['align-items'] = 'stretch';
                break;
        }
    }

    // Gap for spacing
    if (element.spacing !== undefined) {
        const spacingValue = resolveValue(element.spacing, context);
        styles['gap'] = `${spacingValue}px`;
    }

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderRow(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);
    styles['display'] = 'flex';
    styles['flex-direction'] = 'row';
    
    // Ensure row stretches if fillWidth is true
    if (element.fillWidth) {
        styles['width'] = '100%';
    }
    if (element.fillHeight) {
        styles['height'] = '100%';
    }

    if (element.alignment) {
        const alignment = resolveValue(element.alignment, context);
        switch (alignment) {
            case 'start':
                styles['justify-content'] = 'flex-start';
                break;
            case 'center':
                styles['justify-content'] = 'center';
                break;
            case 'end':
                styles['justify-content'] = 'flex-end';
                break;
            case 'spaceBetween':
                styles['justify-content'] = 'space-between';
                break;
        }
    }
    if (element.crossAlignment) {
        const crossAlignment = resolveValue(element.crossAlignment, context);
        switch (crossAlignment) {
            case 'start':
                styles['align-items'] = 'flex-start';
                break;
            case 'center':
                styles['align-items'] = 'center';
                break;
            case 'end':
                styles['align-items'] = 'flex-end';
                break;
            case 'stretch':
                styles['align-items'] = 'stretch';
                break;
        }
    }

    if (element.spacing !== undefined) {
        const spacingValue = resolveValue(element.spacing, context);
        styles['gap'] = `${spacingValue}px`;
    }

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderStack(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);
    styles['position'] = 'relative';
    styles['width'] = '100%';
    styles['height'] = '100%';

    const children =
        element.children
            ?.map((child, index) => {
                const childHtml = renderElement(child, context);
                return `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">${childHtml}</div>`;
            })
            .join('') || '';

    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderLabel(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);

    // Handle fontSize - can be expression or number
    if (element.fontSize) {
        const fontSizeValue = resolveValue(element.fontSize, context);
        styles['font-size'] = `${fontSizeValue}px`;
    }
    
    // Handle fontWeight - can be expression or string
    if (element.fontWeight) {
        const fontWeightValue = resolveValue(element.fontWeight, context);
        styles['font-weight'] = FONT_WEIGHTS[fontWeightValue] || '400';
    }
    
    if (element.color) {
        const colorValue = resolveValue(element.color, context);
        styles['color'] = resolveColor(colorValue, context?.themeVars);
    }
    
    if (element.textAlign) {
        styles['text-align'] = element.textAlign;
    }
    
    if (element.maxLines) {
        const maxLinesValue = resolveValue(element.maxLines, context);
        // Fallback for browsers that don't support -webkit-line-clamp
        styles['overflow'] = 'hidden';
        styles['text-overflow'] = 'ellipsis';
        styles['white-space'] = maxLinesValue === 1 ? 'nowrap' : 'normal';
        // For multi-line truncation (webkit browsers)
        if (maxLinesValue > 1) {
            styles['display'] = '-webkit-box';
            styles['-webkit-line-clamp'] = maxLinesValue.toString();
            styles['-webkit-box-orient'] = 'vertical';
        }
    }

    // Handle text - can be expression (like ["get", "temperature"]) or string with bindings (like "{{item.temperature}}")
    let text = '';
    if (element.text) {
        const textValue = resolveValue(element.text, context);
        if (typeof textValue === 'string') {
            // If it contains bindings like {{...}}, resolve them
            text = resolveBinding(textValue, context);
        } else {
            text = String(textValue || '');
        }
    }
    
    return `<span style="${stylesToString(styles)}">${escapeHtml(text)}</span>`;
}

function hasBinding(s?: string): boolean {
    return typeof s === 'string' && /\{\{[^}]+\}\}/.test(s);
}


/**
 * updates to renderImage:
 * - Accept image element with src JSON that may be an "icon id" (like "01d"), build assetsBaseUrl + id + .png
 * - Support size property for setting width and height
 * - Handle Mapbox expressions for src
 * - Handle data URLs for embedded images
 */
function renderImage(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);

    // Handle size property - sets both width and height
    if (element.size !== undefined) {
        const sizeValue = resolveValue(element.size, context);
        styles['width'] = `${sizeValue}px`;
        styles['height'] = `${sizeValue}px`;
    }

    // Enforce sensible defaults so image never balloons beyond its container.
    // If explicit width/height provided in layout, they'll be present in styles via buildStyles.
    if (!styles['max-width']) styles['max-width'] = '100%';
    if (!styles['max-height']) styles['max-height'] = '100%';
    if (!styles['object-fit']) styles['object-fit'] = 'contain';
    // Respect explicit width/height while keeping ratio
    if (!styles['height'] && !element.size) styles['height'] = 'auto';
    if (!styles['width'] && !element.size) styles['width'] = 'auto';
    
    // Ensure image doesn't grow
    if (!styles['flex-shrink']) styles['flex-shrink'] = '0';

    const src = element.src ?? '';
    let actualSrc = src;
    
    // Handle src - can be expression like ["get", "iconPath"] or string with bindings like "{{item.iconPath}}"
    const srcValue = resolveValue(src, context);
    
    if (typeof srcValue === 'string') {
        const assetsBase = context.assetsBaseUrl ?? '/assets/icon_themes/meteocons/images';
        
        // If it's already a data URL or full URL, use it as-is
        if (srcValue.startsWith('data:') || srcValue.startsWith('http://') || srcValue.startsWith('https://') || srcValue.startsWith('file://')) {
            actualSrc = srcValue;
        }
        // Check if it has bindings like {{...}}
        else if (hasBinding(srcValue)) {
            const replaced = resolveBinding(srcValue, context);
            // If result looks like an icon ID, prepend path
            if (replaced.startsWith('data:') || replaced.startsWith('http://') || replaced.startsWith('https://') || replaced.startsWith('file://')) {
                actualSrc = replaced;
            } else if (/^[a-zA-Z0-9_]+$/.test(replaced)) {
                actualSrc = `${assetsBase}/${replaced}.png`;
            } else {
                actualSrc = replaced;
            }
        } else if (/^[a-zA-Z0-9_]+$/.test(srcValue)) {
            // Plain icon ID
            actualSrc = `${assetsBase}/${srcValue}.png`;
        } else {
            // Full path already
            actualSrc = srcValue;
        }
    } else {
        // If src came from expression evaluation and it's not a string, convert it
        actualSrc = String(srcValue || '');
        // Check if it's a data URL or full URL
        if (actualSrc.startsWith('data:') || actualSrc.startsWith('http://') || actualSrc.startsWith('https://') || actualSrc.startsWith('file://')) {
            // Use as-is
        } else {
            const assetsBase = context.assetsBaseUrl ?? '/assets/icon_themes/meteocons/images';
            if (/^[a-zA-Z0-9_]+$/.test(actualSrc)) {
                actualSrc = `${assetsBase}/${actualSrc}.png`;
            }
        }
    }

    const styleAttr = stylesToString(styles);
    // Always include style="..." so browser applies CSS; escape src for safety
    return `<img alt="" src="${escapeHtml(actualSrc)}" style="${escapeHtml(styleAttr)}" />`;
}

function renderSpacer(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);

    if (element.size !== undefined) {
        const sizeValue = resolveValue(element.size, context);
        styles['width'] = `${sizeValue}px`;
        styles['height'] = `${sizeValue}px`;
        styles['flex-shrink'] = '0';
    } else {
        styles['flex'] = (resolveValue(element.flex, context) || 1).toString();
    }

    return `<div style="${stylesToString(styles)}"></div>`;
}

function renderDivider(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);
    styles['height'] = `${element.thickness || 1}px`;
    styles['width'] = '100%';
    styles['background-color'] = resolveColor(element.color || 'onSurfaceVariant', context?.themeVars);
    styles['opacity'] = '0.3';

    return `<div style="${stylesToString(styles)}"></div>`;
}

function renderScrollView(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);
    
    // Handle scrolling behavior
    const direction = element.direction || 'vertical';
    styles['overflow-x'] = direction === 'horizontal' ? 'auto' : 'hidden';
    styles['overflow-y'] = direction === 'vertical' ? 'auto' : 'hidden';
    styles['display'] = 'flex';
    styles['flex-direction'] = direction === 'horizontal' ? 'row' : 'column';
    
    // Make sure scrollView doesn't collapse
    if (direction === 'horizontal' && !styles['width']) {
        styles['width'] = '100%';
    }
    if (direction === 'vertical' && !styles['height']) {
        styles['flex'] = '1';
    }
    
    // Hide scrollbar indicators if specified
    if (element.showIndicators === false) {
        styles['scrollbar-width'] = 'none'; // Firefox
        styles['-ms-overflow-style'] = 'none'; // IE and Edge
    }

    // Apply gap for spacing between items if specified
    if (element.spacing !== undefined) {
        const spacingValue = resolveValue(element.spacing, context);
        styles['gap'] = `${spacingValue}px`;
    }

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    
    // Add webkit scrollbar hiding for showIndicators: false
    let scrollbarStyles = '';
    if (element.showIndicators === false) {
        scrollbarStyles = `<style>.scrollview-no-indicators::-webkit-scrollbar { display: none; }</style>`;
    }
    
    return `${scrollbarStyles}<div class="${element.showIndicators === false ? 'scrollview-no-indicators' : ''}" style="${stylesToString(styles)}">${children}</div>`;
}

function renderForEach(element: LayoutElement, context: RenderContext): string {
    const itemsStr = element.items || '';
    const parts = (itemsStr as string).split('.');
    let items: any = context.data as any;
    for (const part of parts) {
        items = items?.[part];
    }

    if (!Array.isArray(items)) return '';

    const limit = element.limit || items.length;
    const limitedItems = items.slice(0, limit);

    const html = limitedItems
        .map((item, index) => {
            const itemContext: RenderContext = {
                ...context,
                item,
                index
            };
            return element.itemTemplate ? renderElement(element.itemTemplate, itemContext) : '';
        })
        .join('');

    return html;
}

function renderConditional(element: LayoutElement, context: RenderContext): string {
    let condition = false;
    
    // Handle Mapbox-style expressions for condition
    if (isExpression(element.condition)) {
        const result = evaluateExpression(element.condition, context);
        condition = Boolean(result);
    } else if (typeof element.condition === 'string') {
        condition = evaluateCondition(element.condition, context);
    } else {
        condition = Boolean(element.condition);
    }

    if (condition && element.then) {
        return renderElement(element.then, context);
    } else if (!condition && element.else) {
        return renderElement(element.else, context);
    }

    return '';
}

function renderClock(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);

    if (element.fontSize) {
        const fontSizeValue = resolveValue(element.fontSize, context);
        styles['font-size'] = `${fontSizeValue}px`;
    }
    if (element.fontWeight) {
        const fontWeightValue = resolveValue(element.fontWeight, context);
        styles['font-weight'] = FONT_WEIGHTS[fontWeightValue] || '400';
    }
    if (element.color) {
        const colorValue = resolveValue(element.color, context);
        styles['color'] = resolveColor(colorValue, context?.themeVars);
    }
    if (!element.textAlign) {
        styles['text-align'] = 'center';
    } else {
        styles['text-align'] = element.textAlign;
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `<span style="${stylesToString(styles)}">${hours}:${minutes}</span>`;
}

function renderDate(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element, context);

    if (element.fontSize) {
        const fontSizeValue = resolveValue(element.fontSize, context);
        styles['font-size'] = `${fontSizeValue}px`;
    }
    if (element.fontWeight) {
        const fontWeightValue = resolveValue(element.fontWeight, context);
        styles['font-weight'] = FONT_WEIGHTS[fontWeightValue] || '400';
    }
    if (element.color) {
        const colorValue = resolveValue(element.color, context);
        styles['color'] = resolveColor(colorValue, context?.themeVars);
    }
    if (!element.textAlign) {
        styles['text-align'] = 'center';
    } else {
        styles['text-align'] = element.textAlign;
    }

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    };
    const dateStr = now.toLocaleDateString('en-US', options);

    return `<span style="${stylesToString(styles)}">${dateStr}</span>`;
}

/**
 * Render a complete widget as HTML
 */
export function renderWidgetToHtml(layout: WidgetLayout, data: WidgetData, size: { width: number; height: number }, themeVars: Record<string, string> = THEME_COLORS, assetsBaseUrl?: string): string {
    const context: RenderContext = { data, size, themeVars, assetsBaseUrl };
    const selectedLayout = selectLayout(layout, context);

    const containerStyles: Record<string, string> = {
        width: `${size.width}px`,
        height: `${size.height}px`,
        'border-radius': '16px',
        overflow: 'hidden',
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        'flex-direction': 'column'
    };

    if (layout.background?.color) {
        containerStyles['background-color'] = resolveColor(layout.background.color, themeVars);
    }

    // Handle defaultPadding - can be expression or number
    if (layout.defaultPadding !== undefined) {
        const paddingValue = resolveValue(layout.defaultPadding, context);
        containerStyles['padding'] = `${paddingValue}px`;
    }

    const content = renderElement(selectedLayout, context);

    return `<div class="widget-container" style="${stylesToString(containerStyles)}">${content}</div>`;
}

/**
 * Generate a full HTML page with the widget preview
 */
export function generateWidgetPreviewPage(
    layout: WidgetLayout,
    data: WidgetData,
    size: { width: number; height: number },
    assetsBaseUrl = '/assets/icon_themes/meteocons/images',
    theme = 'dark'
): string {
    // We already have a function to select layout variant; reuse it
    const usedLayout = selectLayout(layout, { size, data });

    // simple theme variables - these can be expanded to mirror your svelte $colors
    const darkVars = {
        onSurface: '#E6E1E5',
        onSurfaceVariant: '#CAC4D0',
        primary: '#D0BCFF',
        error: '#F2B8B5',
        widgetBackground: '#1C1B1F',
        surface: '#2B2930'
    };
    const lightVars = {
        onSurface: '#0b2736',
        onSurfaceVariant: '#2a3940',
        primary: '#0ea5b7',
        error: '#dc6c5a',
        widgetBackground: '#ffffff',
        surface: '#f6f7f9'
    };
    const themeVars = theme === 'light' ? lightVars : darkVars;

    const context: RenderContext = { data, size, assetsBaseUrl, themeVars };

    // Build widget HTML
    const widgetHtml = renderWidgetToHtml(layout, data, size, themeVars, assetsBaseUrl);
    
    const css = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: ${theme === 'light' ? '#fff' : '#0b0f14'};
        --fg: ${themeVars.onSurface};
        --muted: ${themeVars.onSurfaceVariant};
        background: var(--bg);
        color: var(--fg);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .widget-root { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
      }
      .scrollview-no-indicators::-webkit-scrollbar { 
        display: none; 
      }
    </style>
    `;

    const html = `<!doctype html><html><head><meta charset="utf-8">${css}</head><body class="${theme === 'light' ? 'light' : 'dark'}"><div class="widget-root">${widgetHtml}</div></body></html>`;
    return html;
}

// Export for Node.js usage
