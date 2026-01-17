/**
 * Expression Compiler for Widget Layout Generators
 * 
 * Compiles Mapbox-style expressions to platform-specific code.
 * Supports: Kotlin (Glance), Swift (SwiftUI), JavaScript (NativeScript), and TypeScript (HTML)
 */

import { isExpression, normalizePropertyPath, isItemPath } from './shared-utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Expression = any[] | string | number | boolean | null | undefined;

/**
 * Target platform for expression compilation
 */
export type Platform = 'kotlin' | 'swift' | 'javascript' | 'typescript';

/**
 * Expression compilation context
 */
export type CompilationContext = 'value' | 'condition';

/**
 * Formatter function to convert literal values to platform-specific strings
 */
export type ValueFormatter = (value: any) => string;

/**
 * Compilation options
 */
export interface CompilationOptions {
    platform: Platform;
    context?: CompilationContext;
    formatter?: ValueFormatter;
    addDataPrefix?: boolean;
}

// ============================================================================
// EXPRESSION COMPILER
// ============================================================================

/**
 * Compile a Mapbox-style expression to platform-specific code
 * 
 * @param expr - Expression to compile
 * @param options - Compilation options
 * @returns Compiled platform-specific code string
 * 
 * @example
 * // Kotlin (Glance)
 * compileExpression(["get", "temperature"], { platform: 'kotlin' })
 * // => "data.temperature"
 * 
 * // Swift
 * compileExpression(["get", "temperature"], { platform: 'swift' })
 * // => "data.temperature"
 * 
 * // Conditional
 * compileExpression(["<", ["get", "temp"], 32], { platform: 'kotlin', context: 'condition' })
 * // => "data.temp < 32"
 */
export function compileExpression(
    expr: Expression,
    options: CompilationOptions
): string {
    const { platform, context = 'value', formatter, addDataPrefix = true } = options;
    
    // Handle null/undefined
    if (expr === null || expr === undefined) {
        return platform === 'swift' ? 'nil' : 'null';
    }
    
    // Handle literal values
    if (typeof expr === 'string') {
        if (formatter && context === 'value') {
            return formatter(expr);
        }
        return context === 'value' ? `"${escapeString(expr, platform)}"` : expr;
    }
    
    if (typeof expr === 'number') {
        if (formatter && context === 'value') {
            return formatter(expr);
        }
        return String(expr);
    }
    
    if (typeof expr === 'boolean') {
        if (formatter && context === 'value') {
            return formatter(expr);
        }
        return String(expr);
    }
    
    // Not an expression array
    if (!isExpression(expr)) {
        if (formatter && context === 'value') {
            return formatter(expr);
        }
        return String(expr);
    }
    
    // Compile expression operators
    const [op, ...args] = expr;
    
    switch (op) {
        case 'get':
            return compileGet(args[0], platform, addDataPrefix);
            
        case 'has':
            return compileHas(args[0], platform, addDataPrefix);
            
        // Arithmetic
        case '+':
        case '-':
        case '*':
        case '/':
            return compileArithmetic(op, args, options);
            
        // Comparison
        case '<':
        case '<=':
        case '>':
        case '>=':
        case '==':
        case '!=':
            return compileComparison(op, args, options);
            
        // Logical
        case '!':
            return compileNot(args, options);
        case 'all':
            return compileAll(args, options);
        case 'any':
            return compileAny(args, options);
            
        // Conditional
        case 'case':
            return compileCase(args, options);
            
        // String operations
        case 'concat':
            return compileConcat(args, options);
        case 'upcase':
            return compileUpcase(args, options);
        case 'downcase':
            return compileDowncase(args, options);
        case 'substring':
            return compileSubstring(args, options);
            
        // Date/Time formatting
        case 'format':
            return compileFormat(args, options);
            
        // Template interpolation
        case 'interpolate':
            return compileInterpolate(args, options);
            
        default:
            console.warn(`Unknown expression operator: ${op}`);
            return `/* unknown op: ${op} */`;
    }
}

// ============================================================================
// PROPERTY ACCESS OPERATORS
// ============================================================================

/**
 * Compile "get" operator - property access
 */
function compileGet(prop: string, platform: Platform, addDataPrefix: boolean): string {
    // Handle size.width/height specially - map to direct width/height variables in Swift
    if (prop.startsWith('size.')) {
        const parts = prop.split('.');
        if (parts.length === 2) {
            if (platform === 'kotlin') {
                return `size.${parts[1]}.value`;
            } else if (platform === 'swift') {
                // In Swift, size.width maps to the geometry variable 'width'
                return parts[1]; // Just return 'width' or 'height'
            }
        }
        return prop;
    }
    
    // Handle item properties (in forEach loops)
    if (isItemPath(prop)) {
        return prop;
    }
    
    // Check if already prefixed
    if (prop.startsWith('data.') || prop.startsWith('config.')) {
        return prop;
    }
    
    // Add data prefix if needed
    return addDataPrefix ? `data.${prop}` : prop;
}

/**
 * Compile "has" operator - check if property exists/has value
 */
function compileHas(prop: string, platform: Platform, addDataPrefix: boolean): string {
    const path = compileGet(prop, platform, addDataPrefix);
    
    switch (platform) {
        case 'kotlin':
            return `${path}.isNotEmpty()`;
        case 'swift':
            return `!${path}.isEmpty`;
        case 'javascript':
        case 'typescript':
            return `${path} !== undefined && ${path} !== null && ${path} !== ''`;
    }
}

// ============================================================================
// ARITHMETIC OPERATORS
// ============================================================================

function compileArithmetic(
    op: '+' | '-' | '*' | '/',
    args: Expression[],
    options: CompilationOptions
): string {
    const left = compileExpression(args[0], { ...options, context: 'value' });
    const right = compileExpression(args[1], { ...options, context: 'value' });
    return `(${left} ${op} ${right})`;
}

// ============================================================================
// COMPARISON OPERATORS
// ============================================================================

function compileComparison(
    op: '<' | '<=' | '>' | '>=' | '==' | '!=',
    args: Expression[],
    options: CompilationOptions
): string {
    const left = compileExpression(args[0], { ...options, context: 'condition', formatter: undefined });
    const right = compileExpression(args[1], { ...options, context: 'condition', formatter: undefined });
    
    // Swift uses different equality operators
    if (options.platform === 'swift') {
        if (op === '==') return `${left} == ${right}`;
        if (op === '!=') return `${left} != ${right}`;
    }
    
    return `${left} ${op} ${right}`;
}

// ============================================================================
// LOGICAL OPERATORS
// ============================================================================

function compileNot(args: Expression[], options: CompilationOptions): string {
    const condition = compileExpression(args[0], { ...options, context: 'condition', formatter: undefined });
    return `!(${condition})`;
}

function compileAll(args: Expression[], options: CompilationOptions): string {
    const conditions = args.map(arg => 
        compileExpression(arg, { ...options, context: 'condition', formatter: undefined })
    );
    return `(${conditions.join(' && ')})`;
}

function compileAny(args: Expression[], options: CompilationOptions): string {
    const conditions = args.map(arg => 
        compileExpression(arg, { ...options, context: 'condition', formatter: undefined })
    );
    return `(${conditions.join(' || ')})`;
}

// ============================================================================
// CONDITIONAL OPERATOR (CASE)
// ============================================================================

/**
 * Compile "case" operator - conditional expression
 * Format: ["case", condition1, value1, condition2, value2, ..., fallback]
 */
function compileCase(args: Expression[], options: CompilationOptions): string {
    const { platform } = options;
    const pairs: Array<{ condition: string; value: string }> = [];
    
    // Process condition-value pairs
    for (let i = 0; i < args.length - 1; i += 2) {
        if (i + 1 < args.length) {
            const condition = compileExpression(args[i], { ...options, context: 'condition', formatter: undefined });
            const value = compileExpression(args[i + 1], options);
            pairs.push({ condition, value });
        }
    }
    
    // Last arg is the fallback
    const hasFallback = args.length % 2 === 1;
    const fallback = hasFallback 
        ? compileExpression(args[args.length - 1], options)
        : (options.formatter ? options.formatter('') : '""');
    
    // Generate platform-specific code
    switch (platform) {
        case 'kotlin':
            return compileKotlinCase(pairs, fallback);
        case 'swift':
            return compileSwiftCase(pairs, fallback);
        case 'javascript':
        case 'typescript':
            return compileJavaScriptCase(pairs, fallback);
    }
}

function compileKotlinCase(
    pairs: Array<{ condition: string; value: string }>,
    fallback: string
): string {
    if (pairs.length === 0) return fallback;
    
    const whenCases = pairs.map(p => `${p.condition} -> ${p.value}`).join('; ');
    return `when { ${whenCases}; else -> ${fallback} }`;
}

function compileSwiftCase(
    pairs: Array<{ condition: string; value: string }>,
    fallback: string
): string {
    if (pairs.length === 0) return fallback;
    
    // Swift uses ternary for simple cases, but for multiple conditions we need if-else chain
    if (pairs.length === 1) {
        return `${pairs[0].condition} ? ${pairs[0].value} : ${fallback}`;
    }
    
    // For multiple conditions, generate nested ternary (not ideal but works)
    let result = fallback;
    for (let i = pairs.length - 1; i >= 0; i--) {
        result = `${pairs[i].condition} ? ${pairs[i].value} : ${result}`;
    }
    return result;
}

function compileJavaScriptCase(
    pairs: Array<{ condition: string; value: string }>,
    fallback: string
): string {
    if (pairs.length === 0) return fallback;
    
    // JavaScript uses ternary operator
    let result = fallback;
    for (let i = pairs.length - 1; i >= 0; i--) {
        result = `${pairs[i].condition} ? ${pairs[i].value} : ${result}`;
    }
    return result;
}

// ============================================================================
// STRING OPERATORS
// ============================================================================

function compileConcat(args: Expression[], options: CompilationOptions): string {
    const parts = args.map(arg => compileExpression(arg, { ...options, context: 'value' }));
    
    switch (options.platform) {
        case 'kotlin':
            return parts.join(' + ');
        case 'swift':
            return parts.join(' + ');
        case 'javascript':
        case 'typescript':
            return parts.join(' + ');
    }
}

function compileUpcase(args: Expression[], options: CompilationOptions): string {
    const str = compileExpression(args[0], { ...options, context: 'value' });
    
    switch (options.platform) {
        case 'kotlin':
            return `${str}.uppercase()`;
        case 'swift':
            return `${str}.uppercased()`;
        case 'javascript':
        case 'typescript':
            return `${str}.toUpperCase()`;
    }
}

function compileDowncase(args: Expression[], options: CompilationOptions): string {
    const str = compileExpression(args[0], { ...options, context: 'value' });
    
    switch (options.platform) {
        case 'kotlin':
            return `${str}.lowercase()`;
        case 'swift':
            return `${str}.lowercased()`;
        case 'javascript':
        case 'typescript':
            return `${str}.toLowerCase()`;
    }
}

function compileSubstring(args: Expression[], options: CompilationOptions): string {
    const str = compileExpression(args[0], { ...options, context: 'value' });
    const start = compileExpression(args[1], { ...options, context: 'value' });
    
    if (args.length > 2) {
        const length = compileExpression(args[2], { ...options, context: 'value' });
        
        switch (options.platform) {
            case 'kotlin':
                return `${str}.substring(${start}, ${start} + ${length})`;
            case 'swift':
                return `String(${str}.prefix(${start} + ${length}).suffix(${length}))`;
            case 'javascript':
            case 'typescript':
                return `${str}.substring(${start}, ${start} + ${length})`;
        }
    }
    
    switch (options.platform) {
        case 'kotlin':
            return `${str}.substring(${start})`;
        case 'swift':
            return `String(${str}.suffix(from: ${start}))`;
        case 'javascript':
        case 'typescript':
            return `${str}.substring(${start})`;
    }
}

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

function compileFormat(args: Expression[], options: CompilationOptions): string {
    const value = compileExpression(args[0], { ...options, context: 'value' });
    const pattern = args[1] as string;
    
    switch (options.platform) {
        case 'kotlin':
            return `SimpleDateFormat("${pattern}").format(${value})`;
        case 'swift':
            // Swift date formatting is more complex, return a placeholder
            return `DateFormatter.format(${value}, pattern: "${pattern}")`;
        case 'javascript':
        case 'typescript':
            return `formatDate(${value}, "${pattern}")`;
    }
}

// ============================================================================
// TEMPLATE INTERPOLATION
// ============================================================================

function compileInterpolate(args: Expression[], options: CompilationOptions): string {
    const template = args[0] as string;
    
    // Convert {{prop}} to platform-specific interpolation
    switch (options.platform) {
        case 'kotlin':
            return `"${template.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\${data.${prop}}`)}"`;
        case 'swift':
            return `"${template.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\\(data.${prop})`)}"`;
        case 'javascript':
        case 'typescript':
            return `\`${template.replace(/\{\{([^}]+)\}\}/g, (_, prop) => `\${data.${prop}}`)} \``;
    }
}

// ============================================================================
// STRING ESCAPING
// ============================================================================

/**
 * Escape string for the target platform
 */
function escapeString(str: string, platform: Platform): string {
    switch (platform) {
        case 'kotlin':
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        case 'swift':
            // Handle Swift string interpolation specially
            const placeholder = '__SWIFT_INTERP__';
            const withPlaceholders = str.replace(/\\\(/g, placeholder);
            const escaped = withPlaceholders.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return escaped.replace(new RegExp(placeholder, 'g'), '\\(');
        case 'javascript':
        case 'typescript':
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compile a property value that might be a literal or expression
 * 
 * @param value - Value to compile
 * @param options - Compilation options
 * @param defaultValue - Default value if undefined
 * @returns Compiled string
 */
export function compilePropertyValue<T>(
    value: Expression | undefined,
    options: CompilationOptions,
    defaultValue?: string
): string {
    if (value === undefined) {
        return defaultValue || '';
    }
    
    // If it's a literal value and we have a formatter, format it directly
    if (!isExpression(value) && options.formatter) {
        return options.formatter(value as T);
    }
    
    // It's an expression, compile it
    return compileExpression(value, options);
}
