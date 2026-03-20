declare class WidgetUtils extends NSObject {
    static suiteName: string;
    static reloadAllTimelines();
    static reloadTimelinesOfKind(kind: string);
    static dataForKey(key: string);
    static setValueForKey(value: number, key: string);
    static saveWidgetConfig(widgetId: string, configJson: string);
    static loadWidgetConfig(widgetId: string): string;
    static saveKindConfig(widgetKind: string, configJson: string);
    static loadKindConfig(widgetKind: string): string;
}
