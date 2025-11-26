/**
 * Widget Layout Renderer for NativeScript
 * Parses JSON widget layouts and renders them as native views
 */

import { View, StackLayout, GridLayout, Label, Image, ScrollView, Color, FlexboxLayout } from '@nativescript/core';

// Color mapping for theme colors
const THEME_COLORS: Record<string, string> = {
    'onSurface': '#E6E1E5',
    'onSurfaceVariant': '#CAC4D0',
    'primary': '#D0BCFF',
    'error': '#F2B8B5',
    'widgetBackground': '#1C1B1F',
    'surface': '#2B2930'
};

// Font weight mapping
const FONT_WEIGHTS: Record<string, string> = {
    'normal': 'normal',
    'medium': '500',
    'bold': 'bold'
};

export interface WidgetLayout {
    name: string;
    displayName?: string;
    description?: string;
    supportedSizes?: Array<{ width: number; height: number; family: string }>;
    defaultPadding?: number;
    background?: {
        type: string;
        color?: string;
        image?: string;
    };
    variants?: Array<{
        condition: string;
        layout: LayoutElement;
    }>;
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
    // Element-specific properties
    [key: string]: any;
}

export interface WidgetData {
    temperature?: string;
    locationName?: string;
    description?: string;
    iconPath?: string;
    hourlyData?: Array<{
        hour: string;
        temperature: string;
        iconPath?: string;
        description?: string;
        precipAccumulation?: string;
    }>;
    dailyData?: Array<{
        day: string;
        temperatureHigh: string;
        temperatureLow: string;
        iconPath?: string;
        description?: string;
        precipAccumulation?: string;
    }>;
}

export interface RenderContext {
    data: WidgetData;
    size: { width: number; height: number };
    item?: any; // For forEach loops
    index?: number;
}

/**
 * Resolve a color value (theme color or hex)
 */
function resolveColor(color: string | undefined): Color | undefined {
    if (!color) return undefined;
    if (color.startsWith('#')) {
        return new Color(color);
    }
    const themeColor = THEME_COLORS[color];
    return themeColor ? new Color(themeColor) : undefined;
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
        return value?.toString() ?? '';
    });
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(condition: string, context: RenderContext): boolean {
    try {
        // Replace data references
        let expr = condition
            .replace(/size\.width/g, context.size.width.toString())
            .replace(/size\.height/g, context.size.height.toString());
        
        // Handle data path checks like "iconPath" or "item.precipAccumulation"
        expr = expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g, (match) => {
            if (['true', 'false', 'null', 'undefined'].includes(match)) return match;
            if (/^\d+$/.test(match)) return match;
            if (['<', '>', '<=', '>=', '==', '!=', '&&', '||'].some(op => match === op)) return match;
            
            // Resolve the path
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
        
        // Safe eval using Function constructor
        return new Function(`return ${expr}`)();
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
 * Render a layout element to a NativeScript view
 */
function renderElement(element: LayoutElement, context: RenderContext): View | null {
    // Check visibility
    if (element.visible === false) return null;
    if (element.visibleIf && !evaluateCondition(element.visibleIf, context)) return null;

    let view: View | null = null;

    switch (element.type) {
        case 'column':
            view = renderColumn(element, context);
            break;
        case 'row':
            view = renderRow(element, context);
            break;
        case 'stack':
            view = renderStack(element, context);
            break;
        case 'label':
            view = renderLabel(element, context);
            break;
        case 'image':
            view = renderImage(element, context);
            break;
        case 'spacer':
            view = renderSpacer(element, context);
            break;
        case 'divider':
            view = renderDivider(element, context);
            break;
        case 'scrollView':
            view = renderScrollView(element, context);
            break;
        case 'forEach':
            view = renderForEach(element, context);
            break;
        case 'conditional':
            view = renderConditional(element, context);
            break;
        case 'clock':
            view = renderClock(element, context);
            break;
        case 'date':
            view = renderDate(element, context);
            break;
        default:
            console.warn(`Unknown element type: ${element.type}`);
            return null;
    }

    if (view) {
        applyBaseStyles(view, element);
    }

    return view;
}

/**
 * Apply common styles to a view
 */
function applyBaseStyles(view: View, element: LayoutElement): void {
    // Padding
    if (element.padding !== undefined) {
        view.padding = element.padding;
    }
    if (element.paddingHorizontal !== undefined) {
        view.paddingLeft = element.paddingHorizontal;
        view.paddingRight = element.paddingHorizontal;
    }
    if (element.paddingVertical !== undefined) {
        view.paddingTop = element.paddingVertical;
        view.paddingBottom = element.paddingVertical;
    }

    // Margin
    if (element.margin !== undefined) {
        view.margin = element.margin;
    }
    if (element.marginHorizontal !== undefined) {
        view.marginLeft = element.marginHorizontal;
        view.marginRight = element.marginHorizontal;
    }
    if (element.marginVertical !== undefined) {
        view.marginTop = element.marginVertical;
        view.marginBottom = element.marginVertical;
    }

    // Size
    if (element.width !== undefined) {
        if (typeof element.width === 'number') {
            view.width = element.width;
        } else if (element.width === 'fill') {
            view.horizontalAlignment = 'stretch';
        }
    }
    if (element.height !== undefined) {
        if (typeof element.height === 'number') {
            view.height = element.height;
        } else if (element.height === 'fill') {
            view.verticalAlignment = 'stretch';
        }
    }

    // Background
    if (element.backgroundColor) {
        const color = resolveColor(element.backgroundColor);
        if (color) view.backgroundColor = color;
    }

    // Corner radius
    if (element.cornerRadius !== undefined) {
        view.borderRadius = element.cornerRadius;
    }
}

function renderColumn(element: LayoutElement, context: RenderContext): View {
    const stack = new StackLayout();
    stack.orientation = 'vertical';
    
    // Alignment
    if (element.crossAlignment) {
        switch (element.crossAlignment) {
            case 'start': stack.horizontalAlignment = 'left'; break;
            case 'center': stack.horizontalAlignment = 'center'; break;
            case 'end': stack.horizontalAlignment = 'right'; break;
            case 'stretch': stack.horizontalAlignment = 'stretch'; break;
        }
    }

    // Render children
    if (element.children) {
        for (const child of element.children) {
            const childView = renderElement(child, context);
            if (childView) {
                // Apply spacing
                if (element.spacing && stack.getChildrenCount() > 0) {
                    childView.marginTop = element.spacing;
                }
                stack.addChild(childView);
            }
        }
    }

    return stack;
}

function renderRow(element: LayoutElement, context: RenderContext): View {
    const stack = new StackLayout();
    stack.orientation = 'horizontal';
    
    // Alignment
    if (element.crossAlignment) {
        switch (element.crossAlignment) {
            case 'start': stack.verticalAlignment = 'top'; break;
            case 'center': stack.verticalAlignment = 'middle'; break;
            case 'end': stack.verticalAlignment = 'bottom'; break;
            case 'stretch': stack.verticalAlignment = 'stretch'; break;
        }
    }

    // Render children
    if (element.children) {
        for (const child of element.children) {
            const childView = renderElement(child, context);
            if (childView) {
                // Apply spacing
                if (element.spacing && stack.getChildrenCount() > 0) {
                    childView.marginLeft = element.spacing;
                }
                stack.addChild(childView);
            }
        }
    }

    return stack;
}

function renderStack(element: LayoutElement, context: RenderContext): View {
    const grid = new GridLayout();
    
    // Render children (all in same cell for stacking)
    if (element.children) {
        for (const child of element.children) {
            const childView = renderElement(child, context);
            if (childView) {
                grid.addChild(childView);
            }
        }
    }

    return grid;
}

function renderLabel(element: LayoutElement, context: RenderContext): View {
    const label = new Label();
    label.text = resolveBinding(element.text || '', context);
    
    if (element.fontSize) {
        label.fontSize = element.fontSize;
    }
    if (element.fontWeight) {
        label.fontWeight = FONT_WEIGHTS[element.fontWeight] as any || 'normal';
    }
    if (element.color) {
        const color = resolveColor(element.color);
        if (color) label.color = color;
    }
    if (element.textAlign) {
        label.textAlignment = element.textAlign as any;
    }
    if (element.maxLines) {
        label.maxLines = element.maxLines;
    }

    return label;
}

function renderImage(element: LayoutElement, context: RenderContext): View {
    const image = new Image();
    const src = resolveBinding(element.src || '', context);
    
    if (src) {
        image.src = src;
    }
    if (element.size) {
        image.width = element.size;
        image.height = element.size;
    }

    return image;
}

function renderSpacer(element: LayoutElement, context: RenderContext): View {
    const spacer = new StackLayout();
    
    if (element.size !== undefined) {
        spacer.height = element.size;
        spacer.width = element.size;
    } else if (element.flex) {
        // Flex spacer - use flexGrow
        spacer.flexGrow = element.flex;
    }

    return spacer;
}

function renderDivider(element: LayoutElement, context: RenderContext): View {
    const divider = new StackLayout();
    divider.height = element.thickness || 1;
    divider.horizontalAlignment = 'stretch';
    
    const color = resolveColor(element.color || 'onSurfaceVariant');
    if (color) {
        divider.backgroundColor = new Color(color.hex).setAlpha(0.3);
    }

    return divider;
}

function renderScrollView(element: LayoutElement, context: RenderContext): View {
    const scroll = new ScrollView();
    scroll.orientation = element.direction === 'horizontal' ? 'horizontal' : 'vertical';
    
    // Render content
    const content = new StackLayout();
    content.orientation = element.direction === 'horizontal' ? 'horizontal' : 'vertical';
    
    if (element.children) {
        for (const child of element.children) {
            const childView = renderElement(child, context);
            if (childView) {
                content.addChild(childView);
            }
        }
    }
    
    scroll.content = content;
    return scroll;
}

function renderForEach(element: LayoutElement, context: RenderContext): View {
    const container = new StackLayout();
    container.orientation = 'horizontal'; // Default for forEach
    
    // Get the array from data
    const parts = element.items.split('.');
    let items: any[] = context.data as any;
    for (const part of parts) {
        items = items?.[part];
    }
    
    if (!Array.isArray(items)) return container;
    
    // Limit items if specified
    const limit = element.limit || items.length;
    const limitedItems = items.slice(0, limit);
    
    // Render each item
    for (let i = 0; i < limitedItems.length; i++) {
        const itemContext: RenderContext = {
            ...context,
            item: limitedItems[i],
            index: i
        };
        
        if (element.itemTemplate) {
            const itemView = renderElement(element.itemTemplate, itemContext);
            if (itemView) {
                container.addChild(itemView);
            }
        }
    }

    return container;
}

function renderConditional(element: LayoutElement, context: RenderContext): View | null {
    const condition = evaluateCondition(element.condition, context);
    
    if (condition && element.then) {
        return renderElement(element.then, context);
    } else if (!condition && element.else) {
        return renderElement(element.else, context);
    }
    
    return null;
}

function renderClock(element: LayoutElement, context: RenderContext): View {
    // On NativeScript, we create a label with the current time
    // In a real app, this would be a live-updating clock
    const label = new Label();
    const now = new Date();
    
    // Format time based on element properties
    const format24 = element.format24Hour || 'HH:mm';
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    label.text = `${hours}:${minutes}`;
    
    if (element.fontSize) {
        label.fontSize = element.fontSize;
    }
    if (element.fontWeight) {
        label.fontWeight = FONT_WEIGHTS[element.fontWeight] as any || 'normal';
    }
    if (element.color) {
        const color = resolveColor(element.color);
        if (color) label.color = color;
    }
    
    label.textAlignment = 'center';
    return label;
}

function renderDate(element: LayoutElement, context: RenderContext): View {
    const label = new Label();
    const now = new Date();
    
    // Format date
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    };
    label.text = now.toLocaleDateString(undefined, options);
    
    if (element.fontSize) {
        label.fontSize = element.fontSize;
    }
    if (element.fontWeight) {
        label.fontWeight = FONT_WEIGHTS[element.fontWeight] as any || 'normal';
    }
    if (element.color) {
        const color = resolveColor(element.color);
        if (color) label.color = color;
    }
    
    label.textAlignment = 'center';
    return label;
}

/**
 * Main entry point: Render a widget from its JSON layout
 */
export function renderWidget(
    layout: WidgetLayout,
    data: WidgetData,
    size: { width: number; height: number }
): View {
    const context: RenderContext = { data, size };
    
    // Select the appropriate layout variant
    const selectedLayout = selectLayout(layout, context);
    
    // Create container with background
    const container = new GridLayout();
    
    if (layout.background?.color) {
        const bgColor = resolveColor(layout.background.color);
        if (bgColor) container.backgroundColor = bgColor;
    }
    
    // Apply default padding
    if (layout.defaultPadding) {
        container.padding = layout.defaultPadding;
    }
    
    // Render the layout
    const content = renderElement(selectedLayout, context);
    if (content) {
        container.addChild(content);
    }
    
    return container;
}

/**
 * Load and render a widget by name
 */
export async function renderWidgetByName(
    widgetName: string,
    data: WidgetData,
    size: { width: number; height: number }
): Promise<View> {
    // Load the widget layout JSON
    const layoutJson = await loadWidgetLayout(widgetName);
    return renderWidget(layoutJson, data, size);
}

/**
 * Load widget layout from JSON file
 */
async function loadWidgetLayout(widgetName: string): Promise<WidgetLayout> {
    // In a real implementation, this would load from the JSON files
    // For now, we'll need to bundle the JSON or load at runtime
    const response = await fetch(`~/widget-layouts/widgets/${widgetName}.json`);
    return response.json();
}
