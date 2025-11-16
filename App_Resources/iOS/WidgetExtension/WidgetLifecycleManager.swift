// App_Resources/iOS/WidgetExtension/WidgetLifecycleManager.swift
// Manages widget lifecycle events

import Foundation
import WidgetKit

class WidgetLifecycleManager {
    static let shared = WidgetLifecycleManager()
    private let appGroupId = "group.com.akylas.weather"
    
    private init() {}
    
    // MARK: - Widget Added
    
    func notifyWidgetAdded(widgetId: String, widgetKind: String) {
        print("WidgetLifecycleManager: Widget added - \(widgetKind) (id: \(widgetId))")
        
        // Store widget info
        saveActiveWidget(widgetId: widgetId, widgetKind: widgetKind)
        
        // Notify main app if needed
        notifyMainApp(event: "widgetAdded", widgetId: widgetId, widgetKind: widgetKind)
    }
    
    // MARK: - Widget Removed
    
    func notifyWidgetRemoved(widgetId: String, widgetKind: String) {
        print("WidgetLifecycleManager: Widget removed - \(widgetKind) (id: \(widgetId))")
        
        // Remove widget info
        removeActiveWidget(widgetId: widgetId)
        
        // Clean up widget data
        WidgetDataProvider.removeWidgetData(widgetId: widgetId)
        
        // Notify main app if needed
        notifyMainApp(event: "widgetRemoved", widgetId: widgetId, widgetKind: widgetKind)
    }
    
    // MARK: - Recently Seen Widgets (for iOS < 17)
    
    func markWidgetAsSeen(widgetId: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        
        var recentlySeen = getRecentlySeenWidgets()
        recentlySeen.insert(widgetId)
        
        // Store as array for UserDefaults
        let array = Array(recentlySeen)
        userDefaults.set(array, forKey: "recently_seen_widgets")
        userDefaults.set(Date().timeIntervalSince1970, forKey: "last_widget_check_time")
        userDefaults.synchronize()
    }
    
    private func getRecentlySeenWidgets() -> Set<String> {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return [] }
        
        // Clear recently seen list if it's been more than 5 minutes since last check
        let lastCheckTime = userDefaults.double(forKey: "last_widget_check_time")
        let currentTime = Date().timeIntervalSince1970
        
        if currentTime - lastCheckTime > 300 { // 5 minutes
            // Reset the list on next widget update
            userDefaults.removeObject(forKey: "recently_seen_widgets")
            userDefaults.synchronize()
            return []
        }
        
        if let array = userDefaults.array(forKey: "recently_seen_widgets") as? [String] {
            return Set(array)
        }
        
        return []
    }
    
    func clearRecentlySeenWidgets() {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        userDefaults.removeObject(forKey: "recently_seen_widgets")
        userDefaults.synchronize()
    }
    
    // MARK: - Widget ID Generation
    
    private func generateWidgetId(kind: String, family: WidgetFamily) -> String {
        return "widget_\(family.rawValue)_\(kind)".hashValue.description
    }
    
    // MARK: - Active Widgets Storage
    
    private func saveActiveWidget(widgetId: String, widgetKind: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        
        var activeWidgets = getActiveWidgets()
        activeWidgets[widgetId] = widgetKind
        
        if let data = try? JSONEncoder().encode(activeWidgets) {
            userDefaults.set(data, forKey: "active_widgets")
            userDefaults.synchronize()
        }
    }
    
    private func removeActiveWidget(widgetId: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        
        var activeWidgets = getActiveWidgets()
        activeWidgets.removeValue(forKey: widgetId)
        
        if let data = try? JSONEncoder().encode(activeWidgets) {
            userDefaults.set(data, forKey: "active_widgets")
            userDefaults.synchronize()
        }
    }
    
    func getActiveWidgets() -> [String: String] {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let data = userDefaults.data(forKey: "active_widgets"),
              let widgets = try? JSONDecoder().decode([String: String].self, from: data) else {
            return [:]
        }
        return widgets
    }
    
    // MARK: - Main App Communication
    
    private func notifyMainApp(event: String, widgetId: String, widgetKind: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else { return }
        
        let notification: [String: Any] = [
            "event": event,
            "widgetId": widgetId,
            "widgetKind": widgetKind,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: notification) {
            userDefaults.set(data, forKey: "last_widget_event")
            userDefaults.synchronize()
            
            // Post notification for main app to observe
            CFNotificationCenterPostNotification(
                CFNotificationCenterGetDarwinCenter(),
                CFNotificationName("com.akylas.weather.widgetEvent" as CFString),
                nil,
                nil,
                true
            )
        }
    }
}