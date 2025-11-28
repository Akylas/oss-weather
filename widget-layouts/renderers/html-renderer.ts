/**
 * Widget Layout Renderer for HTML
 * Parses JSON widget layouts and renders them as HTML for preview generation
 */

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
    data: WidgetData;
    size: { width: number; height: number };
    item?: any;
    index?: number;
}

/**
 * Resolve a color value (theme color or hex)
 */
function resolveColor(color: string | undefined): string {
    if (!color) return '';
    if (color.startsWith('#')) {
        return color;
    }
    return THEME_COLORS[color] || color;
}

/**
 * Resolve a data binding like "{{temperature}}" or "{{item.hour}}"
 */
function resolveBinding(text: string, context: RenderContext): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
        const parts = path.trim().split('.');
        let value: any = context;

        for (const part of parts) {
            if (part === 'item' && context.item) {
                value = context.item;
            } else if (value && typeof value === 'object') {
                value = value[part] ?? value.data?.[part];
            } else {
                return '';
            }
        }
        return escapeHtml(value?.toString() ?? '');
    });
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
function buildStyles(element: LayoutElement): Record<string, string> {
    const styles: Record<string, string> = {};

    // Padding
    if (element.padding !== undefined) {
        styles['padding'] = `${element.padding}px`;
    }
    if (element.paddingHorizontal !== undefined) {
        styles['padding-left'] = `${element.paddingHorizontal}px`;
        styles['padding-right'] = `${element.paddingHorizontal}px`;
    }
    if (element.paddingVertical !== undefined) {
        styles['padding-top'] = `${element.paddingVertical}px`;
        styles['padding-bottom'] = `${element.paddingVertical}px`;
    }

    // Margin
    if (element.margin !== undefined) {
        styles['margin'] = `${element.margin}px`;
    }
    if (element.marginHorizontal !== undefined) {
        styles['margin-left'] = `${element.marginHorizontal}px`;
        styles['margin-right'] = `${element.marginHorizontal}px`;
    }
    if (element.marginVertical !== undefined) {
        styles['margin-top'] = `${element.marginVertical}px`;
        styles['margin-bottom'] = `${element.marginVertical}px`;
    }

    // Size
    if (element.width !== undefined) {
        if (typeof element.width === 'number') {
            styles['width'] = `${element.width}px`;
        } else if (element.width === 'fill') {
            styles['width'] = '100%';
        }
    }
    if (element.height !== undefined) {
        if (typeof element.height === 'number') {
            styles['height'] = `${element.height}px`;
        } else if (element.height === 'fill') {
            styles['height'] = '100%';
        }
    }

    // Flex
    if (element.flex !== undefined) {
        styles['flex'] = element.flex.toString();
    }

    // Background
    if (element.backgroundColor) {
        styles['background-color'] = resolveColor(element.backgroundColor);
    }

    // Corner radius
    if (element.cornerRadius !== undefined) {
        styles['border-radius'] = `${element.cornerRadius}px`;
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
    if (element.visibleIf && !evaluateCondition(element.visibleIf, context)) return '';

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
    const styles = buildStyles(element);
    styles['display'] = 'flex';
    styles['flex-direction'] = 'column';

    // Alignment
    if (element.alignment) {
        switch (element.alignment) {
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
        switch (element.crossAlignment) {
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
    if (element.spacing) {
        styles['gap'] = `${element.spacing}px`;
    }

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderRow(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);
    styles['display'] = 'flex';
    styles['flex-direction'] = 'row';

    if (element.alignment) {
        switch (element.alignment) {
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
        switch (element.crossAlignment) {
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

    if (element.spacing) {
        styles['gap'] = `${element.spacing}px`;
    }

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderStack(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);
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
    const styles = buildStyles(element);

    if (element.fontSize) {
        styles['font-size'] = `${element.fontSize}px`;
    }
    if (element.fontWeight) {
        styles['font-weight'] = FONT_WEIGHTS[element.fontWeight] || '400';
    }
    if (element.color) {
        styles['color'] = resolveColor(element.color);
    }
    if (element.textAlign) {
        styles['text-align'] = element.textAlign;
    }
    if (element.maxLines) {
        // Fallback for browsers that don't support -webkit-line-clamp
        styles['overflow'] = 'hidden';
        styles['text-overflow'] = 'ellipsis';
        styles['white-space'] = element.maxLines === 1 ? 'nowrap' : 'normal';
        // For multi-line truncation (webkit browsers)
        if (element.maxLines > 1) {
            styles['display'] = '-webkit-box';
            styles['-webkit-line-clamp'] = element.maxLines.toString();
            styles['-webkit-box-orient'] = 'vertical';
        }
    }

    const text = resolveBinding(element.text || '', context);
    return `<span style="${stylesToString(styles)}">${text}</span>`;
}

function renderImage(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);

    if (element.size) {
        styles['width'] = `${element.size}px`;
        styles['height'] = `${element.size}px`;
    }

    const src = resolveBinding(element.src || '', context);

    // For weather icons, use emoji placeholders in HTML preview
    if (!src || src.includes('{{')) {
        styles['font-size'] = element.size ? `${element.size * 0.8}px` : '32px';
        styles['display'] = 'flex';
        styles['align-items'] = 'center';
        styles['justify-content'] = 'center';
        return `<span style="${stylesToString(styles)}">☁️</span>`;
    }

    return `<img src="${src}" style="${stylesToString(styles)}" alt=""/>`;
}

function renderSpacer(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);

    if (element.size !== undefined) {
        styles['width'] = `${element.size}px`;
        styles['height'] = `${element.size}px`;
    } else {
        styles['flex'] = (element.flex || 1).toString();
    }

    return `<div style="${stylesToString(styles)}"></div>`;
}

function renderDivider(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);
    styles['height'] = `${element.thickness || 1}px`;
    styles['width'] = '100%';
    styles['background-color'] = resolveColor(element.color || 'onSurfaceVariant');
    styles['opacity'] = '0.3';

    return `<div style="${stylesToString(styles)}"></div>`;
}

function renderScrollView(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);
    styles['overflow-x'] = element.direction === 'horizontal' ? 'auto' : 'hidden';
    styles['overflow-y'] = element.direction === 'horizontal' ? 'hidden' : 'auto';
    styles['display'] = 'flex';
    styles['flex-direction'] = element.direction === 'horizontal' ? 'row' : 'column';

    const children = element.children?.map((child) => renderElement(child, context)).join('') || '';
    return `<div style="${stylesToString(styles)}">${children}</div>`;
}

function renderForEach(element: LayoutElement, context: RenderContext): string {
    const parts = element.items.split('.');
    let items: any[] = context.data as any;
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
    const condition = evaluateCondition(element.condition, context);

    if (condition && element.then) {
        return renderElement(element.then, context);
    } else if (!condition && element.else) {
        return renderElement(element.else, context);
    }

    return '';
}

function renderClock(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);

    if (element.fontSize) {
        styles['font-size'] = `${element.fontSize}px`;
    }
    if (element.fontWeight) {
        styles['font-weight'] = FONT_WEIGHTS[element.fontWeight] || '400';
    }
    if (element.color) {
        styles['color'] = resolveColor(element.color);
    }
    styles['text-align'] = 'center';

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `<span style="${stylesToString(styles)}">${hours}:${minutes}</span>`;
}

function renderDate(element: LayoutElement, context: RenderContext): string {
    const styles = buildStyles(element);

    if (element.fontSize) {
        styles['font-size'] = `${element.fontSize}px`;
    }
    if (element.fontWeight) {
        styles['font-weight'] = FONT_WEIGHTS[element.fontWeight] || '400';
    }
    if (element.color) {
        styles['color'] = resolveColor(element.color);
    }
    styles['text-align'] = 'center';

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
export function renderWidgetToHtml(layout: WidgetLayout, data: WidgetData, size: { width: number; height: number }): string {
    const context: RenderContext = { data, size };
    const selectedLayout = selectLayout(layout, context);

    const containerStyles: Record<string, string> = {
        width: `${size.width}px`,
        height: `${size.height}px`,
        'border-radius': '16px',
        overflow: 'hidden',
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    if (layout.background?.color) {
        containerStyles['background-color'] = resolveColor(layout.background.color);
    }

    if (layout.defaultPadding) {
        containerStyles['padding'] = `${layout.defaultPadding}px`;
    }

    const content = renderElement(selectedLayout, context);

    return `<div style="${stylesToString(containerStyles)}">${content}</div>`;
}

/**
 * Generate a full HTML page with the widget preview
 */
export function generateWidgetPreviewPage(layout: WidgetLayout, data: WidgetData, size: { width: number; height: number }, backgroundImage?: string): string {
    const widgetHtml = renderWidgetToHtml(layout, data, size);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${layout.displayName || layout.name} Preview</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: ${backgroundImage ? `url('${backgroundImage}')` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'};
            background-size: cover;
            background-position: center;
            padding: 20px;
        }
        .widget-container {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="widget-container">
        ${widgetHtml}
    </div>
</body>
</html>`;
}

// Export for Node.js usage
