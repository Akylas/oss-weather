// App_Resources/iOS/WidgetExtension/WeatherWidgetData.swift
// Data models for iOS widgets

import Foundation
import WidgetKit
import UIKit

// MARK: - Weather Widget Data
struct WeatherWidgetData: Codable {
    let temperature: String
    let locationName: String
    let iconPath: String?
    let description: String
    let hourlyData: [HourlyData]
    let dailyData: [DailyData]
    let loadingState: LoadingState
    let errorMessage: String?
    
    enum LoadingState: String, Codable {
        case none
        case loading
        case loaded
        case error
    }
    
    // Default values for convenience
    init(
        temperature: String = "",
        locationName: String = "",
        iconPath: String? = nil,
        description: String = "",
        hourlyData: [HourlyData] = [],
        dailyData: [DailyData] = [],
        loadingState: LoadingState = .none,
        errorMessage: String? = nil,
    ) {
        self.temperature = temperature
        self.locationName = locationName
        self.iconPath = iconPath
        self.description = description
        self.loadingState = loadingState
        self.errorMessage = errorMessage
        self.hourlyData = hourlyData
        self.dailyData = dailyData
    }
}

// MARK: - Hourly Data
struct HourlyData: Codable, Identifiable {
    var id: String { time + temperature } // Computed ID
    let time: String
    let temperature: String
    let iconPath: String?
    let description: String
    let precipAccumulation: String
    let precipitation: String
    let windSpeed: String
    
    // Coding keys for JSON serialization
    enum CodingKeys: String, CodingKey {
        case time
        case temperature
        case iconPath
        case description
        case precipAccumulation
        case precipitation
        case windSpeed
    }
    
    // Automatic decoding with defaults
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        time = try container.decode(String.self, forKey: .time)
        temperature = try container.decode(String.self, forKey: .temperature)
        iconPath = try container.decodeIfPresent(String.self, forKey: .iconPath)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        precipAccumulation = try container.decodeIfPresent(String.self, forKey: .precipAccumulation) ?? ""
        precipitation = try container.decodeIfPresent(String.self, forKey: .precipitation) ?? ""
        windSpeed = try container.decodeIfPresent(String.self, forKey: .windSpeed) ?? ""
    }
    
    // Manual initializer for convenience
    init(
        time: String,
        temperature: String,
        iconPath: String? = nil,
        description: String = "",
        precipAccumulation: String = "",
        precipitation: String = "",
        windSpeed: String = ""
    ) {
        self.time = time
        self.temperature = temperature
        self.iconPath = iconPath
        self.description = description
        self.precipAccumulation = precipAccumulation
        self.precipitation = precipitation
        self.windSpeed = windSpeed
    }
}

// MARK: - Daily Data
struct DailyData: Codable, Identifiable {
    var id: String { day } // Computed ID
    let day: String
    let temperatureHigh: String
    let temperatureLow: String
    let iconPath: String?
    let description: String
    let precipitation: String
    let windSpeed: String
    let precipAccumulation: String
    
    enum CodingKeys: String, CodingKey {
        case day
        case temperatureHigh
        case temperatureLow
        case iconPath
        case description
        case precipitation
        case windSpeed
        case precipAccumulation
    }
    
    // Automatic decoding with defaults
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        day = try container.decode(String.self, forKey: .day)
        temperatureHigh = try container.decode(String.self, forKey: .temperatureHigh)
        temperatureLow = try container.decode(String.self, forKey: .temperatureLow)
        iconPath = try container.decodeIfPresent(String.self, forKey: .iconPath)
        description = try container.decodeIfPresent(String.self, forKey: .description) ?? ""
        precipitation = try container.decodeIfPresent(String.self, forKey: .precipitation) ?? ""
        windSpeed = try container.decodeIfPresent(String.self, forKey: .windSpeed) ?? ""
        precipAccumulation = try container.decodeIfPresent(String.self, forKey: .precipAccumulation) ?? ""
    }
    
    // Manual initializer for convenience
    init(
        day: String,
        temperatureHigh: String,
        temperatureLow: String,
        iconPath: String? = nil,
        description: String = "",
        precipitation: String = "",
        windSpeed: String = "",
        precipAccumulation: String = ""
    ) {
        self.day = day
        self.temperatureHigh = temperatureHigh
        self.temperatureLow = temperatureLow
        self.iconPath = iconPath
        self.description = description
        self.precipitation = precipitation
        self.windSpeed = windSpeed
        self.precipAccumulation = precipAccumulation
    }
}

// MARK: - Widget Data Provider
class WidgetDataProvider {
    static let appGroupId = "group.com.akylas.weather"
    
    static func loadWidgetData(widgetId: String) -> WeatherWidgetData? {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            WidgetsLogger.e("WidgetData", "Failed to get App Group container")
            return nil
        }
        
        let dataFile = containerURL
            .appendingPathComponent("WidgetData")
            .appendingPathComponent("widget_\(widgetId).json")
        
        guard let jsonData = try? Data(contentsOf: dataFile) else {
            WidgetsLogger.d("WidgetData", "Failed to load widget data from: \(dataFile.path)")
            return nil
        }
        
        let decoder = JSONDecoder()
        return try? decoder.decode(WeatherWidgetData.self, from: jsonData)
    }
    
    static var isPreview: Bool {
        ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] == "1"
    }
    static func loadImageFromPreview(path: String) -> UIImage? {
        let filePath = "\(Bundle.main.bundlePath)/../../\(path)"
            print("filePath: \(filePath)")
       // Load UIImage
        return UIImage(contentsOfFile: filePath)
    }

    static func getIconImage(path: String) -> UIImage? {
        if path.isEmpty {
            return nil
        }
        
        // Try to load from App Group container
        if FileManager.default.fileExists(atPath: path) {
            return UIImage(contentsOfFile: path)
        }
        if (isPreview) {
            return loadImageFromPreview(path: path)
        }
        return nil
    }

    // MARK: - Save Data
    
    static func saveWidgetData(_ data: WeatherWidgetData, for widgetId: String) {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            WidgetsLogger.e("WidgetData", "Failed to get App Group container")
            return
        }
        
        let widgetDataDir = containerURL.appendingPathComponent("WidgetData")
        
        // Create directory if needed
        if !FileManager.default.fileExists(atPath: widgetDataDir.path) {
            try? FileManager.default.createDirectory(at: widgetDataDir, withIntermediateDirectories: true)
        }
        
        let dataFile = widgetDataDir.appendingPathComponent("widget_\(widgetId).json")
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        
        if let jsonData = try? encoder.encode(data) {
            try? jsonData.write(to: dataFile)
            WidgetsLogger.d("WidgetData", "Saved widget data to: \(dataFile.path)")
            
            // Reload all widgets after data change
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }

    static func setWidgetLoading(widgetId: String) {
        let loadingData = WeatherWidgetData(loadingState: .loading)
        saveWidgetData(loadingData, for: widgetId)
    }
    
    static func setWidgetError(widgetId: String, error: String) {
        let errorData = WeatherWidgetData(loadingState: .error, errorMessage: error)
        saveWidgetData(errorData, for: widgetId)
    }

    static func removeWidgetData(widgetId: String) {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            return
        }
        
        let dataFile = containerURL
            .appendingPathComponent("WidgetData")
            .appendingPathComponent("widget_\(widgetId).json")
        
        try? FileManager.default.removeItem(at: dataFile)
        WidgetsLogger.d("WidgetData", "Removed widget data for: \(widgetId)")
    }
}
