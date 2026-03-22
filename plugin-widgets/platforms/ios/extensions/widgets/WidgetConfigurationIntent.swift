// App_Resources/iOS/WidgetExtension/WidgetConfigurationIntent.swift
// AppIntent configuration for unique widget identification

import Foundation
import AppIntents
import WidgetKit

/// Intent for configuring weather widgets with unique identifiers
@available(iOS 16.0, *)
struct WidgetConfigurationIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configure Weather Widget"
    static var description: IntentDescription = IntentDescription("Configure your weather widget settings")
    
    /// Unique identifier for this widget instance
    /// Generated once when widget is first added to home screen
    @Parameter(title: "Widget ID")
    var widgetId: String
    
    init() {
        // Generate a unique ID for new widgets
        self.widgetId = UUID().uuidString
    }
    
    init(widgetId: String) {
        self.widgetId = widgetId
    }
}
