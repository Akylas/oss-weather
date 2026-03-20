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
