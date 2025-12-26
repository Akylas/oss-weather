# Generated Widget Preview Components

This directory contains auto-generated Svelte Native components for widget previews. These components are generated from the JSON widget layouts in `widget-layouts/widgets/` using the NativeScript Svelte generator.

## DO NOT EDIT MANUALLY

All files in this directory are automatically generated and will be overwritten. To make changes:

1. Edit the corresponding JSON widget layout in `widget-layouts/widgets/`
2. Run the generator manually or use live preview mode

## Generation

### Manual Generation

Generate all widgets:
```bash
cd widget-layouts
npm run generate:ns
# or
npx tsx generators/nativescript-svelte-generator.ts
```

Generate a specific widget:
```bash
cd widget-layouts
npx tsx generators/nativescript-svelte-generator.ts widgets ../app/components/widgets/generated SimpleWeatherWidget
```

### Live Preview Mode

Enable live preview during development to automatically regenerate components when JSON files change:

```bash
npm run android -- --env.liveWidgetPreviews
# or
npm run ios -- --env.liveWidgetPreviews
```

When enabled:
- File watcher monitors `widget-layouts/widgets/*.json`
- Changes trigger automatic component regeneration (300ms debounced)
- Webpack HMR instantly updates the preview in the running app
- No manual rebuild required

## How It Works

1. **Source**: JSON widget layouts define structure, styling, and data bindings using Mapbox-style expressions
2. **Generator**: `nativescript-svelte-generator.ts` converts JSON to Svelte Native components
3. **Output**: `.svelte` files in this directory that render widgets using NativeScript views
4. **Preview**: Components can be used in ConfigWidget for widget configuration preview

## Component Structure

Generated components follow this pattern:
- Import NativeScript Svelte Native components
- Export `data` prop (WeatherWidgetData type)
- Export `size` prop (width/height)
- Reactive color variables from `$colors` store
- Native layout elements (gridlayout, stacklayout, label, image, etc.)
- Data bindings evaluated at runtime
- Mapbox expressions compiled to Svelte expressions

## Architecture

The generator produces components that:
- Use proven NativeScript Svelte Native patterns
- Support reactive data updates
- Handle all widget types (Simple, Hourly, Daily, Forecast, WithClock, WithDate)
- Include proper TypeScript typing
- Follow the app's color theming system
