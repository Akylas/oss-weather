/**
 * Mapbox Expression Utilities
 * Shared utilities for evaluating and compiling Mapbox-style expressions
 * across different platforms (Swift, Kotlin, NativeScript, HTML)
 */

// Mapbox-style expression type
export type Expression = any[] | string | number | boolean;

/**
 * Check if a value is a Mapbox expression (array format)
 */
export function isExpression(value: any): value is any[] {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string';
}

/**
 * Evaluate a Mapbox expression to a concrete value (for runtime evaluation)
 * Used by NativeScript and HTML renderers
 */
export function evaluateExpression(expr: Expression, context: any): any {
    // Handle null/undefined
    if (expr === null || expr === undefined) {
        return null;
    }
    
    // Literal values
    if (typeof expr === 'string' || typeof expr === 'number' || typeof expr === 'boolean') {
        return expr;
    }
    
    if (!isExpression(expr)) {
        return expr;
    }
    
    const [op, ...args] = expr;
    
    switch (op) {
        // Property access
        case 'get': {
            const prop = args[0] as string;
            const parts = prop.split('.');
            let current: any = context;
            
            // If property starts with "data.", look in context.data
            if (parts[0] === 'data' && context.data) {
                current = context.data;
                parts.shift(); // Remove "data" from the path
            }
            // If property doesn't have a prefix and exists in context.data, start there
            else if (parts.length === 1 && context.data && context.data[parts[0]] !== undefined) {
                current = context.data;
            }
            // Otherwise traverse from context
            
            for (const part of parts) {
                if (current === undefined || current === null) {
                    return undefined;
                }
                current = current[part];
            }
            return current;
        }
        
        // Check if property exists/has value
        case 'has': {
            const value = evaluateExpression(['get', args[0]], context);
            return value !== undefined && value !== null && value !== '';
        }
        
        // Arithmetic
        case '+':
            return evaluateExpression(args[0], context) + evaluateExpression(args[1], context);
        case '-':
            return evaluateExpression(args[0], context) - evaluateExpression(args[1], context);
        case '*':
            return evaluateExpression(args[0], context) * evaluateExpression(args[1], context);
        case '/':
            return evaluateExpression(args[0], context) / evaluateExpression(args[1], context);
        
        // Comparison
        case '<':
            return evaluateExpression(args[0], context) < evaluateExpression(args[1], context);
        case '<=':
            return evaluateExpression(args[0], context) <= evaluateExpression(args[1], context);
        case '>':
            return evaluateExpression(args[0], context) > evaluateExpression(args[1], context);
        case '>=':
            return evaluateExpression(args[0], context) >= evaluateExpression(args[1], context);
        case '==':
            return evaluateExpression(args[0], context) === evaluateExpression(args[1], context);
        case '!=':
            return evaluateExpression(args[0], context) !== evaluateExpression(args[1], context);
        
        // Logical
        case '!':
            return !evaluateExpression(args[0], context);
        case 'all':
            return args.every(a => evaluateExpression(a, context));
        case 'any':
            return args.some(a => evaluateExpression(a, context));
        
        // Conditional (case statement)
        case 'case': {
            for (let i = 0; i < args.length - 1; i += 2) {
                const condition = evaluateExpression(args[i], context);
                if (condition) {
                    return evaluateExpression(args[i + 1], context);
                }
            }
            // Last arg is the fallback (always present for odd-length args)
            if (args.length % 2 === 1) {
                return evaluateExpression(args[args.length - 1], context);
            }
            // If no fallback provided and no conditions matched, return null
            return null;
        }
        
        // String operations
        case 'substring': {
            const str = String(evaluateExpression(args[0], context) || '');
            const start = evaluateExpression(args[1], context);
            const length = args.length > 2 ? evaluateExpression(args[2], context) : undefined;
            
            if (length !== undefined) {
                return str.substring(start, start + length);
            }
            return str.substring(start);
        }
        
        // Date/Time formatting
        case 'format': {
            const value = evaluateExpression(args[0], context);
            const pattern = args[1] as string;
            
            // If value is a Date or can be converted to Date
            const date = value instanceof Date ? value : new Date(value);
            
            if (isNaN(date.getTime())) {
                return String(value);
            }
            
            // Simple pattern matching for common formats
            // For full support, would need a date formatting library
            if (pattern === 'HH:mm') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (pattern === 'h:mm a') {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } else if (pattern === 'EEE, MMM d') {
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else if (pattern === 'MMM d, yyyy') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            
            // Fallback to ISO string
            return date.toLocaleString();
        }
        
        default:
            console.warn(`Unknown expression operator: ${op}`);
            return undefined;
    }
}
