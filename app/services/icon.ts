import { ApplicationSettings, File, Folder, Observable, knownFolders, path } from '@nativescript/core';
import { prefs } from './preferences';

const iconThemesFolder = path.join(knownFolders.currentApp().path, 'assets/icon_themes');

const WEATHER_CODE_MAPPING = new Map<number, number>();
WEATHER_CODE_MAPPING.set(201, 200);
WEATHER_CODE_MAPPING.set(202, 200);
WEATHER_CODE_MAPPING.set(211, 210);
WEATHER_CODE_MAPPING.set(212, 210);
WEATHER_CODE_MAPPING.set(221, 212);
WEATHER_CODE_MAPPING.set(230, 200);
WEATHER_CODE_MAPPING.set(231, 201);
WEATHER_CODE_MAPPING.set(232, 202);

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

function fillIconMap(folderPath: string, map: Map<number, number>) {
    map.clear();
    Folder.fromPath(folderPath)
        .getEntitiesSync()
        .map((e) => e.name)
        .reduce((acc, current) => {
            current = current.slice(0, -4);
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
export class IconService extends Observable {
    getIconConfig() {
        if (!this.iconSetConfig) {
            this.iconSetConfig = JSON.parse(File.fromPath(path.join(this.iconSetFolderPath, 'config.json')).readTextSync());
        }
        return this.iconSetConfig;
    }
    getPackName() {
        return this.getIconConfig().name;
    }
    getPackIcon() {
        return path.join(this.iconSetFolderPath, 'images/800d.png');
    }
    iconSet: string;
    iconSetFolderPath: string;
    iconSetConfig;
    images: Map<number, number> = new Map<number, number>();
    lotties: Map<number, number> = new Map<number, number>();
    mappingCache: Map<string, string> = new Map<string, string>();
    constructor() {
        super();
        this.load();
        prefs.on('key:icon_set', this.load, this);
    }
    load() {
        this.iconSet = ApplicationSettings.getString('icon_set', 'meteocons');
        this.iconSetFolderPath = path.join(iconThemesFolder, this.iconSet);
        this.iconSetConfig = null;
        fillIconMap(path.join(this.iconSetFolderPath, 'images'), this.images);
        fillIconMap(path.join(this.iconSetFolderPath, 'lottie'), this.lotties);
        this.mappingCache.clear();
    }
    getIcon(iconId: number, isDay: boolean, animated = false) {
        const key = `${iconId}${isDay ? 1 : 0}${animated ? 1 : 0}`;
        const cached = this.mappingCache.get(key);
        if (cached) {
            return cached;
        }
        if (iconId === undefined) {
            return null;
        }
        const mapIds = animated ? this.lotties : this.images;
        let realIconId = iconId;
        let mapId = mapIds.get(realIconId);
        while (mapId === undefined) {
            realIconId = WEATHER_CODE_MAPPING.get(realIconId);
            mapId = mapIds.get(realIconId);
        }
        const result = `${realIconId}${mapId === 1 ? (isDay ? 'd' : 'n') : ''}`;
        this.mappingCache.set(key, result);
        return result;
    }
}
export const iconService = new IconService();
