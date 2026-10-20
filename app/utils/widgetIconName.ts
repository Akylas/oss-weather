// the font family can be a resource path ("res/inter"): the file name must stay a single path segment
export function widgetIconFileName(fontFamily: string, glyph: string, color: string): string {
    return `${fontFamily.replace(/[^\w-]/g, '_')}_${glyph.codePointAt(0).toString(16)}_${color.replace('#', '')}.png`;
}
