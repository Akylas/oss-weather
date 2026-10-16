# Weather Radar

Animated precipitation radar and satellite images on the weather map, from [LibreWXR](https://librewxr.net) by default.

<img class="ow-shot" src="/features/weather-map.webp" alt="Radar on the weather map">

## Opening the radar

On the main screen, tap the menu button (top right), then **Map**. The map opens centered on the selected location. You can also open it for any saved location from its menu in the favorites drawer.

## Layers

With LibreWXR (the default source, no API key needed) you can show:

- **Radar**: precipitation
- **Satellite**: satellite imagery
- **Radar + satellite**: both at once

A **show snow** option controls whether snow is drawn on the radar.

In the modern style, the current layer is shown in a chip at the top left. Tap it, or the layers button, to switch layer. In the classic style the same buttons are in the top bar.

## Color schemes

Tap the palette button to choose how radar intensity is colored. LibreWXR offers 15 schemes, for example Universal Blue, The Weather Channel, NEXRAD Level III, Rainbow, Dark Sky and Windy.

## Animation

At the bottom of the map:

- **Play / pause** button to animate the frames
- **Slider** to move to a given time
- **Time label** showing the time of the selected frame

Frames include past radar images and the short-term forecast ("nowcast") when the server provides it.

The options button (tune icon) lets you change, without leaving the map:

- Animation speed
- Layer opacity
- Show snow (LibreWXR)

## Map settings

Settings > Map holds the same options plus a few more:

- **Weather map source**: LibreWXR or MapTiler
- Animation speed and layer opacity
- Max time span (in hours) and **show past data**
- Custom tile server for the base map
- **LibreWXR**: server address, color scheme, default layer, show snow
- **MapTiler**: API key, color scheme, default layer

### MapTiler

MapTiler is an alternative source that needs your own [MapTiler](https://www.maptiler.com/weather/) API key. Its layers are radar, precipitation, wind, temperature and pressure.

## Map controls

- Pinch to zoom, drag to move. Rotation is disabled.
- The base map follows the app's light or dark theme.

## Next steps

- [Weather map](/features/weather-map)
- [Hourly charts](/features/hourly-charts)
- [Daily forecasts](/features/daily-forecasts)
