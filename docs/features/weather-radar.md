# Weather Radar

Real-time precipitation radar powered by RainViewer.

## Overview

The weather radar feature provides animated precipitation radar showing current and forecasted rain, snow, and storms in your area.

## Accessing the Radar

1. Tap the **Radar** tab in the bottom navigation
2. The radar will load showing your current location
3. Wait for the animation to load

## Radar Features

### Animated Precipitation

The radar shows animated precipitation movement:
- **Current precipitation** - What's happening now
- **Past precipitation** - Last 2 hours
- **Future forecast** - Next 2 hours (when available)

### Color Coding

Precipitation intensity is shown with colors:
- **Light blue/green** - Light precipitation
- **Yellow** - Moderate precipitation
- **Orange** - Heavy precipitation
- **Red/Purple** - Very heavy precipitation

### Map Controls

**Zoom:**
- Pinch to zoom in/out
- Double tap to zoom in
- Two-finger tap to zoom out

**Pan:**
- Drag to move the map

**Rotation:**
- Two-finger rotate gesture (if enabled)

## Timeline Controls

### Timeline Slider

At the bottom of the screen:
- **Slider** - Shows current time position
- **Past** - Blue section (what already happened)
- **Future** - Orange section (forecast)
- **Current time marker** - Shows "now"

### Playback Controls

- **Play/Pause button** - Start/stop animation
- **Drag slider** - Jump to specific time
- **Time label** - Shows selected time
- **Speed control** - Adjust animation speed (if available)

## Layer Options

### Precipitation Type

Some providers show different precipitation types:
- Rain
- Snow
- Mixed precipitation

### Radar Quality

The radar resolution depends on:
- Your location
- Data provider coverage
- Network speed

## Using the Radar

### Check Current Rain

1. Open radar
2. Look for colors near your location
3. Brighter colors = heavier rain

### See If Rain Is Coming

1. Open radar
2. Tap play button
3. Watch animation to see precipitation movement
4. Check timeline for upcoming precipitation

### Track Storms

1. Open radar
2. Look for red/purple areas (heavy precipitation)
3. Play animation to see storm direction and speed
4. Estimate arrival time

### Plan Activities

1. Check radar before outdoor activities
2. Look at forecast portion of timeline
3. Identify rain-free windows

## Radar vs Forecast

### Radar (What You See)

- **Real-time** - Actual current precipitation
- **Short-term** - Good for next 1-2 hours
- **Precise** - Shows exact locations
- **Limited coverage** - May not cover all areas

### Forecast (From Weather Data)

- **Predicted** - Based on models, not current reality
- **Long-term** - Hours to days ahead
- **General** - Broader area coverage
- **Universal** - Available everywhere

**Best Practice:** Use both! Radar for immediate planning, forecast for long-term.

## Radar Data Source

OSS Weather uses **RainViewer** for radar data:

- Global coverage where available
- Real-time updates
- High-quality radar imagery
- Free to use

### Coverage Areas

Radar coverage is best in:
- United States
- Europe
- Australia
- Parts of Asia
- Other developed regions

Coverage may be limited or unavailable in some areas.

## Customization

### Settings

In Settings → Radar, you can configure:
- **Animation speed** - How fast radar plays
- **Animation smoothing** - Smooth or step-by-step
- **Update frequency** - How often radar refreshes
- **Past frames** - How many hours of history
- **Future frames** - How many hours of forecast

### Map Style

Choose your preferred map style:
- Light
- Dark
- Satellite (if available)
- Terrain

## Tips & Tricks

### Battery Saving
- Don't leave radar playing continuously
- Close radar when not needed
- Reduce update frequency

### Data Usage
- Radar uses data to load map tiles
- Animation requires downloading multiple frames
- Use Wi-Fi when possible for smoother experience

### Accuracy
- Radar shows what's actually there now
- Short-term future (30-60 min) is very accurate
- Longer forecasts (1-2 hours) are less certain
- Always check with weather forecast too

### Best Use Cases
- ✅ "Is it raining nearby?"
- ✅ "When will this rain reach me?"
- ✅ "Is there a storm coming?"
- ✅ "Will it rain in the next hour?"
- ❌ "Will it rain tomorrow?" (use forecast instead)

## Limitations

### Geographic Coverage
- Not all regions have radar coverage
- Quality varies by location
- Some areas only have forecast, not real-time radar

### Update Delays
- Radar data may be 5-15 minutes old
- Refresh time depends on data provider
- Not truly "real-time" but close enough

### Precipitation Type
- Radar cannot always distinguish rain vs snow
- Intensity estimates may vary
- Ground truth may differ

## Troubleshooting

### Radar Not Loading
1. Check internet connection
2. Verify location permissions
3. Try refreshing the app
4. Check if radar is available in your region

### Animation Stuttering
1. Check internet speed
2. Reduce animation quality in settings
3. Close other apps
4. Use Wi-Fi instead of mobile data

### No Data Showing
- Your region may not have radar coverage
- Check RainViewer coverage map
- Use weather forecast precipitation data instead

### Old Data
- Pull to refresh
- Check data timestamp
- Verify internet connection

## Alternatives

If radar is not available in your area:
- Use precipitation forecast from weather providers
- Check satellite imagery
- Use precipitation probability data
- Refer to hourly precipitation charts

## Next Steps

- [View hourly precipitation forecast](/features/hourly-charts)
- [Check weather map](/features/weather-map)
- [Learn about daily forecasts](/features/daily-forecasts)
