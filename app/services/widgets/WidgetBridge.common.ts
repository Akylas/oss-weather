import { Observable } from '@nativescript/core';
import { WidgetConfigManager } from './WidgetConfigManager';

export default class WidgetBridgeBase extends Observable {
    reloadConfigs() {
        WidgetConfigManager.reloadConfigs();
    }
}
