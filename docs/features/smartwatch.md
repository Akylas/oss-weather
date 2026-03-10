# Smartwatch Support

Integration with smartwatches via Gadget Bridge.

## Overview

OSS Weather integrates with [Gadget Bridge](https://gadgetbridge.org/), an open-source companion app that supports various smartwatches and fitness bands.

## What is Gadget Bridge?

Gadget Bridge is a free and open-source Android application that allows you to use smartwatches and fitness trackers without proprietary apps or cloud services.

**Supported Devices Include**:
- Amazfit (Bip, GTS, GTR, etc.)
- Xiaomi Mi Band series
- Huami devices
- Fossil Hybrid HR
- Pinetime
- Bangle.js
- And many more...

See the [full list of supported devices](https://gadgetbridge.org/basics/supported-devices/).

## Features

OSS Weather can send weather data to your smartwatch via Gadget Bridge:

### Current Weather
- Temperature
- Weather condition
- Weather icon
- Location

### Forecast Data
- Hourly forecast
- Daily forecast
- Temperature trends
- Conditions

### Updates
- Automatic sync
- Configurable interval
- On-demand updates

## Setting Up

### Prerequisites

1. **Install Gadget Bridge** from:
   - [F-Droid](https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/)
   - [GitHub Releases](https://github.com/Freeyourgadget/Gadgetbridge/releases)

2. **Pair your smartwatch** with Gadget Bridge

3. **Configure OSS Weather** to work with Gadget Bridge

### Configuration

1. Open OSS Weather
2. Go to Settings → Smartwatch
3. Enable "Gadget Bridge Integration"
4. Configure sync settings:
   - Sync interval
   - Data to sync
   - Location to use

5. Open Gadget Bridge
6. Configure weather sync in device settings
7. Set OSS Weather as weather provider

## Syncing Weather Data

### Automatic Sync

When enabled, OSS Weather will:
- Sync at configured intervals
- Update when weather changes significantly
- Sync on manual refresh in app

### Manual Sync

Force sync by:
1. Pull to refresh in OSS Weather
2. Tap sync in Gadget Bridge
3. Use watch to request update (device-dependent)

### Sync Interval

Balance freshness vs battery:
- **30 minutes**: Frequent updates, more battery
- **1 hour**: Balanced (recommended)
- **3 hours**: Conservative battery usage
- **Manual only**: Sync only when needed

## Data Sent to Watch

Depending on your watch and Gadget Bridge settings:

**Current**:
- Temperature
- Weather condition
- Weather icon
- Feels-like temperature
- Humidity
- Wind speed

**Hourly**:
- Next 12-24 hours
- Temperature
- Condition
- Precipitation

**Daily**:
- Next 5-7 days
- High/Low temperature
- Condition
- Precipitation probability

## Smartwatch Display

### Watch Faces

Many Gadget Bridge-compatible watch faces can display:
- Current temperature
- Weather icon
- Condition text
- Forecast data

### Weather App

Some watches have dedicated weather apps showing:
- Detailed current conditions
- Hourly forecast
- Daily forecast
- Multiple metrics

## Battery Considerations

Smartwatch weather sync impacts battery on:

**Phone**:
- Minimal impact
- Periodic sync uses little power
- Background communication

**Watch**:
- Depends on sync frequency
- Watch display usage
- Device efficiency

**Tips**:
- Use reasonable sync intervals (1 hour+)
- Disable if not using weather on watch
- Balance freshness with battery life

## Troubleshooting

### Weather Not Syncing

1. **Check Gadget Bridge connection**:
   - Ensure watch connected
   - Check Bluetooth
   - Verify connection in Gadget Bridge

2. **Verify OSS Weather settings**:
   - Integration enabled
   - Sync interval set
   - Location selected

3. **Check Gadget Bridge settings**:
   - Weather integration enabled
   - OSS Weather selected as provider
   - Permissions granted

### Outdated Weather on Watch

1. Force sync in OSS Weather (pull to refresh)
2. Check last sync time in Gadget Bridge
3. Verify sync interval
4. Check if background sync working

### Wrong Location

1. Verify location in OSS Weather settings
2. Check which location is set for sync
3. Ensure location permissions granted

### Icons Not Showing

- Some watch faces don't support icons
- Check watch face settings
- Try different watch face
- Update Gadget Bridge

## Privacy

**OSS Weather + Gadget Bridge**:
- No cloud services
- No data collection
- Local sync only
- Open source

Your weather data never leaves your devices.

## Compatibility

### Android Only

Gadget Bridge is Android-only, so smartwatch integration requires:
- Android phone
- OSS Weather for Android
- Compatible smartwatch

### iOS Alternative

For iOS users:
- Some smartwatches have native iOS apps
- Check if your watch has iOS support
- May not have open-source options

## Limitations

- Sync requires Gadget Bridge installed
- Limited by watch capabilities
- Some watches show limited data
- Display varies by watch model

## Benefits

**Why use Gadget Bridge + OSS Weather**:

✅ Open source
✅ Privacy-focused
✅ No proprietary apps needed
✅ No cloud services
✅ Free
✅ Customizable
✅ Works offline (with cached data)

## Supported Devices

While OSS Weather can work with any Gadget Bridge-compatible device, weather display depends on the device's capabilities.

**Popular Devices**:
- **Amazfit Bip/Bip S**: Full weather support
- **Mi Band 5/6**: Basic weather
- **Bangle.js**: Customizable weather displays
- **Pinetime**: Growing weather support

Check Gadget Bridge documentation for your specific device.

## Next Steps

- [Install Gadget Bridge](https://gadgetbridge.org/)
- [Set up widgets](/features/home-widgets)
- [Learn about settings](/guide/configuration)

## More Information

- [Gadget Bridge Website](https://gadgetbridge.org/)
- [Gadget Bridge Wiki](https://gadgetbridge.org/basics/)
- [Supported Devices](https://gadgetbridge.org/basics/supported-devices/)
- [Gadget Bridge on F-Droid](https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/)
