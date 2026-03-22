# Platform-Specific Widget Layouts

This document explains how to create platform-specific widget layouts using the new `platform` property.

## Overview

You can now mark widget elements as platform-specific, allowing you to:
- Show/hide elements on specific platforms
- Use different layouts for iOS, Android, and NativeScript
- Leverage platform-native components (like iOS's `Text(Date(), style: .date)`)

## The `platform` Property

Add a `platform` property to any widget element:

```json
{
    "type": "label",
    "platform": "ios",
    "text": "iOS only"
}
```

### Supported Values

- **Single platform**: `"ios"`, `"android"`, or `"nativescript"`
- **Multiple platforms**: `["ios", "android"]` or any combination
- **No platform**: Omit the property to render on all platforms

## Examples

### Example 1: iOS-Only Element

```json
{
    "type": "label",
    "platform": "ios",
    "text": "This only appears on iOS widgets"
}
```

Generated code:
- **Swift**: Element is rendered
- **Glance (Android)**: Element is filtered out
- **NativeScript**: Wrapped in `{#if __IOS__}...{/if}`

### Example 2: Android-Only Element

```json
{
    "type": "label",
    "platform": "android",
    "text": "This only appears on Android widgets"
}
```

Generated code:
- **Swift**: Element is filtered out
- **Glance (Android)**: Element is rendered
- **NativeScript**: Wrapped in `{#if __ANDROID__}...{/if}`

### Example 3: Multi-Platform (Exclude iOS)

```json
{
    "type": "date",
    "style": "year",
    "platform": ["android", "nativescript"],
    "fontSize": 14
}
```

This is useful when iOS handles something natively. For example, `Text(Date(), style: .date)` on iOS already includes the year, so showing it separately is redundant.

Generated code:
- **Swift**: Element is filtered out
- **Glance (Android)**: Element is rendered
- **NativeScript**: Wrapped in `{#if __ANDROID__}...{/if}` (since NativeScript runs on both but widget is marked for android + nativescript)

### Example 4: Complete Widget with Platform-Specific Elements

```json
{
    "layout": {
        "type": "column",
        "children": [
            {
                "type": "row",
                "children": [
                    {
                        "type": "date",
                        "style": "dayMonth",
                        "platform": "ios",
                        "comment": "iOS uses native date formatting"
                    },
                    {
                        "type": "date",
                        "style": "dayMonth",
                        "platform": ["android", "nativescript"],
                        "comment": "Android/NS use custom formatter"
                    }
                ]
            },
            {
                "type": "label",
                "text": ["get", "temperature"],
                "comment": "No platform - renders everywhere"
            },
            {
                "type": "date",
                "style": "year",
                "platform": ["android", "nativescript"],
                "comment": "Year only shown on Android/NS, iOS date style includes it"
            }
        ]
    }
}
```

## iOS Native Date/Time Components

### Clock Widget

For `type: "clock"`, iOS uses native time formatting:

```json
{
    "type": "clock",
    "fontSize": 48
}
```

Generates:
```swift
Text(Date(), style: .time)
    .font(.system(size: 48, weight: .bold))
```

This automatically respects:
- System 12h/24h preference
- Locale-specific time formatting
- AM/PM display

### Date Widget with Native Style

For `type: "date"` with `style: "date"` or `"dayMonth"`:

```json
{
    "type": "date",
    "style": "dayMonth",
    "fontSize": 24
}
```

Generates:
```swift
Text(Date(), style: .date)
    .font(.system(size: 24, weight: .regular))
```

This automatically respects:
- Locale-specific date formatting
- Includes year in appropriate format
- Regional date ordering preferences

### Custom Date Formats

Some date styles still use DateFormatter when native styles aren't appropriate:

```json
{
    "type": "date",
    "style": "year"
}
```

Generates (still uses DateFormatter):
```swift
Text({
    let f = DateFormatter()
    f.dateFormat = "yyyy"
    return f.string(from: Date())
}())
```

## NativeScript Platform Conditionals

In NativeScript Svelte templates, platform-specific elements are wrapped:

```svelte
{#if __IOS__}
<label text="iOS only" />
{/if}

{#if __ANDROID__}
<label text="Android only" />
{/if}
```

These conditionals are automatically added by the generator when you use the `platform` property.

## Best Practices

1. **Use platform filtering sparingly** - Most widgets should work the same everywhere
2. **Leverage native components** - Use iOS native date/time when possible for better UX
3. **Test on all platforms** - Verify your platform-specific logic works correctly
4. **Document why** - Add comments explaining why an element is platform-specific
5. **Prefer conditional layout** - Use platform-specific elements for layout differences, not for features

## Migration Guide

### Updating Existing Widgets

If you have widgets that could benefit from platform-specific layouts:

1. Identify elements that could use native components (dates, times)
2. Add `platform` property to elements that should only appear on certain platforms
3. Regenerate widgets using `npm run generate:all`
4. Test on all target platforms

### Example: SimpleWeatherWithDateWidget

Before:
```json
{
    "type": "date",
    "style": "year",
    "fontSize": 14
}
```

After:
```json
{
    "type": "date",
    "style": "year",
    "fontSize": 14,
    "platform": ["android", "nativescript"]
}
```

This hides the year on iOS since `Text(Date(), style: .date)` already includes it in localized format.

## Implementation Notes

### Swift Generator
- Filters children arrays using `filterChildrenByPlatform(element.children, 'ios')`
- Date/time elements with `style: "date"` or `"dayMonth"` use `Text(Date(), style: .date)`
- Clock elements use `Text(Date(), style: .time)`

### Glance Generator (Android)
- Filters children arrays using `filterChildrenByPlatform(element.children, 'android')`
- Uses custom date/time formatters for all styles

### NativeScript Generator
- Wraps filtered elements in `{#if __IOS__}` or `{#if __ANDROID__}` conditionals
- Both iOS and Android elements are included, selected at runtime
- Uses NativeScript's formatDate for custom formatting

## Schema Changes

The schema now includes:

```json
{
    "platform": { 
        "oneOf": [
            {
                "type": "string",
                "enum": ["ios", "android", "nativescript"]
            },
            {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": ["ios", "android", "nativescript"]
                }
            }
        ]
    }
}
```
