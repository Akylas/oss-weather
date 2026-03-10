#!/bin/bash

# Script to generate all screenshots using Maestro
# Run from the project root directory

set -e

echo "🎬 Generating screenshots for OSS Weather documentation..."
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro is not installed."
    echo "Install it with: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device or emulator detected."
    echo "Please connect a device or start an emulator."
    exit 1
fi

# Check if app is installed
if ! adb shell pm list packages | grep -q "com.akylas.weather"; then
    echo "❌ OSS Weather app is not installed on the device."
    echo "Please install the app first."
    exit 1
fi

echo "✅ Prerequisites met. Starting screenshot generation..."
echo ""

# Create screenshots directory if it doesn't exist
mkdir -p docs/public/screenshots

# Run each Maestro flow
flows=(.maestro/*.yaml)
total=${#flows[@]}
current=0

for flow in "${flows[@]}"; do
    current=$((current + 1))
    filename=$(basename "$flow")
    echo "[$current/$total] Running $filename..."
    
    if maestro test "$flow"; then
        echo "✅ $filename completed"
    else
        echo "⚠️  $filename failed (continuing...)"
    fi
    echo ""
done

echo "🎉 Screenshot generation complete!"
echo "Screenshots saved to: docs/public/screenshots/"
echo ""
echo "Next steps:"
echo "1. Review the generated screenshots"
echo "2. Re-run individual flows if needed: maestro test .maestro/01_main_view.yaml"
echo "3. Build the documentation site: cd docs && npm install && npm run docs:build"
