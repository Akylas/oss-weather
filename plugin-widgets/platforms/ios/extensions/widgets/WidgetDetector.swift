// App_Resources/iOS/WidgetExtension/WidgetDetector.swift
// Detects widget additions and removals using WidgetCenter

import Foundation
import WidgetKit

@available(iOS 16.0, *)
class WidgetDetector {
    /// Singleton instance
    static let shared = WidgetDetector()
    
    private let appGroupId = "group.com.akylas.weather"
    private let widgetInstancesKey = "widget_instances"
    private let widgetIdMappingKey = "widget_id_mapping"
    
    private init() {}
    
    /// Detect widget changes by comparing current state with cached state
    func detect() {
        WidgetCenter.shared.getCurrentConfigurations { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let widgetInfos):
                WidgetsLogger.d("WidgetDetector", "getCurrentConfigurations returned \(widgetInfos.count) widgets")
                self.diff(widgetInfos)
            case .failure(let error):
                WidgetsLogger.e("WidgetDetector", "Failed to get current configurations: \(error)")
            }
        }
    }
    
    /// Get or create stable widget ID for a widget instance
    /// Uses widget kind + family + a hash of its description as a stable identifier
    func getStableWidgetId(for info: WidgetInfo) -> String {
        let baseId = "\(info.kind)_\(info.family.rawValue)"
        
        // Use widget description hash to differentiate multiple widgets of same type
        // This is stable across timeline calls for the same widget instance
        let descriptionHash = info.description.hashValue
        let widgetId = "\(baseId)_\(abs(descriptionHash))"
        
        return widgetId
    }
    
    /// Compare new widget state with cached state and detect changes
    private func diff(_ newWidgetInfos: [WidgetInfo]) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            WidgetsLogger.e("WidgetDetector", "Failed to access App Group UserDefaults")
            return
        }
        
        // Build set of currently active widget instances
        var newInstances: [String: WidgetInstanceInfo] = [:]
        
        for info in newWidgetInfos {
            let widgetId = getStableWidgetId(for: info)
            
            let instanceInfo = WidgetInstanceInfo(
                widgetId: widgetId,
                kind: info.kind,
                family: info.family
            )
            
            newInstances[widgetId] = instanceInfo
        }
        
        // Load cached instances
        let cachedInstances = loadCachedInstances()
        
        // Detect added widgets
        let addedWidgetIds = Set(newInstances.keys).subtracting(Set(cachedInstances.keys))
        for widgetId in addedWidgetIds {
            if let info = newInstances[widgetId] {
                didAddWidget(widgetId: widgetId, kind: info.kind, family: info.family)
            }
        }
        
        // Detect removed widgets
        let removedWidgetIds = Set(cachedInstances.keys).subtracting(Set(newInstances.keys))
        for widgetId in removedWidgetIds {
            if let info = cachedInstances[widgetId] {
                didRemoveWidget(widgetId: widgetId, kind: info.kind, family: info.family)
            }
        }
        
        // Save new state
        saveCachedInstances(newInstances)
        
        if addedWidgetIds.isEmpty && removedWidgetIds.isEmpty {
            WidgetsLogger.d("WidgetDetector", "No widget changes detected")
        }
    }
    
    /// Handle widget added event
    private func didAddWidget(widgetId: String, kind: String, family: WidgetFamily) {
        WidgetsLogger.i("WidgetDetector", "🟢 Widget added: \(kind) [\(family)] (id: \(widgetId))")
        WidgetLifecycleManager.shared.notifyWidgetAdded(widgetId: widgetId, widgetKind: kind)
    }
    
    /// Handle widget removed event
    private func didRemoveWidget(widgetId: String, kind: String, family: WidgetFamily) {
        WidgetsLogger.i("WidgetDetector", "🔴 Widget removed: \(kind) [\(family)] (id: \(widgetId))")
        WidgetLifecycleManager.shared.notifyWidgetRemoved(widgetId: widgetId, widgetKind: kind)
    }
    
    /// Load cached widget instances from UserDefaults
    private func loadCachedInstances() -> [String: WidgetInstanceInfo] {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let data = userDefaults.data(forKey: widgetInstancesKey),
              let instances = try? JSONDecoder().decode([String: WidgetInstanceInfo].self, from: data) else {
            return [:]
        }
        return instances
    }
    
    /// Save widget instances to UserDefaults
    private func saveCachedInstances(_ instances: [String: WidgetInstanceInfo]) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let data = try? JSONEncoder().encode(instances) else {
            return
        }
        userDefaults.set(data, forKey: widgetInstancesKey)
        userDefaults.synchronize()
    }
}

/// Information about a widget instance
@available(iOS 14.0, *)
struct WidgetInstanceInfo: Codable {
    let widgetId: String
    let kind: String
    let family: WidgetFamily
    
    enum CodingKeys: String, CodingKey {
        case widgetId, kind, family
    }
    
    init(widgetId: String, kind: String, family: WidgetFamily) {
        self.widgetId = widgetId
        self.kind = kind
        self.family = family
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        widgetId = try container.decode(String.self, forKey: .widgetId)
        kind = try container.decode(String.self, forKey: .kind)
        let familyRawValue = try container.decode(Int.self, forKey: .family)
        family = WidgetFamily(rawValue: familyRawValue) ?? .systemSmall
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(widgetId, forKey: .widgetId)
        try container.encode(kind, forKey: .kind)
        try container.encode(family.rawValue, forKey: .family)
    }
}
