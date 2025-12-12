#!/usr/bin/env node
/**
 * Android Glance Code Generator with Mapbox-Style Expressions
 * Generates Glance composables from JSON layout definitions using Mapbox expression syntax
 */

import * as fs from 'fs';
import * as path from 'path';

// Mapbox-style expression type
type Expression = any[] | string | number | boolean;

interface LayoutElement {
    type: string;
    id?: string;
    visible?: boolean;
    visibleIf?: Expression;
    padding?: Expression;
    paddingHorizontal?: Expression;
    paddingVertical?: Expression;
    margin?: Expression;
    spacing?: Expression;
    alignment?: string;
    crossAlignment?: string;
    width?: Expression;
    height?: Expression;
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

// Color mapping for theme colors
const GLANCE_COLORS: Record<string, string> = {
    onSurface: 'GlanceTheme.colors.onSurface',
    onSurfaceVariant: 'GlanceTheme.colors.onSurfaceVariant',
    primary: 'GlanceTheme.colors.primary',
    error: 'GlanceTheme.colors.error',
    widgetBackground: 'GlanceTheme.colors.background',
    surface: 'GlanceTheme.colors.surface'
};

// Font weight mapping
const KOTLIN_FONT_WEIGHTS: Record<string, string> = {
    normal: 'FontWeight.Normal',
    medium: 'FontWeight.Medium',
    bold: 'FontWeight.Bold'
};

/**
 * Check if a value is a Mapbox expression (array format)
 */
function isExpression(value: any): value is any[] {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string';
}

/**
 * Evaluate/compile a Mapbox expression to Kotlin code
 */
function compileExpression(expr: Expression, context: 'value' | 'condition' = 'value'): string {
    // Literal values
    if (typeof expr === 'string') {
        return context === 'value' ? `"${expr}"` : expr;
    }
    if (typeof expr === 'number' || typeof expr === 'boolean') {
        return String(expr);
    }
    
    if (!isExpression(expr)) {
        return String(expr);
    }
    
    const [op, ...args] = expr;
    
    switch (op) {
        // Property access
        case 'get': {
            const prop = args[0] as string;
            if (prop.startsWith('size.')) {
                return prop.replace('size.', 'size.') + '.value';
            }
            if (prop.startsWith('item.')) {
                return prop; // Keep as-is for forEach items
            }
            return `data.${prop}`;
        }
        
        // Check if property exists/has value
        case 'has': {
            const prop = args[0] as string;
            if (prop.startsWith('item.')) {
                return `${prop}.isNotEmpty()`;
            }
            return `data.${prop}.isNotEmpty()`;
        }
        
        // Arithmetic
        case '+':
            return `(${compileExpression(args[0], context)} + ${compileExpression(args[1], context)})`;
        case '-':
            return `(${compileExpression(args[0], context)} - ${compileExpression(args[1], context)})`;
        case '*':
            return `(${compileExpression(args[0], context)} * ${compileExpression(args[1], context)})`;
        case '/':
            return `(${compileExpression(args[0], context)} / ${compileExpression(args[1], context)})`;
        
        // Comparison
        case '<':
            return `${compileExpression(args[0], 'condition')} < ${compileExpression(args[1], 'condition')}`;
        case '<=':
            return `${compileExpression(args[0], 'condition')} <= ${compileExpression(args[1], 'condition')}`;
        case '>':
            return `${compileExpression(args[0], 'condition')} > ${compileExpression(args[1], 'condition')}`;
        case '>=':
            return `${compileExpression(args[0], 'condition')} >= ${compileExpression(args[1], 'condition')}`;
        case '==':
            return `${compileExpression(args[0], 'condition')} == ${compileExpression(args[1], 'condition')}`;
        case '!=':
            return `${compileExpression(args[0], 'condition')} != ${compileExpression(args[1], 'condition')}`;
        
        // Logical
        case '!':
            return `!(${compileExpression(args[0], 'condition')})`;
        case 'all': {
            const conditions = args.map(a => compileExpression(a, 'condition'));
            return `(${conditions.join(' && ')})`;
        }
        case 'any': {
            const conditions = args.map(a => compileExpression(a, 'condition'));
            return `(${conditions.join(' || ')})`;
        }
        
        // Conditional (case statement)
        case 'case': {
            const pairs: string[] = [];
            for (let i = 0; i < args.length - 1; i += 2) {
                if (i + 1 < args.length) {
                    const condition = compileExpression(args[i], 'condition');
                    const value = compileExpression(args[i + 1], context);
                    pairs.push(`${condition} -> ${value}`);
                }
            }
            // Last arg is the fallback
            const fallback = args.length % 2 === 1 ? compileExpression(args[args.length - 1], context) : '""';
            
            return `when {\n                ${pairs.join('\n                ')}\n                else -> ${fallback}\n            }`;
        }
        
        // String operations
        case 'concat': {
            const parts = args.map(a => compileExpression(a, context));
            return `"${parts.join(' + ')}"`;
        }
        case 'upcase':
            return `${compileExpression(args[0], context)}.uppercase()`;
        case 'downcase':
            return `${compileExpression(args[0], context)}.lowercase()`;
        
        // Interpolation (for template strings like "{{temperature}}")
        case 'interpolate': {
            const template = args[0] as string;
            // Convert {{prop}} to ${data.prop}
            return `"${template.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\${data.${prop}}`)}"`;
        }
        
        default:
            console.warn(`Unknown expression operator: ${op}`);
            return `/* unknown op: ${op} */`;
    }
}

/**
 * Compile a property value that might be a literal or expression
 */
function compilePropertyValue<T>(
    value: Expression | undefined,
    formatter: (v: T) => string,
    defaultValue?: string
): string {
    if (value === undefined) {
        return defaultValue || '';
    }
    
    // If it's a literal value, format it directly
    if (!isExpression(value)) {
        return formatter(value as T);
    }
    
    // It's an expression, compile it
    return compileExpression(value, 'value');
}

/**
 * Convert alignment to Glance alignment
 */
function toGlanceVerticalAlignment(alignment?: string): string {
    switch (alignment) {
        case 'start':
            return 'Alignment.Vertical.Top';
        case 'center':
            return 'Alignment.Vertical.CenterVertically';
        case 'end':
            return 'Alignment.Vertical.Bottom';
        default:
            return 'Alignment.Vertical.CenterVertically';
    }
}

function toGlanceHorizontalAlignment(alignment?: string): string {
    switch (alignment) {
        case 'start':
            return 'Alignment.Horizontal.Start';
        case 'center':
            return 'Alignment.Horizontal.CenterHorizontally';
        case 'end':
            return 'Alignment.Horizontal.End';
        default:
            return 'Alignment.Horizontal.CenterHorizontally';
    }
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
        const condition = compileExpression(element.visibleIf, 'condition');
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
    const vertAlign = toGlanceVerticalAlignment(element.alignment);
    const horizAlign = toGlanceHorizontalAlignment(element.crossAlignment);

    const modifier = 'GlanceModifier.fillMaxSize()';

    lines.push(`${indent}Column(`);
    lines.push(`${indent}    modifier = ${modifier},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign},`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign}`);
    lines.push(`${indent}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
        }
    }

    lines.push(`${indent}}`);
    return lines;
}

function generateRow(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const horizAlign = toGlanceHorizontalAlignment(element.alignment);
    const vertAlign = toGlanceVerticalAlignment(element.crossAlignment);

    const modifier = 'GlanceModifier.fillMaxWidth()';

    lines.push(`${indent}Row(`);
    lines.push(`${indent}    modifier = ${modifier},`);
    lines.push(`${indent}    horizontalAlignment = ${horizAlign},`);
    lines.push(`${indent}    verticalAlignment = ${vertAlign}`);
    lines.push(`${indent}) {`);

    if (element.children) {
        for (const child of element.children) {
            lines.push(generateElement(child, indent + '    '));
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
        // Template string like "{{temperature}}"
        textExpr = element.text.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\${data.${prop}}`);
        textExpr = `"${textExpr}"`;
    } else {
        textExpr = compilePropertyValue(element.text, (v: string) => `"${v}"`, '""');
    }

    const fontSizeExpr = compilePropertyValue(element.fontSize, (v: number) => `${v}.sp`, undefined);
    const colorExpr = compilePropertyValue(
        element.color,
        (v: string) => GLANCE_COLORS[v] || `Color(0xFF${v})`,
        'GlanceTheme.colors.onSurface'
    );
    const fontWeightExpr = compilePropertyValue(
        element.fontWeight,
        (v: string) => KOTLIN_FONT_WEIGHTS[v] || 'FontWeight.Normal',
        undefined
    );
    const maxLinesExpr = compilePropertyValue(element.maxLines, (v: number) => String(v), undefined);

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
        lines.push(`${indent}    style = TextStyle(${styleProps.join(', ')})`);
    }

    if (maxLinesExpr) {
        lines.push(`${indent}    maxLines = ${maxLinesExpr}`);
    }

    lines.push(`${indent})`);
    return lines;
}

function generateImage(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    // Compile src
    let srcExpr: string;
    if (typeof element.src === 'string' && element.src.includes('{{')) {
        srcExpr = element.src.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\${data.${prop}}`);
        srcExpr = `"${srcExpr}"`;
    } else {
        srcExpr = compilePropertyValue(element.src, (v: string) => `"${v}"`, '""');
    }

    const sizeExpr = compilePropertyValue(element.size, (v: number) => `${v}.dp`, '24.dp');

    lines.push(`${indent}Image(`);
    lines.push(`${indent}    provider = ImageProvider(resId = R.drawable.${srcExpr.replace(/"/g, '')}),`);
    lines.push(`${indent}    contentDescription = null,`);
    lines.push(`${indent}    modifier = GlanceModifier.size(${sizeExpr})`);
    lines.push(`${indent})`);

    return lines;
}

function generateSpacer(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    const sizeExpr = compilePropertyValue(element.size, (v: number) => `${v}.dp`, undefined);
    const flexExpr = compilePropertyValue(element.flex, (v: number) => String(v), undefined);

    if (sizeExpr) {
        lines.push(`${indent}Spacer(modifier = GlanceModifier.height(${sizeExpr}))`);
    } else if (flexExpr) {
        lines.push(`${indent}Spacer(modifier = GlanceModifier.defaultWeight())`);
    } else {
        lines.push(`${indent}Spacer(modifier = GlanceModifier.height(8.dp))`);
    }

    return lines;
}

function generateDivider(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];
    const thicknessExpr = compilePropertyValue(element.thickness, (v: number) => `${v}.dp`, '1.dp');
    const colorExpr = compilePropertyValue(
        element.color,
        (v: string) => GLANCE_COLORS[v] || `Color(0xFF${v})`,
        'GlanceTheme.colors.onSurfaceVariant'
    );

    lines.push(`${indent}Box(`);
    lines.push(`${indent}    modifier = GlanceModifier.fillMaxWidth().height(${thicknessExpr})`);
    lines.push(`${indent}        .background(${colorExpr})`);
    lines.push(`${indent})`);

    return lines;
}

function generateScrollView(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    lines.push(`${indent}// ScrollView not directly supported in Glance, using Column`);
    return generateColumn(element, indent);
}

function generateForEach(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    if (!element.items || !element.itemTemplate) {
        lines.push(`${indent}// forEach requires items and itemTemplate`);
        return lines;
    }

    const limit = element.limit || 10;

    lines.push(`${indent}data.${element.items}.take(${limit}).forEach { item ->`);
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

    const condition = compileExpression(element.condition, 'condition');

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

    const fontSizeExpr = compilePropertyValue(element.fontSize, (v: number) => `${v}.sp`, undefined);
    const colorExpr = compilePropertyValue(
        element.color,
        (v: string) => GLANCE_COLORS[v] || `Color(0xFF${v})`,
        'GlanceTheme.colors.onSurface'
    );

    lines.push(`${indent}Text(`);
    lines.push(`${indent}    text = android.text.format.DateFormat.format("${format24}", System.currentTimeMillis()).toString(),`);

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

function generateDate(element: LayoutElement, indent: string): string[] {
    const lines: string[] = [];

    const format = element.format || 'MMM dd, yyyy';

    const fontSizeExpr = compilePropertyValue(element.fontSize, (v: number) => `${v}.sp`, undefined);
    const colorExpr = compilePropertyValue(
        element.color,
        (v: string) => GLANCE_COLORS[v] || `Color(0xFF${v})`,
        'GlanceTheme.colors.onSurface'
    );

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
    lines.push('import androidx.compose.ui.graphics.Color');
    lines.push('import androidx.compose.ui.unit.dp');
    lines.push('import androidx.compose.ui.unit.sp');
    lines.push('import androidx.glance.GlanceModifier');
    lines.push('import androidx.glance.Image');
    lines.push('import androidx.glance.ImageProvider');
    lines.push('import androidx.glance.LocalSize');
    lines.push('import androidx.glance.background');
    lines.push('import androidx.glance.layout.*');
    lines.push('import androidx.glance.text.FontWeight');
    lines.push('import androidx.glance.text.Text');
    lines.push('import androidx.glance.text.TextAlign');
    lines.push('import androidx.glance.text.TextStyle');
    lines.push('import androidx.glance.unit.ColorProvider');
    lines.push('import com.akylas.weather.R');
    lines.push('');
    lines.push('/**');
    lines.push(` * Generated content for ${layout.displayName || layout.name}`);
    lines.push(' * DO NOT EDIT - This file is auto-generated from JSON layout definitions');
    lines.push(' */');
    lines.push('');
    lines.push('@Composable');
    lines.push(`fun ${className}(data: ${layout.name}Data) {`);
    lines.push('    val size = LocalSize.current');
    lines.push('');

    // Generate the main content
    lines.push(generateElement(layout.layout, '    '));

    lines.push('}');
    lines.push('');

    // Generate data class
    lines.push(`data class ${layout.name}Data(`);
    lines.push('    val temperature: String = "",');
    lines.push('    val locationName: String = "",');
    lines.push('    val description: String = "",');
    lines.push('    val iconPath: String = "",');
    lines.push('    val hourlyForecasts: List<HourlyForecast> = emptyList(),');
    lines.push('    val dailyForecasts: List<DailyForecast> = emptyList()');
    lines.push(')');
    lines.push('');
    lines.push('data class HourlyForecast(');
    lines.push('    val time: String = "",');
    lines.push('    val temperature: String = "",');
    lines.push('    val iconPath: String = ""');
    lines.push(')');
    lines.push('');
    lines.push('data class DailyForecast(');
    lines.push('    val date: String = "",');
    lines.push('    val high: String = "",');
    lines.push('    val low: String = "",');
    lines.push('    val iconPath: String = ""');
    lines.push(')');

    return lines.join('\n');
}

/**
 * Main function
 */
function main() {
    const widgetsDir = path.join(__dirname, '../widgets');
    const outputDir = path.join(__dirname, '../../App_Resources/Android/src/main/java/com/akylas/weather/widgets/generated');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process all widget JSON files
    const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith('.json') && !f.includes('.refactored'));

    for (const file of files) {
        const filePath = path.join(widgetsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const layout: WidgetLayout = JSON.parse(content);

        console.log(`Generating Glance code for ${layout.name}...`);

        const kotlinCode = generateKotlinFile(layout);
        const outputPath = path.join(outputDir, `${layout.name}Content.generated.kt`);
        fs.writeFileSync(outputPath, kotlinCode);

        console.log(`  → ${outputPath}`);
    }

    console.log('\nGlance code generation complete!');
}

if (require.main === module) {
    main();
}

export { compileExpression, generateElement, generateKotlinFile };
