// App_Resources/iOS/WidgetExtension/WeatherWidgetData.swift
// Data models for iOS widgets

import Foundation

// Widget loading state
enum WidgetLoadingState: String, Codable {
    case none = "none"
    case loading = "loading"
    case loaded = "loaded"
    case error = "error"
}

struct WeatherWidgetData: Codable {
    let temperature: String
    let iconPath: String
    let description: String
    let locationName: String
    let date: String
    let hourlyData: [HourlyData]
    let dailyData: [DailyData]
    let forecastData: [ForecastData]
    let lastUpdate: Double
    let loadingState: WidgetLoadingState
    let errorMessage: String
}

struct HourlyData: Codable {
    let time: String
    let temperature: String
    let iconPath: String
    let precipitation: String
    let precipAccumulation: String
    let windSpeed: String
}

struct DailyData: Codable {
    let day: String
    let temperatureHigh: String
    let temperatureLow: String
    let iconPath: String
    let precipitation: String
    let precipAccumulation: String
}

struct ForecastData: Codable {
    let dateTime: String
    let temperature: String
    let iconPath: String
    let description: String
    let precipitation: String
    let precipAccumulation: String
}

class WidgetDataProvider {
    static let appGroupId = "group.com.akylas.weather"
    
    static func loadWidgetData(widgetId: String) -> WeatherWidgetData? {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            print("Failed to get App Group container")
            return nil
        }
        
        let dataFile = containerURL
            .appendingPathComponent("WidgetData")
            .appendingPathComponent("widget_\(widgetId).json")
        
        guard let jsonData = try? Data(contentsOf: dataFile) else {
            print("Failed to load widget data from: \(dataFile.path)")
            return nil
        }
        
        let decoder = JSONDecoder()
        return try? decoder.decode(WeatherWidgetData.self, from: jsonData)
    }
    
    static func getIconImage(path: String) -> UIImage? {
        if path.isEmpty {
            return nil
        }
        
        // Try to load from App Group container
        if FileManager.default.fileExists(atPath: path) {
            return UIImage(contentsOfFile: path)
        }
        
        return nil
    }

    // MARK: - Save Data
    
    static func saveWidgetData(_ data: WeatherWidgetData, for widgetId: String) {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            print("Failed to get App Group container")
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
            print("Saved widget data to: \(dataFile.path)")
            
            // Reload all widgets after data change
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    func setWidgetLoading(widgetId: String) {
        let loadingData = WeatherData(loadingState: .loading)
        saveWidgetData(loadingData, for: widgetId)
    }
    
    func setWidgetError(widgetId: String, error: String) {
        let errorData = WeatherData(loadingState: .error, errorMessage: error)
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
        print("Removed widget data for: \(widgetId)")
    }
}