# Air Quality

An air quality index, pollutant levels and pollen levels for your location.

<img class="ow-shot" src="/features/air-quality.webp" alt="Air quality and pollen cards">

## Turning it on

Air quality is **off by default**. To enable it:

1. Open Settings > Weather data.
2. Move **Air Quality Index** from the disabled list to the enabled list.

The app then fetches air quality data with each weather update.

## Where it appears

- **Main screen**: the current index with the other weather data, colored by level
- **Daily list**: the index of each day, when available
- **Daily page**: an **Air quality** card and a **Pollens** card (tap a day to open it)

On the daily page, the modern style shows each pollutant or pollen with its value, unit and a colored level bar. The air quality card title shows the level and index, for example "Fair · 33".

## Index and levels

The index is calculated by the app from ozone, nitrogen dioxide, PM10 and PM2.5. It uses six European-style bands:

| Index | Level |
|-------|-------|
| 0 to 19 | Good |
| 20 to 39 | Fair |
| 40 to 59 | Moderate |
| 60 to 79 | Poor |
| 80 to 99 | Very poor |
| 100 and above | Extremely poor |

## Pollutants

- PM2.5 and PM10 (fine and coarse particles)
- O3 (ozone)
- NO2 (nitrogen dioxide)
- SO2 (sulfur dioxide)
- CO (carbon monoxide)

## Pollen

With Open-Meteo, the app also shows pollen levels:

- Alder, birch, grass, mugwort, olive, ragweed

## Air quality providers

| Provider | What it gives |
|----------|---------------|
| Open-Meteo (default) | Hourly pollutants and pollen, for the next days |
| ATMO Auvergne-Rhône-Alpes | Hourly pollutants for that French region |
| AccuWeather | Current pollutants only, needs an [API key](/guide/api-keys) |

Choose the default in Settings > Providers > **Air Quality Provider**. Each saved location can use its own: in the favorites drawer, tap the menu of a location, then the air quality provider entry.

## Next steps

- [Weather data](/features/weather-data)
- [Daily forecasts](/features/daily-forecasts)
