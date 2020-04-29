export interface Currently {
    time: number;
    summary: string;
    icon: string;
    precipIntensity: number;
    precipProbability: number;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number;
}

export interface HourlyData {
    index: number;
    time: number;
    color?: string;
    summary: string;
    icon: string;
    precipIntensity: number;
    precipProbability: number;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    windIcon?: string;
    windBeaufortIcon?: string;
    cloudCover: number;
    cloudColor?: string;
    uvIndex: number;
    visibility: number;
    ozone: number;
    precipType: string;
}

export interface Hourly {
    summary: string;
    icon: string;
    data: HourlyData[];
}

export interface DailyData {
    hourly: HourlyData[];
    time: number;
    summary: string;
    icon: string;
    hourlyData?;
    sunriseTime: number;
    sunsetTime: number;
    moonPhase: number;
    precipIntensity: number;
    precipIntensityMax: number;
    precipIntensityMaxTime: number;
    precipProbability: number;
    precipType: string;
    precipAccumulation: number;
    temperatureHigh: number;
    temperatureHighTime: number;
    temperatureLow: number;
    temperatureLowTime: number;
    apparentTemperatureHigh: number;
    apparentTemperatureHighTime: number;
    apparentTemperatureLow: number;
    apparentTemperatureLowTime: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windGustTime: number;
    windBearing: number;
    windIcon?: string;
    windBeaufortIcon?: string;
    moonIcon?: string;
    color?: string;
    uvIndexColor?: string;
    cloudColor?: string;
    cloudCover: number;
    uvIndex: number;
    uvIndexTime: number;
    visibility: number;
    ozone: number;
    temperatureMin: number;
    temperatureMinTime: number;
    temperatureMax: number;
    temperatureMaxTime: number;
    apparentTemperatureMin: number;
    apparentTemperatureMinTime: number;
    apparentTemperatureMax: number;
    apparentTemperatureMaxTime: number;
}
export interface MinutelyData {
    time: number;
    summary: string;
    icon: string;
    precipIntensity: number;
    precipProbability: number;
    precipType: string;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number;
}

export interface Daily {
    summary: string;
    icon: string;
    data: DailyData[];
}

export interface Minutely {
    summary: string;
    icon: string;
    data: MinutelyData[];
}

export interface Alert {
    title: string;
    regions: string[];
    severity: string;
    alertColor?: string;
    time: number;
    expires: number;
    description: string;
    uri: string;
}

export interface Flags {
    sources: string[];
    'meteoalarm-license': string;
    'nearest-station': number;
    units: string;
}

export interface DarkSky {
    latitude: number;
    longitude: number;
    timezone: string;
    currently: Currently;
    minutely: any;
    hourly: Hourly;
    daily: Daily;
    alerts: Alert[];
    flags: Flags;
    offset: number;
}
