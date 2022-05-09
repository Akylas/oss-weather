export interface MFForecastResult {
    position: Position;
    updated_on: number;
    daily_forecast: Dailyforecast[];
    forecast: Forecast[];
    probability_forecast: Probabilityforecast[];
}

export interface Probabilityforecast {
    dt: number;
    rain: Rain;
    snow: Rain;
    freezing: number;
}

export interface Forecast {
    dt: number;
    T: T2;
    humidity: number;
    sea_level: number;
    wind: Wind;
    rain: Rain;
    snow: Rain;
    iso0: number;
    'rain snow limit': number | string;
    clouds: number;
    weather: Weather12H;
}

export interface Rain {
    '1h'?: number;
    '3h'?: number;
    '6h'?: number;
    '12h'?: number;
    '24h'?: number;
}

export interface Wind {
    speed: number;
    gust: number;
    direction: number | 'Variable';
    icon: string;
}

export interface T2 {
    value: number;
    windchill: number;
}

export interface Dailyforecast {
    dt: number;
    T: T;
    humidity: Humidity;
    precipitation: Precipitation;
    uv?: number;
    weather12H: Weather12H;
    sun: Sun;
}

export interface Sun {
    rise: number;
    set: number;
}

export interface Weather12H {
    icon: string;
    desc: string;
}

export interface Precipitation {
    '24h': number;
}

export interface Humidity {
    min: number;
    max: number;
}

export interface T {
    min: number;
    max: number;
    sea?: any;
}

export interface Coord {
    lon: number;
    lat: number;
}
export interface Position {
    lat: number;
    lon: number;
    alti: number;
    name: string;
    country: string;
    dept: string;
    rain_product_available: number;
    timezone: string;
    insee?: string;
    bulletin_cote: number;
}

export interface MFMinutely {
    position: Position;
    updated_on: number;
    quality: number;
    forecast: RainForecast[];
}

export interface RainForecast {
    dt: number;
    rain: number;
    desc: string;
}

export interface MFCurrent {
    position: Position;
    updated_on: number;
    observation: Observation;
}

export interface Observation {
    T: number;
    wind: Wind;
    weather: Weather;
}

export interface Weather {
    icon: string;
    desc: string;
}

export interface MFWarnings {
    update_time: number;
    end_validity_time: number;
    domain_id: string;
    color_max: number;
    timelaps: Timelap[];
    phenomenons_items: Phenomenonsitem[];
    advices?: any;
    consequences?: any;
    max_count_items?: any;
    comments: Comments;
    text?: any;
    text_avalanche?: any;
}

export interface Comments {
    begin_time: number;
    end_time: number;
    text_bloc_item: Textblocitem[];
}

export interface Textblocitem {
    title: string;
    title_html: string;
    text_html: any[];
    text: any[];
}

export interface Phenomenonsitem {
    phenomenon_id: number;
    phenomenon_max_color_id: number;
}

export interface Timelap {
    phenomenon_id: number;
    timelaps_items: Timelapsitem[];
}

export interface Timelapsitem {
    begin_time: number;
    color_id: number;
}
