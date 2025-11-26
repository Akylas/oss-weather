import Foundation
import UIKit
import ActivityKit
import WidgetKit


@objcMembers
public class WidgetUtils: NSObject {
	static let suiteName = "group.com.akylas.weather"

	

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
}
