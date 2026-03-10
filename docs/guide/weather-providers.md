# Weather Providers

Compare and choose the best weather data provider for your needs.

## Available Providers

OSS Weather supports multiple weather data providers, each with unique strengths.

## Open-Meteo

**Recommendation: ⭐ Best for free usage**

### Overview
- **Coverage**: Global (European-focused)
- **API Key**: Not required
- **Cost**: Free, no limits
- **Update Frequency**: Hourly

### Features
- High-quality forecasts
- 16-day forecasts
- Hourly data up to 16 days
- Multiple weather models
- No rate limits
- No registration needed

### Pros
✅ Completely free
✅ No API key required
✅ No rate limits
✅ High quality data
✅ Excellent for Europe
✅ Privacy-friendly

### Cons
❌ Less detailed than OpenWeather premium
❌ Fewer data points than some providers
❌ Limited historical data

### Best For
- Users who don't want API keys
- European locations
- Privacy-conscious users
- High-frequency updates
- Free unlimited usage

## OpenWeather

**Recommendation: ⭐ Best for comprehensive data**

### Overview
- **Coverage**: Global
- **API Key**: Required (free tier available)
- **Cost**: Free tier: 1,000 calls/day
- **Update Frequency**: Varies by plan

### Features
- Comprehensive current conditions
- 48-hour hourly forecast
- 8-day daily forecast
- Weather alerts
- Historical data (paid)
- Air quality data
- UV index
- Detailed precipitation

### Pros
✅ Very comprehensive data
✅ Excellent global coverage
✅ Rich API features
✅ Weather alerts included
✅ Well-documented API
✅ Generous free tier

### Cons
❌ Requires API key
❌ Rate limits on free tier
❌ Can be complex for beginners

### Best For
- Users wanting detailed data
- Global locations
- Weather alerts
- Professional use
- Historical data needs

### Getting Started
1. Sign up at [OpenWeather](https://home.openweathermap.org/users/sign_up)
2. Get your API key
3. Add it in OSS Weather settings
4. See [API Keys guide](/guide/api-keys)

## AccuWeather

**Recommendation: 🔸 Best for minute-by-minute precipitation**

### Overview
- **Coverage**: Global
- **API Key**: Required
- **Cost**: Free tier: 50 calls/day
- **Update Frequency**: Limited on free tier

### Features
- 15-day forecasts
- MinuteCast (minute-by-minute precipitation)
- Severe weather alerts
- Lifestyle indices
- Detailed forecasts
- Tropical weather tracking

### Pros
✅ MinuteCast for precipitation timing
✅ Detailed 15-day forecasts
✅ Excellent severe weather alerts
✅ Lifestyle indices
✅ High accuracy

### Cons
❌ Very limited free tier (50 calls/day)
❌ Requires API key
❌ Can exhaust quota quickly
❌ Registration required

### Best For
- Precipitation timing (MinuteCast)
- Severe weather tracking
- Supplementary provider
- Low-frequency checking

### Getting Started
1. Sign up at [AccuWeather Developer](https://developer.accuweather.com/)
2. Create an app
3. Get your API key
4. Add it in OSS Weather settings
5. See [API Keys guide](/guide/api-keys)

## Meteo France

**Recommendation: ⭐ Best for France and territories**

### Overview
- **Coverage**: France, French territories, some Europe
- **API Key**: Not required
- **Cost**: Free
- **Update Frequency**: Hourly

### Features
- High-quality French data
- Detailed forecasts
- Weather warnings
- Marine forecasts
- Mountain weather
- Avalanche information

### Pros
✅ Excellent for France
✅ No API key needed
✅ Free with no limits
✅ Official government data
✅ Very accurate for covered regions

### Cons
❌ Limited geographic coverage
❌ Primarily French territories
❌ Less global data
❌ Fewer data points than global providers

### Best For
- Users in France
- French territories
- Some European locations
- Government-quality data
- Free usage in France

## Comparison Table

| Feature | Open-Meteo | OpenWeather | AccuWeather | Meteo France |
|---------|------------|-------------|-------------|--------------|
| **API Key** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Free Tier** | Unlimited | 1,000/day | 50/day | Unlimited |
| **Coverage** | Global | Global | Global | France+ |
| **Forecast Days** | 16 | 8 | 15 | 14 |
| **Hourly Data** | 16 days | 48 hours | Limited | 48 hours |
| **Weather Alerts** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Air Quality** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Historical** | Limited | Paid | Paid | Limited |

## Choosing a Provider

### For Most Users
**Open-Meteo** - No hassle, unlimited, good quality

### For Detailed Data
**OpenWeather** - Most comprehensive, generous free tier

### For French Users
**Meteo France** - Best accuracy for France

### For Precipitation Timing
**AccuWeather** - MinuteCast feature (if quota allows)

## Using Multiple Providers

You can configure multiple providers and switch between them:

### Strategy 1: Primary + Backup
- **Primary**: Open-Meteo (unlimited)
- **Backup**: OpenWeather (when you need more detail)

### Strategy 2: Regional Optimization
- **Home (France)**: Meteo France
- **Travel (Global)**: Open-Meteo

### Strategy 3: Comparison
- Check multiple providers
- Compare forecasts
- Choose based on historical accuracy

## Switching Providers

To change your weather provider:

1. Open Settings
2. Go to Weather Providers
3. Select provider
4. Enter API key if required
5. Save

The app will immediately fetch data from the new provider.

## API Key Management

### Security
- API keys are stored securely on your device
- Never shared or sent elsewhere
- Use unique keys per app

### Rate Limits
Monitor your usage:
- Open-Meteo: No limits
- OpenWeather: 1,000/day (roughly 1 per 1.5 min)
- AccuWeather: 50/day (one per ~30 min)
- Meteo France: No limits

### Best Practices
1. Use Open-Meteo when possible (no limits)
2. Set reasonable update intervals
3. Don't share API keys publicly
4. Monitor quota if using paid tiers

## Troubleshooting

### Provider Not Working
1. Check internet connection
2. Verify API key (if required)
3. Check provider status page
4. Try different provider

### Inaccurate Forecasts
- Try different provider
- Check if provider is best for your region
- Compare multiple sources
- Report specific issues to provider

### Rate Limit Errors
- Get your own API key (don't use default)
- Reduce update frequency
- Switch to Open-Meteo
- Use multiple providers

## Provider Status

Check provider status:
- [OpenWeather Status](https://status.openweathermap.org/)
- [AccuWeather Status](https://status.accuweather.com/)
- Open-Meteo: Check website
- Meteo France: Check website

## Future Providers

OSS Weather may add more providers in the future. Suggestions welcome on [GitHub](https://github.com/Akylas/oss-weather/issues).

## Next Steps

- [Get API keys](/guide/api-keys)
- [Configure settings](/guide/configuration)
- [Learn about weather data](/features/weather-data)
