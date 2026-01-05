package com.akylas.weather.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.res.Configuration

private const val LOG_TAG = "WidgetConfigChangeReceiver"

/**
 * Receives configuration changes (theme, locale, etc.) and updates widgets
 */
class WidgetConfigChangeReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        WidgetsLogger.d(LOG_TAG, "onReceive: action=${intent.action}")
        
        when (intent.action) {
            Intent.ACTION_CONFIGURATION_CHANGED -> {
                handleConfigurationChanged(context)
            }
            "android.intent.action.UI_MODE_NIGHT_CHANGED" -> {
                WidgetsLogger.i(LOG_TAG, "UI Mode (dark/light) changed, re-rendering widgets")
                WeatherWidgetManager.reRenderAllWidgets(context)
            }
            Intent.ACTION_LOCALE_CHANGED -> {
                WidgetsLogger.i(LOG_TAG, "Locale changed, re-rendering widgets")
                WeatherWidgetManager.reRenderAllWidgets(context)
            }
            Intent.ACTION_TIMEZONE_CHANGED -> {
                WidgetsLogger.i(LOG_TAG, "Timezone changed, updating widgets")
                WeatherWidgetManager.requestAllWidgetsUpdate(context)
            }
            Intent.ACTION_TIME_CHANGED -> {
                WidgetsLogger.i(LOG_TAG, "Time changed, updating time-based widgets")
                // Update clock and date widgets
                WeatherWidgetManager.updateClockWidgets(context)
                WeatherWidgetManager.updateDateWidgets(context)
            }
            Intent.ACTION_SCREEN_ON -> {
                WidgetsLogger.d(LOG_TAG, "Screen turned on, checking for theme changes")
                handleConfigurationChanged(context)
            }
        }
    }
    
    private fun handleConfigurationChanged(context: Context) {
        val currentNightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        
        WidgetsLogger.i(LOG_TAG, "Configuration changed, nightMode=$currentNightMode")
        
        // Re-render all widgets with new theme
        WeatherWidgetManager.reRenderAllWidgets(context)
    }
}