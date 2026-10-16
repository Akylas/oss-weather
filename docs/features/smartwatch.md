# Smartwatch Support

OSS Weather can send its weather data to [Gadgetbridge](https://gadgetbridge.org/), the open source Android companion app for many smartwatches and fitness bands. Gadgetbridge then passes it to your watch.

This is **Android only**.

## Turning it on

1. Install [Gadgetbridge](https://gadgetbridge.org/) and pair your watch with it.
2. In OSS Weather, open Settings > Integrations.
3. Turn on **Enable Gadgetbridge support**.

There are no other options in OSS Weather. How the weather is shown on the watch depends on Gadgetbridge and on your watch; see the [Gadgetbridge documentation](https://gadgetbridge.org/internals/development/weather-support/).

## When data is sent

The weather is sent each time the main screen gets new weather data: when the app updates the forecast, when you pull to refresh, or when you change location or provider.

- It is sent for the location shown on the main screen.
- There is no separate sync interval. Open the app or refresh to update the watch.
- If sending fails, the app shows a message once.

## What is sent

**Current weather**

- Location name and coordinates
- Temperature, feels-like temperature, dew point
- Weather condition and description
- Humidity, pressure, cloud cover
- Wind speed and direction, UV index
- Today's minimum and maximum temperature, precipitation probability
- Sunrise, sunset, moonrise, moonset and moon phase
- Air quality (when enabled in Settings > Weather data)

**Daily forecast**: up to 8 days, with condition, min and max temperature, humidity, wind, UV index, precipitation probability, sun and moon times, moon phase and air quality.

**Hourly forecast**: up to 48 hours, with temperature, condition, humidity, wind, UV index and precipitation probability.

The data goes directly from OSS Weather to Gadgetbridge on your phone, with no extra server.

## Next steps

- [Home widgets](/features/home-widgets)
- [Settings](/guide/settings)
