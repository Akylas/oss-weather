# Weather Providers

OSS Weather gets its data from several providers. You choose them in **Settings > Providers**, and you can override them for each favorite location.

## Forecast providers

| | Open-Meteo | Meteo France | OpenWeather | AccuWeather |
|---|---|---|---|---|
| Default | Yes | | | |
| API key | No | No (built-in, optional own key) | Your own key | Your own key |
| Weather alerts | No | Yes (weather warnings) | Yes | Paid AccuWeather plans only |
| Precipitation in the next hour | Yes | Yes | Yes | No |
| Weather models to choose from | Yes | No | No | No |

The number of days (up to 16), hours and minutes shown is set in **Settings > Providers**. Each provider returns at most what its API offers. With AccuWeather the app fetches 5 days and 12 hours.

### Open-Meteo

The default provider. No account or key is needed. See [open-meteo.com](https://open-meteo.com).

Open-Meteo combines many weather models. In **Settings > Providers > Open-Meteo**:

- **Open-Meteo preferred model**: "Best match" (default) or a specific model, such as ECMWF IFS, DWD ICON (Global, EU, D2), NCEP GFS and HRRR, MeteoFrance Arome and Arpege, UK Met Office, GEM, JMA, KNMI, DMI, MeteoSwiss, MET Norway, KMA, and more.
- **Augment models with Best Match**: when you use another model, the app still asks Best Match to fill in values that model lacks (on by default).

You can also pick a model for a single favorite.

### Meteo France

Works out of the box with a key built into the app. You can enter your own in **Settings > Providers > Meteo France**. See [meteofrance.com](https://meteofrance.com).

For locations in France, the overflow menu also offers the **BRA**, the Meteo France avalanche bulletin of the mountain massif the location is in, as a PDF. Long press the entry to choose a massif yourself.

### OpenWeather

Needs your own API key (see [API keys](/guide/api-keys)). The app uses the One Call API. The **OneCall version** setting picks 3.0 (default) or 2.5. See [openweathermap.org](https://openweathermap.org).

### AccuWeather

Needs your own API key (see [API keys](/guide/api-keys)). Alerts are only returned on paid AccuWeather plans. See [accuweather.com](https://accuweather.com).

## Air quality providers

Set in **Settings > Providers > Air Quality Provider**, or per favorite:

- **Open-Meteo** (default), no key
- **AccuWeather**: uses your AccuWeather key
- **ATMO Auvergne-Rhône-Alpes**: the regional air quality agency, for that French region

Air quality appears as the "Air Quality Index" value on the main screen (if enabled in [weather data settings](/guide/settings#weather-data)) and in the daily page with pollutants and pollens. See [Air quality](/features/air-quality).

## Marine provider

**MétéoConsult** adds tides and sea data (sea temperature, wave and swell height). It is off by default. Turn it on per location: **Marine Weather Provider** in the overflow menu (⋮), or in a favorite's menu. Tides show in the daily page.

## Per-location settings

Each favorite can have its own:

- forecast provider
- Open-Meteo model
- air quality provider
- marine provider

Open the favorites drawer and tap the ⋮ on a row. See [Basic usage](/guide/basic-usage#favorites-drawer).

## Quick provider switch

Turn on **Settings > Providers > Actionbar swipe gesture** (off by default). Then swipe left or right on the action bar to show the current location with the next provider. Providers that need a key you haven't set are skipped. This does not change your saved provider.

## Compare models

**Compare models** in the overflow menu lets you pick providers and Open-Meteo models and compare their forecasts for the current location, as charts and as icons per hour or day. See [Compare models](/features/weather-comparison).

## Meteoblue pages

Turn on **Settings > Providers > Meteoblue** (off by default) to add a **meteoblue** entry to the menus. It opens the meteoblue weather, meteogram and "all in one" pages for the location.

## Next steps

- [API keys](/guide/api-keys)
- [Settings](/guide/settings)
- [Weather data](/features/weather-data)
