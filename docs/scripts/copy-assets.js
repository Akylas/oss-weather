#!/usr/bin/env node

/**
 * Copy assets from the main repository to docs/public for the documentation build.
 * This script ensures we reuse assets instead of duplicating them.
 */

const fs = require('fs');
const path = require('path');

// Resolve paths relative to the repository root
const repoRoot = path.resolve(__dirname, '../..');
const docsPublic = path.resolve(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(docsPublic)) {
  fs.mkdirSync(docsPublic, { recursive: true });
}

// Define asset mappings: source -> destination
const assetMappings = [
  // Logo and badges from root
  {
    src: path.join(repoRoot, 'logo.png'),
    dest: path.join(docsPublic, 'logo.png')
  },
  {
    src: path.join(repoRoot, 'badge_github.png'),
    dest: path.join(docsPublic, 'badge_github.png')
  },
  {
    src: path.join(repoRoot, 'Icon.png'),
    dest: path.join(docsPublic, 'Icon.png')
  }
];

// Copy screenshots from fastlane
const screenshotsSource = path.join(repoRoot, 'fastlane/metadata/android/en-US/images/phoneScreenshots');
const screenshotsDest = path.join(docsPublic, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDest)) {
  fs.mkdirSync(screenshotsDest, { recursive: true });
}

console.log('📦 Copying assets for documentation build...\n');

// Copy individual assets
assetMappings.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${path.basename(src)}`);
  } else {
    console.warn(`⚠ Warning: Source file not found: ${src}`);
  }
});

// Copy all screenshots
if (fs.existsSync(screenshotsSource)) {
  const screenshots = fs.readdirSync(screenshotsSource);
  screenshots.forEach(file => {
    if (file.endsWith('.png')) {
      const src = path.join(screenshotsSource, file);
      const dest = path.join(screenshotsDest, file);
      fs.copyFileSync(src, dest);
    }
  });
  console.log(`✓ Copied: ${screenshots.filter(f => f.endsWith('.png')).length} screenshots`);
} else {
  console.warn(`⚠ Warning: Screenshots directory not found: ${screenshotsSource}`);
}

console.log('\n✅ Asset copying complete!\n');
