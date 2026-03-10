# Configuration

Learn how to configure OSS Weather to suit your preferences.

## First Launch

When you first launch OSS Weather, you'll be greeted with a setup wizard that helps you:

1. Grant necessary permissions (location, internet)
2. Select your default weather provider
3. Choose your location
4. Set your preferred units

## Settings Overview

Access settings by tapping the menu icon (☰) or settings gear icon in the app.

### General Settings

#### Units
- **Temperature**: Celsius, Fahrenheit, Kelvin
- **Wind Speed**: m/s, km/h, mph, knots
- **Pressure**: hPa, inHg, mmHg
- **Precipitation**: mm, inches
- **Distance**: km, miles

#### Language
OSS Weather supports 30+ languages. The app can automatically use your system language or you can manually select from:
- English, French, German, Spanish, Italian
- Portuguese, Russian, Chinese, Japanese, Korean
- And many more...

Translations are community-driven via [Weblate](https://hosted.weblate.org/engage/oss-weather/). Feel free to contribute!

### Display Settings

#### Theme
- **Auto**: Follow system theme
- **Light**: Always use light theme
- **Dark**: Always use dark theme

#### Home Screen Layout
Customize what information appears on your main weather screen:
- Current conditions
- Hourly forecast
- Daily forecast
- Weather radar
- Air quality
- Astronomy data

### Weather Data Settings

#### Default Provider
Choose your preferred weather data source:
- **OpenWeather** - Comprehensive data, requires API key
- **Open-Meteo** - Free, no API key needed
- **Meteo France** - Good for European locations
- **AccuWeather** - Detailed forecasts (API key required)

Learn more about [Weather Providers](/guide/weather-providers).

#### Update Frequency
Control how often weather data is refreshed:
- **Manual**: Only update when you pull to refresh
- **15 minutes**: Frequent updates (uses more battery)
- **30 minutes**: Balanced
- **1 hour**: Conservative (recommended)
- **3 hours**: Minimal updates

#### Background Updates
Enable or disable background weather data updates. When enabled, weather data will be updated even when the app is not active, keeping widgets and notifications up-to-date.

### Location Settings

#### Current Location
- Enable/disable automatic location detection
- Choose GPS accuracy (high precision vs battery saving)

#### Saved Locations
- Add multiple locations
- Set a default location
- Reorder locations
- Delete locations

#### Location Permissions
- **Always**: Allows background location updates for widgets
- **While Using**: Only when the app is open
- **Never**: Manually select locations only

### Notifications

#### Weather Alerts
Enable notifications for:
- Severe weather warnings
- Precipitation alerts
- Temperature extremes
- Air quality alerts
- Custom conditions

#### Notification Times
Set when you want to receive weather notifications:
- Morning briefing
- Evening forecast
- Custom times

### Widget Settings

Configure home screen widgets:
- Widget size and layout
- Data to display
- Update frequency
- Transparency and styling

Learn more about [Widgets](/guide/widgets).

### Privacy Settings

#### Data Collection
- **None**: OSS Weather collects no personal data
- Weather provider APIs receive location data as needed to provide forecasts

#### Crash Reports
Optionally enable anonymous crash reporting to help improve the app (uses Sentry).

### Advanced Settings

#### Cache Management
- Clear weather data cache
- Clear image cache
- View cache size

#### Developer Options
- Enable debug logging
- View app logs
- Export settings
- Import settings

## Backup & Restore

### Export Settings
1. Go to Settings → Advanced
2. Tap "Export Settings"
3. Choose where to save the file
4. Settings are exported as JSON

### Import Settings
1. Go to Settings → Advanced
2. Tap "Import Settings"
3. Select your settings file
4. Confirm to apply settings

## Reset to Defaults

To reset all settings to their default values:
1. Go to Settings → Advanced
2. Tap "Reset Settings"
3. Confirm the action

::: warning
Resetting settings will not delete your saved locations or API keys, but all other preferences will be reset.
:::

## Next Steps

- [Set up API keys](/guide/api-keys) for weather providers
- [Learn about basic usage](/guide/basic-usage)
- [Explore features](/features/)
