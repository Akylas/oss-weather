interface WeatherData {
    currently: Currently;
    daily: Daily;
    minutely: Minutely;
    alerts: Alert[];
}

interface Alert {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
}

interface Minutely {
    data: MinutelyData[];
}

interface MinutelyData {
    intensity: number;
    time: number;
}

interface Daily {
    data: DailyData[];
}

interface DailyData {
    time: number;
    icon: string;
    description: string;
    windSpeed: number;
    windGust: number;
    temperatureMin: number;
    temperatureMax: number;
    temperatureNight?: number;
    precipProbability: number;
    cloudCover: number;
    precipColor: string | Color;
    windBearing: number;
    humidity: number;
    pressure: number;
    moonIcon: string;
    sunriseTime?: number;
    sunsetTime?: number;
    precipAccumulation: number;
    precipAccumulation: number;
    color: string | Color;
    cloudColor?: string | Color;
    uvIndexColor: string | Color;
    uvIndex: number;
    windBeaufortIcon?: any;
    windIcon: string;
    hourly: Hourly[];

    rainSnowLimit?: number;
    iso?: number;
}

interface Hourly {
    time: number;
    icon: string;
    description: string;
    cloudCeiling?: number;
    windSpeed: number;
    temperature: number;
    feelTemperature?: number;
    windBearing: number;
    precipAccumulation: number;
    snowfall: number;
    precipProbability: number;
    precipProbabilities?: {
        rain: number;
        snow: number;
        ice: number;
    };
    cloudCover: number;
    humidity: number;
    windGust: number;
    pressure: number;
    precipColor: string | Color;
    color: string | Color;
    windBeaufortIcon?: any;
    cloudColor: string | Color;
    windIcon: string;
    rainSnowLimit?: number;
    iso?: number;
    snowDepth?: number;
}
interface Currently {
    time: number;
    temperature: number;
    pressure: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudColor: string | Color;
    uvIndexColor: string | Color;
    precipColor: string | Color;
    color: string | Color;
    uvIndex: number;
    moonIcon: string;
    sunriseTime: number;
    sunsetTime: number;
    icon: string;
    description: string;
    windBeaufortIcon: string;
    windIcon: string;
}
