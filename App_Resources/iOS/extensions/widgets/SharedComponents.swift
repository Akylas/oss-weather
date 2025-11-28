import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct WidgetContainer<Content: View>: View {
    let padding: CGFloat
    let content: Content
    @Environment(\.colorScheme) var colorScheme
    
    init(padding: CGFloat = 8, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

@available(iOS 14.0, *)
struct LocationHeader: View {
    let locationName: String
    let fontSize: CGFloat
    let maxLines: Int
    @Environment(\.colorScheme) var colorScheme
    
    init(_ locationName: String, fontSize: CGFloat = 14, maxLines: Int = 1) {
        self.locationName = locationName
        self.fontSize = fontSize
        self.maxLines = maxLines
    }
    
    var body: some View {
        Text(locationName)
            .font(.system(size: fontSize))
            .foregroundColor(WidgetColorProvider.locationText(for: colorScheme))
            .lineLimit(maxLines)
    }
}

@available(iOS 14.0, *)
struct WeatherIconView: View {
    let iconPath: String?
    let description: String
    let size: CGFloat
    @Environment(\.colorScheme) var colorScheme
    
    init(_ iconPath: String?, description: String = "", size: CGFloat = 48) {
        self.iconPath = iconPath
        self.description = description
        self.size = size
    }
    
    var body: some View {
        if let iconPath = iconPath, let image = WidgetDataProvider.getIconImage(path: iconPath) {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
        } else {
            Image(systemName: "cloud.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
        }
    }
}

@available(iOS 14.0, *)
struct TemperatureText: View {
    let temperature: String
    let fontSize: CGFloat
    @Environment(\.colorScheme) var colorScheme
    
    init(_ temperature: String, fontSize: CGFloat = 32) {
        self.temperature = temperature
        self.fontSize = fontSize
    }
    
    var body: some View {
        Text(temperature)
            .font(.system(size: fontSize, weight: .bold))
            .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
    }
}

@available(iOS 14.0, *)
struct DescriptionText: View {
    let description: String
    let fontSize: CGFloat
    @Environment(\.colorScheme) var colorScheme
    
    init(_ description: String, fontSize: CGFloat = 14) {
        self.description = description
        self.fontSize = fontSize
    }
    
    var body: some View {
        Text(description)
            .font(.system(size: fontSize))
            .foregroundColor(WidgetColorProvider.secondaryText(for: colorScheme))
    }
}

@available(iOS 14.0, *)
struct PrecipitationText: View {
    let precipAccumulation: String
    let fontSize: CGFloat
    
    init(_ precipAccumulation: String, fontSize: CGFloat = 10) {
        self.precipAccumulation = precipAccumulation
        self.fontSize = fontSize
    }
    
    var body: some View {
        if !precipAccumulation.isEmpty && precipAccumulation != "0mm" && precipAccumulation != "0\"" {
            Text(precipAccumulation)
                .font(.system(size: fontSize))
                .foregroundColor(WidgetColorProvider.precipitationColor)
                .lineLimit(1)
        }
    }
}

@available(iOS 14.0, *)
struct NoDataView: View {
    let state: WeatherWidgetData.LoadingState
    let errorMessage: String?
    @Environment(\.colorScheme) var colorScheme
    
    init(state: WeatherWidgetData.LoadingState = .none, errorMessage: String? = nil) {
        self.state = state
        self.errorMessage = errorMessage
    }
    
    var body: some View {
        VStack {
            if state == .loading {
                ProgressView()
                Text(WidgetLocalizedStrings.loading)
                    .font(.caption)
                    .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
            } else if state == .error {
                Image(systemName: "exclamationmark.triangle")
                    .foregroundColor(.red)
                Text(errorMessage ?? WidgetLocalizedStrings.error_loading)
                    .font(.caption)
                    .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
                    .multilineTextAlignment(.center)
            } else {
                Image(systemName: "cloud")
                    .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
                Text(WidgetLocalizedStrings.noLocationSet)
                    .font(.caption)
                    .foregroundColor(WidgetColorProvider.primaryText(for: colorScheme))
            }
        }
    }
}

// MARK: - Widget Background with Gradient
@available(iOS 14.0, *)
struct WidgetBackgroundView: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        WidgetColorProvider.backgroundGradient(for: colorScheme)
            .ignoresSafeArea()
    }
}

// MARK: - Card View with Adaptive Background
@available(iOS 14.0, *)
struct CardView<Content: View>: View {
    let content: Content
    @Environment(\.colorScheme) var colorScheme
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(8)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(WidgetColorProvider.cardBackground(for: colorScheme))
            )
    }
}