import { describe, expect, it } from 'vitest';
import { evaluateMapboxExpression } from './nativescript-svelte-generator';

describe('evaluateMapboxExpression item paths', () => {
    it('guards nested item properties that can be missing', () => {
        expect(evaluateMapboxExpression(['get', 'item.wind.value'])).toBe('item.wind?.value');
    });

    it('guards nested item properties in has checks', () => {
        expect(evaluateMapboxExpression(['has', 'item.wind.iconPath'])).toBe('item.wind?.iconPath != null');
    });

    it('keeps single level item properties as is', () => {
        expect(evaluateMapboxExpression(['get', 'item.hour'])).toBe('item.hour');
    });

    it('does not call startsWith on a numeric icon id', () => {
        const src = evaluateMapboxExpression(['get', 'item.iconPath']);
        const iconService = { getIconPath: (iconId: unknown) => `icon:${String(iconId)}` };
        const config = { iconSet: undefined };
        const resolve = (item: { iconPath: unknown }) => new Function('item', 'iconService', 'config', `return ${src}`)(item, iconService, config);
        expect(resolve({ iconPath: 800 })).toBe('icon:800');
        expect(resolve({ iconPath: '/data/icon.png' })).toBe('/data/icon.png');
    });
});
