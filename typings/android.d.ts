declare namespace com {
    export namespace tns {
        export class NativeScriptException {
            static getStackTraceAsString(ex): String;
        }
    }
}

declare namespace com {
    export namespace akylas {
        export namespace weather {
            export class ImageUtils extends java.lang.Object {
                public static class: java.lang.Class<ImageUtils>;
                public constructor();
            }
            export namespace ImageUtils {
                export class Companion extends java.lang.Object {
                    public static class: java.lang.Class<Companion>;
                    public static getImageSize(param0: globalAndroid.content.Context, param1: string): number[];
                    public static readBitmapFromFile(param0: globalAndroid.content.Context, param1: string, param2: LoadImageOptions): globalAndroid.graphics.Bitmap;
                    public static readBitmapFromFile(param0: globalAndroid.content.Context, param1: string, param2: string): globalAndroid.graphics.Bitmap;
                    public static calculateInSampleSize(param0: number, param1: number, param2: number, param3: number): number;
                    public static getTargetFormat(param0: string): globalAndroid.graphics.Bitmap.CompressFormat;
                }
                export class ImageAssetOptions extends java.lang.Object {
                    public static class: java.lang.Class<ImageAssetOptions>;
                    public setAutoScaleFactor(param0: boolean): void;
                    public setWidth(param0: number): void;
                    public getAutoScaleFactor(): boolean;
                    public constructor(param0: globalAndroid.graphics.BitmapFactory.Options);
                    public getWidth(): number;
                    public setHeight(param0: number): void;
                    public setKeepAspectRatio(param0: boolean): void;
                    public getKeepAspectRatio(): boolean;
                    public constructor(param0: globalAndroid.graphics.BitmapFactory.Options, param1: LoadImageOptions);
                    public getHeight(): number;
                }
                export class LoadImageOptions extends java.lang.Object {
                    public static class: java.lang.Class<LoadImageOptions>;
                    public setAutoScaleFactor(param0: boolean): void;
                    public setWidth(param0: number): void;
                    public setMaxHeight(param0: number): void;
                    public setMaxWidth(param0: number): void;
                    public getResizeThreshold(): number;
                    public constructor(param0: org.json.JSONObject);
                    public getHeight(): number;
                    public initWithJSON(param0: org.json.JSONObject): void;
                    public getAutoScaleFactor(): boolean;
                    public getWidth(): number;
                    public getMaxWidth(): number;
                    public getMaxHeight(): number;
                    public setHeight(param0: number): void;
                    public setKeepAspectRatio(param0: boolean): void;
                    public getKeepAspectRatio(): boolean;
                    public setResizeThreshold(param0: number): void;
                    public constructor(param0: string);
                }
            }
        }
    }
}
