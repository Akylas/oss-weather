// App_Resources/iOS/WidgetExtension/AllWeatherWidgets.swift
// All weather widget implementations for iOS

import WidgetKit
import SwiftUI

// MARK: - Preview Fake Data Helper
@available(iOS 14.0, *)
struct FakeWeatherData {
    static func createSimpleWeatherData() -> WeatherWidgetData {
        WeatherWidgetData(
            temperature: "8°",
            locationName: "Grenoble",
            iconPath: "800d",
            description: "Partly Cloudy",
            loadingState: .loaded,
            errorMessage: nil,
            hourlyData: [],
            dailyData: []
        )
    }
    
    static func createHourlyWeatherData() -> WeatherWidgetData {
        WeatherWidgetData(
            temperature: "12°",
            locationName: "Grenoble",
            iconPath: "802d",
            description: "Partly Cloudy",
            loadingState: .loaded,
            errorMessage: nil,
            hourlyData: [
                HourlyData(hour: "07:00", temperature: "7 °C", iconPath: "800d", precipAccumulation: "0 mm"),
                HourlyData(hour: "08:00", temperature: "8 °C", iconPath: "802d", precipAccumulation: "0 mm"),
                HourlyData(hour: "09:00", temperature: "10 °C", iconPath: "500n", precipAccumulation: "0 mm"),
                HourlyData(hour: "10:00", temperature: "12 °C", iconPath: "802d", precipAccumulation: "0 mm"),
                HourlyData(hour: "11:00", temperature: "13 °C", iconPath: "802d", precipAccumulation: "0 mm"),
                HourlyData(hour: "12:00", temperature: "14 °C", iconPath: "500n", precipAccumulation: "0.2 mm"),
                HourlyData(hour: "13:00", temperature: "14 °C", iconPath: "500n", precipAccumulation: "0.5 mm")
            ],
            dailyData: []
        )
    }
    
    static func createDailyWeatherData() -> WeatherWidgetData {
        WeatherWidgetData(
            temperature: "12°",
            locationName: "Grenoble",
            iconPath: "802d",
            description: "Partly Cloudy",
            loadingState: .loaded,
            errorMessage: nil,
            hourlyData: [],
            dailyData: [
                DailyData(day: "Mon", temperatureHigh: "12°", temperatureLow: "4°", iconPath: "800d", precipitation: "5 %", windSpeed: "14 km/h", precipAccumulation: "0 mm"),
                DailyData(day: "Tue", temperatureHigh: "14°", temperatureLow: "6°", iconPath: "802d", precipitation: "10 %", windSpeed: "12 km/h", precipAccumulation: "0 mm"),
                DailyData(day: "Wed", temperatureHigh: "10°", temperatureLow: "5°", iconPath: "500d", precipitation: "60 %", windSpeed: "18 km/h", precipAccumulation: "3 mm"),
                DailyData(day: "Thu", temperatureHigh: "9°", temperatureLow: "3°", iconPath: "503", precipitation: "80 %", windSpeed: "22 km/h", precipAccumulation: "8 mm"),
                DailyData(day: "Fri", temperatureHigh: "11°", temperatureLow: "4°", iconPath: "802d", precipitation: "20 %", windSpeed: "16 km/h", precipAccumulation: "0 mm"),
                DailyData(day: "Sat", temperatureHigh: "15°", temperatureLow: "7°", iconPath: "800d", precipitation: "5 %", windSpeed: "10 km/h", precipAccumulation: "0 mm")
            ]
        )
    }
    
    static func createPreviewEntry(data: WeatherWidgetData, kind: String, family: WidgetFamily = .systemMedium) -> WeatherEntry {
        WeatherEntry(
            date: Date(),
            data: data,
            widgetFamily: family,
            widgetKind: kind,
            config: WidgetConfig()
        )
    }
}

// MARK: - Widget Background Helper
@available(iOS 17.0, *)
extension View {
    @ViewBuilder
    func widgetBackground(for entry: WeatherEntry, colorScheme: ColorScheme) -> some View {
        let config = entry.config ?? WidgetConfig()
        let isTransparent = (config.settings?["transparent"] as? Bool) ?? false
        
        if isTransparent {
            // Transparent background with rounded corners
            self.containerBackground(for: .widget) {
                Color.clear
            }
        } else if let backgroundColorStr = config.settings?["background_color"] as? String {
            // Custom background color from config with rounded corners
            self.containerBackground(for: .widget) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: backgroundColorStr))
            }
        } else {
            // Default background color with rounded corners
            self.containerBackground(for: .widget) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(WidgetColorProvider.background(for: colorScheme))
            }
        }
    }
}

// MARK: - Simple Weather Widget
@available(iOS 17.0, *)
struct SimpleWeatherWidget: Widget {
    let kind: String = "SimpleWeatherWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.simpleWeatherName)
        .description(WidgetLocalizedStrings.simpleWeatherDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Simple Weather Widget with Clock
@available(iOS 17.0, *)
struct SimpleWeatherWithClockWidget: Widget {
    let kind: String = "SimpleWeatherWithClockWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWithClockWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithClockName)
        .description(WidgetLocalizedStrings.weatherWithClockDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Simple Weather Widget with Date
@available(iOS 17.0, *)
struct SimpleWeatherWithDateWidget: Widget {
    let kind: String = "SimpleWeatherWithDateWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWithDateWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithDateName)
        .description(WidgetLocalizedStrings.weatherWithDateDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Hourly Weather Widget
@available(iOS 17.0, *)
struct HourlyWeatherWidget: Widget {
    let kind: String = "HourlyWeatherWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            HourlyWeatherWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.hourlyForecastName)
        .description(WidgetLocalizedStrings.hourlyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Daily Weather Widget
@available(iOS 17.0, *)
struct DailyWeatherWidget: Widget {
    let kind: String = "DailyWeatherWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            DailyWeatherWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.dailyForecastName)
        .description(WidgetLocalizedStrings.dailyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Forecast Weather Widget
@available(iOS 17.0, *)
struct ForecastWeatherWidget: Widget {
    let kind: String = "ForecastWeatherWidget"
    @Environment(\.colorScheme) var colorScheme

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            ForecastWeatherWidgetView(entry: entry)
                .widgetBackground(for: entry, colorScheme: colorScheme)
        }
        .configurationDisplayName(WidgetLocalizedStrings.detailedForecastName)
        .description(WidgetLocalizedStrings.detailedForecastDesc)
        .supportedFamilies([.systemLarge, .systemExtraLarge])
    }
}

// MARK: - Widget Bundle
@main
@available(iOS 17.0, *)
struct AllWeatherWidgets: WidgetBundle {
    var body: some Widget {
        SimpleWeatherWidget()
        SimpleWeatherWithClockWidget()
        SimpleWeatherWithDateWidget()
        HourlyWeatherWidget()
        DailyWeatherWidget()
        ForecastWeatherWidget()
    }
}

// MARK: - Xcode Previews
@available(iOS 17.0, *)
#Preview("Simple Weather - Small", as: .systemSmall) {
    SimpleWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWidget",
        family: .systemSmall
    )
}

@available(iOS 17.0, *)
#Preview("Simple Weather - Medium", as: .systemMedium) {
    SimpleWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWidget",
        family: .systemMedium
    )
}

@available(iOS 17.0, *)
#Preview("Weather with Clock - Small", as: .systemSmall) {
    SimpleWeatherWithClockWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWithClockWidget",
        family: .systemSmall
    )
}

@available(iOS 17.0, *)
#Preview("Weather with Clock - Medium", as: .systemMedium) {
    SimpleWeatherWithClockWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWithClockWidget",
        family: .systemMedium
    )
}

@available(iOS 17.0, *)
#Preview("Weather with Date - Small", as: .systemSmall) {
    SimpleWeatherWithDateWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWithDateWidget",
        family: .systemSmall
    )
}

@available(iOS 17.0, *)
#Preview("Weather with Date - Medium", as: .systemMedium) {
    SimpleWeatherWithDateWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createSimpleWeatherData(),
        kind: "SimpleWeatherWithDateWidget",
        family: .systemMedium
    )
}

@available(iOS 17.0, *)
#Preview("Hourly Weather - Medium", as: .systemMedium) {
    HourlyWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createHourlyWeatherData(),
        kind: "HourlyWeatherWidget",
        family: .systemMedium
    )
}

@available(iOS 17.0, *)
#Preview("Hourly Weather - Large", as: .systemLarge) {
    HourlyWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createHourlyWeatherData(),
        kind: "HourlyWeatherWidget",
        family: .systemLarge
    )
}

@available(iOS 17.0, *)
#Preview("Daily Weather - Medium", as: .systemMedium) {
    DailyWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createDailyWeatherData(),
        kind: "DailyWeatherWidget",
        family: .systemMedium
    )
}

@available(iOS 17.0, *)
#Preview("Daily Weather - Large", as: .systemLarge) {
    DailyWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createDailyWeatherData(),
        kind: "DailyWeatherWidget",
        family: .systemLarge
    )
}

@available(iOS 17.0, *)
#Preview("Forecast Weather - Large", as: .systemLarge) {
    ForecastWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createDailyWeatherData(),
        kind: "ForecastWeatherWidget",
        family: .systemLarge
    )
}

@available(iOS 17.0, *)
#Preview("Forecast Weather - Extra Large", as: .systemExtraLarge) {
    ForecastWeatherWidget()
} timeline: {
    FakeWeatherData.createPreviewEntry(
        data: FakeWeatherData.createDailyWeatherData(),
        kind: "ForecastWeatherWidget",
        family: .systemExtraLarge
    )
}
