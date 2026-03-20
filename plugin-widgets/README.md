# Widget Layout DSL

A cross-platform widget layout system that uses JSON definitions to render weather widgets consistently across iOS, Android, and web.

## Overview

This system allows defining widget layouts once in JSON and rendering them on multiple platforms:
- **iOS** - WidgetKit SwiftUI views
- **Android** - Glance Composables
- **NativeScript** - Native views for in-app preview

## Directory Structure

```
widget-layouts/
├── schema.json              # JSON Schema for widget layouts
├── widgets/                 # Widget layout definitions
│   ├── SimpleWeatherWidget.json
│   ├── SimpleWeatherWithClockWidget.json
│   ├── SimpleWeatherWithDateWidget.json
│   ├── HourlyWeatherWidget.json
│   ├── DailyWeatherWidget.json
│   └── ForecastWeatherWidget.json
├── scripts/generators/              # Code generators
│   ├── nativescript-svelte-generator.ts # Nativescript code generator
│   ├── swift-generator.ts   # iOS SwiftUI code generator
│   └── glance-generator.ts  # Android Glance code generator
└── image-generator/         # Preview image generation
    ├── generate-images.ts
    ├── package.json
    └── README.md
```

## Layout Elements

The following layout primitives are available:

| Element | Description | iOS | Android | NativeScript | HTML |
|---------|-------------|-----|---------|--------------|------|
| `column` | Vertical container | VStack | Column | StackLayout (vertical) | flexbox column |
| `row` | Horizontal container | HStack | Row | StackLayout (horizontal) | flexbox row |
| `stack` | Overlay container | ZStack | Box | GridLayout | position: relative |
| `label` | Text display | Text | Text | Label | span |
| `image` | Image display | Image | Image | Image | img |
| `spacer` | Flexible space | Spacer | Spacer | StackLayout | div with flex |
| `divider` | Line separator | Divider | Box | StackLayout | div |
| `scrollView` | Scrollable container | ScrollView | LazyRow/Column | ScrollView | overflow: auto |
| `forEach` | Repeat template | ForEach | forEachIndexed | Loop | map() |
| `clock` | Current time | Text(.time) | TextClock | Label | span |
| `date` | Current date | Text(.date) | DateText | Label | span |

## Data Binding

Use `{{path}}` syntax to bind weather data:

```json
{
  "type": "label",
  "text": "{{temperature}}"
}
```

Available data paths:
- `temperature` - Current temperature
- `locationName` - Location name
- `description` - Weather description
- `iconPath` - Weather icon path
- `hourlyData[n].hour` - Hour label
- `hourlyData[n].temperature` - Hourly temperature
- `hourlyData[n].iconPath` - Hourly icon
- `hourlyData[n].precipAccumulation` - Precipitation amount
- `dailyData[n].day` - Day name
- `dailyData[n].temperatureHigh` - High temperature
- `dailyData[n].temperatureLow` - Low temperature
- `dailyData[n].iconPath` - Daily icon
- `dailyData[n].precipAccumulation` - Daily precipitation

## Size Variants

Widgets can define different layouts for different sizes:

```json
{
  "variants": [
    {
      "condition": "size.width < 80",
      "layout": { /* small layout */ }
    },
    {
      "condition": "size.width < 200",
      "layout": { /* medium layout */ }
    }
  ],
  "layout": { /* default/large layout */ }
}
```

## Code Generators

### iOS SwiftUI Generator

Generate SwiftUI widget views from JSON layouts:

```bash
npx ts-node generators/swift-generator.ts [layoutsDir] [outputDir]
```

This generates `*View.generated.swift` files that can be used in the iOS widget extension.

### Android Glance Generator

Generate Glance composables from JSON layouts:

```bash
npx ts-node generators/glance-generator.ts [layoutsDir] [outputDir]
```

This generates `*Content.generated.kt` files that can be used in Android widgets.

## Usage

### NativeScript (In-App Preview)

```typescript
import { renderWidget } from '~/widget-layouts/renderers/nativescript-renderer';
import layout from '~/widget-layouts/widgets/SimpleWeatherWidget.json';

const view = renderWidget(layout, weatherData, { width: 120, height: 120 });
container.addChild(view);
```

## Colors

Theme colors are referenced by name:
- `onSurface` - Primary text color
- `onSurfaceVariant` - Secondary text color
- `primary` - Accent color
- `error` - Error color
- `widgetBackground` - Widget background
- `surface` - Card surface color

Or use hex colors directly: `#RRGGBB`

## TODO

- [x] Generate iOS SwiftUI code from JSON
- [x] Generate Android Glance composables from JSON
- [x] Add image generation script for README previews
- [ ] Update existing iOS widgets to use generated code
- [ ] Update existing Android widgets to use generated code
- [ ] Add visual editor for widget layouts
- [ ] Add animation support
