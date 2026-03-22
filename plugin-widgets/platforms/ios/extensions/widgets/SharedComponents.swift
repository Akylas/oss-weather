import SwiftUI
import WidgetKit

@available(iOS 14.0, *)
struct WidgetContainer<Content: View>: View {
    let padding: CGFloat
    let content: Content
    @Environment(\.colorScheme) var colorScheme
    
    init(padding: CGFloat = 0, @ViewBuilder content: () -> Content) {
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
        }
    }
}

@available(iOS 15.0, *)
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
                ProgressView().controlSize(.small).padding(6)
                Text(WidgetLocalizedStrings.loading)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(WidgetColorProvider.onBackground(for: colorScheme))
            } else if state == .error {
                Image(systemName: "exclamationmark.triangle").resizable()
                    .aspectRatio(contentMode: .fit).frame(width:30, height:30)
                    .foregroundColor(.red).padding(6)
                Text(errorMessage ?? WidgetLocalizedStrings.error_loading)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(WidgetColorProvider.onBackground(for: colorScheme))
                    .multilineTextAlignment(.center)
            } else {
                Image(systemName: "cloud").resizable()
                    .aspectRatio(contentMode: .fit).frame(width:30, height:30)
                    .foregroundColor(WidgetColorProvider.onBackground(for: colorScheme)).padding(6)
                Text(WidgetLocalizedStrings.noLocationSet)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(WidgetColorProvider.onBackground(for: colorScheme))
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
