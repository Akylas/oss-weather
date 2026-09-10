export const WEATHER_CODE_MAPPING = new Map<number, number>();
WEATHER_CODE_MAPPING.set(201, 200);
WEATHER_CODE_MAPPING.set(202, 200);
WEATHER_CODE_MAPPING.set(211, 210);
WEATHER_CODE_MAPPING.set(212, 211);
WEATHER_CODE_MAPPING.set(221, 212);
WEATHER_CODE_MAPPING.set(230, 200);
WEATHER_CODE_MAPPING.set(231, 201);
WEATHER_CODE_MAPPING.set(232, 202);

WEATHER_CODE_MAPPING.set(300, 500);
WEATHER_CODE_MAPPING.set(301, 300);
WEATHER_CODE_MAPPING.set(302, 300);
WEATHER_CODE_MAPPING.set(310, 300);
WEATHER_CODE_MAPPING.set(311, 310);
WEATHER_CODE_MAPPING.set(312, 311);
WEATHER_CODE_MAPPING.set(313, 313);
WEATHER_CODE_MAPPING.set(314, 313);
WEATHER_CODE_MAPPING.set(321, 301);

WEATHER_CODE_MAPPING.set(501, 500);
WEATHER_CODE_MAPPING.set(502, 501);
WEATHER_CODE_MAPPING.set(503, 502);
WEATHER_CODE_MAPPING.set(504, 503);
WEATHER_CODE_MAPPING.set(510, 500);
WEATHER_CODE_MAPPING.set(511, 501);
WEATHER_CODE_MAPPING.set(520, 500);
WEATHER_CODE_MAPPING.set(521, 501);
WEATHER_CODE_MAPPING.set(522, 503);
// 530 is not an OWM code: it was produced by older versions for OpenMeteo code 82 and can still sit in cached data
WEATHER_CODE_MAPPING.set(530, 520);
WEATHER_CODE_MAPPING.set(531, 503);

WEATHER_CODE_MAPPING.set(601, 600);
WEATHER_CODE_MAPPING.set(602, 601);
WEATHER_CODE_MAPPING.set(603, 602);
WEATHER_CODE_MAPPING.set(611, 601);
WEATHER_CODE_MAPPING.set(612, 600);
WEATHER_CODE_MAPPING.set(613, 601);
WEATHER_CODE_MAPPING.set(615, 600);
WEATHER_CODE_MAPPING.set(616, 601);
WEATHER_CODE_MAPPING.set(620, 600);
WEATHER_CODE_MAPPING.set(621, 601);
WEATHER_CODE_MAPPING.set(622, 602);

WEATHER_CODE_MAPPING.set(711, 701);
WEATHER_CODE_MAPPING.set(721, 701);
WEATHER_CODE_MAPPING.set(731, 701);
WEATHER_CODE_MAPPING.set(741, 701);
WEATHER_CODE_MAPPING.set(751, 731);
WEATHER_CODE_MAPPING.set(761, 731);
WEATHER_CODE_MAPPING.set(762, 731);
WEATHER_CODE_MAPPING.set(771, 701);
WEATHER_CODE_MAPPING.set(781, 771);

WEATHER_CODE_MAPPING.set(801, 800);
WEATHER_CODE_MAPPING.set(802, 801);
WEATHER_CODE_MAPPING.set(803, 802);
WEATHER_CODE_MAPPING.set(804, 803);

/**
 * Builds the icon id map from icon file names ('800d.png', '701.png'):
 * icon id => 1 when the pack has day/night variants, 0 when it has a single file.
 */
export function buildIconMap(fileNames: string[], map: Map<number, number>) {
    map.clear();
    return fileNames.reduce((acc, current) => {
        current = current.split('.').slice(0, -1).join('.');
        const length = current.length;
        if (length === 3) {
            acc.set(parseInt(current, 10), 0);
        } else {
            const id = parseInt(current.slice(0, -1), 10);
            if (!acc.has(id)) {
                acc.set(id, 1);
            }
        }
        return acc;
    }, map);
}

/**
 * Resolves a weather icon id to the name of an icon actually present in the pack,
 * walking WEATHER_CODE_MAPPING until a match is found.
 * Returns null when no icon of that pack can represent the id.
 */
export function resolveIconName(iconId: number, isDay: boolean, mapIds: Map<number, number>) {
    if (!iconId && iconId !== 0) {
        return null;
    }
    let realIconId = iconId;
    let mapId = mapIds.get(realIconId);
    while (mapId === undefined && realIconId !== undefined) {
        realIconId = WEATHER_CODE_MAPPING.get(realIconId);
        mapId = mapIds.get(realIconId);
    }
    if (!realIconId) {
        return null;
    }
    return `${realIconId}${mapId === 1 ? (isDay ? 'd' : 'n') : ''}`;
}
