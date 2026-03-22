import Foundation
import os.log

/**
 * Simple centralized logger for widgets package. Uses os_log.
 * Logging can be toggled via WidgetsLogger.enabled property.
 */
struct WidgetsLogger {
    // Default to enabled
    static var enabled: Bool = true
    
    static func d(_ tag: String, _ message: String) {
        guard enabled else { return }
        print("CONSOLE DEBUG: [\(tag)] \(message)")
        // os_log("[%@] %@", log: .default, type: .debug, tag, message)
    }
    
    static func i(_ tag: String, _ message: String) {
        // guard enabled else { return }
        print("CONSOLE LOG: [\(tag)] \(message)")
        // os_log("[%@] %@", log: .default, type: .info, tag, message)
    }
    
    static func w(_ tag: String, _ message: String) {
        // guard enabled else { return }
        print("CONSOLE WARN: [\(tag)] \(message)")
        // os_log("[%@] %@", log: .default, type: .default, tag, message)
    }
    
    static func e(_ tag: String, _ message: String) {
        // guard enabled else { return }
        print("CONSOLE ERROR: [\(tag)] \(message)")
        // os_log("[%@] %@", log: .default, type: .error, tag, message)
    }
}
