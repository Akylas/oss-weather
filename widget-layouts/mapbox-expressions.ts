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
            return evaluateExpression(args[0], context) == evaluateExpression(args[1], context);
        case '!=':
            return evaluateExpression(args[0], context) != evaluateExpression(args[1], context);
        
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
                if (i + 1 < args.length) {
                    const condition = evaluateExpression(args[i], context);
                    if (condition) {
                        return evaluateExpression(args[i + 1], context);
                    }
                }
            }
            // Last arg is the fallback
            if (args.length % 2 === 1) {
                return evaluateExpression(args[args.length - 1], context);
            }
            return undefined;
        }
        
        default:
            console.warn(`Unknown expression operator: ${op}`);
            return undefined;
    }
}
