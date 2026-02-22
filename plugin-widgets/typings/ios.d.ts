declare class WidgetUtils extends NSObject {
    static suiteName: string;
    static reloadAllTimelines();
    static reloadTimelinesOfKind(kind: string);
    static dataForKey(key: string);
    static setValueForKey(value: number, key: string);
}
