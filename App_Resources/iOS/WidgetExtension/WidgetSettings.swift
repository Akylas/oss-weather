// App_Resources/iOS/WidgetExtension/WidgetSettings.swift
// Shared settings for widgets

import Foundation

class WidgetSettings {
    static let shared = WidgetSettings()
    private let appGroupId = WidgetDataProvider.appGroupId
    
    private init() {}
    
    // MARK: - Update Frequency
    
    func getUpdateFrequency() -> Int {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            return 30 // Default: 30 minutes
        }
        let frequency = userDefaults.integer(forKey: "widget_update_frequency")
        return frequency > 0 ? frequency : 30
    }
    
    func setUpdateFrequency(_ minutes: Int) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            return
        }
        userDefaults.set(minutes, forKey: "widget_update_frequency")
        userDefaults.synchronize()
        
        print("Widget update frequency set to \(minutes) minutes")
        
        // Reload all widgets to pick up new frequency
        WidgetCenter.shared.reloadAllTimelines()
    }
}