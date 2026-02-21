# Mapbox-Style Expression System

## Overview
Inspired by Mapbox GL expressions, this system uses a JSON array format where the first element is an operator and remaining elements are operands.

## Basic Operators

### Get
- `["get", "propertyName"]` - Get a property value from data
- `["get", "temperature"]` → `data.temperature`

### Arithmetic
- `["+", expr1, expr2]` - Addition
- `["-", expr1, expr2]` - Subtraction
- `["*", expr1, expr2]` - Multiplication
- `["/", expr1, expr2]` - Division

### Comparison
- `["<", expr1, expr2]` - Less than
- `["<=", expr1, expr2]` - Less than or equal
- `[">", expr1, expr2]` - Greater than
- `[">=", expr1, expr2]` - Greater than or equal
- `["==", expr1, expr2]` - Equal
- `["!=", expr1, expr2]` - Not equal

### Logical
- `["!", expr]` - Logical NOT
- `["all", expr1, expr2, ...]` - Logical AND (all must be true)
- `["any", expr1, expr2, ...]` - Logical OR (any can be true)

### Conditional
- `["case", condition1, value1, condition2, value2, ..., fallback]`
- Example: `["case", ["<", ["get", "size.width"], 80], 14, ["<", ["get", "size.width"], 200], 32, 48]`

### String
- `["concat", str1, str2, ...]` - Concatenate strings
- `["upcase", str]` - Uppercase
- `["downcase", str]` - Lowercase

## Examples

### Simple property
```json
["get", "temperature"]
```

### Size-based conditional fontSize
```json
["case",
  ["<", ["get", "size.width"], 80], 14,
  ["<", ["get", "size.width"], 200], 32,
  48
]
```

### Visibility condition
```json
["all",
  [">=", ["get", "size.width"], 80],
  ["has", "description"]
]
```

### Complex condition
```json
["any",
  ["<", ["get", "size.width"], 80],
  [">=", ["get", "size.width"], 200]
]
```

## Updated JSON Format

```json
{
  "type": "label",
  "text": ["get", "temperature"],
  "fontSize": ["case",
    ["<", ["get", "size.width"], 80], 14,
    ["<", ["get", "size.width"], 200], 32,
    48
  ],
  "fontWeight": "bold",
  "color": "onSurface",
  "visibleIf": ["has", "temperature"]
}
```
