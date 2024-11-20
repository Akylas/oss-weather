export enum UNITS {
    InchHg = 'InchHg',
    MMHg = 'MMHg',
    kPa = 'kPa',
    IconId = 'iconId',
    UV = '',
    MM = 'mm',
    CM = 'cm',
    Percent = '%',
    Celcius = '°',
    Fahrenheit = '°F',
    PressureHpa = 'hPa',
    Duration = 'duration',
    Date = 'date',
    Meters = 'm',
    Feet = 'ft',
    Inch = 'in',
    Kilometers = 'km',
    Miles = 'mi',
    SpeedKm = 'km/h',
    MPH = 'mph',
    FPH = 'ft/h',
    SpeedM = 'm/h'
}

export enum UNIT_FAMILIES {
    Uv = 'uv',
    Percent = 'percent',
    Temperature = 'temp',
    Distance = 'dist',
    DistanceSmall = 'distSmall',
    DistanceVerySmall = 'distVerySmall',
    Precipitation = 'prec',
    Speed = 'speed',
    Pressure = 'pressure'
}

export const DEFAULT_IMPERIAL_UINTS = {
    [UNIT_FAMILIES.DistanceSmall]: UNITS.Inch,
    [UNIT_FAMILIES.DistanceVerySmall]: UNITS.Inch,
    [UNIT_FAMILIES.Uv]: UNITS.UV,
    [UNIT_FAMILIES.Percent]: UNITS.Percent,
    [UNIT_FAMILIES.Temperature]: UNITS.Fahrenheit,
    [UNIT_FAMILIES.Distance]: UNITS.Feet,
    [UNIT_FAMILIES.Precipitation]: UNITS.Inch,
    [UNIT_FAMILIES.Speed]: UNITS.MPH,
    [UNIT_FAMILIES.Pressure]: UNITS.PressureHpa
};

export const DEFAULT_METRIC_UINTS = {
    [UNIT_FAMILIES.DistanceSmall]: UNITS.CM,
    [UNIT_FAMILIES.DistanceVerySmall]: UNITS.MM,
    [UNIT_FAMILIES.Uv]: UNITS.UV,
    [UNIT_FAMILIES.Percent]: UNITS.Percent,
    [UNIT_FAMILIES.Temperature]: UNITS.Celcius,
    [UNIT_FAMILIES.Distance]: UNITS.Meters,
    [UNIT_FAMILIES.Precipitation]: UNITS.MM,
    [UNIT_FAMILIES.Speed]: UNITS.SpeedKm,
    [UNIT_FAMILIES.Pressure]: UNITS.PressureHpa
};
