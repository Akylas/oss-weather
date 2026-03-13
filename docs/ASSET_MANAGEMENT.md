# Asset Deduplication Summary

## Problem

The documentation website had duplicated assets:
- `docs/public/logo.png` (duplicate of `logo.png`)
- `docs/public/badge_github.png` (duplicate of `badge_github.png`)
- `docs/public/screenshots/*.png` (duplicates of `fastlane/metadata/android/en-US/images/phoneScreenshots/*.png`)

This caused:
- ❌ Repository bloat (duplicate large images)
- ❌ Maintenance burden (updating images in multiple places)
- ❌ Risk of inconsistency

## Solution

Implemented a build-time asset copying mechanism:

1. **Created `docs/scripts/copy-assets.js`**
   - Node.js script that copies assets from their source locations
   - Runs before every build (dev and production)
   - Copies:
     - `logo.png`, `badge_github.png`, `Icon.png` from repository root
     - All screenshots from `fastlane/metadata/android/en-US/images/phoneScreenshots/`

2. **Updated Build Process**
   - Modified `docs/package.json` to run prebuild script
   - Updated `.github/workflows/docs.yml` to run copy script in CI
   - Added explicit copy step for clarity

3. **Removed Duplicates**
   - Deleted all assets from `docs/public/`
   - Updated `.gitignore` to exclude `docs/public/` assets (they're generated)

4. **Updated Documentation**
   - `docs/README.md` - Explains asset management
   - `docs/maestro/README.md` - Points to fastlane for screenshots

## Benefits

✅ **Single Source of Truth**: Assets live in one place
✅ **Shared Resources**: Screenshots used by both fastlane and docs
✅ **Smaller Repository**: No duplicate large files
✅ **Easier Maintenance**: Update once, reflects everywhere
✅ **Build Consistency**: CI and local builds work the same way

## Asset Locations

| Asset | Source Location | Copied To |
|-------|----------------|-----------|
| Logo | `logo.png` | `docs/public/logo.png` |
| GitHub Badge | `badge_github.png` | `docs/public/badge_github.png` |
| App Icon | `Icon.png` | `docs/public/Icon.png` |
| Screenshots | `fastlane/metadata/android/en-US/images/phoneScreenshots/*.png` | `docs/public/screenshots/*.png` |

## Usage

**Local Development:**
```bash
cd docs
npm install
npm run docs:dev    # Runs prebuild automatically
```

**Production Build:**
```bash
cd docs
npm run docs:build  # Runs prebuild automatically
```

**Adding New Assets:**
1. Place asset in appropriate source location
2. Update `docs/scripts/copy-assets.js` if needed
3. Asset will be copied during build

## Files Changed

- ✅ `docs/scripts/copy-assets.js` - Created
- ✅ `docs/package.json` - Added prebuild script
- ✅ `.gitignore` - Exclude generated assets
- ✅ `.github/workflows/docs.yml` - Added copy step
- ✅ `docs/README.md` - Updated documentation
- ✅ `docs/maestro/README.md` - Updated screenshot location
- ✅ `docs/public/logo.png` - Deleted (now generated)
- ✅ `docs/public/badge_github.png` - Deleted (now generated)
- ✅ `docs/public/screenshots/*.png` - Deleted (now generated)

## Verification

Verified that:
- ✅ Assets are correctly copied (MD5 checksums match)
- ✅ Local build works
- ✅ Assets appear in build output
- ✅ References in markdown still work
- ✅ CI workflow updated properly
