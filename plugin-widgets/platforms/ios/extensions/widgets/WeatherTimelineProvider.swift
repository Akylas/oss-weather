// App_Resources/iOS/WidgetExtension/WeatherTimelineProvider.swift
// Timeline provider for all weather widgets

import WidgetKit
import SwiftUI

@available(iOS 14.0, *)
struct WeatherEntry: TimelineEntry {
    let date: Date
    let data: WeatherWidgetData?
    let widgetFamily: WidgetFamily
    let widgetKind: String
    let config: WidgetConfig?
}

@available(iOS 14.0, *)
struct WeatherTimelineProvider: TimelineProvider {
    let widgetKind: String
    
    func placeholder(in context: Context) -> WeatherEntry {
        WeatherEntry(
            date: Date(),
            data: nil,
            widgetFamily: context.family,
            widgetKind: widgetKind,
            config: nil
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) {
        let widgetId = getWidgetId(from: context)
        let data = WidgetDataProvider.loadWidgetData(widgetId: widgetId)
        var config = WidgetSettings.shared.loadWidgetConfig(widgetId: widgetId)
        if (config == nil) {
            config = WidgetSettings.shared.createInstanceConfig(widgetId: widgetId, widgetKind: widgetKind)
        }
        
        let entry = WeatherEntry(
            date: Date(),
            data: data,
            widgetFamily: context.family,
            widgetKind: widgetKind,
            config: config
        )
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
        let widgetId = getWidgetId(from: context)
        
        // Detect widget changes (added/removed) using WidgetCenter
        if #available(iOS 16.0, *) {
            WidgetDetector.shared.detect()
        }
        
        // Check if this is first time seeing this widget
        let activeWidgets = WidgetLifecycleManager.shared.getActiveWidgets()
        var config = WidgetSettings.shared.loadWidgetConfig(widgetId: widgetId)
        if (config == nil) {
            config = WidgetSettings.shared.createInstanceConfig(widgetId: widgetId, widgetKind: widgetKind)
        }
        if activeWidgets[widgetId] == nil {
            // New widget detected - notify main app
            // NOTE: If main app is not running, the notification will be persisted
            // and processed when the user next opens the app. This is an iOS platform
            // limitation - widget extensions cannot wake the main app.
            WidgetLifecycleManager.shared.notifyWidgetAdded(widgetId: widgetId, widgetKind: widgetKind)
        }
        
        let currentDate = Date()
        // Load weather data from shared App Group container
        let weatherData = WidgetDataProvider.loadWidgetData(widgetId: widgetId)
        
        var entries: [WeatherEntry] = []
        
        // Weather widgets: Use configured frequency
        let updateFrequency = WidgetSettings.shared.getUpdateFrequency()
        let numberOfEntries = min(12, 360 / updateFrequency)
        
        for offset in 0..<numberOfEntries {
            let entryDate = Calendar.current.date(byAdding: .minute, value: offset * updateFrequency, to: currentDate)!
            entries.append(WeatherEntry(
                date: entryDate,
                data: weatherData,
                widgetFamily: context.family,
                widgetKind: widgetKind,
                config: config
            ))
        }
        
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    
    private func getWidgetId(from context: Context) -> String {
        // Generate a stable widget ID based on kind and family and context
        // The goal is to create an ID that:
        // 1. Is unique per widget instance on the home screen
        // 2. Remains stable across timeline calls for the same widget
        // 3. Can be matched with WidgetDetector's stable IDs
        
        let baseId = "\(widgetKind)_\(context.family.rawValue)"
        
        // Use context description hash to differentiate multiple widgets of same type
        // This should be stable for the same widget instance
        let descriptionHash = context.description.hashValue
        let widgetId = "\(baseId)_\(abs(descriptionHash))"
        
        WidgetsLogger.d("TimelineProvider", "Generated stable widgetId: \(widgetId)")
        return widgetId
    }
}
