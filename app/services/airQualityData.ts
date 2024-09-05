import { Color } from '@nativescript/core';
import { lc } from '@nativescript-community/l';
import { getIndexedColor, nearest } from '~/utils/utils.common';
import { aqiDataIconColors } from '~/helpers/formatter';
import { CommonAirQualityData } from './providers/weather';

export enum Pollutants {
    CO = 'co',
    NO = 'no',
    NO2 = 'no2',
    O3 = 'o3',
    SO2 = 'so2',
    PM25 = 'pm2_5',
    PM10 = 'pm10',
    NH3 = 'nh3'
}

const POLLUTANT_LEVEL_INDEXES: { [k in Pollutants]?: number[] } = {
    [Pollutants.O3]: [0, 50, 100, 160, 240, 480], // Plume 2023
    [Pollutants.NO2]: [0, 10, 25, 200, 400, 1000], // Plume 2023
    [Pollutants.PM10]: [0, 15, 45, 80, 160, 400], // Plume 2023
    [Pollutants.PM25]: [0, 5, 15, 30, 60, 150], // Plume 2023
    [Pollutants.SO2]: [0, 20, 40 /* daily */, 270, 500 /* 10 min */, 960 /* linear prolongation */], // WHO 2021
    [Pollutants.CO]: [0, 2, 4 /* daily */, 35 /* hourly */, 100 /* 15 min */, 230 /* linear prolongation */] // WHO 2021
};

const AIR_LEVEL_INDEXES = [0, 20, 40, 60, 80, 100];
const AIR_QUALITY_COLORS = ['#7bd878', '#c5e173', '#f9cc33', '#f38725', '#ec2c45', '#7d2181'];

const POLLEN_LEVEL_INDEXES = [0, 0, 25, 50, 75, 100];
const POLLEN_LEVEL_COLORS = ['#bfbfbf', '#08c286', '#08c286', '#6ad555', '#ffd741', '#ffab40', '#ff3b30'];

const POLLUTANT_LEVEL_COLORS = ['#50f0e6', '#50ccaa', '#f0e641', '#ff5050', '#960032', '#872181'];
// const AIR_QUALITY_COLORS_BREEZY = ['#00e59b', '#ffc302', '#ff712b', '#f62a55', '#c72eaa', '#9930ff'];
export const POLLUTANT_DEFAULT_LEVEL_INDEXES = [0, 20, 50, 100, 150, 250];

export const POLLENS_POLLUTANTS_TITLES = {
    [Pollutants.O3]: lc('o3'),
    [Pollutants.NO2]: lc('no2'),
    [Pollutants.PM10]: lc('pm10'),
    [Pollutants.PM25]: lc('pm25'),
    [Pollutants.SO2]: lc('so2'),
    [Pollutants.CO]: lc('co'),
    mold: lc('mold'),
    alder: lc('alnus'),
    birch: lc('betula'),
    grass: lc('poaeceae'),
    mugwort: lc('artemisia'),
    olive: lc('olea'),
    ragweed: lc('ambrosia')
};

export function colorForPollutant(value, key) {
    return getIndexedColor(value, POLLUTANT_LEVEL_INDEXES[key] || POLLUTANT_DEFAULT_LEVEL_INDEXES, POLLUTANT_LEVEL_COLORS);
}

function _getIndex(cp: number, bpLo: number, bpHi: number, inLo: number, inHi: number) {
    const result = Math.round(((inHi - inLo) / (bpHi - bpLo)) * (cp - bpLo) + inLo);
    // Result will be incorrect if we don’t cast to double
    return result;
}

function getIndexFromLevel(pollutant: Pollutants, cp: number, level: number) {
    const thresholds = POLLUTANT_LEVEL_INDEXES[pollutant];
    if (!thresholds) {
        return -1;
    }
    if (level < thresholds.length - 1) {
        return _getIndex(cp, thresholds[level], thresholds[level + 1], POLLUTANT_DEFAULT_LEVEL_INDEXES[level], POLLUTANT_DEFAULT_LEVEL_INDEXES[level + 1]);
    } else {
        // Continue producing a linear index above lastIndex
        return Math.round((cp * POLLUTANT_DEFAULT_LEVEL_INDEXES[POLLUTANT_DEFAULT_LEVEL_INDEXES.length - 1]) / thresholds[thresholds.length - 1]);
    }
}

export function getPollutantIndex(pollutant: Pollutants, cp: number) {
    if (cp == null) return null;
    const thresholds = POLLUTANT_LEVEL_INDEXES[pollutant];
    const [low, high] = nearest(thresholds, cp);
    if (low >= 0) {
        return getIndexFromLevel(pollutant, cp, low);
    } else {
        return null;
    }
}

export function getAqiFromPollutants(pollutants: { [k in Pollutants]?: { value: number } }) {
    return Math.max(...[Pollutants.O3, Pollutants.NO2, Pollutants.PM10, Pollutants.PM25].map((p) => getPollutantIndex(p, pollutants[p].value)));
}

export function colorForAqi(value) {
    return getIndexedColor(value, AIR_LEVEL_INDEXES, AIR_QUALITY_COLORS);
    // if (value >= 100) {
    //     return '#7d2181';
    // } else if (value >= 80) {
    //     return '#ec2c45';
    // } else if (value >= 60) {
    //     return '#f38725';
    // } else if (value >= 40) {
    //     return '#f9cc33';
    // } else if (value >= 20) {
    //     return '#c5e173';
    // } else {
    //     return '#7bd878';
    // }
}

export function colorForPollen(value) {
    return getIndexedColor(value, POLLEN_LEVEL_INDEXES, POLLEN_LEVEL_COLORS);
    // if (value === 0) {
    //     return '#bfbfbf';
    // }
    // if (value <= 25) {
    //     return '#08c286';
    // }
    // if (value <= 50) {
    //     return '#6ad555';
    // }
    // if (value <= 75) {
    //     return '#ffd741';
    // }
    // if (value <= 100) {
    //     return '#ffab40';
    // }
    // return '#ff3b30';
}

export function prepareAirQualityData<T extends CommonAirQualityData>(d: T, lastDay?) {
    d.aqi = getAqiFromPollutants(d.pollutants);
    if (lastDay) {
        lastDay.tempDatas.aqi = lastDay.tempDatas.aqi || { sum: 0, count: 0 };
        lastDay.tempDatas.aqi.sum += d.aqi;
        lastDay.tempDatas.aqi.count += 1;
    }
    return aqiDataIconColors(d);
}
