import Foundation
import os.log

/**
 * Simple centralized logger for widgets package. Uses os_log.
 * Logging can be toggled via WidgetsLogger.enabled property.
 */
@available(iOS 14.0, *)
struct WidgetsLogger {
    // Default to enabled
    static var enabled: Bool = true
    
    private static let subsystem = "com.akylas.weather.widgets"
    
    static func d(_ tag: String, _ message: String) {
        guard enabled else { return }
        let log = OSLog(subsystem: subsystem, category: tag)
        os_log("%{public}@", log: log, type: .debug, message)
    }
    
    static func i(_ tag: String, _ message: String) {
        guard enabled else { return }
        let log = OSLog(subsystem: subsystem, category: tag)
        os_log("%{public}@", log: log, type: .info, message)
    }
    
    static func w(_ tag: String, _ message: String) {
        guard enabled else { return }
        let log = OSLog(subsystem: subsystem, category: tag)
        os_log("%{public}@", log: log, type: .default, message)
    }
    
    static func e(_ tag: String, _ message: String) {
        guard enabled else { return }
        let log = OSLog(subsystem: subsystem, category: tag)
        os_log("%{public}@", log: log, type: .error, message)
    }
}
