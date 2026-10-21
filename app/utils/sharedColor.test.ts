import { describe, expect, it } from 'vitest';
import { formatHex, hsvToRgb, parseHex, rgbToHsv } from '@shared/utils/color';

describe('parseHex', () => {
    it('parses 6 digits with hash', () => {
        expect(parseHex('#FF8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 });
    });
    it('parses without hash, lowercase', () => {
        expect(parseHex('ff8800')).toEqual({ r: 255, g: 136, b: 0, a: 1 });
    });
    it('parses 8 digits as RRGGBBAA', () => {
        expect(parseHex('#FF880080')).toEqual({ r: 255, g: 136, b: 0, a: 128 / 255 });
    });
    it('trims whitespace', () => {
        expect(parseHex('  #000000 ')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });
    it('rejects invalid input', () => {
        expect(parseHex('')).toBeNull();
        expect(parseHex('#12')).toBeNull();
        expect(parseHex('#GG0000')).toBeNull();
        expect(parseHex('#FF88001')).toBeNull();
        expect(parseHex('#FF8800800')).toBeNull();
    });
});

describe('formatHex', () => {
    it('omits alpha when opaque', () => {
        expect(formatHex({ r: 255, g: 136, b: 0 })).toBe('#FF8800');
    });
    it('appends alpha when translucent', () => {
        expect(formatHex({ r: 255, g: 136, b: 0 }, 128 / 255)).toBe('#FF880080');
    });
    it('pads small channels', () => {
        expect(formatHex({ r: 0, g: 1, b: 10 })).toBe('#00010A');
    });
    it('round-trips with parseHex', () => {
        const parsed = parseHex('#12345678');
        expect(formatHex(parsed, parsed.a)).toBe('#12345678');
    });
});

describe('hsvToRgb / rgbToHsv', () => {
    it('converts primaries', () => {
        expect(hsvToRgb(0, 1, 1)).toEqual({ r: 255, g: 0, b: 0 });
        expect(hsvToRgb(120, 1, 1)).toEqual({ r: 0, g: 255, b: 0 });
        expect(hsvToRgb(240, 1, 1)).toEqual({ r: 0, g: 0, b: 255 });
    });
    it('converts white and black', () => {
        expect(hsvToRgb(0, 0, 1)).toEqual({ r: 255, g: 255, b: 255 });
        expect(hsvToRgb(200, 1, 0)).toEqual({ r: 0, g: 0, b: 0 });
    });
    it('gives hue 0 and saturation 0 for gray', () => {
        expect(rgbToHsv(128, 128, 128)).toEqual({ h: 0, s: 0, v: 128 / 255 });
    });
    it('reads hue from the dominant channel', () => {
        expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 1, v: 1 });
        expect(rgbToHsv(255, 0, 255).h).toBeCloseTo(300);
    });
    it('round-trips a grid of rgb values', () => {
        for (let red = 0; red < 256; red += 51) {
            for (let green = 0; green < 256; green += 51) {
                for (let blue = 0; blue < 256; blue += 51) {
                    const { h, s, v } = rgbToHsv(red, green, blue);
                    expect(hsvToRgb(h, s, v)).toEqual({ r: red, g: green, b: blue });
                }
            }
        }
    });
});
