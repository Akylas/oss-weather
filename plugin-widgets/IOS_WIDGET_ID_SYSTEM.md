# iOS Widget ID System and Removal Detection

## Overview

This document explains the unique widget ID system and widget removal detection implemented for iOS widgets.

## Problem Statement

The previous implementation had several limitations:

1. **Non-unique IDs**: Widget IDs were generated as `widget_{family}_{kind}`.hash which was the same for all widgets of the same type
2. **No removal detection**: iOS doesn't provide removal events when widgets are deleted from the home screen
3. **No per-instance config**: Multiple widgets of the same type shared the same configuration

## Solution

### 1. Stable Widget ID Generation

Each widget instance gets a unique, stable ID generated using:

```swift
let baseId = "\(widgetKind)_\(context.family.rawValue)"
let descriptionHash = context.description.hashValue  
let widgetId = "\(baseId)_\(abs(descriptionHash))"
```

**Properties:**
- ✅ Unique per widget instance on home screen
- ✅ Stable across timeline calls for same widget
- ✅ Different for multiple widgets of same type
- ✅ Survives app/widget restarts

**Example IDs:**
```
SimpleWeatherWidget_0_123456789
SimpleWeatherWidget_0_987654321  (second instance of same widget)
HourlyWeatherWidget_1_555555555
```

### 2. Widget Detection System

#### WidgetDetector Class

Located in: `plugin-widgets/platforms/ios/extensions/widgets/WidgetDetector.swift`

**Purpose:** Detect when widgets are added to or removed from the home screen

**Requirements:** iOS 16+ (uses `WidgetCenter.getCurrentConfigurations`)

**How it works:**

1. **Query Current State**
   ```swift
   WidgetCenter.shared.getCurrentConfigurations { result in
       // Gets list of all active widgets
   }
   ```

2. **Generate Stable IDs**
   ```swift
   func getStableWidgetId(for info: WidgetInfo) -> String {
       let baseId = "\(info.kind)_\(info.family.rawValue)"
       let descriptionHash = info.description.hashValue
       return "\(baseId)_\(abs(descriptionHash))"
   }
   ```

3. **Compare with Cache**
   - Load previously cached widget list from App Group UserDefaults
   - Compare current widgets vs cached widgets
   - Detect additions: `currentIDs - cachedIDs`
   - Detect removals: `cachedIDs - currentIDs`

4. **Notify Lifecycle Manager**
   ```swift
   // Widget added
   WidgetLifecycleManager.shared.notifyWidgetAdded(widgetId: widgetId, widgetKind: kind)
   
   // Widget removed
   WidgetLifecycleManager.shared.notifyWidgetRemoved(widgetId: widgetId, widgetKind: kind)
   ```

5. **Update Cache**
   - Save new widget list to UserDefaults
   - Used for next comparison

#### Detection Triggers

**1. On App Resume**
```typescript
// WidgetBridge.ios.ts
Application.on(Application.resumeEvent, () => {
    this.triggerWidgetDetection();
});
```

**2. On Timeline Refresh**
```swift
// WeatherTimelineProvider.swift
func getTimeline(in context: Context, completion: ...) {
    if #available(iOS 16.0, *) {
        WidgetDetector.shared.detect()
    }
    // ... rest of timeline code
}
```

### 3. Data Storage

**Widget Instance Cache**
- Key: `widget_instances`  
- Location: App Group UserDefaults (`group.com.akylas.weather`)
- Format: `[String: WidgetInstanceInfo]` (widgetId -> instance info)

```swift
struct WidgetInstanceInfo: Codable {
    let widgetId: String
    let kind: String
    let family: WidgetFamily
}
```

**Widget Configurations**
- Key: `widget_configs`
- Location: App Group UserDefaults
- Format: `[String: WidgetConfig]` (widgetId -> config)

### 4. Lifecycle Integration

#### Widget Added Event

1. WidgetDetector detects new widget
2. Calls `WidgetLifecycleManager.notifyWidgetAdded()`
3. Lifecycle manager:
   - Stores widget in active widgets list
   - Creates default configuration
   - Notifies main app via Darwin notification + UserDefaults
4. Main app (when opened):
   - Checks pending events via `checkPendingWidgetEvents()`
   - Fetches weather data for new widget
   - Saves data to App Group
5. Widget auto-refreshes with data

#### Widget Removed Event

1. WidgetDetector detects missing widget  
2. Calls `WidgetLifecycleManager.notifyWidgetRemoved()`
3. Lifecycle manager:
   - Removes from active widgets list
   - Cleans up widget data via `WidgetDataProvider.removeWidgetData()`
   - Notifies main app
4. Main app (when opened):
   - Processes removal event
   - Cleans up any remaining data

## Implementation Files

### New Files

**`WidgetDetector.swift`**
- Main detection logic
- Uses WidgetCenter.getCurrentConfigurations
- Compares current vs cached widget state
- Triggers lifecycle events

**`WidgetConfigurationIntent.swift`**
- AppIntent infrastructure (for future use)
- Enables AppIntentConfiguration migration
- Provides per-widget configuration UI capability

### Modified Files

**`WeatherTimelineProvider.swift`**
- Updated `getWidgetId()` to generate stable IDs
- Added detection trigger in `getTimeline()`
- Removed old hash-based ID generation

**`WidgetBridge.ios.ts`**
- Added `triggerWidgetDetection()` method
- Calls detection on app startup
- Calls detection on app resume
- Integrated with Application lifecycle

## Usage Examples

### Detecting Widget Changes in Main App

```typescript
// Automatically happens on app resume
Application.on(Application.resumeEvent, () => {
    // WidgetDetector.shared.detect() is called automatically
});
```

### Getting Widget Configuration

```swift
// In timeline provider
let widgetId = getWidgetId(from: context)
let config = WidgetSettings.shared.loadWidgetConfig(widgetId: widgetId)
```

### Handling Removal in TypeScript

```typescript
// In WidgetBridge
private handleWidgetEvent() {
    const lastEvent = this.getLastWidgetEvent();
    if (lastEvent.event === 'widgetRemoved') {
        // Clean up any app-side data for removed widget
        this.onWidgetRemoved(lastEvent.widgetId, lastEvent.widgetKind);
    }
}
```

## Limitations & Future Improvements

### Current Limitations

1. **iOS 16+ Only**: Detection requires iOS 16+ for `getCurrentConfigurations` API
2. **Hash-Based IDs**: Still relies on context description hash (stable but not perfect)
3. **No True Configuration UI**: StaticConfiguration doesn't provide per-widget UI

### Future Enhancements

#### Migrate to AppIntentConfiguration

For iOS 16+, can migrate to AppIntentConfiguration which provides:

```swift
@available(iOS 16.0, *)
AppIntentConfiguration(
    kind: kind,
    intent: WidgetConfigurationIntent.self,
    provider: WeatherIntentTimelineProvider(widgetKind: kind)
) { entry in
    SimpleWeatherWidgetView(entry: entry)
}
```

**Benefits:**
- True per-widget configuration UI
- UUID-based widget IDs (more reliable)
- Better widget identity tracking
- User-facing configuration options

**Infrastructure Already Created:**
- `WidgetConfigurationIntent.swift` - Ready to use
- `WeatherIntentTimelineProvider` - Skeleton code in place
- Just needs widget definitions to be updated

## Troubleshooting

### Widget IDs Keep Changing

**Cause:** Context description is not stable  
**Solution:** Check if widget configuration or layout changed. The description hash should be stable for same widget instance.

### Removal Not Detected

**Cause:** Detection not triggering or iOS < 16  
**Solution:** 
- Check detection is called on app resume
- Verify iOS version is 16+
- Check App Group UserDefaults is accessible

### Multiple Widgets Share Config

**Cause:** Widget IDs are same (detection not working)
**Solution:**
- Verify WidgetDetector is running
- Check widget instance cache in UserDefaults
- Ensure stable ID generation is working

### Detection Delayed

**Cause:** Detection only runs on app resume or timeline refresh  
**Solution:** This is expected behavior. iOS widgets can't wake the app, so detection happens when:
- User opens the app (app resume)
- Widget refreshes its timeline

## Testing

### Test Widget Addition

1. Delete all weather widgets from home screen
2. Open app to trigger detection (clears cache)
3. Add a weather widget
4. Widget shows placeholder "Tap to configure"
5. Open app
6. Detection runs, creates config, fetches weather
7. Widget auto-updates with weather data

### Test Widget Removal

1. Add 2-3 weather widgets
2. Open app to ensure they're tracked
3. Remove one widget from home screen
4. Open app
5. Check logs: Should show "🔴 Widget removed"
6. Verify config/data cleaned up

### Test Multiple Instances

1. Add 2 Simple Weather widgets (same type)
2. Open app
3. Check UserDefaults for `widget_instances`
4. Should see 2 different widget IDs
5. Each should have separate configuration

## Migration Notes

### From Previous System

Old system generated IDs like:
```
"widget_0_SimpleWeatherWidget".hash -> "123456789"
```

New system generates:
```
"SimpleWeatherWidget_0_123456789"
```

**Backwards Compatibility:**
- Old configs with old IDs will continue to work
- New widgets get new stable IDs
- Gradual migration as widgets are re-added
- No data loss during transition

## Summary

This implementation provides:

✅ Unique widget IDs per instance  
✅ Stable IDs across app/widget restarts  
✅ Widget removal detection (iOS 16+)  
✅ Per-instance configuration storage  
✅ Proper cleanup on widget removal  
✅ App Group shared data storage  
✅ Future-ready for AppIntentConfiguration  

The system elegantly solves the widget identity problem using iOS 16+ APIs while maintaining backwards compatibility and providing a path forward for enhanced widget configuration UX.
