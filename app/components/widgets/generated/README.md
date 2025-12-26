# Generated Widget Preview Components

This directory contains auto-generated Svelte components for widget previews.

## Live Widget Previews

When developing widgets with live previews enabled, changes to widget JSON files will automatically regenerate the corresponding Svelte preview components.

### Usage

1. **Enable live previews** during development:
   ```bash
   npm run android -- --env.liveWidgetPreviews
   # or
   npm run ios -- --env.liveWidgetPreviews
   ```

2. **Edit widget JSON** files in `widget-layouts/widgets/`:
   - `SimpleWeatherWidget.json`
   - `HourlyWeatherWidget.json`
   - `DailyWeatherWidget.json`
   - `ForecastWeatherWidget.json`
   - `SimpleWeatherWithClockWidget.json`
   - `SimpleWeatherWithDateWidget.json`

3. **Components automatically regenerate** when JSON files are saved

4. **Use in ConfigWidget** or other components:
   ```svelte
   <script>
       import SimpleWeatherWidgetPreview from '~/components/widgets/generated/SimpleWeatherWidgetPreview.svelte';
   </script>

   <SimpleWeatherWidgetPreview 
       widgetId="1"
       widgetClass="SimpleWeatherWidget"
       data={widgetData}
       size={{ width: 260, height: 120 }}
   />
   ```

## How It Works

1. **LiveWidgetPreviewPlugin** (webpack plugin) watches widget JSON files
2. When a JSON file changes, it triggers the `generate-svelte-components.ts` script
3. The script uses the NativeScript renderer to create a Svelte wrapper component
4. The component is saved here and automatically reloaded by webpack HMR

## Files

- `*Preview.svelte` - Generated preview components (one per widget)
- These files are **auto-generated** - do not edit manually!

## Configuration

The live preview feature is configured in `app.webpack.config.js`:

```javascript
new LiveWidgetPreviewPlugin({
    enabled: env.liveWidgetPreviews,  // Controlled by --env.liveWidgetPreviews
    widgetsDir: 'widget-layouts/widgets',
    generatorScript: 'widget-layouts/renderers/generate-svelte-components.ts',
    debounceMs: 300  // Debounce file changes
})
```
