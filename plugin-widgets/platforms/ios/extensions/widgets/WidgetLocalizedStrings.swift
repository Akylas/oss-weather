import Foundation

/// Localized strings for widgets
struct WidgetLocalizedStrings {
    
    // MARK: - Widget Names
    static let simpleWeatherName = NSLocalizedString("widget.simple.name", comment: "Simple Weather")
    static let simpleWeatherDesc = NSLocalizedString("widget.simple.description", comment: "Current weather at a glance")
    
    static let weatherWithDateName = NSLocalizedString("widget.withdate.name", comment: "Weather with Date")
    static let weatherWithDateDesc = NSLocalizedString("widget.withdate.description", comment: "Weather with date and location")
    
    static let weatherWithClockName = NSLocalizedString("widget.withclock.name", comment: "Weather with Clock")
    static let weatherWithClockDesc = NSLocalizedString("widget.withclock.description", comment: "Real-time clock with weather")
    
    static let hourlyForecastName = NSLocalizedString("widget.hourly.name", comment: "Hourly Forecast")
    static let hourlyForecastDesc = NSLocalizedString("widget.hourly.description", comment: "Next 24 hours forecast")
    
    static let dailyForecastName = NSLocalizedString("widget.daily.name", comment: "7-Day Forecast")
    static let dailyForecastDesc = NSLocalizedString("widget.daily.description", comment: "Weekly weather forecast")
    
    static let detailedForecastName = NSLocalizedString("widget.forecast.name", comment: "Detailed Forecast")
    static let detailedForecastDesc = NSLocalizedString("widget.forecast.description", comment: "Detailed weather forecast")
    
    // MARK: - Common Text
    static let noLocationSet = NSLocalizedString("widget.no_location", comment: "No location set")
    static let tapToConfigure = NSLocalizedString("widget.tap_configure", comment: "Tap to configure")
    static let loading = NSLocalizedString("widget.loading", comment: "Loading...")
    static let error_loading = NSLocalizedString("widget.error_loading", comment: "Error loading data")
    static let hourlyForecast = NSLocalizedString("widget.hourly.title", comment: "Hourly Forecast")
    static let sevenDayForecast = NSLocalizedString("widget.daily.title", comment: "7-Day Forecast")
    
}