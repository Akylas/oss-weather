# Platform-Specific Widgets - Quick Reference

## Adding Platform Filter to an Element

```json
{
    "type": "label",
    "platform": "ios",          // Single platform
    "text": "iOS only"
}

{
    "type": "date",
    "platform": ["android", "nativescript"],  // Multiple platforms
    "style": "year"
}
```

## iOS Native Date/Time

### Clock Widget
```json
{
    "type": "clock",
    "fontSize": 48
}
```
→ Generates: `Text(Date(), style: .time)`
→ Auto-respects: 12h/24h, locale, AM/PM

### Date Widget (Recommended for iOS)
```json
{
    "type": "date",
    "style": "dayMonth",  // or "date"
    "fontSize": 24
}
```
→ Generates: `Text(Date(), style: .date)`
→ Auto-respects: locale, includes year, regional ordering

### Custom Date Formats (When Native Not Sufficient)
```json
{
    "type": "date",
    "style": "year",  // or "month", "fullDate"
    "fontSize": 14
}
```
→ Still uses DateFormatter for these styles

## Common Patterns

### Hide Redundant Year on iOS
```json
{
    "type": "date",
    "style": "year",
    "platform": ["android", "nativescript"]
}
```
Reason: iOS native .date style already includes year

### Platform-Specific Date Rendering
```json
{
    "type": "row",
    "children": [
        {
            "type": "date",
            "style": "dayMonth",
            "platform": "ios",
            "comment": "Native iOS date"
        },
        {
            "type": "label",
            "text": ["formatDate", "..."],
            "platform": ["android", "nativescript"],
            "comment": "Custom formatted date"
        }
    ]
}
```

## Platform Values

| Value | Description |
|-------|-------------|
| `"ios"` | iOS widgets only (Swift) |
| `"android"` | Android widgets only (Glance/Kotlin) |
| `"nativescript"` | NativeScript apps only |
| `["ios", "android"]` | Both mobile platforms |
| (omit property) | All platforms |

## Generated Output

### Swift (iOS)
```swift
// Platform-specific elements are filtered out
// Only elements matching 'ios' are generated
```

### Glance (Android)
```kotlin
// Platform-specific elements are filtered out
// Only elements matching 'android' are generated
```

### NativeScript
```svelte
<!-- Platform-specific elements wrapped in conditionals -->
{#if __IOS__}
<label text="iOS only" />
{/if}

{#if __ANDROID__}
<label text="Android only" />
{/if}
```

## Generation Commands

```bash
# Generate all widgets
npm run generate:all

# Generate specific platforms
npm run generate:swift      # iOS
npm run generate:glance     # Android
npm run generate:ns         # NativeScript
```

## See Also

- [PLATFORM_SPECIFIC_LAYOUTS.md](./PLATFORM_SPECIFIC_LAYOUTS.md) - Full documentation
- [schema.json](./schema.json) - JSON schema with platform property
- [SimpleWeatherWithDateWidget.json](./src/widgets/SimpleWeatherWithDateWidget.json) - Example usage
