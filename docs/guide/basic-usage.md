# Basic Usage

A tour of the main screen and the places you reach from it.

<div class="ow-shots">
  <img class="ow-shot" src="/features/main.webp" alt="Main screen">
  <img class="ow-shot" src="/features/favorites.webp" alt="Favorites drawer">
</div>

## Action bar

From left to right:

- **☰ menu icon**: opens the [favorites drawer](#favorites-drawer). You can also swipe from the left edge.
- **Star**: adds the current location to your favorites, or removes it.
- **Location name**
- **Alert icon**: only shown when the provider reports weather alerts. Tap it to read them.
- **Search**: find a place by name.
- **⋮ overflow menu** (see below)

### Overflow menu

- **Refresh**
- **Chart**: full-page hourly chart
- **Compare models**: compare providers and Open-Meteo models for this location
- **Map**: the weather map
- **meteoblue**: only if enabled in Settings > Providers
- **Marine Weather Provider**: turn MétéoConsult tides and sea data on or off for this location
- **BRA**: Meteo France avalanche bulletin, only for locations in France
- **Select location on map**
- **Find GPS location** (when location is available)
- **Preferences**: opens [Settings](/guide/settings)

## Main screen

From top to bottom:

1. **Current weather**: temperature, condition and icon, today's low and high.
2. **Weather data**: wind, precipitation, cloud cover, UV and more. You choose which values appear and their order in [Settings > Weather data](/guide/settings#weather-data). They are drawn as an aligned grid (default), chips or blocks, set in Settings > Appearance.
3. **Precipitation for the next hour**: a small chart, when the provider has minute data and rain is expected.
4. **Sunrise, sunset and moon phase**, and the time of the last update.
5. **Hourly forecast**: scroll sideways.
6. **Daily list**: one row per day, with the condition, the low/high range bar and the day's data.

The provider used is shown at the bottom ("Powered by ...").

### Hourly display modes

Set in **Settings > Hourly > Main view hourly display mode**:

- **Classic** (default): one column per hour with icon, wind, temperature and precipitation.
- **Chart**: a scrollable chart.
- **Windy**: a compact layout inspired by Windy.

Tap an hour to see all its values in a popup.

### Daily page

Tap the current weather or a day in the list to open its daily page. Swipe left or right to go to the next or previous day. It shows:

- the hourly forecast for that day
- the last and next 24 hours (precipitation, snowfall)
- air quality with pollutants, and pollens when available
- tides, if a marine provider is on for this location
- sun and moon: rise and set times, positions and moon phase

See [Daily forecasts](/features/daily-forecasts) and [Astronomy](/features/astronomy).

## Refreshing

- **Pull down** on the main screen to refresh. If "Fetch current location when swiping down" is on (Settings > Geolocation), it also updates your GPS position.
- The app refreshes by itself when cached data no longer covers the coming hours, at start and when you come back to it.
- If new data cannot be fetched, the screen says **Weather data is outdated**, shows when it was last updated, and offers a **Refresh** button.
- With no network and no saved data, the screen shows **No network**.

## Favorites drawer

Open it with ☰ or by swiping from the left edge.

- Tap a favorite to show it. The current one is highlighted.
- Each row shows the place, its region and its local time.
- **Long press and drag** a row to reorder.
- The button at the bottom adds a location (search).

The **⋮** on a row opens its menu:

- **Rename** or **duplicate** the favorite
- **Provider**, **Open-Meteo model**, **Air Quality Provider**, **Marine Weather Provider**: settings for this location only
- **Compare models**, **Chart**, **Map**, **meteoblue** (if enabled), **BRA** (France)
- **Remove** from favorites

## Changing provider quickly

With **Settings > Providers > Actionbar swipe gesture** turned on (off by default), swipe left or right on the action bar to show the current location with another provider. Your saved provider does not change.

## Other pages

- **Chart**: full-page hourly chart. In the modern style, zoom presets (24 h, 48 h, 72 h, All) and legend chips to show or hide each series. See [Hourly charts](/features/hourly-charts).
- **Compare models**: see [Compare models](/features/weather-comparison).
- **Map**: radar and satellite layers with a play button and time slider. See [Weather map](/features/weather-map).

## Need help?

- [FAQ](/guide/faq)
- [All features](/features/)
- [Report an issue](https://github.com/ossappscollective/oss-weather/issues)
