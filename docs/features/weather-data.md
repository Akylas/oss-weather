# Weather Data

OSS Weather provides comprehensive weather data from multiple sources.

## Current Weather Conditions

The app displays detailed current weather information including:

### Temperature Metrics
- **Current Temperature** - The actual air temperature
- **Feels Like** - How the temperature actually feels (accounting for wind chill and humidity)
- **Dew Point** - The temperature at which air becomes saturated with moisture

### Precipitation
- **Precipitation Probability** - Chance of rain/snow in percentage
- **Precipitation Amount** - Expected rainfall/snowfall amount
- **Precipitation Type** - Rain, snow, sleet, or mixed

### Wind Data
- **Wind Speed** - Current wind speed in your preferred units
- **Wind Gusts** - Maximum expected wind speed
- **Wind Direction** - Direction from which wind is blowing (with compass bearing)

### Atmospheric Conditions
- **Humidity** - Relative humidity percentage
- **Pressure** - Atmospheric pressure with trend indicator (rising, falling, steady)
- **Cloud Cover** - Percentage of sky covered by clouds
- **Visibility** - How far you can see

### Sun & UV
- **UV Index** - Sun exposure level with health recommendations
- **Sunrise/Sunset** - Times for sunrise and sunset
- **Day Length** - Total daylight hours

## Hourly Forecast

Detailed hourly forecasts for the next 48 hours:

### Available Data Points
For each hour, you get:
- Temperature and feels-like temperature
- Precipitation probability and amount
- Wind speed and direction
- Cloud cover percentage
- Humidity
- Pressure
- UV index

### Visualization
- **Interactive Charts** - Line graphs for temperature, bar charts for precipitation
- **Timeline** - Scroll through hours to see changes
- **Tap for Details** - Tap any hour for complete information

## Daily Forecast

Extended forecasts for 7-14 days (depending on provider):

### Daily Summary
- **High/Low Temperatures** - Daily temperature range
- **Weather Condition** - Overall condition (sunny, cloudy, rainy, etc.)
- **Precipitation Probability** - Chance of precipitation
- **Weather Icon** - Visual representation of conditions

### Detailed Daily Data
Tap on any day to see:
- Hour-by-hour breakdown
- Temperature curve throughout the day
- Precipitation timing
- Wind patterns
- Sunrise/sunset times

## Weather Providers

### OpenWeather

**Coverage:** Global

**Data Quality:** Excellent

**Features:**
- Comprehensive current conditions
- 48-hour hourly forecast
- 8-day daily forecast
- Historical data
- Weather alerts
- Detailed precipitation data

**Requirements:** API key (free tier available)

**Best For:** General use worldwide

### Open-Meteo

**Coverage:** Global (European-focused)

**Data Quality:** Very Good

**Features:**
- High-resolution forecasts
- 16-day forecasts
- Hourly data
- Multiple weather models
- No API key required
- No rate limits

**Requirements:** None

**Best For:** Free usage, European locations

### AccuWeather

**Coverage:** Global

**Data Quality:** Excellent

**Features:**
- Minute-by-minute precipitation (MinuteCast)
- 15-day forecasts
- Detailed severe weather alerts
- Lifestyle indices
- Radar data

**Requirements:** API key (limited free tier)

**Best For:** Detailed forecasts, precipitation timing

### Meteo France

**Coverage:** France and French territories primarily

**Data Quality:** Excellent

**Features:**
- High-quality European data
- Detailed precipitation forecasts
- Weather warnings
- Marine forecasts
- Mountain weather

**Requirements:** None

**Best For:** French territories, some European areas

## Comparing Providers

Different providers may show different forecasts due to:

1. **Different Weather Models** - Each provider uses their own prediction algorithms
2. **Update Frequency** - Some update more frequently than others
3. **Data Sources** - Different ground station networks and satellite data
4. **Regional Optimization** - Some providers are better for specific regions

### Tips for Best Results

- **Compare Providers** - Check multiple sources for important weather decisions
- **Regional Providers** - Use Meteo France for France, etc.
- **Free Options** - Open-Meteo is excellent and has no limits
- **Update Frequency** - Set reasonable update intervals (1 hour is usually fine)

## Weather Accuracy

Weather forecasts become less accurate further into the future:

- **Current conditions:** Very accurate
- **Next 24 hours:** Highly accurate
- **2-3 days:** Good accuracy
- **4-7 days:** Moderate accuracy
- **8+ days:** General trends only

## Data Updates

### Automatic Updates
- Configurable update interval (15 min to 3 hours)
- Background updates for widgets (optional)
- Location-based updates

### Manual Updates
- Pull to refresh on main screen
- Uses API calls (counts toward limits)

### Caching
- Weather data is cached locally
- Reduces API calls
- Provides offline access to last-fetched data

## Weather Alerts

When available from providers:

- **Severe Weather Warnings** - Storms, hurricanes, etc.
- **Temperature Extremes** - Heat waves, cold snaps
- **Precipitation Alerts** - Heavy rain, snow
- **Wind Warnings** - High winds, gales
- **Other Hazards** - Fog, ice, etc.

Alerts are shown prominently on the main screen and can trigger notifications.

## Historical Data

Some providers (OpenWeather with paid plan) offer historical weather data:
- Past weather conditions
- Historical averages
- Trends and comparisons

## Data Privacy

**Your weather data is private:**

- Location data only sent to weather provider APIs
- No data collection by OSS Weather
- No tracking or analytics (optional crash reporting)
- Data cached locally on your device

## API Rate Limits

Be aware of provider limits:

| Provider | Free Tier Limit |
|----------|----------------|
| OpenWeather | 1,000 calls/day |
| Open-Meteo | No limit (fair use) |
| AccuWeather | 50 calls/day |
| Meteo France | No limit |

**Tip:** Use Open-Meteo as default to avoid rate limits.

## Troubleshooting

### Data Not Loading
1. Check internet connection
2. Verify API key (if required)
3. Check provider status
4. Try different provider

### Inaccurate Data
- Compare with other providers
- Check location accuracy
- Verify units are set correctly

### Old Data Showing
- Pull to refresh
- Check last update time
- Verify background updates enabled

## Next Steps

- [Set up API keys](/guide/api-keys)
- [Learn about weather providers](/guide/weather-providers)
- [Explore hourly charts](/features/hourly-charts)
