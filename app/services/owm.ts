export interface Coord {
    lon: number;
    lat: number;
}

export interface Weather {
    id: number;
    main: string;
    description: string;
    icon: string;
}

export interface Main {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
}

export interface Wind {
    speed: number;
    deg: number;
}

export interface Rain {
    '1h'?: number;
    '3h'?: number;
}
export interface Snow {
    '1h'?: number;
    '3h'?: number;
}

export interface Clouds {
    all: number;
}

export interface Sys {
    type?: number;
    id?: number;
    country?: string;
    sunrise?: number;
    sunset?: number;
    pod?: string;
}

export interface Alert {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
}

export interface CityWeather {
    coord: Coord;
    weather: Weather[];
    base: string;
    main: Main;
    visibility: number;
    wind?: Wind;
    rain?: Rain;
    snow?: Snow;
    clouds?: Clouds;
    dt: number;
    sys?: Sys;
    timezone: number;
    id: number;
    name: string;
    cod: number;
}

export interface ListWeather {
    weather: Weather[];
    main: Main;
    visibility: number;
    wind?: Wind;
    rain?: Rain;
    snow?: Snow;
    clouds?: Clouds;
    dt: number;
    dt_txt: string;
}
