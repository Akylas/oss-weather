declare class ImageUtils extends NSObject {
    static alloc(): ImageUtils; // inherited from NSObject

    static getAspectSafeDimensions(sourceWidth: number, sourceHeight: number, reqWidth: number, reqHeight: number): CGSize;

    static new(): ImageUtils; // inherited from NSObject

    static readImageFromFileOptions(src: string, options: NSDictionary<any, any>): UIImage;

    static readImageFromFileStringOptions(src: string, stringOptions: string): UIImage;
    static getImageSize(src: string): NSDictionary<string, any>;

    static scaleImage(image: UIImage, scaledImageSize: CGSize): UIImage;

    static toJSON(str: string): NSDictionary<any, any>;
}
