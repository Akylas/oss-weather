package com.akylas.weather.widgets

import android.util.Log

/**
 * Simple centralized logger for widgets package. Uses Android Log.
 * Logging default follows BuildConfig.DEBUG; toggle WidgetsLogger.enabled if you need runtime change.
 */
object WidgetsLogger {
    private const val PREFIX = "Widgets"

    // Default to debug builds
    var enabled: Boolean  = true

    fun d(tag: String, message: String) {
        if (!enabled) return
        Log.d("$PREFIX:$tag", message)
    }

    fun i(tag: String, message: String) {
        if (!enabled) return
        Log.i("$PREFIX:$tag", message)
    }

    fun w(tag: String, message: String, t: Throwable? = null) {
        if (!enabled) return
        if (t == null) Log.w("$PREFIX:$tag", message) else Log.w("$PREFIX:$tag", message, t)
    }

    fun e(tag: String, message: String, t: Throwable? = null) {
        if (!enabled) return
        if (t == null) Log.e("$PREFIX:$tag", message) else Log.e("$PREFIX:$tag", message, t)
    }
}