# API Keys

Learn how to set up API keys for weather data providers.

## Why Do I Need API Keys?

OSS Weather accesses weather data from third-party providers. While some providers like Open-Meteo don't require API keys, others like OpenWeather and AccuWeather do. API keys allow you to:

- Access premium features
- Avoid rate limits
- Get more frequent updates
- Access historical data

## Provider Requirements

| Provider | API Key Required | Free Tier | Sign Up Link |
|----------|-----------------|-----------|--------------|
| **Open-Meteo** | ❌ No | Yes | N/A |
| **OpenWeather** | ✅ Yes* | Yes | [Sign up](https://home.openweathermap.org/users/sign_up) |
| **AccuWeather** | ✅ Yes | Yes | [Sign up](https://developer.accuweather.com/) |
| **Meteo France** | ❌ No | Yes | N/A |

*OSS Weather includes a default OpenWeather API key with limited access. For best experience, get your own key.

## OpenWeather API Key

### Creating an Account
1. Go to [OpenWeather](https://home.openweathermap.org/users/sign_up)
2. Fill in your details
3. Verify your email
4. Log in to your account

### Getting Your API Key
1. Navigate to [API keys page](https://home.openweathermap.org/api_keys)
2. Your default API key will be shown
3. Or click "Generate" to create a new key
4. Copy the API key

### Adding to OSS Weather
1. Open OSS Weather
2. Go to Settings → Weather Providers → OpenWeather
3. Tap "API Key"
4. Paste your API key
5. Tap "Save"

### Free Tier Limits
- 1,000 API calls per day
- Current weather data
- 5-day forecast
- 60 calls per minute

::: tip
The free tier is usually sufficient for personal use. The app intelligently caches data to minimize API calls.
:::

## AccuWeather API Key

### Creating an Account
1. Go to [AccuWeather Developer Portal](https://developer.accuweather.com/)
2. Click "Register"
3. Fill in your details
4. Verify your email

### Getting Your API Key
1. Log in to the [Developer Portal](https://developer.accuweather.com/)
2. Go to "My Apps"
3. Click "Add a new App"
4. Fill in app details (name can be anything)
5. Copy the API key provided

### Adding to OSS Weather
1. Open OSS Weather
2. Go to Settings → Weather Providers → AccuWeather
3. Tap "API Key"
4. Paste your API key
5. Tap "Save"

### Free Tier Limits
- 50 API calls per day
- Current conditions
- 5-day forecast
- Limited endpoint access

::: warning
AccuWeather's free tier is quite limited. Consider using it as a secondary provider.
:::

## Default API Key Behavior

### Using the Built-in Key

OSS Weather includes a default OpenWeather API key for convenience. However:

- ⚠️ This key is shared among all users
- ⚠️ It may hit rate limits during peak usage
- ⚠️ You might see errors like "Too Many Requests"

If you encounter these issues, get your own API key.

### Rate Limiting

When you hit rate limits, you'll see error messages like:
- "API rate limit exceeded"
- "Too many requests"
- "Service temporarily unavailable"

**Solutions:**
1. Get your own API key (recommended)
2. Switch to Open-Meteo (no key required)
3. Increase update interval in settings
4. Reduce number of saved locations

## Provider Comparison

### Open-Meteo (Recommended for Free Usage)
- ✅ No API key required
- ✅ No rate limits for personal use
- ✅ High-quality forecasts
- ✅ European-focused but global coverage
- ❌ Less detailed than premium providers

### OpenWeather
- ✅ Comprehensive data
- ✅ Generous free tier
- ✅ Global coverage
- ✅ Historical data available
- ⚠️ Requires API key
- ❌ Rate limits on free tier

### AccuWeather
- ✅ Detailed forecasts
- ✅ Minute-by-minute precipitation
- ✅ Severe weather alerts
- ⚠️ Requires API key
- ❌ Very limited free tier (50 calls/day)

### Meteo France
- ✅ No API key required
- ✅ High quality data
- ✅ Excellent for French territories
- ❌ Limited to French territories and some European areas
- ❌ Less comprehensive than global providers

## Troubleshooting

### "Invalid API Key"
- Double-check you copied the key correctly
- Ensure there are no extra spaces
- Verify the key is activated (OpenWeather keys can take a few minutes)

### "API Rate Limit Exceeded"
- You've hit the daily/hourly limit
- Get your own API key if using the default
- Reduce update frequency
- Wait for the limit to reset

### "API Key Not Working"
- New API keys may take 10-15 minutes to activate
- Check if your account is verified
- Ensure you're using the correct key for the provider

### Weather Data Not Updating
- Check your internet connection
- Verify API key is entered correctly
- Check provider status page for outages
- Try switching to a different provider

## Best Practices

1. **Get Your Own Key**: Don't rely on the default OpenWeather key
2. **Use Open-Meteo**: When possible, use Open-Meteo to avoid rate limits
3. **Multiple Providers**: Set up multiple providers as backups
4. **Reasonable Updates**: Don't set update frequency too high (1 hour is usually fine)
5. **Cache Awareness**: The app caches data intelligently, manual refreshes use API calls

## Next Steps

- [Learn about weather providers](/guide/weather-providers)
- [Configure your settings](/guide/configuration)
- [Start using the app](/guide/basic-usage)
