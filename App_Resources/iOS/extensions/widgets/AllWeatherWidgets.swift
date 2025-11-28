// App_Resources/iOS/WidgetExtension/AllWeatherWidgets.swift
// All weather widget implementations for iOS

import WidgetKit
import SwiftUI

// MARK: - Simple Weather Widget
@available(iOS 17.0, *)
struct SimpleWeatherWidget: Widget {
    let kind: String = "SimpleWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.simpleWeatherName)
        .description(WidgetLocalizedStrings.simpleWeatherDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 14.0, *)
struct SimpleWeatherWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let width = geometry.size.width
                let height = geometry.size.height
                let isVerySmall = width < 120
                
                // Adjust padding based on size
                let padding: CGFloat = width < 100 ? 4 : (width < 150 ? 6 : 8)
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: padding) {
                        if isVerySmall {
                            // Very small layout: large icon with small temp
                            VStack(spacing: 4) {
                                Spacer()
                                
                                // Large icon - 50% of width
                                WeatherIconView(data.iconPath, description: data.description, 
                                            size: max(32, width * 0.5))
                                
                                // Small temperature
                                TemperatureText(data.temperature, fontSize: 14)
                                
                                // Location at bottom, scaled with size
                                LocationHeader(data.locationName, 
                                            fontSize: max(8, min(12, width / 15)),
                                            maxLines: 1)
                            }
                        } else if width < 200 {
                            // Small widget: vertical layout
                            VStack(spacing: 4) {
                                LocationHeader(data.locationName, fontSize: 12)
                                
                                Spacer()
                                
                                // Bigger icon - 40% of width
                                WeatherIconView(data.iconPath, description: data.description,
                                            size: max(48, width * 0.4))
                                
                                Spacer()
                                
                                TemperatureText(data.temperature, fontSize: 32)
                            }
                        } else {
                            // Medium widget: more spacious layout
                            VStack(spacing: 8) {
                                LocationHeader(data.locationName, fontSize: 16)
                                
                                Spacer()
                                
                                // Bigger icon
                                WeatherIconView(data.iconPath, description: data.description, size: 72)
                                
                                Spacer()
                                
                                TemperatureText(data.temperature, fontSize: 48)
                                
                                if !data.description.isEmpty {
                                    DescriptionText(data.description, fontSize: 14)
                                }
                            }
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)
                }
            }
        }
    }
}

// MARK: - Simple Weather Widget with Clock
@available(iOS 17.0, *)
struct SimpleWeatherWithClockWidget: Widget {
    let kind: String = "SimpleWeatherWithClockWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWithClockWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithClockName)
        .description(WidgetLocalizedStrings.weatherWithClockDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 14.0, *)
struct SimpleWeatherWithClockWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let width = geometry.size.width
                let height = geometry.size.height
                let isSmall = width < 150
                
                // Read clock bold setting
                let clockBold = WidgetSettings.shared.clockBold()
                
                // Adjust padding based on size
                let padding: CGFloat = width < 100 ? 4 : (width < 150 ? 6 : 8)
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: padding) {
                        ZStack {
                            VStack(spacing: isSmall ? 4 : 8) {
                                // Clock at top
                                let clockFontSize: CGFloat = width < 100 ? 24 : (width < 150 ? 32 : 48)
                                Text(entry.date, style: .time)
                                    .font(.system(size: clockFontSize, weight: clockBold ? .bold : .regular))
                                    .foregroundColor(WidgetColorProvider.onSurface)
                                
                                // Weather info
                                HStack(spacing: isSmall ? 4 : 8) {
                                    // Bigger icon
                                    let iconSize: CGFloat = width < 100 ? 32 : (width < 150 ? 40 : 56)
                                    WeatherIconView(data.iconPath, description: data.description, size: iconSize)
                                    
                                    let tempFontSize: CGFloat = width < 100 ? 18 : (width < 150 ? 24 : 32)
                                    TemperatureText(data.temperature, fontSize: tempFontSize)
                                }
                                
                                Spacer()
                            }
                            
                            // Location at bottom right, scaled with size
                            VStack {
                                Spacer()
                                HStack {
                                    Spacer()
                                    let locationFontSize: CGFloat = width < 100 ? 8 : (width < 150 ? 10 : 12)
                                    LocationHeader(data.locationName, fontSize: locationFontSize, maxLines: 1)
                                        .padding(.bottom, 2)
                                        .padding(.trailing, 2)
                                }
                            }
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)
                }
            }
        }
    }
}

// MARK: - Simple Weather Widget with Date
@available(iOS 17.0, *)
struct SimpleWeatherWithDateWidget: Widget {
    let kind: String = "SimpleWeatherWithDateWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            SimpleWeatherWithDateWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithDateName)
        .description(WidgetLocalizedStrings.weatherWithDateDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 14.0, *)
struct SimpleWeatherWithDateWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let width = geometry.size.width
                let height = geometry.size.height
                
                // Support down to 50dp (approximately 50 points) height
                let padding: CGFloat = height < 60 ? 2 : (height < 80 ? 4 : 6)
                let isVerySmall = height < 60
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: padding) {
                        VStack(spacing: 0) {
                            // Date
                            let dateFontSize: CGFloat = isVerySmall ? 10 : (height < 80 ? 12 : 14)
                            Text(entry.date, style: .date)
                                .font(.system(size: dateFontSize))
                                .foregroundColor(WidgetColorProvider.onSurface.opacity(0.7))
                                .lineLimit(1)
                            
                            Spacer()
                            
                            // Weather info
                            HStack(spacing: isVerySmall ? 4 : 8) {
                                // Bigger icon
                                let iconSize: CGFloat = isVerySmall ? 24 : (height < 80 ? 32 : 40)
                                WeatherIconView(data.iconPath, description: data.description, size: iconSize)
                                
                                let tempFontSize: CGFloat = isVerySmall ? 16 : (height < 80 ? 20 : 24)
                                TemperatureText(data.temperature, fontSize: tempFontSize)
                            }
                            
                            Spacer()
                            
                            // Location
                            let locationFontSize: CGFloat = isVerySmall ? 9 : (height < 80 ? 11 : 12)
                            LocationHeader(data.locationName, fontSize: locationFontSize, maxLines: 1)
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)
                }
            }
        }
    }
}

// MARK: - Hourly Weather Widget
@available(iOS 17.0, *)
struct HourlyWeatherWidget: Widget {
    let kind: String = "HourlyWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            HourlyWeatherWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.hourlyForecastName)
        .description(WidgetLocalizedStrings.hourlyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

@available(iOS 14.0, *)
struct HourlyWeatherWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let height = geometry.size.height
                
                // Support smaller heights
                let padding: CGFloat = height < 60 ? 2 : (height < 80 ? 4 : 6)
                let isVerySmall = height < 60
                let isSmall = height < 80
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: padding) {
                        VStack(alignment: .leading, spacing: 0) {
                            if !isSmall {
                                LocationHeader(data.locationName, fontSize: 14)
                                Spacer().frame(height: 4)
                            }
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(data.hourlyData) { hour in
                                        HourlyItem(hour: hour, height: height, isVerySmall: isVerySmall, isSmall: isSmall)
                                    }
                                }
                            }
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)
                }
            }
        }
    }
}

@available(iOS 14.0, *)
struct HourlyItem: View {
    let hour: HourlyData
    let height: CGFloat
    let isVerySmall: Bool
    let isSmall: Bool
    
    var body: some View {
        VStack(spacing: isVerySmall ? 0 : 2) {
            // Time
            let timeFontSize: CGFloat = isVerySmall ? 9 : 11
            Text(hour.hour)
                .font(.system(size: timeFontSize))
                .foregroundColor(WidgetColorProvider.onSurfaceVariant)
                .lineLimit(1)
            
            // Icon - bigger
            let iconSize: CGFloat = isVerySmall ? 24 : (isSmall ? 28 : 32)
            WeatherIconView(hour.iconPath, description: hour.description, size: iconSize)
            
            // Temperature
            let tempFontSize: CGFloat = isVerySmall ? 12 : 14
            Text(hour.temperature)
                .font(.system(size: tempFontSize, weight: .bold))
                .foregroundColor(WidgetColorProvider.onSurface)
                .lineLimit(1)
            
            // Precipitation accumulation
            if !isVerySmall {
                PrecipitationText(hour.precipAccumulation, fontSize: isSmall ? 9 : 10)
            }
        }
        .frame(width: 56)
    }
}

// MARK: - Daily Weather Widget
@available(iOS 17.0, *)
struct DailyWeatherWidget: Widget {
    let kind: String = "DailyWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            DailyWeatherWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.dailyForecastName)
        .description(WidgetLocalizedStrings.dailyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

@available(iOS 14.0, *)
struct DailyWeatherWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let height = geometry.size.height
                let isLarge = height > 150
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: 8) {
                        VStack(alignment: .leading, spacing: 8) {
                            LocationHeader(data.locationName, fontSize: 14)
                            
                            VStack(spacing: 0) {
                                let maxItems = isLarge ? 5 : 3
                                ForEach(Array(data.dailyData.prefix(maxItems).enumerated()), id: \.element.id) { index, day in
                                    // Add gap between days using a divider with spacing
                                    if index > 0 {
                                        Spacer().frame(height: 4)
                                    }
                                    DailyItem(day: day, showExtraData: isLarge)
                                }
                            }
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)
                }
            }
        }
    }
}

@available(iOS 14.0, *)
struct DailyItem: View {
    let day: DailyData
    let showExtraData: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            // Day name
            Text(day.day)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(WidgetColorProvider.onSurface)
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineLimit(1)
            
            // Weather icon - bigger
            WeatherIconView(day.iconPath, description: day.description, size: 28)
            
            // Temperature range with precipAccumulation
            HStack(spacing: 6) {
                PrecipitationText(day.precipAccumulation, fontSize: 10)
                
                HStack(spacing: 4) {
                    Text(day.temperatureHigh)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(WidgetColorProvider.onSurface)
                    
                    Text(day.temperatureLow)
                        .font(.system(size: 13))
                        .foregroundColor(WidgetColorProvider.onSurfaceVariant)
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Forecast Weather Widget
@available(iOS 17.0, *)
struct ForecastWeatherWidget: Widget {
    let kind: String = "ForecastWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeatherTimelineProvider(widgetKind: kind)) { entry in
            ForecastWeatherWidgetView(entry: entry)
                .containerBackground(WidgetColorProvider.background, for: .widget)
        }
        .configurationDisplayName(WidgetLocalizedStrings.detailedForecastName)
        .description(WidgetLocalizedStrings.detailedForecastDesc)
        .supportedFamilies([.systemLarge, .systemExtraLarge])
    }
}

@available(iOS 14.0, *)
struct ForecastWeatherWidgetView: View {
    let entry: WeatherEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        ZStack {
            // Adaptive background
            WidgetBackgroundView()
            
            // Widget content
            GeometryReader { geometry in
                let height = geometry.size.height
                let isLarge = height > 240
                
                if let data = entry.data, entry.data?.loadingState != WeatherWidgetData.LoadingState.loaded  {
                    WidgetContainer(padding: 8) {
                        VStack(alignment: .leading, spacing: 8) {
                            // Current weather
                            HStack(spacing: 8) {
                                WeatherIconView(data.iconPath, description: data.description, size: 40)
                                
                                VStack(alignment: .leading) {
                                    TemperatureText(data.temperature, fontSize: 24)
                                    LocationHeader(data.locationName, fontSize: 11)
                                }
                                
                                Spacer()
                            }
                            
                            Divider()
                            
                            // Hourly section
                            Text(WidgetLocalizedStrings.hourlyForecast)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(WidgetColorProvider.onSurfaceVariant)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(data.hourlyData.prefix(8)) { hour in
                                        HourlyForecastItem(hour: hour, isLarge: isLarge)
                                    }
                                }
                            }
                            .frame(height: isLarge ? 80 : 70)
                            
                            Divider()
                            
                            // Daily section
                            Text(WidgetLocalizedStrings.sevenDayForecast)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(WidgetColorProvider.onSurfaceVariant)
                            
                            VStack(spacing: 0) {
                                let maxDays = isLarge ? 5 : 3
                                ForEach(Array(data.dailyData.prefix(maxDays).enumerated()), id: \.element.id) { index, day in
                                    if index > 0 {
                                        Spacer().frame(height: 2)
                                    }
                                    DailyForecastItem(day: day)
                                }
                            }
                        }
                    }
                } else {
                    NoDataView(state: entry.data?.loadingState ??  WeatherWidgetData.LoadingState.none , errorMessage: entry.data?.errorMessage)

                }
            }
        }
    }
}

@available(iOS 14.0, *)
struct HourlyForecastItem: View {
    let hour: HourlyData
    let isLarge: Bool
    
    var body: some View {
        VStack(spacing: 2) {
            Text(hour.hour)
                .font(.system(size: 10))
                .foregroundColor(WidgetColorProvider.onSurfaceVariant)
                .lineLimit(1)
            
            WeatherIconView(hour.iconPath, description: hour.description, size: 28)
            
            Text(hour.temperature)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(WidgetColorProvider.onSurface)
                .lineLimit(1)
            
            PrecipitationText(hour.precipAccumulation, fontSize: 9)
        }
        .frame(width: 50)
    }
}

@available(iOS 14.0, *)
struct DailyForecastItem: View {
    let day: DailyData
    
    var body: some View {
        HStack(spacing: 8) {
            Text(day.day)
                .font(.system(size: 12))
                .foregroundColor(WidgetColorProvider.onSurface)
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineLimit(1)
            
            WeatherIconView(day.iconPath, description: day.description, size: 24)
            
            HStack(spacing: 6) {
                PrecipitationText(day.precipAccumulation, fontSize: 10)
                
                Text("\(day.temperatureHigh)/\(day.temperatureLow)")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(WidgetColorProvider.onSurface)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.vertical, 2)
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
