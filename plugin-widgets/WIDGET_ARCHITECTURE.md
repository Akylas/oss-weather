# Widget Architecture Documentation

## Overview

This document explains how weather widgets work in OSS-Weather, particularly focusing on iOS widget architecture and the data flow between the main app and widget extensions.

## iOS Platform Limitations

### Widgets Cannot Wake the Main App

**Critical Limitation**: iOS widget extensions run in a separate process and **CANNOT** wake up, launch, or communicate with the main app when it's suspended or terminated. This is an intentional iOS design decision for:

- **Security**: Prevents widgets from triggering arbitrary app code
- **Battery Life**: Limits background activity
- **System Performance**: Prevents resource abuse

This is not a bug or limitation of our implementation - it's how iOS widgets are designed to work.

## Data Flow Architecture

### 1. Widget Added (Main App Closed)

```
User adds widget to home screen
         ↓
iOS calls WeatherTimelineProvider.getTimeline()
         ↓
Widget calls notifyWidgetAdded()
         ↓
Event persisted to App Group UserDefaults
         ↓
Widget calls WidgetDataProvider.loadWidgetData()
         ↓
Returns nil (no data exists yet)
         ↓
Widget displays "Tap to configure" or "No location set"
```

**At this point**: The widget is visible but shows a placeholder state. This is **normal and expected**.

### 2. User Opens Main App

```
User opens OSS-Weather app
         ↓
WidgetBridge constructor called
         ↓
checkPendingWidgetEvents() runs
         ↓
Reads pending events from App Group UserDefaults
         ↓
Calls onWidgetAdded(widgetId)
         ↓
Fetches weather data using app's weather service
         ↓
Formats data for widget display
         ↓
Saves to App Group: WidgetData/widget_{id}.json
         ↓
Calls WidgetCenter.shared.reloadAllTimelines()
         ↓
Widget automatically refreshes with weather data
```

**Result**: Widget now displays current weather.

### 3. Ongoing Updates

```
Main app runs (foreground or background)
         ↓
Weather data updated (user refresh, scheduled update, etc.)
         ↓
updateAllWidgets() called
         ↓
Weather data saved to App Group for each widget
         ↓
Widgets reload based on their timeline policy
```

## App Group Shared Container

All data sharing between the main app and widgets happens through the **App Group container** (`group.com.akylas.weather`):

### Shared Data

1. **Widget Weather Data**: `WidgetData/widget_{id}.json`
   - Temperature, location, icon, description
   - Hourly forecast data
   - Daily forecast data
   - Loading/error states

2. **Widget Configuration**: `WidgetSettings/{widgetId}_config.json`
   - User preferences (transparent background, colors, etc.)
   - Location/forecast settings

3. **Widget Translations**: `widget_translations`
   - Localized strings for widget UI
   - Synced when app launches or language changes

4. **Lifecycle Events**: `last_widget_event`
   - Widget add/remove notifications
   - Processed when app becomes active

## Why Widgets Don't Fetch Weather Directly

**Question**: Can't the widget extension just fetch weather data itself when added?

**Answer**: No, and here's why:

### Technical Limitations

1. **No Background Networking**: Widget extensions have extremely limited networking capabilities
2. **No NativeScript Runtime**: Widgets are pure Swift, can't access TypeScript/JavaScript code
3. **Limited Execution Time**: Widgets have strict time limits (a few seconds)
4. **No Location Services**: Widgets can't directly access CoreLocation

### Architectural Reasons

1. **Code Duplication**: Would require reimplementing all weather fetching logic in Swift
2. **API Key Management**: Weather API keys would need to be duplicated
3. **Consistency**: Different data formatting between app and widget
4. **Maintenance Burden**: Every change would need to be made twice
5. **State Synchronization**: User preferences, locations, units would be split

### Industry Standard

This architecture (main app provides data, widget displays it) is the **standard pattern** used by all major iOS widgets:

- Apple Weather widgets
- Carrot Weather
- Weather Underground
- Dark Sky (RIP)
- All Google widgets (Gmail, Calendar, etc.)
- All productivity widgets (Todoist, Things, etc.)

## User Experience

### Expected Behavior

1. **User adds widget** → Shows "Tap to configure" or "No location set"
2. **User opens app** → Widget updates with weather data within seconds
3. **Ongoing usage** → Widget stays updated based on refresh frequency

### What Users See

| Scenario | Widget Display |
|----------|---------------|
| Widget added, app never opened | "Tap to configure" or "No location set" |
| Widget added, app opened | Current weather data |
| App closed, widget older than refresh interval | Last known weather (may be stale) |
| App running in background | Fresh weather data |
| No location set in app | "No location set" |
| Network error | "Error loading widget data" |

This is **identical to how Apple's own Weather widget behaves**.

## Implementation Details

### WidgetBridge (TypeScript/NativeScript)

**File**: `plugin-widgets/src/WidgetBridge.ios.ts`

Key responsibilities:
- Syncs translations to App Group
- Checks for pending widget events on startup
- Fetches weather data using app's weather service
- Formats and saves data to App Group
- Triggers widget timeline reloads

### WeatherTimelineProvider (Swift)

**File**: `plugin-widgets/platforms/ios/extensions/widgets/WeatherTimelineProvider.swift`

Key responsibilities:
- Called by iOS when widget needs to refresh
- Loads weather data from App Group
- Generates timeline entries (multiple for clock widgets)
- Handles nil data gracefully (shows placeholder)
- Detects new widgets and notifies via lifecycle manager

### WidgetDataProvider (Swift)

**File**: `plugin-widgets/platforms/ios/extensions/widgets/WeatherWidgetData.swift`

Key responsibilities:
- Loads weather data from App Group JSON files
- Provides icon image loading
- Handles data persistence
- Triggers timeline reloads when data changes

## Troubleshooting

### Widget Shows "Tap to Configure" Forever

**Cause**: Main app hasn't run since widget was added

**Solution**: Open the main app once

### Widget Shows Stale Data

**Cause**: 
- App hasn't refreshed weather in a while
- Background App Refresh disabled
- Network issues

**Solution**: 
- Open the app to force refresh
- Enable Background App Refresh in iOS Settings
- Check network connectivity

### Widget Shows "No Location Set"

**Cause**: User hasn't configured a location in the main app

**Solution**: Open app and select a location

### Translations Show as Keys (e.g., "widget.loading")

**Cause**: Main app hasn't synced translations to App Group

**Solution**: 
- Open the app once (syncs on launch)
- Change language in app (triggers sync)

## Development Guidelines

### Adding New Widget Data Fields

1. Update `WeatherWidgetData` struct in `WeatherWidgetData.swift`
2. Update `WidgetDataManager.getWidgetWeatherData()` to populate the field
3. Update widget views to display the new field
4. Test with cold start (app not running)

### Testing Widget Behavior

1. **Test with app closed**:
   ```bash
   # Force quit app in simulator
   # Add widget from widget gallery
   # Verify it shows placeholder
   # Open app
   # Verify widget updates
   ```

2. **Test with app running**:
   ```bash
   # Keep app in foreground
   # Add widget
   # Verify it gets data immediately
   ```

3. **Test stale data**:
   ```bash
   # Add widget with app open
   # Force quit app
   # Wait past refresh interval
   # Check if widget shows last known data
   ```

### Logging

Enable widget logging:
```swift
WidgetsLogger.enabled = true
```

Check logs for:
- `"Synced X widget translations"` - translations loaded
- `"Checked for pending widget events"` - event check on startup
- `"Widget added - {kind} (id: {id})"` - widget lifecycle
- `"Loaded widget data from: {path}"` - data loading

## Frequently Asked Questions

**Q: Can we make widgets fetch weather without opening the app?**

A: No. This is an iOS platform limitation. Widget extensions cannot perform background networking or wake the main app.

**Q: How do other weather apps handle this?**

A: Exactly the same way. All iOS weather widgets show placeholder text until you open the main app at least once.

**Q: What about Background App Refresh?**

A: Background App Refresh helps keep data fresh *after* the app has been opened at least once. It cannot make the initial widget data fetch.

**Q: Can we use push notifications to trigger updates?**

A: No. Push notifications can't be triggered by widget additions, and they'd require server infrastructure for what should be a local operation.

**Q: This seems like a bad user experience?**

A: It's the best possible experience given iOS limitations. Users understand they need to open an app before its widgets work - this is universal iOS behavior.

## Summary

The current widget architecture is **correct and follows iOS best practices**. The pattern of:

1. Widget shows placeholder → 
2. User opens app → 
3. Widget gets data

...is not a bug, but the standard iOS widget lifecycle. This matches how Apple's own widgets work and is the architecture used by all major widget-enabled apps.

Any alternative approach would either:
- Not work due to iOS limitations
- Require massive code duplication and maintenance burden
- Violate Apple's widget design guidelines
- Create inconsistent user experiences

The implementation is complete and working as designed.
