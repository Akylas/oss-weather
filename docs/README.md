# OSS Weather Documentation

This directory contains the source for the OSS Weather documentation website, built with VitePress.

## Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
cd docs
npm install
```

### Local Development

Start the development server:

```bash
npm run docs:dev
```

The site will be available at `http://localhost:5173`

### Building

Build the documentation site:

```bash
npm run docs:build
```

The built site will be in `.vitepress/dist`

### Preview Build

Preview the built site locally:

```bash
npm run docs:preview
```

## Structure

```
docs/
├── .vitepress/          # VitePress configuration
│   └── config.mts       # Site configuration
├── public/              # Static assets
│   ├── screenshots/     # App screenshots
│   └── logo.png         # App logo
├── guide/               # User guides
│   ├── getting-started.md
│   ├── installation.md
│   ├── configuration.md
│   ├── api-keys.md
│   └── ...
├── features/            # Feature documentation
│   ├── index.md
│   ├── weather-data.md
│   ├── weather-radar.md
│   └── ...
├── index.md             # Homepage
└── download.md          # Download page
```

## Adding Content

### New Guide Page

1. Create a new `.md` file in `docs/guide/`
2. Add frontmatter if needed
3. Update sidebar in `.vitepress/config.mts`

### New Feature Page

1. Create a new `.md` file in `docs/features/`
2. Add frontmatter if needed
3. Update sidebar in `.vitepress/config.mts`

### Adding Images

**Important**: The documentation reuses assets from the main repository to avoid duplication.

**Existing Assets** (automatically copied during build):
- Logo: `logo.png` (from repository root)
- Badge: `badge_github.png` (from repository root)
- Screenshots: From `fastlane/metadata/android/en-US/images/phoneScreenshots/`

**Adding New Images**:
1. Place original images in appropriate repository location:
   - App icons/badges: Repository root
   - Screenshots: `fastlane/metadata/android/en-US/images/phoneScreenshots/`
   - Other assets: Consider adding to repository root or a relevant location

2. Update `docs/scripts/copy-assets.js` to include new assets in the build

3. Reference them in markdown as usual:
```markdown
![Alt text](/image.png)
```

**Note**: Assets in `docs/public/` are generated during build and should not be committed to git.

## Build Process

The documentation build process automatically:
1. Runs `docs/scripts/copy-assets.js` to copy assets from the repository
2. Builds the VitePress site
3. Outputs to `docs/.vitepress/dist`

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `master` branch.

The deployment is handled by `.github/workflows/docs.yml`

## Generating Screenshots

Screenshots for the documentation are generated using Maestro scripts in the `.maestro/` directory.

See `.maestro/README.md` for instructions on generating screenshots.

## Contributing

1. Make changes to the documentation
2. Test locally with `npm run docs:dev`
3. Build to verify: `npm run docs:build`
4. Submit a pull request

## License

Same as the main OSS Weather project - MIT License
