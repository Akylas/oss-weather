export enum ClimaCellDataKeys {
    temp = 'temp',
    feels_like = 'feels_like',
    dewpoint = 'dewpoint',
    humidity = 'humidity',
    wind_speed = 'wind_speed',
    wind_direction = 'wind_direction',
    wind_gust = 'wind_gust',
    baro_pressure = 'baro_pressure',
    precipitation = 'precipitation',
    precipitation_type = 'precipitation_type',
    precipitation_probability = 'precipitation_probability',
    precipitation_accumulation = 'precipitation_accumulation',
    sunrise = 'sunrise',
    sunset = 'sunset',
    visibility = 'visibility',
    cloud_cover = 'cloud_cover',
    cloud_base = 'cloud_base',
    cloud_ceiling = 'cloud_ceiling',
    satellite_cloud = 'satellite_cloud',
    surface_shortwave_radiation = 'surface_shortwave_radiation',
    moon_phase = 'moon_phase',
    weather_code = 'weather_code',
}
type TestMap<T extends string> = {
    [key in T]: { value: number; units?: string };
};

// export type ClimaCellDataKeys = 'temp' | 'cloud_cover';
export interface ClimaCellNowCastData extends TestMap<ClimaCellDataKeys> {
    lat: number;
    lon: number;
    observation_time: {
        value: string;
    };
}
export type ClimaCellNowCast = ClimaCellNowCastData[];
export type ClimaCellHourly = ClimaCellNowCastData[];
export type ClimaCellDaily = ClimaCellNowCastData[];
