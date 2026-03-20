// App_Resources/iOS/WidgetExtension/AllWeatherWidgets.swift
// All weather widget implementations for iOS

import WidgetKit
import SwiftUI

// MARK: - Widget Background Helper
@available(iOS 17.0, *)
extension View {
    @ViewBuilder
    func widgetBackground(for entry: WeatherEntry, colorScheme: ColorScheme) -> some View {
        let config = entry.config ?? WidgetConfig()
        let isTransparent = (config.settings?["transparent"] as? Bool) ?? false
        
        if isTransparent {
            // Transparent background
            self.containerBackground(Color.clear, for: .widget)
        } else if let backgroundColorStr = config.settings?["background_color"] as? String {
            // Custom background color from config
            self.containerBackground(Color(hex: backgroundColorStr), for: .widget)
        } else {
            // Default background color
            self.containerBackground(WidgetColorProvider.backgroundColor(for: colorScheme), for: .widget)
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
