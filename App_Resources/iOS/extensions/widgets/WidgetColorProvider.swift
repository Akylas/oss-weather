import SwiftUI

/// Provides colors for widgets based on dark mode state
struct WidgetColorProvider {
    @Environment(\.colorScheme) var colorScheme
    
    var isDarkMode: Bool {
        colorScheme == .dark
    }
    
    // MARK: - Background Colors
    var backgroundColor: Color {
        isDarkMode ? Color(red: 30/255, green: 42/255, blue: 58/255) : Color(red: 77/255, green: 168/255, blue: 218/255)
    }
    
    var backgroundGradientStart: Color {
        isDarkMode ? Color(red: 26/255, green: 31/255, blue: 58/255) : Color(red: 109/255, green: 213/255, blue: 237/255)
    }
    
    var backgroundGradientEnd: Color {
        isDarkMode ? Color(red: 44/255, green: 62/255, blue: 80/255) : Color(red: 33/255, green: 147/255, blue: 176/255)
    }
    
    // MARK: - Text Colors
    var primaryTextColor: Color {
        isDarkMode ? Color(red: 232/255, green: 232/255, blue: 232/255) : .white
    }
    
    var secondaryTextColor: Color {
        isDarkMode ? Color(red: 176/255, green: 176/255, blue: 176/255) : Color.white.opacity(0.9)
    }
    
    var locationTextColor: Color {
        isDarkMode ? Color(red: 144/255, green: 202/255, blue: 249/255) : .white
    }
    
    // MARK: - Card Background
    var cardBackgroundColor: Color {
        isDarkMode ? Color.black.opacity(0.25) : Color.white.opacity(0.25)
    }
    
    // MARK: - Accent Colors
    var accentColor: Color {
        isDarkMode ? Color(red: 100/255, green: 181/255, blue: 246/255) : Color(red: 25/255, green: 118/255, blue: 210/255)
    }
}

// MARK: - Static Access
extension WidgetColorProvider {
    static func colors(for colorScheme: ColorScheme) -> WidgetColorProvider {
        var provider = WidgetColorProvider()
        provider.colorScheme = colorScheme
        return provider
    }
}