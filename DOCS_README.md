# Documentation Website & Screenshot Automation

This PR adds a complete documentation website for OSS Weather and Maestro scripts for automated screenshot generation.

## 🎉 What's New

### 1. Documentation Website

A comprehensive documentation website built with VitePress and ready to be hosted on GitHub Pages.

**Location**: `/docs/`

**Features**:
- Beautiful, responsive design
- Search functionality
- Dark/light mode support
- Mobile-friendly
- Fast static site generation

**Content Includes**:
- Homepage with donation links prominently displayed
- Getting Started guide
- Installation instructions
- Configuration guide
- API keys setup
- Weather providers comparison
- Complete feature documentation (11 feature pages)
- FAQ section
- Download page
- Basic usage guide

### 2. Maestro Scripts for Screenshots

Automated UI testing scripts using Maestro to generate screenshots for documentation.

**Location**: `/docs/maestro/`

**Scripts** (8 flows):
- Main weather view
- Hourly forecast
- Daily forecast
- Weather radar
- Weather map
- Settings
- Astronomy view
- Air quality

**Helper Script**: `/docs/scripts/generate-screenshots.sh` - Run all Maestro flows at once

### 3. GitHub Pages Deployment

Automatic deployment workflow configured.

**Location**: `/.github/workflows/docs.yml`

**Deployment**:
- Triggered on push to `master` branch (when docs change)
- Can be manually triggered
- Builds VitePress site
- Deploys to GitHub Pages

## 📖 Documentation Structure

```
docs/
├── .vitepress/
│   └── config.mts          # VitePress configuration
├── public/
│   ├── screenshots/        # App screenshots
│   ├── logo.png           # App logo
│   └── badge_github.png   # GitHub download badge
├── guide/
│   ├── getting-started.md
│   ├── installation.md
│   ├── configuration.md
│   ├── api-keys.md
│   ├── basic-usage.md
│   ├── weather-providers.md
│   ├── widgets.md
│   └── faq.md
├── features/
│   ├── index.md               # Features overview
│   ├── weather-data.md
│   ├── weather-radar.md
│   ├── hourly-charts.md
│   ├── daily-forecasts.md
│   ├── weather-map.md
│   ├── weather-comparison.md
│   ├── astronomy.md
│   ├── air-quality.md
│   ├── home-widgets.md
│   └── smartwatch.md
├── maestro/                   # Maestro screenshot scripts
│   ├── 01_main_view.yaml
│   ├── 02_hourly_forecast.yaml
│   ├── 03_daily_forecast.yaml
│   ├── 04_weather_radar.yaml
│   ├── 05_weather_map.yaml
│   ├── 06_settings.yaml
│   ├── 07_astronomy.yaml
│   ├── 08_air_quality.yaml
│   └── README.md
├── scripts/
│   └── generate-screenshots.sh
├── index.md                   # Homepage
├── download.md               # Download page
├── package.json              # VitePress dependencies
└── README.md                 # Docs development guide
```

## 🚀 Getting Started

### Running Documentation Locally

```bash
cd docs
npm install
npm run docs:dev
```

Visit `http://localhost:5173` to view the site.

### Building Documentation

```bash
cd docs
npm run docs:build
```

Built site will be in `docs/.vitepress/dist`

### Generating Screenshots with Maestro

**Prerequisites**:
1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Have OSS Weather installed on a connected device or emulator
3. Ensure device is connected: `adb devices`

**Generate all screenshots**:
```bash
./docs/scripts/generate-screenshots.sh
```

**Generate single screenshot**:
```bash
maestro test docs/maestro/01_main_view.yaml
```

Screenshots will be saved to `docs/public/screenshots/`

## 🌐 GitHub Pages Setup

### Enable GitHub Pages

1. Go to repository Settings → Pages
2. Under "Build and deployment":
   - Source: GitHub Actions
3. The workflow will automatically deploy when you push to `master`

The site will be available at: `https://akylas.github.io/oss-weather/`

### Manual Deployment

You can manually trigger deployment:
1. Go to Actions tab
2. Select "Deploy Documentation" workflow
3. Click "Run workflow"

## 💝 Donation Links

The homepage prominently features donation links:
- GitHub Sponsors
- Patreon
- Liberapay
- Buy Me a Coffee
- PayPal

All links are configured based on `.github/FUNDING.yml`

## 📝 Customization

### Updating Content

1. Edit markdown files in `docs/`
2. Test locally: `cd docs && npm run docs:dev`
3. Commit and push to `master`
4. GitHub Actions will automatically deploy

### Adding Pages

1. Create new `.md` file in appropriate directory
2. Add to sidebar in `docs/.vitepress/config.mts`
3. Link from relevant pages

### Changing Theme

Edit `docs/.vitepress/config.mts` to customize:
- Colors
- Navigation
- Logo
- Footer
- Search settings

## 🎬 Maestro Scripts

### What is Maestro?

Maestro is a mobile UI testing framework that allows you to:
- Automate UI interactions
- Generate screenshots
- Test app flows
- Record UI tests visually

### Script Customization

Edit `.yaml` files in `.maestro/` to:
- Change element selectors
- Adjust wait times
- Modify screenshot locations
- Add new flows

### Maestro Studio

For interactive flow creation:
```bash
maestro studio
```

This opens a UI where you can:
- Inspect app elements
- Build flows visually
- Test selectors
- Export YAML

## 🔧 CI Integration (Optional)

To generate screenshots in CI:

1. Add screenshot generation to release workflow
2. Use GitHub Actions with Android emulator
3. Run Maestro scripts
4. Commit screenshots back or upload as artifacts

Example addition to `.github/workflows/release.yml`:
```yaml
- name: Setup Maestro
  run: curl -Ls "https://get.maestro.mobile.dev" | bash

- name: Generate Screenshots  
  run: ./scripts/generate-screenshots.sh
```

## 📊 Documentation Statistics

- **Total Pages**: 25+
- **Guide Pages**: 8
- **Feature Pages**: 12
- **Words**: ~35,000+
- **Maestro Flows**: 8
- **Screenshots**: 6 (existing) + 8 (Maestro can generate)

## 🎯 Key Features

### Homepage
- ✅ App overview
- ✅ Feature highlights (12 features)
- ✅ Donation section prominently displayed
- ✅ Sponsor showcase
- ✅ Download links for all platforms
- ✅ Beautiful hero section

### Documentation
- ✅ Comprehensive guides
- ✅ Feature documentation
- ✅ FAQ section
- ✅ API keys setup
- ✅ Weather providers comparison
- ✅ Troubleshooting tips

### Screenshots
- ✅ Maestro automation scripts
- ✅ 8 different app views
- ✅ Automated generation
- ✅ Ready for localization

### Deployment
- ✅ GitHub Actions workflow
- ✅ Automatic deployment
- ✅ Manual trigger option
- ✅ Build optimization

## 📚 Additional Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Maestro Documentation](https://maestro.mobile.dev/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## 🤝 Contributing to Documentation

To contribute:
1. Fork the repository
2. Make changes to documentation
3. Test locally
4. Submit pull request

Documentation follows:
- Markdown format
- Clear, concise writing
- Examples and screenshots
- Consistent structure

## ❓ Troubleshooting

### Documentation Build Fails

**Issue**: VitePress build errors
**Solution**: 
1. Check for broken links
2. Verify all referenced files exist
3. Run `npm run docs:build` locally to debug

### Screenshots Not Generating

**Issue**: Maestro scripts fail
**Solution**:
1. Verify device connected: `adb devices`
2. Check app is installed: `adb shell pm list packages | grep weather`
3. Update element selectors if app UI changed
4. Use Maestro Studio to debug

### GitHub Pages Not Deploying

**Issue**: Site not accessible
**Solution**:
1. Check Actions tab for deployment status
2. Verify Pages is enabled in repository settings
3. Check workflow permissions
4. Ensure `GITHUB_TOKEN` has necessary permissions

## 🎨 Future Enhancements

Potential improvements:
- [ ] Add video demos
- [ ] Multi-language documentation
- [ ] Interactive examples
- [ ] Blog section for updates
- [ ] API documentation
- [ ] Developer guide
- [ ] Contributing guide
- [ ] Code of conduct
- [ ] More Maestro flows for all features
- [ ] Automated screenshot localization

## 📄 License

Documentation is released under the same license as the main project (MIT License).

---

**Questions?** Open an issue or check the docs at the repository.
