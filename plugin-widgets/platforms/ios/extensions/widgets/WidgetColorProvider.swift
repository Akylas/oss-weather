import SwiftUI

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

/// Provides colors for widgets that automatically adapt to dark mode
/// Matches Android's GlanceTheme.colors naming convention
@available(iOS 14.0, *)
struct WidgetColorProvider {
    // MARK: - Primary Colors
    
    /// Primary color - matches GlanceTheme.colors.primary
    static func primary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#64B5F6") : Color(hex: "#1976D2")
    }
    
    static func onPrimary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#003258") : Color(hex: "#FFFFFF")
    }
    
    static func primaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#00497D") : Color(hex: "#BBDEFB")
    }
    
    static func onPrimaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#CCE5FF") : Color(hex: "#388E3C")
    }
    
    // MARK: - Secondary Colors
    
    static func secondary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#81C784") : Color(hex: "#388E3C")
    }
    
    static func onSecondary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#00390D") : Color(hex: "#FFFFFF")
    }
    
    static func secondaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#005316") : Color(hex: "#C8E6C9")
    }
    
    static func onSecondaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#B7F397") : Color(hex: "#00260E")
    }
    
    // MARK: - Tertiary Colors
    
    static func tertiary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#B388FF") : Color(hex: "#6200EA")
    }
    
    static func onTertiary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#3700B3") : Color(hex: "#FFFFFF")
    }
    
    static func tertiaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#4A148C") : Color(hex: "#E1BEE7")
    }
    
    static func onTertiaryContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#E1BEE7") : Color(hex: "#23004D")
    }
    
    // MARK: - Error Colors
    
    static func error(for colorScheme: ColorScheme) -> Color {
        Color(hex: "#CF6679") // Same for both modes
    }
    
    static func onError(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#690005") : Color(hex: "#FFFFFF")
    }
    
    static func errorContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#93000A") : Color(hex: "#FDE7E9")
    }
    
    static func onErrorContainer(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#FFDAD6") : Color(hex: "#410002")
    }
    
    // MARK: - Background & Surface Colors
    
    /// Widget background color - matches GlanceTheme.colors.widgetBackground
    static func widgetBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#E6000000") : Color(hex: "#F5FFFFFF")
    }
    
    /// Background color - matches GlanceTheme.colors.background
    static func background(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#E6000000") : Color(hex: "#F5FFFFFF")
    }
    
    /// OnBackground color - matches GlanceTheme.colors.onBackground
    static func onBackground(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#FFFFFF") : Color(hex: "#000000")
    }
    
    /// Surface color - matches GlanceTheme.colors.surface
    static func surface(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#1AFFFFFF") : Color(hex: "#12000000")
    }
    
    /// OnSurface color - matches GlanceTheme.colors.onSurface
    static func onSurface(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#FFFFFF") : Color(hex: "#000000")
    }
    
    /// Surface variant color - matches GlanceTheme.colors.surfaceVariant
    static func surfaceVariant(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#26FFFFFF") : Color(hex: "#1F000000")
    }
    
    /// OnSurfaceVariant color - matches GlanceTheme.colors.onSurfaceVariant
    static func onSurfaceVariant(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#B3FFFFFF") : Color(hex: "#99000000")
    }
    
    // MARK: - Outline Colors
    
    static func outline(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#4DFFFFFF") : Color(hex: "#4D000000")
    }
    
    // MARK: - Inverse Colors
    
    static func inverseSurface(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#E0E0E0") : Color(hex: "#2E2E2E")
    }
    
    static func inverseOnSurface(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#1C1C1C") : Color(hex: "#FFFFFF")
    }
    
    static func inversePrimary(for colorScheme: ColorScheme) -> Color {
        colorScheme == .dark ? Color(hex: "#1976D2") : Color(hex: "#90CAF9")
    }
    
    // MARK: - Deprecated - Kept for backward compatibility
    
    /// Get background color based on color scheme
    /// @deprecated Use background(for:) instead
    static func backgroundColor(for colorScheme: ColorScheme) -> Color {
        background(for: colorScheme)
    }
}