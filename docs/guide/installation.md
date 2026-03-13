# Installation

OSS Weather is available on multiple platforms and app stores.

## Android

### Google Play Store

The easiest way to install OSS Weather on Android is through the Google Play Store:

<a href="https://play.google.com/store/apps/details?id=com.akylas.weather" target="_blank">
  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height:50px">
</a>

### IzzyOnDroid (F-Droid Repository)

For users who prefer open-source app stores, OSS Weather is available on IzzyOnDroid:

<a href="https://apt.izzysoft.de/packages/com.akylas.weather" target="_blank">
  <img src="https://gitlab.com/IzzyOnDroid/repo/-/raw/master/assets/IzzyOnDroid.png" alt="Get it on IzzyOnDroid" style="height:50px">
</a>

### Direct APK Download

You can also download the APK directly from GitHub releases:

<a href="https://github.com/Akylas/oss-weather/releases" target="_blank">
  <img src="https://raw.githubusercontent.com/Akylas/OSS-DocumentScanner/main/badge_github.png" alt="Get it on GitHub" style="height:50px">
</a>

#### Installation Steps:
1. Go to the [Releases page](https://github.com/Akylas/oss-weather/releases)
2. Download the latest APK file
3. Enable "Install from Unknown Sources" in your Android settings if needed
4. Open the APK file to install

## iOS

### App Store

OSS Weather is available on the iOS App Store:

<a href="https://apps.apple.com/fr/app/oss-weather/id1499117252" target="_blank">
  <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1496188800" alt="Download on the App Store" style="height:50px">
</a>

## Verification

### Android App Verification

To verify the authenticity of the Android app, you can check the app signature:

**Package Name:** `com.akylas.weather`

**SHA-256 Fingerprint:**
```
68:70:80:D4:CF:6F:CF:FE:8D:82:FD:1D:78:3C:90:C2:95:94:80:AA:13:C3:8A:D8:D0:4E:C3:40:66:FC:13:F1
```

You can verify this using tools like [AppVerifier](https://github.com/soupslurpr/AppVerifier).

## System Requirements

### Android
- Android 7.0 (API level 24) or higher
- ~50 MB storage space
- Internet connection for weather data

### iOS
- iOS 13.0 or later
- ~50 MB storage space
- Internet connection for weather data

## Permissions

OSS Weather requires the following permissions:

- **Location** - To get weather data for your current location
- **Internet** - To fetch weather data from providers
- **Storage** (Android) - To save settings and cache weather data

All permissions are used solely for the app's functionality. No data is collected or sent to third parties beyond the weather data providers you choose to use.

## Next Steps

After installation:
1. [Configure your preferences](/guide/configuration)
2. [Set up API keys](/guide/api-keys) for weather providers
3. [Learn the basics](/guide/basic-usage)
