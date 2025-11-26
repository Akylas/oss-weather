import SwiftUI

/// Provides colors for widgets that automatically adapt to dark mode
@available(iOS 14.0, *)
struct WidgetColorProvider {
    // MARK: - Primary Colors
    static let background = Color("WidgetBackground", bundle: nil)
    static let surface = Color("WidgetSurface", bundle: nil)
    static let widgetBackground = Color("WidgetBackground", bundle: nil)
    
    // MARK: - Text Colors
    static let onSurface = Color("WidgetOnSurface", bundle: nil)
    static let onSurfaceVariant = Color("WidgetOnSurfaceVariant", bundle: nil)
    static let onBackground = Color("WidgetOnBackground", bundle: nil)
    
    // MARK: - Accent Colors
    static let primary = Color("WidgetPrimary", bundle: nil)
    static let accent = Color("WidgetAccent", bundle: nil)
    
    // MARK: - Status Colors
    static let error = Color("WidgetError", bundle: nil)
    
    // MARK: - Precipitation Color
    static let precipitation = Color("WidgetPrecipitation", bundle: nil)
    
    // MARK: - Dynamic Color Support (for views that need ColorScheme context)
    static func adaptiveColor(
        light: Color,
        dark: Color,
        colorScheme: ColorScheme
    ) -> Color {
        colorScheme == .dark ? dark : light
    }
}

// MARK: - Color Hex Extension
@available(iOS 14.0, *)
extension Color {
    /// Creates a color from a hex string
    /// Supports formats: "#RGB", "#RGBA", "#RRGGBB", "#RRGGBBAA"
    /// Example: Color(hex: "#4A90E2") or Color(hex: "4A90E2")
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RRGGBB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // RRGGBBAA (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    /// Creates a color that automatically adapts to dark mode
    static func adaptive(light: Color, dark: Color) -> Color {
        return Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}

// MARK: - Fallback Static Colors (if Asset Catalog not used)
@available(iOS 14.0, *)
extension WidgetColorProvider {
    // Background Colors
    static var backgroundLight: Color {
        Color(hex: "#4DA8DA") // RGB(77, 168, 218)
    }
    
    static var backgroundDark: Color {
        Color(hex: "#1E2A3A") // RGB(30, 42, 58)
    }
    
    static var backgroundGradientStartLight: Color {
        Color(hex: "#6DD5ED") // RGB(109, 213, 237)
    }
    
    static var backgroundGradientStartDark: Color {
        Color(hex: "#1A1F3A") // RGB(26, 31, 58)
    }
    
    static var backgroundGradientEndLight: Color {
        Color(hex: "#2193B0") // RGB(33, 147, 176)
    }
    
    static var backgroundGradientEndDark: Color {
        Color(hex: "#2C3E50") // RGB(44, 62, 80)
    }
    
    // Text Colors
    static var primaryTextLight: Color {
        Color(hex: "#FFFFFF") // White
    }
    
    static var primaryTextDark: Color {
        Color(hex: "#E8E8E8") // RGB(232, 232, 232)
    }
    
    static var secondaryTextLight: Color {
        Color(hex: "#FFFFFF").opacity(0.9)
    }
    
    static var secondaryTextDark: Color {
        Color(hex: "#B0B0B0") // RGB(176, 176, 176)
    }
    
    static var locationTextLight: Color {
        Color(hex: "#FFFFFF") // White
    }
    
    static var locationTextDark: Color {
        Color(hex: "#90CAF9") // RGB(144, 202, 249)
    }
    
    // Card Background
    static var cardBackgroundLight: Color {
        Color(hex: "#FFFFFF").opacity(0.25)
    }
    
    static var cardBackgroundDark: Color {
        Color(hex: "#000000").opacity(0.25)
    }
    
    // Accent Colors
    static var accentLight: Color {
        Color(hex: "#1976D2") // RGB(25, 118, 210)
    }
    
    static var accentDark: Color {
        Color(hex: "#64B5F6") // RGB(100, 181, 246)
    }
    
    static var precipitationColor: Color {
        Color(hex: "#4A90E2") // RGB(74, 144, 226) - same in both modes
    }
}

// MARK: - Convenience Methods
@available(iOS 14.0, *)
extension WidgetColorProvider {
    /// Get background color based on color scheme
    static func backgroundColor(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? backgroundDark : backgroundLight
    }
    
    /// Get background gradient
    static func backgroundGradient(for colorScheme: ColorScheme) -> LinearGradient {
        LinearGradient(
            colors: [
                colorScheme == .dark ? backgroundGradientStartDark : backgroundGradientStartLight,
                colorScheme == .dark ? backgroundGradientEndDark : backgroundGradientEndLight
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    /// Get primary text color
    static func primaryText(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? primaryTextDark : primaryTextLight
    }
    
    /// Get secondary text color
    static func secondaryText(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? secondaryTextDark : secondaryTextLight
    }
    
    /// Get location text color
    static func locationText(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? locationTextDark : locationTextLight
    }
    
    /// Get card background color
    static func cardBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? cardBackgroundDark : cardBackgroundLight
    }
    
    /// Get accent color
    static func accent(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? accentDark : accentLight
    }
}