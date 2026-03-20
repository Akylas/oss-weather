import Foundation
import UIKit
import ActivityKit
import WidgetKit


@objcMembers
public class WidgetUtils: NSObject {
	public static let suiteName = "group.com.akylas.weather"

	

    public static func updateData(key: String, _ data: String) {
		guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
			return
		}
		sharedDefaults.set(data, forKey: key)
    	sharedDefaults.synchronize()
	}
    public static func set(value: Any, forKey: String) {
        guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
            return
        }
        if let castValue = value as? Int {
            sharedDefaults.set( castValue, forKey: forKey)
        }
         else if let castValue = value as? Bool {
            sharedDefaults.set( castValue, forKey: forKey)
        }
        else if let castValue = value as? Float {
            sharedDefaults.set( castValue, forKey: forKey)
        } else if let castValue = value as? Double {
            sharedDefaults.set( castValue, forKey: forKey)
        } else {
            sharedDefaults.set( value, forKey: forKey)
        }
        sharedDefaults.synchronize()
    }
	public static func removeData(key: String) {
		guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
			return
		}
		sharedDefaults.removeObject(forKey: key)
        sharedDefaults.synchronize()
	}
	public static func data(forKey: String) -> Data? {
		guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
			return nil
		}
		return sharedDefaults.data(forKey: forKey)
	}
	public static func reloadTimelines( ofKind: String) {
		if #available(iOS 14.0, *) {
            Task.detached(priority: .userInitiated) {
                WidgetCenter.shared.reloadTimelines(ofKind: ofKind)
            }
        }
	}
    public static func reloadAllTimelines() {
        if #available(iOS 14.0, *) {
            Task.detached(priority: .userInitiated) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
    
    // MARK: - Widget Config Management
    
    /// Save widget configuration for a specific widget instance
    public static func saveWidgetConfig(widgetId: String, configJson: String) {
        guard let jsonData = configJson.data(using: .utf8),
              let configDict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
              let config = try? JSONDecoder().decode(WidgetConfig.self, from: jsonData) else {
            print("[WidgetUtils] Failed to decode widget config JSON")
            return
        }
        WidgetSettings.shared.saveWidgetConfig(widgetId: widgetId, config: config)
        print("[WidgetUtils] Saved widget config for \(widgetId)")
    }
    
    /// Load widget configuration for a specific widget instance
    public static func loadWidgetConfig(widgetId: String) -> String? {
        guard let config = WidgetSettings.shared.loadWidgetConfig(widgetId: widgetId) else {
            return nil
        }
        
        if let jsonData = try? JSONEncoder().encode(config),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            return jsonString
        }
        
        return nil
    }
    
    /// Save widget kind default configuration
    public static func saveKindConfig(widgetKind: String, configJson: String) {
        guard let jsonData = configJson.data(using: .utf8),
              let config = try? JSONDecoder().decode(WidgetConfig.self, from: jsonData) else {
            print("[WidgetUtils] Failed to decode kind config JSON")
            return
        }
        WidgetSettings.shared.saveKindConfig(widgetKind: widgetKind, config: config)
        print("[WidgetUtils] Saved kind config for \(widgetKind)")
    }
    
    /// Load widget kind default configuration
    public static func loadKindConfig(widgetKind: String) -> String? {
        let config = WidgetSettings.shared.getKindConfig(widgetKind: widgetKind)
        
        if let jsonData = try? JSONEncoder().encode(config),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            return jsonString
        }
        
        return nil
    }
}
