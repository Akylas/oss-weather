import { GenericMapPos, MapBounds } from '@nativescript-community/ui-carto/core';

export interface IMapBounds {
    northeast: GenericMapPos<LatLonKeys>;
    southwest: GenericMapPos<LatLonKeys>;
}
export type IMapPos =  GenericMapPos<LatLonKeys>;


const TO_RAD = Math.PI / 180;
const TO_DEG = 180 / Math.PI;
const PI_X2 = Math.PI * 2;
const PI_DIV4 = Math.PI / 4;

/**
 * Calculates the center of a collection of geo coordinates
 *
 * @param        array       Collection of coords [{lat: 51.510, lon: 7.1321} {lat: 49.1238, lon: "8° 30' W"} ...]
 * @return       object      {lat: centerLat, lon: centerLng}
 */
export function getCenter(...coords: GenericMapPos<LatLonKeys>[]) {
    if (!coords.length) {
        return undefined;
    }

    let X = 0.0;
    let Y = 0.0;
    let Z = 0.0;
    let lat, lon, coord: GenericMapPos<LatLonKeys>;

    for (let i = 0, l = coords.length; i < l; ++i) {
        coord = coords[i];
        lat = coord.lat * TO_RAD;
        lon = coord.lon * TO_RAD;

        X += Math.cos(lat) * Math.cos(lon);
        Y += Math.cos(lat) * Math.sin(lon);
        Z += Math.sin(lat);
    }

    const nb_coords = coords.length;
    X = X / nb_coords;
    Y = Y / nb_coords;
    Z = Z / nb_coords;

    lon = Math.atan2(Y, X);
    const hyp = Math.sqrt(X * X + Y * Y);
    lat = Math.atan2(Z, hyp);

    return {
        lat: lat * TO_DEG,
        lon: lon * TO_DEG
    } as GenericMapPos<LatLonKeys>;
}

export function getBoundsZoomLevel(bounds: IMapBounds, mapDim: { width: number; height: number }, worldDim = 256) {
    const zoomMax = 24;

    function latRad(lat) {
        const sin = Math.sin((lat * Math.PI) / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.round(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const ne = bounds.northeast;
    const sw = bounds.southwest;

    const latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

    const lngDiff = ne.lon - sw.lon;
    const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

    const latZoom = zoom(mapDim.height, worldDim, latFraction);
    const lngZoom = zoom(mapDim.width, worldDim, lngFraction);

    return Math.min(Math.min(latZoom, lngZoom), zoomMax);
}

const R = 6371000;

function toRad(_number) {
    return (_number * Math.PI) / 180;
}

// return m/s
export function computeDistance(_pos1: GenericMapPos<LatLonKeys>, _pos2: GenericMapPos<LatLonKeys>) {
    // m
    const dLat_2 = toRad(_pos2.lat - _pos1.lat) / 2;
    const dLon_2 = toRad(_pos2.lon - _pos1.lon) / 2;
    const lat1 = toRad(_pos1.lat);
    const lat2 = toRad(_pos2.lat);
    const el1 = _pos1.altitude || 0;
    const el2 = _pos2.altitude || 0;
    // for now we can't trust altitude to compute distance ...
    const height = 0;
    // const height = el1 - el2;

    const a = Math.sin(dLat_2) * Math.sin(dLat_2) + Math.sin(dLon_2) * Math.sin(dLon_2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.sqrt(Math.pow(R * c, 2) + Math.pow(height, 2));
}

export function getBounds(sourceLocs: GenericMapPos<LatLonKeys>[] | [number, number][]) {
    const northeast: GenericMapPos<LatLonKeys> = {
        lat: -Infinity,
        lon: -Infinity
    };
    const southwest: GenericMapPos<LatLonKeys> = {
        lat: Infinity,
        lon: Infinity
    };
    const isMapPosArray = typeof sourceLocs[0] === 'object';
    if (isMapPosArray) {
        (sourceLocs as GenericMapPos<LatLonKeys>[]).forEach(l => {
            northeast.lat = Math.max(l.lat, northeast.lat);
            southwest.lat = Math.min(l.lat, southwest.lat);
            northeast.lon = Math.max(l.lon, northeast.lon);
            southwest.lon = Math.min(l.lon, southwest.lon);
        });
    } else {
        sourceLocs.forEach(l => {
            northeast.lat = Math.max(l[0], northeast.lat);
            southwest.lat = Math.min(l[0], southwest.lat);
            northeast.lon = Math.max(l[1], northeast.lon);
            southwest.lon = Math.min(l[1], southwest.lon);
        });
    }

    // console.log('getBounds', northeast, southwest)
    return new MapBounds<LatLonKeys>(northeast, southwest);
}
