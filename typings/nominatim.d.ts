export interface NominatimResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    address: NominatimAddress;
    boundingbox: string[];
}

export interface NominatimAddress {
    road: string;
    industrial: string;
    village: string;
    municipality: string;
    city: string;
    town: string;
    hamlet: string;
    county: string;
    house_number?: string;
    'ISO3166-2-lvl6': string;
    state: string;
    'ISO3166-2-lvl4': string;
    region: string;
    postcode: string;
    country: string;
    country_code: string;
}
