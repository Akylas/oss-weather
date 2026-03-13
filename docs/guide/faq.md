# Frequently Asked Questions

Common questions and answers about OSS Weather.

## General

### What is OSS Weather?

OSS Weather is a free, open-source weather application that provides detailed weather data from multiple providers including OpenWeather, Open-Meteo, AccuWeather, and Meteo France.

### Is OSS Weather really free?

Yes! OSS Weather is completely free with no ads, no tracking, and no premium features locked behind a paywall. The app is open source and available under the MIT License.

### How does OSS Weather make money?

OSS Weather doesn't make money - it's a passion project maintained by volunteers. If you'd like to support development, you can [sponsor on GitHub](https://github.com/sponsors/farfromrefug) or use other donation methods.

### What platforms does OSS Weather support?

- Android 7.0 (API 24) or higher
- iOS 13.0 or later

## Weather Data

### Which weather provider should I use?

- **Open-Meteo**: Best for free usage, no API key needed, excellent for Europe
- **OpenWeather**: Most comprehensive, requires free API key, global coverage
- **AccuWeather**: Very detailed, limited free tier (50 calls/day)
- **Meteo France**: Best for French territories

### Why do different providers show different forecasts?

Each provider uses different weather models, data sources, and prediction algorithms. This is normal and happens with all weather services.

### How accurate are the forecasts?

Accuracy decreases over time:
- Current conditions: Very accurate
- Next 24 hours: Highly accurate (~90%)
- 2-3 days: Good accuracy (~80%)
- 4-7 days: Moderate accuracy (~70%)
- 8+ days: General trends only (~50-60%)

### How often is weather data updated?

You can configure update frequency from 15 minutes to 3 hours. We recommend 1 hour for a good balance between freshness and battery life.

## API Keys

### Do I need an API key?

It depends on the provider:
- **No key needed**: Open-Meteo, Meteo France
- **Key recommended**: OpenWeather (has default key but limited)
- **Key required**: AccuWeather

### How do I get a free API key?

See our [API Keys guide](/guide/api-keys) for detailed instructions.

### The default OpenWeather key isn't working

The default key is shared among all users and may hit rate limits. Get your own free API key from [OpenWeather](https://openweathermap.org/api).

### I'm getting "API Rate Limit Exceeded" errors

Either:
1. Get your own API key
2. Switch to Open-Meteo (no limits)
3. Increase update interval
4. Reduce number of saved locations

## Features

### Can I use OSS Weather offline?

Partially - the app caches the last-fetched weather data, so you can view it offline. However, you need internet to get updated weather information.

### Does OSS Weather track my location?

OSS Weather only uses your location to fetch weather data. Location information is only sent to the weather provider you choose. No tracking, no analytics (except optional anonymous crash reporting).

### Can I compare weather between multiple locations?

Yes! Use the Compare feature to view side-by-side weather for different locations.

### Does OSS Weather show weather alerts?

Yes, when available from your weather provider. Alerts for severe weather, storms, etc., are displayed prominently.

### Can I customize the widgets?

Yes! Widgets are highly customizable:
- Choose location
- Select data to display
- Customize appearance
- Set update frequency

## Technical

### Why is the app size larger than other weather apps?

OSS Weather includes:
- Multiple weather provider integrations
- Advanced charting library
- Weather radar engine
- Map visualization
- Widget rendering system
- No server-side processing (everything local)

### Why does the app need so many permissions?

- **Location**: To get weather for your location
- **Internet**: To fetch weather data
- **Storage** (Android): To cache data and save settings

All permissions are used only for app functionality.

### How much battery does OSS Weather use?

Battery usage depends on:
- Update frequency (1 hour = minimal impact)
- Number of widgets
- Background updates enabled
- GPS usage

Typical usage: <2% battery per day with hourly updates.

### How much data does the app use?

Very little:
- ~10-50 KB per weather update
- Weather radar uses more (~1-5 MB per session)
- Maps use data for tiles
- Typical usage: <10 MB per month

## Widgets

### Why isn't my widget updating?

Check:
1. Background app restrictions
2. Battery optimization settings
3. Internet connection
4. Location permissions
5. Update frequency settings

### Can I have multiple widgets?

Yes! Add as many widgets as you want for different locations or data views.

### Widget shows wrong location

Tap the widget to configure it and select the correct location.

## Privacy & Security

### Does OSS Weather collect my data?

No. OSS Weather collects no personal data. Your location is only sent to weather providers to get forecasts. Optional anonymous crash reporting can be enabled in settings.

### Is OSS Weather open source?

Yes! View the source code on [GitHub](https://github.com/Akylas/oss-weather).

### Can I trust OSS Weather with my location?

Yes. The app only uses location to fetch weather data. Being open source, anyone can verify there's no tracking or data collection.

## Troubleshooting

### Weather data not loading

1. Check internet connection
2. Verify API key (if using OpenWeather/AccuWeather)
3. Try different weather provider
4. Check provider status
5. Pull to refresh

### App crashes on startup

1. Update to latest version
2. Clear app cache
3. Reinstall the app
4. Report issue on GitHub with crash logs

### Location not detected

1. Check location permissions
2. Enable GPS
3. Try manual location selection
4. Ensure location services are on

### Widget not showing on home screen (iOS)

1. Ensure iOS 14 or later
2. Long press home screen → tap + → search OSS Weather
3. Check if app is up to date
4. Try restarting device

### Radar not working

1. Check internet connection
2. Verify your region has radar coverage
3. Try different map tiles
4. Check RainViewer status

## Contributing

### How can I help improve OSS Weather?

- Report bugs on [GitHub](https://github.com/Akylas/oss-weather/issues)
- Contribute translations on [Weblate](https://hosted.weblate.org/engage/oss-weather/)
- Submit code improvements
- Support the developer financially

### I found a bug, what should I do?

1. Check if it's already reported on [GitHub Issues](https://github.com/Akylas/oss-weather/issues)
2. If not, create a new issue with:
   - Device model and OS version
   - App version
   - Steps to reproduce
   - Screenshots if applicable

### Can I request a feature?

Yes! Create a feature request on [GitHub Issues](https://github.com/Akylas/oss-weather/issues).

### How can I translate OSS Weather to my language?

Visit [Weblate](https://hosted.weblate.org/engage/oss-weather/) to contribute translations.

## Updates

### How often is OSS Weather updated?

Updates are released regularly with:
- Bug fixes
- New features
- Performance improvements
- Security updates

### Will OSS Weather always be free?

Yes! As an open-source project under MIT License, it will always be free.

### Can I help develop OSS Weather?

Absolutely! The project welcomes contributions. See the [GitHub repository](https://github.com/Akylas/oss-weather) to get started.

## Still Have Questions?

- Check the [User Guide](/guide/getting-started)
- Explore [Features](/features/)
- Report issues on [GitHub](https://github.com/Akylas/oss-weather/issues)
- Join discussions in GitHub Discussions
