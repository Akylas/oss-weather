import Foundation

/// Localized strings for widgets
/// Loads translations from the app's shared i18n data
struct WidgetLocalizedStrings {
    
    // Cached translations dictionary
    private static var translations: [String: String] = {
        loadTranslations()
    }()
    
    /// Load translations from App Group shared container
    private static func loadTranslations() -> [String: String] {
        guard let userDefaults = UserDefaults(suiteName: WidgetUtils.suiteName) else {
            WidgetsLogger.w("WidgetLocalizedStrings", "Failed to access App Group UserDefaults")
            return [:]
        }
        
        // Try to load translations data from shared container
        if let data = userDefaults.data(forKey: "widget_translations"),
           let translationsDict = try? JSONDecoder().decode([String: String].self, from: data) {
            WidgetsLogger.d("WidgetLocalizedStrings", "Loaded \(translationsDict.count) translations from App Group")
            return translationsDict
        }
        
        WidgetsLogger.w("WidgetLocalizedStrings", "No translations found in App Group, using fallback values")
        return [:]
    }
    
    /// Get localized string for key, with fallback to default value
    private static func localized(_ key: String, fallback: String) -> String {
        return translations[key] ?? fallback
    }
    
    /// Force reload translations from shared container
    static func reloadTranslations() {
        translations = loadTranslations()
    }
    
    // MARK: - Widget Names
    static var simpleWeatherName: String {
        localized("widget.simple.name", fallback: "Simple Weather")
    }
    static var simpleWeatherDesc: String {
        localized("widget.simple.description", fallback: "Current weather at a glance")
    }
    
    static var weatherWithDateName: String {
        localized("widget.withdate.name", fallback: "Weather with Date")
    }
    static var weatherWithDateDesc: String {
        localized("widget.withdate.description", fallback: "Weather with date and location")
    }
    
    static var weatherWithClockName: String {
        localized("widget.withclock.name", fallback: "Weather with Clock")
    }
    static var weatherWithClockDesc: String {
        localized("widget.withclock.description", fallback: "Real-time clock with weather")
    }
    
    static var hourlyForecastName: String {
        localized("widget.hourly.name", fallback: "Hourly Forecast")
    }
    static var hourlyForecastDesc: String {
        localized("widget.hourly.description", fallback: "Next 24 hours forecast")
    }
    
    static var dailyForecastName: String {
        localized("widget.daily.name", fallback: "7-Day Forecast")
    }
    static var dailyForecastDesc: String {
        localized("widget.daily.description", fallback: "Weekly weather forecast")
    }
    
    static var detailedForecastName: String {
        localized("widget.forecast.name", fallback: "Detailed Forecast")
    }
    static var detailedForecastDesc: String {
        localized("widget.forecast.description", fallback: "Detailed weather forecast")
    }
    
    // MARK: - Common Text
    static var daily: String {
        localized("daily", fallback: "Daily")
    }
    static var hourly: String {
        localized("hourly", fallback: "Hourly")
    }
    static var noLocationSet: String {
        localized("widget.no_location", fallback: "No location set")
    }
    static var tapToConfigure: String {
        localized("widget.tap_configure", fallback: "Tap to configure")
    }
    static var loading: String {
        localized("widget.loading", fallback: "Loading...")
    }
    static var error_loading: String {
        localized("widget.error_loading", fallback: "Error loading data")
    }
    static var hourlyForecast: String {
        localized("widget.hourly.title", fallback: "Hourly Forecast")
    }
    static var sevenDayForecast: String {
        localized("widget.daily.title", fallback: "7-Day Forecast")
    }
    
}
