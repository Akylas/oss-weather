import { readdirSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { buildIconMap, resolveIconName } from './iconMapping';
import { convertWeatherCodeToIcon } from './providers/omIcons';

const ICON_THEMES_FOLDER = join(__dirname, '../assets/icon_themes');

function iconMapForPack(pack: string) {
    return buildIconMap(readdirSync(join(ICON_THEMES_FOLDER, pack, 'images')), new Map<number, number>());
}

const PACKS = readdirSync(ICON_THEMES_FOLDER);

describe('resolveIconName', () => {
    it('resolves an id the pack has, with its day/night variant', () => {
        const mapIds = iconMapForPack('meteocons');
        expect(resolveIconName(800, true, mapIds)).toBe('800d');
        expect(resolveIconName(800, false, mapIds)).toBe('800n');
        expect(resolveIconName(701, true, mapIds)).toBe('701');
    });

    it('walks the mapping chain for an id the pack lacks', () => {
        expect(resolveIconName(804, true, iconMapForPack('weathericons'))).toBe('802d');
    });

    it('resolves 530, still present in cached data of older versions', () => {
        expect(resolveIconName(530, true, iconMapForPack('meteocons'))).toBe('520');
        expect(resolveIconName(530, true, iconMapForPack('weathericons'))).toBe('500d');
    });

    it('returns null for an unknown id', () => {
        expect(resolveIconName(9999, true, iconMapForPack('meteocons'))).toBeNull();
    });

    it.each(PACKS)('resolves every icon id OpenMeteo can produce (%s)', (pack) => {
        const mapIds = iconMapForPack(pack);
        // WMO codes as documented by OpenMeteo
        const iconIds = Array.from({ length: 100 }, (_, code) => convertWeatherCodeToIcon(code)).filter((iconId) => iconId !== undefined);
        const unresolved = iconIds.filter((iconId) => resolveIconName(iconId, true, mapIds) === null);
        expect(unresolved).toEqual([]);
    });
});
