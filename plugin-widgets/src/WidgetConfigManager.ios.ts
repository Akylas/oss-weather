import { widgetsUserDefaults } from './WidgetBridge.ios';
import { BaseWidgetConfigManager, WIDGET_CONFIGS_KEY, WIDGET_KIND_CONFIGS_KEY } from './WidgetConfigManager.common';

export * from './WidgetConfigManager.common';

export class WidgetConfigManager extends BaseWidgetConfigManager {
    protected static loadConfigs() {
        const data = widgetsUserDefaults.stringForKey(WIDGET_CONFIGS_KEY);
        DEV_LOG && console.log('loadConfigs', data);
        if (data) {
            try {
                this.configs = JSON.parse(data);
            } catch (error) {
                this.configs = {};
            }
        } else {
            this.configs = {};
        }
    }

    protected static loadKindConfigs() {
        const data = widgetsUserDefaults.stringForKey(WIDGET_KIND_CONFIGS_KEY);
        // DEV_LOG && console.log('loadKindConfigs', data);
        if (data) {
            try {
                this.kindConfigs = JSON.parse(data);
            } catch (error) {
                this.kindConfigs = {};
            }
        } else {
            this.kindConfigs = {};
        }
    }
}
