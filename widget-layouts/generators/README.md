# Widget Configuration Generators

## Overview

This directory contains scripts that generate widget configurations and code for Android, iOS, and the main app.

## Widget Kind Config Generation

### Purpose

The `generate-widget-kind-configs.ts` script generates default widget configurations from JSON schemas, ensuring:
- **No code duplication**: Settings defaults are defined once in JSON schemas
- **Immediate availability**: Configs are generated at build time, available immediately at app start
- **Type safety**: Generated code is type-safe across all platforms
- **Single source of truth**: Widget JSON schemas are the authoritative source for all settings

### Usage

```bash
# Generate all widget kind configs
cd widget-layouts
npm run generate:kind-configs
```

Or from the main project:

```bash
npm run generate:widget-kind-configs
```

### Generated Files

The script generates three files:

1. **TypeScript** (`app/services/widgets/WidgetKindConfigs.ts`):
   - Used by the main app for widget management
   - Exports `WIDGET_KIND_CONFIGS` and helper functions

2. **Kotlin** (`App_Resources/Android/src/main/java/com/akylas/weather/widgets/WidgetKindConfigs.generated.kt`):
   - Used by Android WeatherWidgetManager
   - Provides `WidgetKindConfigs.createDefaultKindConfig(widgetKind)`
   - Replaces runtime JSON parsing from assets

3. **Swift** (`App_Resources/iOS/extensions/widgets/WidgetKindConfigs.generated.swift`):
   - Used by iOS WidgetSettings
   - Provides `WidgetKindConfigs.createDefaultKindConfig(widgetKind:)`
   - Replaces runtime JSON parsing from bundle

### Integration

The generator is automatically run during:
- `npm install` (via postinstall → setup script)
- Manual execution: `npm run generate:widget-kind-configs`

### Widget JSON Schema

Widget settings are defined in JSON schemas under `widget-layouts/widgets/`:

```json
{
  "name": "SimpleWeatherWithClockWidget",
  "settings": {
    "clockBold": {
      "type": "boolean",
      "default": true,
      "title": "widget_clock_bold_title",
      "description": "widget_clock_bold_description"
    }
  }
}
```

The generator extracts the `default` values and creates configuration objects for each platform.

### Benefits

1. **Consistency**: All platforms use the same default values from JSON schemas
2. **Performance**: No runtime JSON parsing needed
3. **Maintainability**: Settings defined in one place (JSON), used everywhere
4. **Type Safety**: Generated code is properly typed for each platform
5. **Immediate Availability**: Configs available at app start, no async loading

### Development Workflow

1. Modify widget JSON schema in `widget-layouts/widgets/`
2. Run generator: `npm run generate:widget-kind-configs`
3. Generated files are updated automatically
4. Commit all changes including generated files

Note: Generated files should be committed to the repository as they are required for building the app.
