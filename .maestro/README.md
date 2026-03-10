# Maestro Screenshot Scripts

This directory contains Maestro test flows for automatically generating screenshots of OSS Weather for documentation purposes.

## Prerequisites

1. **Install Maestro**: 
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. **Install the App**:
   - Build and install OSS Weather on a connected device or emulator
   - Ensure the app package `com.akylas.weather` is installed

3. **Start Android Emulator or Connect Device**:
   ```bash
   # List available devices
   adb devices
   ```

## Available Flows

- `01_main_view.yaml` - Main weather view with current conditions
- `02_hourly_forecast.yaml` - Hourly forecast chart
- `03_daily_forecast.yaml` - Daily forecast view
- `04_weather_radar.yaml` - Weather radar screen
- `05_weather_map.yaml` - Interactive weather map
- `06_settings.yaml` - Settings screen
- `07_astronomy.yaml` - Astronomy data view
- `08_air_quality.yaml` - Air quality information

## Running Individual Flows

To run a single screenshot flow:

```bash
maestro test .maestro/01_main_view.yaml
```

## Running All Flows

To generate all screenshots at once:

```bash
# Using the provided script
./scripts/generate-screenshots.sh
```

Or run manually:

```bash
for file in .maestro/*.yaml; do
  maestro test "$file"
done
```

## Generated Screenshots

Screenshots are saved to: `docs/public/screenshots/`

These screenshots are automatically used in the documentation website.

## Tips

1. **Clean State**: Start with the app in a known state (freshly installed or with test data)
2. **Stable Internet**: Ensure stable internet connection for weather data to load
3. **Screen Size**: Use a standard device size (e.g., Pixel 5) for consistent screenshots
4. **Light/Dark Mode**: Run flows in both light and dark mode if needed
5. **Localization**: Change device language to capture screenshots for different languages

## Customization

To customize the flows:

1. Edit the `.yaml` files with your desired actions
2. Use Maestro Studio for interactive flow creation:
   ```bash
   maestro studio
   ```

## Troubleshooting

### App Not Found
- Verify app is installed: `adb shell pm list packages | grep weather`
- Check app ID matches: `com.akylas.weather`

### Elements Not Found
- Use Maestro Studio to inspect element hierarchy
- Update element selectors in the YAML files

### Slow Performance
- Increase wait times in flows
- Use `waitForAnimationToEnd` between actions

## CI Integration

These flows can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Maestro Tests
  run: |
    maestro test .maestro/
```

See `.github/workflows/screenshots.yml` for the complete CI configuration.
