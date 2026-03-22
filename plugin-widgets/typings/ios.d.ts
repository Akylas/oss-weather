declare class WidgetSettings extends NSObject {
    static alloc(): WidgetSettings; // inherited from NSObject

    static new(): WidgetSettings; // inherited from NSObject

    static readonly shared: WidgetSettings;

    static readonly widgetKinds: NSArray<string>;

    addActiveWidgetWithWidgetId(widgetId: string): void;

    getActiveWidgetIds(): NSSet<string>;

    getInstancesOfKindWithWidgetKind(widgetKind: string): NSArray<string>;

    getUpdateFrequency(): number;

    reloadAllWidgets(): void;

    removeActiveWidgetWithWidgetId(widgetId: string): void;

    saveActiveWidgetIds(ids: NSSet<string>): void;

    setUpdateFrequency(minutes: number): void;
}

declare class WidgetUtils extends NSObject {
    static alloc(): WidgetUtils; // inherited from NSObject

    static dataForKey(forKey: string): NSData;

    static loadKindConfigWithWidgetKind(widgetKind: string): string;

    static loadWidgetConfigWithWidgetId(widgetId: string): string;

    static new(): WidgetUtils; // inherited from NSObject

    static reloadAllTimelines(): void;

    static reloadTimelinesOfKind(ofKind: string): void;

    static removeDataWithKey(key: string): void;

    static saveKindConfigWithWidgetKindConfigJson(widgetKind: string, configJson: string): void;

    static saveWidgetConfigWithWidgetIdConfigJson(widgetId: string, configJson: string): void;

    static setWithValueForKey(value: any, forKey: string): void;

    static updateDataWithKey(key: string, data: string): void;

    static readonly suiteName: string;
}
