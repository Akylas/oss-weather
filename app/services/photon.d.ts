export interface Geometry {
    coordinates: number[];
    type: string;
}

export interface Properties {
    osm_id: any;
    osm_type: string;
    extent: number[];
    country: string;
    osm_key: string;
    osm_value: string;
    name: string;
    state: string;
    housenumber: string;
    city: string;
    street: string;
    postcode: string;
}

export interface Feature {
    geometry: Geometry;
    type: string;
    properties: Properties;
}

export interface Photon {
    features: Feature[];
    type: string;
}
