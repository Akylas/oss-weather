import { describe, expect, it } from 'vitest';
import { widgetIconFileName } from './widgetIconName';

describe('widgetIconFileName', () => {
    it('names the file after the font, the glyph code and the color', () => {
        expect(widgetIconFileName('mdi', '\ue915', '#EF9F27')).toBe('mdi_e915_EF9F27.png');
    });

    it('stays a single file name when the font family is a path', () => {
        expect(widgetIconFileName('res/inter', '\ue915', '#EF9F27')).toBe('res_inter_e915_EF9F27.png');
    });
});
