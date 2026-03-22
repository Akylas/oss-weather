// App_Resources/iOS/WidgetExtension/AllWeatherWidgets.swift
// All weather widget implementations for iOS

import WidgetKit
import SwiftUI

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
        .contentMarginsDisabled()
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
        .contentMarginsDisabled()
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithClockName)
        .description(WidgetLocalizedStrings.weatherWithClockDesc)
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
        .contentMarginsDisabled()
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
        .contentMarginsDisabled()
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
        .contentMarginsDisabled()
        .configurationDisplayName(WidgetLocalizedStrings.detailedForecastName)
        .description(WidgetLocalizedStrings.detailedForecastDesc)
        .supportedFamilies([.systemLarge, .systemExtraLarge])
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
