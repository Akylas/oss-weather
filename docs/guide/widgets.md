# Weather Widgets

Learn about customizing and using OSS Weather widgets.

## Widget System

OSS Weather features an advanced widget system that allows creating customizable weather widgets for both iOS and Android.

## Widget Layouts

See the detailed guide on [Home Widgets](/features/home-widgets) for:
- Adding widgets to your home screen
- Customizing widget appearance
- Configuring widget data
- Managing widget updates

## Advanced Customization

For developers and advanced users, OSS Weather uses a custom widget layout system defined in JSON.

### Widget Layout DSL

The widget system uses a Domain Specific Language (DSL) for defining layouts:
- JSON-based configuration
- Cross-platform widget definitions
- Multiple renderer support (iOS, Android, NativeScript, HTML)
- Flexible data binding

### Documentation

See `plugin-widgets/README.md` in the repository for:
- Widget layout specification
- Creating custom widgets
- Renderer documentation
- Expression language
- Data binding

## Widget Types

### iOS Widgets
- WidgetKit integration
- Small, Medium, Large sizes
- System integration
- Dynamic Island support (where available)

### Android Widgets
- Material Design
- Glance widgets (Android 12+)
- Multiple sizes
- Rich interactions

## Configuration

Widgets can be configured for:
- Location selection
- Data display options
- Visual styling
- Update frequency
- Background transparency

## Best Practices

For optimal widget experience:
- Choose appropriate update intervals
- Balance information density
- Consider battery impact
- Use meaningful locations

## Next Steps

- [Set up home widgets](/features/home-widgets)
- [Configure settings](/guide/configuration)
- [Learn about weather data](/features/weather-data)
