// App_Resources/iOS/WidgetExtension/AllWeatherWidgets.swift
// All weather widget implementations for iOS

import WidgetKit
import SwiftUI

// MARK: - Gradient Background
struct GradientBackground: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        LinearGradient(
            gradient: Gradient(colors: [colors.backgroundGradientStart, colors.backgroundGradientEnd]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - No Data View
struct NoDataView: View {
    let loadingState: WidgetLoadingState
    let errorMessage: String
    @Environment(\.colorScheme) var colorScheme
    
    init(loadingState: WidgetLoadingState = .none, errorMessage: String = "") {
        self.loadingState = loadingState
        self.errorMessage = errorMessage
    }
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        ZStack {
            GradientBackground()
            
            VStack(spacing: 8) {
                switch loadingState {
                case .loading:
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: colors.primaryTextColor))
                        .scaleEffect(1.5)
                    
                    Text(WidgetLocalizedStrings.loading)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(colors.primaryTextColor)
                    
                case .error:
                    Text("⚠️")
                        .font(.system(size: 32))
                    
                    Text(errorMessage.isEmpty ? WidgetLocalizedStrings.error_loading : errorMessage)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(colors.primaryTextColor)
                        .multilineTextAlignment(.center)
                    
                    Text(WidgetLocalizedStrings.tapToConfigure)
                        .font(.system(size: 12))
                        .foregroundColor(colors.secondaryTextColor)
                    
                default:
                    Text(WidgetLocalizedStrings.noLocationSet)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(colors.primaryTextColor)
                    
                    Text(WidgetLocalizedStrings.tapToConfigure)
                        .font(.system(size: 12))
                        .foregroundColor(colors.secondaryTextColor)
                }
            }
            .padding()
        }
    }
}

// MARK: - Location Header
struct LocationHeader: View {
    let locationName: String
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        Text(locationName)
            .font(.system(size: 16, weight: .medium))
            .foregroundColor(colors.locationTextColor)
    }
}

// MARK: - Weather Icon
struct WeatherIcon: View {
    let iconPath: String
    let size: CGFloat
    
    init(iconPath: String, size: CGFloat = 64) {
        self.iconPath = iconPath
        self.size = size
    }
    
    var body: some View {
        if let iconImage = WidgetDataProvider.getIconImage(path: iconPath) {
            Image(uiImage: iconImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        }
    }
}

// MARK: - Temperature Text
struct TemperatureText: View {
    let temperature: String
    let fontSize: CGFloat
    @Environment(\.colorScheme) var colorScheme
    
    init(temperature: String, fontSize: CGFloat = 48) {
        self.temperature = temperature
        self.fontSize = fontSize
    }
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        Text(temperature)
            .font(.system(size: fontSize, weight: .bold))
            .foregroundColor(colors.primaryTextColor)
    }
}

// MARK: - Description Text
struct DescriptionText: View {
    let description: String
    let fontSize: CGFloat
    @Environment(\.colorScheme) var colorScheme
    
    init(description: String, fontSize: CGFloat = 14) {
        self.description = description
        self.fontSize = fontSize
    }
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        Text(description)
            .font(.system(size: fontSize))
            .foregroundColor(colors.secondaryTextColor)
    }
}

// MARK: - Card Item
struct CardItem<Content: View>: View {
    let content: Content
    @Environment(\.colorScheme) var colorScheme
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        HStack {
            content
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(colors.cardBackgroundColor)
        .cornerRadius(8)
    }
}

// MARK: - Simple Weather Widget
struct SimpleWeatherWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData) -> some View {
        VStack(spacing: 8) {
            LocationHeader(locationName: data.locationName.isEmpty ? data.locationName : data.locationName)
            
            Spacer().frame(height: 8)
            
            WeatherIcon(iconPath: data.iconPath)
            
            Spacer().frame(height: 8)
            
            TemperatureText(temperature: data.temperature)
            
            Spacer().frame(height: 4)
            
            if !data.description.isEmpty {
                DescriptionText(description: data.description)
            }
        }
        .padding()
    }
}

struct SimpleWeatherWidget: Widget {
    let kind: String = "SimpleWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            SimpleWeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.simpleWeatherName)
        .description(WidgetLocalizedStrings.simpleWeatherDesc)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}


// MARK: - Simple Weather with Date Widget
struct SimpleWeatherWithDateWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData) -> some View {
        VStack(spacing: 8) {
            if !data.date.isEmpty {
                DescriptionText(description: data.date, fontSize: 12)
            }
            
            LocationHeader(locationName: data.locationName.isEmpty ? data.locationName : data.locationName)
            
            Spacer().frame(height: 8)
            
            WeatherIcon(iconPath: data.iconPath)
            
            Spacer().frame(height: 8)
            
            TemperatureText(temperature: data.temperature, fontSize: 24)
            
            Spacer().frame(height: 4)
            
            if !data.description.isEmpty {
                DescriptionText(description: data.description, fontSize: 11)
            }
        }
        .padding()
    }
}

struct SimpleWeatherWithDateWidget: Widget {
    let kind: String = "SimpleWeatherWithDateWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            SimpleWeatherWithDateWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithDateName)
        .description(WidgetLocalizedStrings.weatherWithDateDesc)
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Simple Weather with Clock Widget
struct SimpleWeatherWithClockWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data, colors: colors)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData, colors: WidgetColorProvider) -> some View {
        HStack(spacing: 16) {
            // Left side - Clock
            VStack(alignment: .leading, spacing: 4) {
                Text(Date(), style: .time)
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(colors.primaryTextColor)
                    .minimumScaleFactor(0.8)
                
                Text(Date(), style: .date)
                    .font(.system(size: 14))
                    .foregroundColor(colors.secondaryTextColor)
                
                Spacer().frame(height: 8)
                
                LocationHeader(locationName: data.locationName.isEmpty ? data.locationName : data.locationName)
            }
            
            Spacer()
            
            // Right side - Weather
            VStack(spacing: 4) {
                WeatherIcon(iconPath: data.iconPath, size: 56)
                
                TemperatureText(temperature: data.temperature, fontSize: 28)
                
                if !data.description.isEmpty {
                    DescriptionText(description: data.description, fontSize: 11)
                        .lineLimit(1)
                }
            }
        }
        .padding(16)
    }
}

struct SimpleWeatherWithClockWidget: Widget {
    let kind: String = "SimpleWeatherWithClockWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            SimpleWeatherWithClockWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.weatherWithClockName)
        .description(WidgetLocalizedStrings.weatherWithClockDesc)
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Hourly Weather Widget
struct HourlyWeatherWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData, colors: WidgetColorProvider) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(WidgetLocalizedStrings.hourlyForecast)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(colors.primaryTextColor)
                Spacer()
            }
            .padding(.bottom, 4)
            
            if !data.locationName.isEmpty {
                DescriptionText(description: data.locationName.isEmpty ? data.locationName : data.locationName, fontSize: 11)
            }
            
            ForEach(data.hourlyData.prefix(6), id: \.time) { hour in
                CardItem {
                    Text(hour.time)
                        .font(.system(size: 11))
                        .foregroundColor(colors.primaryTextColor)
                        .frame(width: 50, alignment: .leading)
                    
                    WeatherIcon(iconPath: hour.iconPath, size: 20)
                    
                    Text(hour.temperature)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(colors.primaryTextColor)
                        .frame(width: 50)
                    
                    if !hour.precipitation.isEmpty {
                        Text("💧 \(hour.precipitation)")
                            .font(.system(size: 10))
                            .foregroundColor(colors.accentColor)
                    }
                }
            }
        }
        .padding(12)
    }
}

struct HourlyWeatherWidget: Widget {
    let kind: String = "HourlyWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            HourlyWeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.hourlyForecastName)
        .description(WidgetLocalizedStrings.hourlyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Daily Weather Widget
struct DailyWeatherWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData, colors: WidgetColorProvider) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(WidgetLocalizedStrings.sevenDayForecast)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(colors.primaryTextColor)
                Spacer()
            }
            .padding(.bottom, 4)
            
            if !data.locationName.isEmpty {
                DescriptionText(description: data.locationName.isEmpty ? data.locationName : data.locationName, fontSize: 11)
            }
            
            ForEach(data.dailyData.prefix(7), id: \.day) { day in
                CardItem {
                    Text(day.day)
                        .font(.system(size: 11))
                        .foregroundColor(colors.primaryTextColor)
                        .frame(width: 60, alignment: .leading)
                    
                    WeatherIcon(iconPath: day.iconPath, size: 24)
                    
                    HStack(spacing: 4) {
                        Text(day.temperatureHigh)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(colors.primaryTextColor)
                        
                        Text("/")
                            .font(.system(size: 11))
                            .foregroundColor(colors.secondaryTextColor)
                        
                        Text(day.temperatureLow)
                            .font(.system(size: 12))
                            .foregroundColor(colors.secondaryTextColor)
                    }
                    .frame(width: 70)
                    
                    if !day.precipitation.isEmpty {
                        Text("💧 \(day.precipitation)")
                            .font(.system(size: 10))
                            .foregroundColor(colors.accentColor)
                    }
                }
            }
        }
        .padding(12)
    }
}

struct DailyWeatherWidget: Widget {
    let kind: String = "DailyWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            DailyWeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.dailyForecastName)
        .description(WidgetLocalizedStrings.dailyForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Forecast Weather Widget
struct ForecastWeatherWidgetEntryView: View {
    let entry: WeatherEntry
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        let colors = WidgetColorProvider.colors(for: colorScheme)
        
        ZStack {
            GradientBackground()
            
            if let data = entry.weatherData {
                switch data.loadingState {
                case .loaded:
                    if !data.temperature.isEmpty {
                        WeatherContentView(data: data)
                    } else {
                        NoDataView()
                    }
                case .loading:
                    NoDataView(loadingState: .loading)
                case .error:
                    NoDataView(loadingState: .error, errorMessage: data.errorMessage)
                case .none:
                    NoDataView()
                }
            } else {
                NoDataView()
            }
        }
    }

    @ViewBuilder
    private func WeatherContentView(data: WeatherWidgetData, colors: WidgetColorProvider) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header with current weather
            HStack {
                VStack(alignment: .leading) {
                    LocationHeader(locationName: data.locationName.isEmpty ? data.locationName : data.locationName)
                    
                    if !data.date.isEmpty {
                        DescriptionText(description: data.date, fontSize: 10)
                    }
                }
                
                Spacer()
                
                WeatherIcon(iconPath: data.iconPath, size: 36)
                
                TemperatureText(temperature: data.temperature, fontSize: 20)
            }
            
            Divider()
                .background(colors.secondaryTextColor.opacity(0.3))
            
            // Forecast items
            ForEach(data.forecastData.prefix(5), id: \.dateTime) { forecast in
                CardItem {
                    Text(forecast.dateTime)
                        .font(.system(size: 10))
                        .foregroundColor(colors.primaryTextColor)
                        .frame(width: 60, alignment: .leading)
                    
                    WeatherIcon(iconPath: forecast.iconPath, size: 20)
                    
                    Text(forecast.temperature)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(colors.primaryTextColor)
                        .frame(width: 40)
                    
                    Text(forecast.description)
                        .font(.system(size: 9))
                        .foregroundColor(colors.secondaryTextColor)
                        .lineLimit(1)
                    
                    if !forecast.precipitation.isEmpty {
                        Text("💧 \(forecast.precipitation)")
                            .font(.system(size: 9))
                            .foregroundColor(colors.accentColor)
                    }
                }
            }
        }
        .padding(12)
    }
}

struct ForecastWeatherWidget: Widget {
    let kind: String = "ForecastWeatherWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: kind,
            provider: WeatherTimelineProvider(widgetKind: kind)
        ) { entry in
            ForecastWeatherWidgetEntryView(entry: entry)
        }
        .configurationDisplayName(WidgetLocalizedStrings.detailedForecastName)
        .description(WidgetLocalizedStrings.detailedForecastDesc)
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

// MARK: - Widget Bundle
@main
struct WeatherWidgetBundle: WidgetBundle {
    var body: some Widget {
        SimpleWeatherWidget()
        SimpleWeatherWithDateWidget()
        SimpleWeatherWithClockWidget()
        HourlyWeatherWidget()
        DailyWeatherWidget()
        ForecastWeatherWidget()
    }
}