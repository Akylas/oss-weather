# Installation

OSS Weather is available for Android and iOS. A Mac version is built from the iOS app (Mac Catalyst).

## Android

### Google Play Store

<a href="https://play.google.com/store/apps/details?id=com.akylas.weather" target="_blank">
  <img src="https://raw.githubusercontent.com/pioug/google-play-badges/refs/heads/main/svg/en.svg" alt="Get it on Google Play" style="height:50px">
</a>

### IzzyOnDroid

An F-Droid compatible repository. Add it to an F-Droid client (or use the IzzyOnDroid app) to get updates.

<a href="https://apt.izzysoft.de/packages/com.akylas.weather" target="_blank">
  <img src="https://izzyondroid.org/assets/static/IzzyOnDroidButtonGreyBorder_nofont.png" alt="Get it on IzzyOnDroid" style="height:50px">
</a>

### GitHub releases

APK files are attached to every release.

<a href="https://github.com/ossappscollective/oss-weather/releases" target="_blank">
  <img src="/badge_github.png" alt="Get it on GitHub" style="height:50px">
</a>

1. Open the [releases page](https://github.com/ossappscollective/oss-weather/releases).
2. Download the latest APK.
3. Allow installing apps from this source if Android asks.
4. Open the APK to install it.

### Obtainium

[Obtainium](https://github.com/ImranR98/Obtainium) installs and updates apps straight from GitHub releases. Add this repository URL in Obtainium:

```
https://github.com/ossappscollective/oss-weather
```

### Verify the APK

**Package name:** `com.akylas.weather`

**SHA-256 signing certificate fingerprint:**

```
68:70:80:D4:CF:6F:CF:FE:8D:82:FD:1D:78:3C:90:C2:95:94:80:AA:13:C3:8A:D8:D0:4E:C3:40:66:FC:13:F1
```

You can check it with [AppVerifier](https://github.com/soupslurpr/AppVerifier).

## iOS

<a href="https://apps.apple.com/fr/app/oss-weather/id1499117252" target="_blank">
  <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1496188800" alt="Download on the App Store" style="height:50px">
</a>

## Mac

The Mac version (Mac Catalyst) is released to the Mac App Store, and as a zip file on [GitHub releases](https://github.com/ossappscollective/oss-weather/releases).

## System requirements

- **Android**: 7.0 (API 24) or later
- **iOS**: 13.0 or later. Home screen widgets on iOS need iOS 18 or later.
- **Mac**: macOS 12 or later
- An internet connection to fetch weather data

## Permissions

- **Location**: to show the weather where you are. It is only used while the app is open ("while using" on iOS). You can also search for places or pick them on a map without granting it.
- **Internet** and **network state** (Android): to download weather data and to know when you are offline.

The app does not ask for storage access. Exporting and importing settings go through the system file picker.

## Next steps

1. [First steps](/guide/configuration)
2. [Basic usage](/guide/basic-usage)
3. [Settings](/guide/settings)
