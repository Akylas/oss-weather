# Widget Image Generator

Generates preview images for weather widgets using Puppeteer and the HTML renderer.

## Setup

```bash
cd widget-layouts/image-generator
npm install
```

## Usage

### Generate all widget images

```bash
npm run generate
```

This generates images for all widgets in `./output/<WidgetName>/` directory.

### Generate combined gallery

```bash
npm run generate:combined
```

Creates a single image showing all widgets in a gallery layout.

### Generate for a single widget

```bash
npm run generate:single SimpleWeatherWidget
```

## Output

Images are generated in multiple sizes:
- `small` (80x80)
- `medium` (120x120)
- `wide` (260x120)
- `large` (360x180)

Plus any additional sizes defined in the widget's `supportedSizes` array.

## Customizing Preview Data

Edit `SAMPLE_DATA` in `generate-images.ts` to customize the weather data shown in previews.
