# Home Widgets

Add customizable weather widgets to your home screen on iOS and Android.

## iOS Widgets

OSS Weather supports iOS WidgetKit with multiple widget sizes and configurations.

### Available Sizes

- **Small** (2x2) - Current conditions
- **Medium** (4x2) - Current + hourly forecast
- **Large** (4x4) - Full weather overview

### Adding a Widget

1. Long press on your home screen
2. Tap the "+" button in the top left
3. Search for "OSS Weather"
4. Select desired widget size
5. Tap "Add Widget"
6. Long press the widget to configure

### Widget Configuration

Tap "Edit Widget" to customize:
- **Location** - Choose which saved location to display
- **Data Display** - Select what information to show
- **Update Frequency** - How often to refresh
- **Theme** - Light, dark, or auto

## Android Widgets

OSS Weather provides multiple widget types for Android home screens.

### Widget Types

**Current Weather Widget**
- Compact display of current conditions
- Temperature and condition icon
- Location name

**Hourly Forecast Widget**
- Shows next few hours
- Temperature graph
- Precipitation indicators

**Daily Forecast Widget**
- Week view
- High/low temperatures
- Condition icons

**Full Weather Widget**
- Complete weather overview
- Current conditions + forecasts
- Multiple data points

### Adding a Widget (Android)

1. Long press on your home screen
2. Tap "Widgets"
3. Find "OSS Weather"
4. Long press and drag desired widget to home screen
5. Resize if needed
6. Tap to configure

### Widget Configuration (Android)

After adding, tap the widget to configure:
- Location selection
- Data to display
- Background transparency
- Text color
- Update interval

## Widget Customization

### Data Display Options

Choose what information to show:
- Current temperature
- Feels-like temperature
- Weather condition
- High/Low temperatures
- Precipitation probability
- Wind speed
- Humidity
- UV index
- Sunrise/sunset times
- Next hour forecast
- Hourly forecast graph
- Daily forecast

### Visual Customization

Customize appearance:
- **Background** - Solid, gradient, or transparent
- **Text Color** - Auto, light, or dark
- **Font Size** - Small, medium, or large
- **Icons** - Various icon sets
- **Layout** - Different layout styles

### Update Settings

Configure refresh behavior:
- **Update Frequency** - 15 min to 3 hours
- **Background Updates** - Enable for automatic refresh
- **Manual Refresh** - Tap widget to update
- **Battery Optimization** - Balance updates with battery life

## Widget Features

### Smart Refresh

Widgets intelligently update based on:
- Time of day (more frequent during active hours)
- Weather changes (update when conditions change)
- Battery level (reduce updates on low battery)
- Network availability (pause on no connection)

### Multiple Widgets

Add multiple widgets for:
- Different locations
- Different data views
- Quick comparison

### Deep Links

Tap widgets to:
- Open app to that location
- View detailed forecast
- Access specific features

## Android Glance Widgets

For Android 12+ with supported launchers, OSS Weather provides Glance-powered widgets with:
- Modern Material Design
- Better performance
- Smoother animations
- Rich interactions

## Widget Layouts

OSS Weather uses an advanced widget layout system that allows:
- Custom layouts via JSON configuration
- Cross-platform widget definitions
- Flexible data binding
- Multiple renderer support

See `plugin-widgets/README.md` for advanced widget customization.

## Battery Impact

Widgets require periodic updates which impact battery:

### Minimizing Battery Usage
- Set longer update intervals (1 hour+)
- Disable background updates when not needed
- Use fewer widgets
- Enable battery optimization for the app

### Recommended Settings
- **Active use**: 30-minute updates
- **Normal use**: 1-hour updates
- **Battery saving**: 3-hour updates or manual

## Troubleshooting

### Widget Not Updating
1. Check background app restrictions
2. Verify internet connection
3. Check battery optimization settings
4. Ensure location permissions granted
5. Try removing and re-adding widget

### Wrong Location Showing
1. Tap widget to configure
2. Select correct location
3. Verify location permissions
4. Check GPS accuracy

### Widget Looks Broken
1. Remove and re-add widget
2. Update OSS Weather to latest version
3. Check if widget size is supported
4. Try different layout style

### Data Not Loading
1. Check internet connection
2. Verify API keys configured
3. Try different weather provider
4. Check app permissions

## iOS Widget Limitations

iOS widgets have some limitations:
- Cannot show real-time animated data
- Update frequency limited by iOS
- Some features require opening the app
- Limited customization compared to Android

## Best Practices

### Widget Placement
- Use large widgets for detailed view
- Small widgets for at-a-glance info
- Medium widgets for balanced view

### Number of Widgets
- 2-3 widgets is optimal
- More widgets = more battery usage
- Focus on most-used locations

### Update Frequency
- Balance freshness vs battery
- Weather doesn't change every minute
- 1-hour updates usually sufficient

## Examples

### Traveler Setup
- Current location widget (auto-updates)
- Home city widget
- Destination city widget

### Weather Enthusiast Setup
- Large detailed widget for main location
- Multiple small widgets for comparison
- Frequent updates (30 min)

### Battery Saver Setup
- Single medium widget
- 3-hour updates
- Manual refresh when needed

## Next Steps

- [Configure widget settings](/guide/configuration)
- [Explore weather data](/features/weather-data)
