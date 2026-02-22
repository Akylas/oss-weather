package com.akylas.weather.widgets

import android.content.Context

/**
 * Provider for localized strings used in widget composables.
 *
 * The app should call [setStrings] on startup (and whenever the language changes) to supply
 * translated strings. If [setStrings] has not been called in the current process lifetime,
 * [ensureLoaded] falls back to strings previously persisted in SharedPreferences. English
 * defaults are used as a final fallback so the widget always has something to display.

 * ```
 */
object WidgetLocalizationProvider {

    private const val PREFS_FILE = "widget_localization"
    private const val KEY_LOADING = "loading"
    private const val KEY_ERROR_LOADING = "error_loading"
    private const val KEY_TAP_CONFIGURE = "tap_configure"
    private const val KEY_NO_LOCATION = "no_location"

    var loading: String = "Loading\u2026"
        private set
    var errorLoading: String = "Failed to load widget data"
        private set
    var tapConfigure: String = "Tap to configure"
        private set
    var noLocation: String = "No location set"
        private set

    private var loaded = false

    /**
     * Provide localized strings to the widget library.
     *
     * Call this from the NativeScript/app side on startup and whenever the language changes.
     * The strings are persisted to SharedPreferences so that widgets can use them even when the
     * app process is not running (e.g. a WorkManager update in the background).
     *
     * @param context       Android application context
     * @param loading       Text shown while weather data is loading
     * @param errorLoading  Text shown when weather data failed to load
     * @param tapConfigure  Hint text telling the user to tap to configure the widget
     * @param noLocation    Text shown when no location has been configured
     */
    @JvmStatic
    fun setStrings(
        context: Context,
        loading: String,
        errorLoading: String,
        tapConfigure: String,
        noLocation: String
    ) {
        this.loading = loading
        this.errorLoading = errorLoading
        this.tapConfigure = tapConfigure
        this.noLocation = noLocation
        this.loaded = true
        context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_LOADING, loading)
            .putString(KEY_ERROR_LOADING, errorLoading)
            .putString(KEY_TAP_CONFIGURE, tapConfigure)
            .putString(KEY_NO_LOCATION, noLocation)
            .apply()
    }

    /**
     * Ensures strings are populated. If [setStrings] has not been called in this process
     * lifetime, loads previously persisted strings from SharedPreferences.
     *
     * Called automatically by composables before accessing any string value.
     */
    fun ensureLoaded(context: Context) {
        if (loaded) return
        val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)
        loading = prefs.getString(KEY_LOADING, loading) ?: loading
        errorLoading = prefs.getString(KEY_ERROR_LOADING, errorLoading) ?: errorLoading
        tapConfigure = prefs.getString(KEY_TAP_CONFIGURE, tapConfigure) ?: tapConfigure
        noLocation = prefs.getString(KEY_NO_LOCATION, noLocation) ?: noLocation
        loaded = true
    }
}
