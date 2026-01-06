// App_Resources/iOS/WidgetExtension/WidgetSettings.swift
// Shared settings for widgets

import Foundation
import WidgetKit

/// Widget configuration settings manager
class WidgetSettings {
    static let shared = WidgetSettings()
    private let userDefaults: UserDefaults
    
    // Keys for storing configurations
    private let widgetConfigsKey = "widget_configs" // per-instance configs
    private let widgetKindConfigsKey = "widget_kind_configs" // per-kind default configs
    private let activeWidgetsKey = "active_widget_ids"
    private let updateFrequencyKey = "widget_update_frequency"
    private let widgetDataCacheKey = "widget_data_cache"
    
    // Widget kind constants matching TypeScript
    static let widgetKinds = [
        "SimpleWeatherWidget",
        "SimpleWeatherWithDateWidget",
        "SimpleWeatherWithClockWidget",
        "HourlyWeatherWidget",
        "DailyWeatherWidget",
        "ForecastWeatherWidget"
    ]
    
    private init() {
        guard let suiteName = WidgetUtils.suiteName else {
            fatalError("Widget suite name not configured")
        }
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            fatalError("Failed to create UserDefaults for suite: \(suiteName)")
        }
        self.userDefaults = defaults
    }
    
    // MARK: - Per-Kind Default Configurations
    
    /// Get all per-kind default configurations
    func getAllKindConfigs() -> [String: WidgetConfig] {
        guard let data = userDefaults.data(forKey: widgetKindConfigsKey),
              let configs = try? JSONDecoder().decode([String: WidgetConfig].self, from: data) else {
            print("[WidgetSettings] No stored kind configs found")
            return [:]
        }
        print("[WidgetSettings] Loaded \(configs.count) widget kind configurations")
        return configs
    }
    
    /// Save all per-kind default configurations
    func saveAllKindConfigs(_ configs: [String: WidgetConfig]) {
        guard let data = try? JSONEncoder().encode(configs) else {
            print("[WidgetSettings] Failed to encode kind configs")
            return
        }
        userDefaults.set(data, forKey: widgetKindConfigsKey)
        print("[WidgetSettings] Saved \(configs.count) widget kind configurations")
    }
    
    /// Get configuration for a specific widget kind (default settings)
    /// Now uses generated WidgetKindConfigs for default settings
    func getKindConfig(widgetKind: String) -> WidgetConfig {
        var configs = getAllKindConfigs()
        
        if let config = configs[widgetKind] {
            return config
        }
        
        // No config exists, create default from generated configs
        print("[WidgetSettings] No kind config for \(widgetKind), creating from generated defaults")
        let defaultConfig = WidgetKindConfigs.createDefaultKindConfig(widgetKind: widgetKind)
        configs[widgetKind] = defaultConfig
        saveAllKindConfigs(configs)
        return defaultConfig
    }
    
    /// Save configuration for a specific widget kind
    func saveKindConfig(widgetKind: String, config: WidgetConfig) {
        print("[WidgetSettings] saveKindConfig(widgetKind=\(widgetKind))")
        var configs = getAllKindConfigs()
        configs[widgetKind] = config
        saveAllKindConfigs(configs)
    }
    
    // MARK: - Per-Instance Configurations
    
    /// Get all per-instance widget configurations
    func getAllWidgetConfigs() -> [String: WidgetConfig] {
        guard let data = userDefaults.data(forKey: widgetConfigsKey),
              let configs = try? JSONDecoder().decode([String: WidgetConfig].self, from: data) else {
            print("[WidgetSettings] No stored widget configs found")
            return [:]
        }
        print("[WidgetSettings] Loaded \(configs.count) widget configurations")
        return configs
    }
    
    /// Save all per-instance widget configurations
    func saveAllWidgetConfigs(_ configs: [String: WidgetConfig]) {
        guard let data = try? JSONEncoder().encode(configs) else {
            print("[WidgetSettings] Failed to encode widget configs")
            return
        }
        userDefaults.set(data, forKey: widgetConfigsKey)
        print("[WidgetSettings] Saved \(configs.count) widget configurations")
    }
    
    /// Create widget instance configuration from kind defaults
    func createInstanceConfig(widgetId: String, widgetKind: String) -> WidgetConfig {
        print("[WidgetSettings] createInstanceConfig(widgetId=\(widgetId), widgetKind=\(widgetKind))")
        
        // Get kind defaults
        let kindConfig = getKindConfig(widgetKind: widgetKind)
        
        // Create instance config with widgetKind set
        var instanceConfig = kindConfig
        instanceConfig.widgetKind = widgetKind
        
        // Save instance config
        saveWidgetConfig(widgetId: widgetId, config: instanceConfig)
        
        print("[WidgetSettings] Created instance config for widget \(widgetId) from kind \(widgetKind)")
        return instanceConfig
    }
    
    /// Load widget configuration for specific widget instance
    func loadWidgetConfig(widgetId: String) -> WidgetConfig? {
        let configs = getAllWidgetConfigs()
        
        if let config = configs[widgetId] {
            print("[WidgetSettings] loadWidgetConfig(widgetId=\(widgetId)) -> found instance config")
            return config
        }
        
        // No instance config - try to determine widget kind and create from defaults
        if let widgetKind = getWidgetKindForId(widgetId: widgetId) {
            print("[WidgetSettings] loadWidgetConfig(widgetId=\(widgetId)) -> creating from kind \(widgetKind)")
            return createInstanceConfig(widgetId: widgetId, widgetKind: widgetKind)
        }
        
        print("[WidgetSettings] loadWidgetConfig(widgetId=\(widgetId)) -> no config found, returning default")
        return createDefaultConfig()
    }
    
    /// Save widget configuration for specific widget instance
    func saveWidgetConfig(widgetId: String, config: WidgetConfig) {
        print("[WidgetSettings] saveWidgetConfig(widgetId=\(widgetId))")
        var configs = getAllWidgetConfigs()
        configs[widgetId] = config
        saveAllWidgetConfigs(configs)
    }
    
    /// Delete widget configuration and data for specific instance
    func deleteWidgetConfig(widgetId: String) {
        print("[WidgetSettings] deleteWidgetConfig(widgetId=\(widgetId))")
        
        // Delete instance config
        var configs = getAllWidgetConfigs()
        configs.removeValue(forKey: widgetId)
        saveAllWidgetConfigs(configs)
        
        // Delete cached data
        var dataCache = getWidgetDataCache()
        dataCache.removeValue(forKey: widgetId)
        saveWidgetDataCache(dataCache)
        
        print("[WidgetSettings] Deleted config and cache for widgetId=\(widgetId)")
    }
    
    /// Get all widget IDs for a specific kind
    func getInstancesOfKind(widgetKind: String) -> [String] {
        let configs = getAllWidgetConfigs()
        let instances = configs.filter { $0.value.widgetKind == widgetKind }.map { $0.key }
        print("[WidgetSettings] getInstancesOfKind(\(widgetKind)) -> \(instances.count) instances")
        return instances
    }
    
    // MARK: - Widget Data Cache
    
    /// Get widget data cache
    func getWidgetDataCache() -> [String: WeatherWidgetData] {
        guard let data = userDefaults.data(forKey: widgetDataCacheKey),
              let cache = try? JSONDecoder().decode([String: WeatherWidgetData].self, from: data) else {
            print("[WidgetSettings] No widget data cache found")
            return [:]
        }
        return cache
    }
    
    /// Save widget data cache
    func saveWidgetDataCache(_ cache: [String: WeatherWidgetData]) {
        guard let data = try? JSONEncoder().encode(cache) else {
            print("[WidgetSettings] Failed to encode widget data cache")
            return
        }
        userDefaults.set(data, forKey: widgetDataCacheKey)
        print("[WidgetSettings] Saved widget data cache with \(cache.count) entries")
    }
    
    /// Get cached data for specific widget
    func getWidgetData(widgetId: String) -> WeatherWidgetData? {
        let cache = getWidgetDataCache()
        return cache[widgetId]
    }
    
    /// Update cached data for specific widget
    func updateWidgetData(widgetId: String, data: WeatherWidgetData) {
        var cache = getWidgetDataCache()
        cache[widgetId] = data
        saveWidgetDataCache(cache)
        print("[WidgetSettings] Updated widget data for \(widgetId)")
    }
    
    /// Clear cached data for specific widget
    func clearWidgetData(widgetId: String) {
        var cache = getWidgetDataCache()
        cache.removeValue(forKey: widgetId)
        saveWidgetDataCache(cache)
        print("[WidgetSettings] Cleared widget data for \(widgetId)")
    }
    
    // MARK: - Active Widgets
    
    /// Get list of active widget IDs
    func getActiveWidgetIds() -> Set<String> {
        guard let array = userDefaults.array(forKey: activeWidgetsKey) as? [String] else {
            return Set()
        }
        return Set(array)
    }
    
    /// Save list of active widget IDs
    func saveActiveWidgetIds(_ ids: Set<String>) {
        userDefaults.set(Array(ids), forKey: activeWidgetsKey)
        print("[WidgetSettings] Saved \(ids.count) active widget IDs")
    }
    
    /// Add widget to active list
    func addActiveWidget(widgetId: String) {
        var ids = getActiveWidgetIds()
        if ids.insert(widgetId).inserted {
            saveActiveWidgetIds(ids)
            print("[WidgetSettings] Added widget \(widgetId) to active list (total=\(ids.count))")
        }
    }
    
    /// Remove widget from active list
    func removeActiveWidget(widgetId: String) {
        var ids = getActiveWidgetIds()
        if ids.remove(widgetId) != nil {
            saveActiveWidgetIds(ids)
            print("[WidgetSettings] Removed widget \(widgetId) from active list (remaining=\(ids.count))")
        }
    }
    
    // MARK: - Update Frequency
    
    /// Get update frequency in minutes
    func getUpdateFrequency() -> Int {
        let frequency = userDefaults.integer(forKey: updateFrequencyKey)
        return frequency > 0 ? frequency : 30 // default 30 minutes
    }
    
    /// Set update frequency in minutes
    func setUpdateFrequency(_ minutes: Int) {
        userDefaults.set(minutes, forKey: updateFrequencyKey)
        print("[WidgetSettings] Set update frequency to \(minutes) minutes")
    }
    
    // MARK: - Helpers
    
    /// Create default configuration
    /// NOTE: This is deprecated in favor of WidgetKindConfigs.createDefaultKindConfig
    /// which includes settings from generated configs
    private func createDefaultConfig() -> WidgetConfig {
        return WidgetConfig(
            locationName: "current",
            latitude: 0.0,
            longitude: 0.0
        )
    }
    
    /// Determine widget kind from widget ID
    /// In iOS, widget IDs from WidgetCenter don't directly tell us the kind,
    /// so we rely on the stored config. If none exists, we return nil.
    private func getWidgetKindForId(widgetId: String) -> String? {
        // Check if we have any config that might have the kind
        let configs = getAllWidgetConfigs()
        return configs[widgetId]?.widgetKind
    }
    
    /// Reload all widgets (useful after configuration changes)
    func reloadAllWidgets() {
        WidgetCenter.shared.reloadAllTimelines()
        print("[WidgetSettings] Reloaded all widget timelines")
    }
}

// MARK: - Widget Configuration Model

struct WidgetConfig: Codable {
    var locationName: String = "current"
    var latitude: Double = 0.0
    var longitude: Double = 0.0
    var model: String?
    var provider: String?
    var widgetKind: String?
    var iconSet: String?
    var settings: [String: Any]?
    
    enum CodingKeys: String, CodingKey {
        case locationName, latitude, longitude, model, provider, widgetKind, iconSet, settings
    }
    
    init(locationName: String = "current", latitude: Double = 0.0, longitude: Double = 0.0, model: String? = nil, provider: String? = nil, widgetKind: String? = nil, iconSet: String? = nil, settings: [String: Any]? = nil) {
        self.locationName = locationName
        self.latitude = latitude
        self.longitude = longitude
        self.model = model
        self.provider = provider
        self.widgetKind = widgetKind
        self.iconSet = iconSet
        self.settings = settings
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        locationName = try container.decodeIfPresent(String.self, forKey: .locationName) ?? "current"
        latitude = try container.decodeIfPresent(Double.self, forKey: .latitude) ?? 0.0
        longitude = try container.decodeIfPresent(Double.self, forKey: .longitude) ?? 0.0
        model = try container.decodeIfPresent(String.self, forKey: .model)
        provider = try container.decodeIfPresent(String.self, forKey: .provider)
        widgetKind = try container.decodeIfPresent(String.self, forKey: .widgetKind)
        iconSet = try container.decodeIfPresent(String.self, forKey: .iconSet)
        
        // Decode settings as [String: Any]
        if let settingsData = try? container.decodeIfPresent(Data.self, forKey: .settings) {
            settings = try? JSONSerialization.jsonObject(with: settingsData) as? [String: Any]
        } else if let settingsDict = try? container.decodeIfPresent([String: AnyCodable].self, forKey: .settings) {
            settings = settingsDict?.mapValues { $0.value }
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(locationName, forKey: .locationName)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
        try container.encodeIfPresent(model, forKey: .model)
        try container.encodeIfPresent(provider, forKey: .provider)
        try container.encodeIfPresent(widgetKind, forKey: .widgetKind)
        try container.encodeIfPresent(iconSet, forKey: .iconSet)
        
        // Encode settings
        if let settings = settings {
            let settingsData = try JSONSerialization.data(withJSONObject: settings)
            try container.encode(settingsData, forKey: .settings)
        }
    }
}

// Helper for encoding/decoding Any values
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        default:
            try container.encodeNil()
        }
    }
}
