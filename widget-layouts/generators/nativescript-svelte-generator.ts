#!/usr/bin/env node
/**
 * NativeScript Svelte Component Generator
 * Generates Svelte Native (Svelte 4) components from JSON widget layouts.
 *
 * - All static element properties (color, text, size...) are exported as Svelte `export let` props
 *   so consumers can override them.
 * - Dynamic bindings ({{...}} placeholders) are converted into Svelte expressions
 *   and reference `data` or `item` depending on context.
 * - For-each elements are rendered as a CollectionView + Template by default if they were defined
 *   using `forEach` in the layout; otherwise we fall back to `#each` in StackLayout.
 *
 * Output dir default: app/components/widgets/generated
 */

import * as fs from 'fs';
import * as path from 'path';

type AnyObj = Record<string, any>;

interface LayoutElement {
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
    // cspan-like segments for rich label children
    childrenInline?: LayoutElement[];
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

/**
 * Normalize identifier: keep alphanum + underscore
 */
function sanitize(s: string) {
    return s.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Checks if a string contains a binding placeholder ({{...}})
 */
function hasBinding(s?: string) {
    if (!s || typeof s !== 'string') return false;
    return /\{\{[^}]+\}\}/.test(s);
}

/**
 * Convert a raw binding string with placeholders into a Svelte expression
 * - If the whole string is a single binding: return the inner expression (normalized)
 * - If mixed text + bindings: return a template literal expression
 */
function convertBindingToSvelteExpr(raw: string, defaultPrefix = 'data'): string {
    if (!raw || !hasBinding(raw)) {
        return JSON.stringify(raw ?? '');
    }

    // Single binding?
    const single = raw.trim().match(/^\{\{\s*([^}]+)\s*\}\}$/);
    if (single) {
        return normalizeExpr(single[1].trim(), defaultPrefix);
    }

    // Mixed content -> build template literal
    const tpl = raw
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${')
        .replace(/\{\{([^}]+)\}\}/g, (_, expr) => '${' + normalizeExpr(expr.trim(), defaultPrefix) + '}');
    return '`' + tpl + '`';
}

/**
 * Normalize an expression so that simple identifiers map to data.* by default
 */
function normalizeExpr(expr: string, defaultPrefix = 'data'): string {
    // Do not prefix expressions that include function calls or dots already
    if (/[()]/.test(expr)) {
        // if expression contains dots but not item./data. - try to prefix simple paths in the expr
        return expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (m) => {
            // skip booleans and numbers and well-known words
            if (['true', 'false', 'null', 'undefined'].includes(m)) return m;
            if (/^\d+$/.test(m)) return m;
            if (/^item$/.test(m) || /^data$/.test(m) || /^size$/.test(m)) return m;
            return `${defaultPrefix}.${m}`;
        });
    }

    // Single token without dots -> prefix
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
        if (/^(item|data|size)$/.test(expr)) return expr;
        return `${defaultPrefix}.${expr}`;
    }

    // Has dots already (item.prop or data.prop) -> keep as-is
    if (expr.includes('.')) return expr;

    return expr;
}

/**
 * Decide if value is a data path (for 'items' or similar)
 */
function isLikelyDataPath(val: any): boolean {
    if (!val || typeof val !== 'string') return false;
    // Only treat explicit data/item/size paths as data paths;
    // plain tokens like "center" or "onSurface" should NOT be treated as data by default.
    if (val.startsWith('data.') || val.startsWith('item.') || val.startsWith('size.')) return true;
    return false;
}

function isSimpleToken(val: any): boolean {
    return typeof val === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val);
}

/**
 * Convert JS value to Svelte/TS default value literal
 */
function toLiteral(v: any): string {
    if (typeof v === 'string') return JSON.stringify(v);
    if (v === null) return 'null';
    return String(v);
}

/**
 * Build color token var name for a simple token like onSurface -> colorOnSurface
 */
function colorTokenToVar(token: string) {
    if (!token || typeof token !== 'string') return token;
    const pascal = token[0].toUpperCase() + token.slice(1);
    return 'color' + pascal;
}

/**
 * Collect used color tokens in layout elements (non-hex, non-data path)
 */
function collectUsedColorsFromElement(element: LayoutElement, usedColors: Set<string>) {
    const keys = ['color', 'backgroundColor'];
    for (const k of keys) {
        const v = (element as any)[k];
        if (!v || typeof v !== 'string') continue;
        if (hasBinding(v)) continue;
        if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(v)) continue;
        if (isLikelyDataPath(v)) continue;
        // token -> var name
        usedColors.add(colorTokenToVar(v));
    }

    const children = element.children ?? [];
    for (let i = 0; i < children.length; i++) {
        collectUsedColorsFromElement(children[i], usedColors);
    }

    if (element.type === 'forEach' && element.itemTemplate) {
        collectUsedColorsFromElement(element.itemTemplate, usedColors);
    }
    if (element.type === 'conditional') {
        if (element.then) collectUsedColorsFromElement(element.then, usedColors);
        if (element.else) collectUsedColorsFromElement(element.else, usedColors);
    }
}

// Collect color tokens used in the whole layout, including top-level layout background + variants
function collectUsedColorsFromLayout(layout: WidgetLayout, usedColors: Set<string>) {
    // top-level background
    const bg = layout.background?.color;
    if (typeof bg === 'string' && !hasBinding(bg) && !/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(bg) && !isLikelyDataPath(bg)) {
        usedColors.add(colorTokenToVar(bg));
    }

    // layout root element
    if (layout.layout) {
        collectUsedColorsFromElement(layout.layout, usedColors);
    }

    // variants
    if (layout.variants && Array.isArray(layout.variants)) {
        for (const v of layout.variants) {
            if (v?.layout) collectUsedColorsFromElement(v.layout, usedColors);
        }
    }
}

/**
 * Build Svelte attribute string: either a svelte expression (binding) or literal
 * Note: we don't export most element props as component props anymore - values are inlined.
 */
function buildAttribute(widgetName: string, prop: string, value: any, elementPath: string[], defaultPrefix = 'data', usedColors?: Set<string>): string | null {
    if (value === undefined || value === null) return null;

    // map layout prop names -> Svelte/NativeScript attribute names
    const attrMap: Record<string, string> = {
        alignment: 'verticalAlignment',
        crossAlignment: 'horizontalAlignment',
        textAlign: 'textAlignment',
        direction: 'orientation',
        spacing: 'margin'
    };
    const attrName = attrMap[prop] ?? prop;

    // Visible / visibleIf should map to a `visibility` attribute rather than conditional wrapper
    if (prop === 'visibleIf') {
        let expr = '';
        if (typeof value === 'string' && hasBinding(value)) {
            expr = convertBindingToSvelteExpr(value, defaultPrefix);
        } else if (typeof value === 'string') {
            expr = normalizeExpr(value, defaultPrefix);
        } else if (typeof value === 'boolean') {
            expr = value ? 'true' : 'false';
        } else {
            expr = 'true';
        }
        return `visibility={${expr} ? 'visible' : 'hidden'}`;
    }

    if (prop === 'visible') {
        if (typeof value === 'boolean') {
            return `visibility="${value ? 'visible' : 'hidden'}"`;
        } else if (typeof value === 'string') {
            const expr = hasBinding(value) ? convertBindingToSvelteExpr(value, defaultPrefix) : normalizeExpr(value, defaultPrefix);
            return `visibility={${expr} ? 'visible' : 'hidden'}`;
        }
        return null;
    }

    // handle a 'size' virtual prop: translate into width and height attributes
    if (prop === 'size') {
        // handle binding / expression / literals
        if (typeof value === 'string' && hasBinding(value)) {
            const expr = convertBindingToSvelteExpr(value, defaultPrefix);
            return `width={${expr}} height={${expr}}`;
        }
        if (typeof value === 'string' && isLikelyDataPath(value)) {
            const path = value.startsWith('data.') || value.startsWith('item.') ? value : `${defaultPrefix}.${value}`;
            return `width={${path}} height={${path}}`;
        }
        // number or string literal
        return `width={${JSON.stringify(value)}} height={${JSON.stringify(value)}}`;
    }

    // handle bindings first
    if (typeof value === 'string' && hasBinding(value)) {
        const expr = convertBindingToSvelteExpr(value, defaultPrefix);
        return `${attrName}={${expr}}`;
    }

    // items => treat tokens like 'hourlyData' as data path (defaultPrefix override)
    if (prop === 'items' && typeof value === 'string') {
        if (value.startsWith('data.') || value.startsWith('item.') || value.startsWith('size.')) {
            const path = value;
            return `${attrName}={${path}}`;
        } else if (isSimpleToken(value)) {
            const path = `${defaultPrefix}.${value}`;
            return `${attrName}={${path}}`;
        } else {
            return `${attrName}={${JSON.stringify(value)}}`;
        }
    }

    // Colors: map tokens to local variables derived from $colors store, hex inline, data/binding handled earlier
    if ((prop === 'color' || prop === 'backgroundColor') && typeof value === 'string') {
        // binding handled above
        const isHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
        if (isHex) {
            return `${attrName}={${JSON.stringify(value)}}`;
        }
        // If it's an explicit data/item path -> bind to it
        if (value.startsWith('data.') || value.startsWith('item.') || value.startsWith('size.')) {
            return `${attrName}={${value}}`;
        }
        // If it's a simple token like onSurface -> treat as theme color var and record it
        if (isSimpleToken(value)) {
            const varName = colorTokenToVar(value);
            usedColors?.add(varName);
            return `${attrName}={${varName}}`;
        }
        // fallback: treat as literal string
        return `${attrName}={${JSON.stringify(value)}}`;
    }

    // simple literal -> inline as a literal expression OR string literal
    if (typeof value === 'number' || typeof value === 'boolean') {
        return `${attrName}={${JSON.stringify(value)}}`;
    }
    if (typeof value === 'string') {
        // If the value looks like a data path (explicit), bind it
        if (value.startsWith('data.') || value.startsWith('item.') || value.startsWith('size.')) {
            return `${attrName}={${value}}`;
        }
        // Otherwise, string literal -> inline as quoted string
        return `${attrName}={${JSON.stringify(value)}}`;
    }

    return null;
}

/**
 * Generate Svelte markup recursively
 */
function generateMarkup(widgetName: string, element: LayoutElement, elementPath: string[], usedTemplateImport: { val: boolean }, usedColors: Set<string>, defaultPrefix = 'data'): string {
    const indent = '    '.repeat(elementPath.length + 1);
    const elType = element.type;
    const tag = (() => {
        switch (elType) {
            case 'column':
                return 'stacklayout';
            case 'row':
                return 'stacklayout';
            case 'stack':
                return 'gridlayout';
            case 'label':
                return 'label';
            case 'image':
                return 'image';
            case 'spacer':
                return 'stacklayout';
            case 'divider':
                return 'stacklayout';
            case 'scrollView':
                return 'scrollview';
            case 'forEach':
                return 'collectionview';
            case 'conditional':
                return 'fragment'; // handled with {#if}
            case 'clock':
                return 'label';
            case 'date':
                return 'label';
            case 'cspan':
                return 'cspan';
            default:
                return 'stacklayout';
        }
    })();

    const attrsArr: string[] = [];
    // A set of properties that map directly to svelte attribute names (pass-through)
    const attributesToMap = [
        'padding',
        'paddingHorizontal',
        'paddingVertical',
        'margin',
        'marginHorizontal',
        'marginVertical',
        'width',
        'height',
        'cornerRadius',
        'spacing',
        'direction',
        'alignment',
        'crossAlignment',
        'backgroundColor',
        'color',
        'fontSize',
        'fontWeight',
        'textAlign',
        'textAlignment', // allow actual attr too
        'maxLines',
        'size',
        'thickness',
        'visible',
        'visibleIf',
        'col',
        'row',
        'colSpan',
        'rowSpan',
        'textWrap'
    ];

    for (const k of Object.keys(element)) {
        if (!attributesToMap.includes(k) && k !== 'text' && k !== 'src' && k !== 'items') continue;
        const v = (element as any)[k];

        // Map 'size' attribute -> width & height; handled inside buildAttribute.
        if (k === 'size') {
            const attr = buildAttribute(widgetName, 'size', v, elementPath, defaultPrefix, usedColors);
            if (attr) attrsArr.push(attr);
            continue;
        }

        // We no longer special-case visible/visibleIf to be wrappers; they are attributes now
        if (k === 'text') {
            const attr = buildAttribute(widgetName, 'text', v, elementPath, defaultPrefix, usedColors);
            if (attr) attrsArr.push(attr);
            continue;
        }
        if (k === 'src') {
            const attr = buildAttribute(widgetName, 'src', v, elementPath, defaultPrefix, usedColors);
            if (attr) attrsArr.push(attr);
            continue;
        }
        if (k === 'items') {
            const attr = buildAttribute(widgetName, 'items', v, elementPath, defaultPrefix, usedColors);
            if (attr) attrsArr.push(attr);
            continue;
        }
        // other attributes map directly but names like alignment / crossAlignment / textAlign are remapped in buildAttribute
        const attr = buildAttribute(widgetName, k, v, elementPath, defaultPrefix, usedColors);
        if (attr) attrsArr.push(attr);
    }

    // For 'row' and 'column' we need orientation prop
    if (elType === 'column') {
        attrsArr.push(`orientation="vertical"`);
    } else if (elType === 'row') {
        attrsArr.push(`orientation="horizontal"`);
    } else if (elType === 'spacer') {
        // verticalStretch for flex
        if (typeof element.flex === 'number') {
            attrsArr.push(`verticalAlignment="stretch"`);
        }
        // if explicit size, map to height (default)
        if (element.size !== undefined && typeof element.size === 'number') {
            attrsArr.push(`height={${element.size}}`);
        }
    } else if (elType === 'divider') {
        const thickness = element.thickness ?? 1;
        attrsArr.push(`height={${thickness}}`);
        // if no color present, use onSurfaceVariant variable
        if (!element.color) {
            const defaultVar = colorTokenToVar('onSurfaceVariant');
            usedColors.add(defaultVar);
            attrsArr.push(`backgroundColor={${defaultVar}}`);
        }
    // } else if (elType === 'scrollView') {
    //     const axis = element.direction === 'horizontal' ? 'horizontal' : 'vertical';
    //     delete element.direction;
    //     attrsArr.push(`orientation="${axis}"`);
    }

    // If this is a clock element, render as label with time text
    if (elType === 'clock') {
        // override or ensure text attribute uses nowTime()
        attrsArr.push(`text={nowTime()}`);
    }

    // if this is a plain stacklayout without attributes and without children, skip it entirely (no empty wrappers)
    const children = element.children ?? [];
    if (tag === 'stacklayout' && attrsArr.length === 0 && children.length === 0 && elType !== 'spacer' && elType !== 'divider') {
        return '';
    }

    // Join attributes
    const attrStr = attrsArr.length ? ' ' + attrsArr.join(' ') : '';

    // Now generate children markup
    let childrenMarkup = '';

    // Build children with special handling of 'spacer' elements:
    // - spacer with a numeric size will be applied as margin to the previous element
    const childMarkups: string[] = [];
    const parentOrientation = elType === 'row' ? 'horizontal' : 'vertical';
    const marginProp = parentOrientation === 'horizontal' ? 'marginRight' : 'marginBottom';

    function addMarginToLastChild(markup: string, marginName: string, marginVal: number): string {
        // find the first opening tag for the element (skip initial {#if...} etc.)
        const firstLT = markup.indexOf('<');
        if (firstLT === -1) return markup;
        const closingGT = markup.indexOf('>', firstLT);
        if (closingGT === -1) return markup;
        const openingTag = markup.substring(firstLT, closingGT + 1);
        // skip if the margin prop is already present on opening tag
        if (openingTag.includes(`${marginName}=`)) return markup;
        // Insert the margin before the closing '>' of opening tag
        return markup.slice(0, closingGT) + ` ${marginName}={${marginVal}}` + markup.slice(closingGT);
    }

    for (let i = 0; i < children.length; i++) {
        const childDef = children[i];

        if (childDef.type === 'spacer') {
            // If spacer specifies a numeric 'size', apply it as margin on the previous child markup (if any)
            const sizeVal = typeof (childDef as any).size === 'number' ? (childDef as any).size : undefined;
            if (sizeVal !== undefined && childMarkups.length > 0) {
                const idx = childMarkups.length - 1;
                childMarkups[idx] = addMarginToLastChild(childMarkups[idx], marginProp, sizeVal);
            }
            // Don't generate any markup for the spacer itself
            continue;
        }

        // Normal child generation
        const childMarkup = generateMarkup(widgetName, children[i], [...elementPath, `${element.type}${i}`], usedTemplateImport, usedColors, defaultPrefix);
        if (childMarkup) childMarkups.push(childMarkup);
    }
    if (childMarkups.length > 0) {
        childrenMarkup = '\n' + childMarkups.join('\n') + '\n' + indent;
    }

    // For conditional element: the element uses then/else semantics
    if (elType === 'conditional') {
        const condRaw = element.condition ?? 'true';
        let condExpr = 'true';
        // If binding placeholders present use convertBindingToSvelteExpr; otherwise normalize a plain JS-like expression
        if (typeof condRaw === 'string' && hasBinding(condRaw)) {
            condExpr = convertBindingToSvelteExpr(condRaw, defaultPrefix);
        } else if (typeof condRaw === 'string') {
            condExpr = normalizeExpr(condRaw, defaultPrefix);
        } else {
            // Not a string, fallback to JSON literal
            condExpr = JSON.stringify(condRaw);
        }
        let thenMarkup = '';
        let elseMarkup = '';
        if (element.then) thenMarkup = generateMarkup(widgetName, element.then, [...elementPath, 'then'], usedTemplateImport, usedColors, defaultPrefix);
        if (element.else) elseMarkup = generateMarkup(widgetName, element.else, [...elementPath, 'else'], usedTemplateImport, usedColors, defaultPrefix);
        const s = `${indent}{#if ${condExpr}}\n${thenMarkup}\n${indent}{:else}\n${elseMarkup}\n${indent}{/if}`;
        return s;
    }

    // Tag markup assembly
    // special-case <collectionview> because we already generated the inner Template
    if (elType === 'forEach') {
        const itemsAttr = buildAttribute(widgetName, 'items', element.items ?? '[]', elementPath, defaultPrefix, usedColors);
        const start = `${indent}<collectionview ${itemsAttr ?? ''}>`;
        const end = `${indent}</collectionview>`;
        return `${start}${childrenMarkup}${end}`;
    }

    // For scrollview, we keep children in a content StackLayout
    if (elType === 'scrollView') {
        const start = `${indent}<scrollview${attrStr}>`;
        const contentStart = `${indent}    <stacklayout orientation="${element.direction === 'horizontal' ? 'horizontal' : 'vertical'}">`;
        const contentEnd = `${indent}    </stacklayout>`;
        const end = `${indent}</scrollview>`;
        return `${start}\n${contentStart}${childrenMarkup}\n${contentEnd}\n${end}`;
    }

    // For label with children (cspan or nested elements)
    if (elType === 'label' && children.length > 0) {
        const start = `${indent}<label${attrStr}>`;
        let inner = '';
        for (let i = 0; i < children.length; i++) {
            inner += '\n' + generateMarkup(widgetName, children[i], [...elementPath, `labelChild${i}`], usedTemplateImport, usedColors, defaultPrefix);
        }
        const end = `${indent}</label>`;
        return `${start}${inner}\n${indent}${end}`;
    }

    // For simple tags
    const start = `${indent}<${tag}${attrStr}>`;
    const end = `</${tag}>`;
    // For tags that are self-closing in NS normal UI (imagex), we keep the tag as-is and don't add children
    const selfClosing = ['image', 'cspan']; // cspan can be self-closing if no text child or use text attribute
    if (selfClosing.includes(tag) && children.length === 0 && !element.text) {
        return `${start}${end}`;
    }

    // For labels with a 'text' attribute we've added attr already; no need for inner text
    return `${start}${childrenMarkup}\n${indent}${end}`;
}

/**
 * Generate the full Svelte component for a layout
 */
function generateSvelteComponent(layout: WidgetLayout): string {
    const widgetName = layout.name;
    // Determine whether we need Template import
    const usedTemplateImport = { val: false };

    // Collect used color variables
    const usedColors = new Set<string>();
    collectUsedColorsFromLayout(layout, usedColors); // <--- use layout-level collector (includes bg + variants)
    // ensure default color var used in some elements like divider defaults etc.

    // Build script block: imports, props, helper functions
    let script = `<script lang="ts">\n`;
    script += `    // Auto-generated Svelte Native component for widget "${layout.name}"\n`;
    // keep Writable import if it's still useful - remove if not necessary
    script += `    import type { Writable } from 'svelte/store';\n`;
    // CollectionView Template import if needed (conditioned later, but we can keep it; Svelte import removal is optional)
    script += `    import { Template } from '@nativescript-community/svelte-native/components';\n`;
    script += `    import { formatDate, l } from '~/helpers/locale';\n`;
    script += `    import { titlecase } from '@nativescript-community/l';\n`;
    script += `    import { colors } from '~/variables';\n\n`;

    // Exported props: data, size
    script += `    export let data: any = {} as any;\n`;
    script += `    export let size: { width: number; height: number } = { width: ${layout.supportedSizes?.[0]?.width ?? 160}, height: ${layout.supportedSizes?.[0]?.height ?? 160}};\n\n`;

    // If we have used color tokens, generate reactive destructuring from $colors
    if (usedColors.size > 0) {
        // create comma-separated string of used color variable names
        const vars = Array.from(usedColors).join(', ');
        script += `    $: ({ ${vars} } = $colors);\n\n`;
    }

    // Additional helpers: format date/time or clock creation - minimal support
    script += `    function nowTime() { const now = new Date(); return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0'); }\n`;

    // End script
    script += `</script>\n\n`;

    // Svelte markup generation - detect Template usage while generating
    const markup = generateMarkup(widgetName, layout.layout, ['root'], usedTemplateImport, usedColors);
    // Build top-level style or wrapper element (container)
    const wrapperAttrs: string[] = [];
    // Use provided size prop as wrapper width/height
    wrapperAttrs.push(`width={size.width}`, `height={size.height}`);
    // background color and default padding
    if (layout.background?.color) {
        const v = layout.background.color;
        const attrBg = buildAttribute(widgetName, 'backgroundColor', v, ['root'], 'data', usedColors);
        if (attrBg) wrapperAttrs.push(attrBg);
    }
    if (layout.defaultPadding !== undefined) {
        wrapperAttrs.push(`padding={${JSON.stringify(layout.defaultPadding)}}`);
    }

    const wrapperAttrStr = wrapperAttrs.length ? ' ' + wrapperAttrs.join(' ') : '';

    // Clean up repeated blank lines in markup
    const cleanedMarkup = `${markup}`.replace(/\n{3,}/g, '\n\n').replace(/\n\s+\n/g, '\n');

    const svelteLines = `${script}<gridlayout class="widget-container"${wrapperAttrStr}>\n${cleanedMarkup}\n</gridlayout>\n`;

    return svelteLines;
}

/**
 * Generate Svelte components for all widget layouts found in layoutsDir
 */
export function generateAllWidgetsSvelte(layoutsDir: string, outputDir: string): void {
    if (!fs.existsSync(layoutsDir)) {
        console.error(`Layouts directory not found: ${layoutsDir}`);
        return;
    }

    const widgetFiles = fs.readdirSync(layoutsDir).filter((f) => f.endsWith('.json'));
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const file of widgetFiles) {
        const layoutPath = path.join(layoutsDir, file);
        const raw = fs.readFileSync(layoutPath, 'utf-8');
        let layout: WidgetLayout;
        try {
            layout = JSON.parse(raw) as WidgetLayout;
        } catch (e) {
            console.error(`Failed to parse ${layoutPath}:`, (e as Error).message);
            continue;
        }
        const svelte = generateSvelteComponent(layout);
        const outFile = path.join(outputDir, `${layout.name}View.generated.svelte`);
        fs.writeFileSync(outFile, svelte, 'utf-8');
        console.log(`Generated Svelte component: ${outFile}`);
    }
}

// CLI entrypoint
// if (require.main === module) {
const args = process.argv.slice(2);
const layoutsDir = args[0] || path.join(__dirname, '..', 'widgets');
const outputDir = args[1] || path.join(__dirname, '..', '..', 'app', 'components', 'widgets', 'generated');

generateAllWidgetsSvelte(layoutsDir, outputDir);
console.log('NativeScript Svelte generation complete!');
// }
