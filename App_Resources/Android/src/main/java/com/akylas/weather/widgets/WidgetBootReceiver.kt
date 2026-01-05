package com.akylas.weather.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

private const val LOG_TAG = "WidgetBootReceiver"

/**
 * Receiver that handles device boot and app updates
 * Reschedules widget updates after boot or app update
 */
class WidgetBootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        WidgetsLogger.d(LOG_TAG, "onReceive: action=${intent.action}")
        
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON" -> {
                WidgetsLogger.i(LOG_TAG, "Device booted, rescheduling widget updates")
                handleBootCompleted(context)
            }
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                WidgetsLogger.i(LOG_TAG, "App updated, reinitializing widgets")
                handleAppUpdated(context)
            }
        }
    }
    
    private fun handleBootCompleted(context: Context) {
        // Check if we have any active widgets
        val activeWidgets = WeatherWidgetManager.getAllActiveWidgetIds(context)
        
        if (activeWidgets.isNotEmpty()) {
            WidgetsLogger.i(LOG_TAG, "Found ${activeWidgets.size} active widgets, scheduling updates")
            
            // Reschedule periodic updates
            WeatherWidgetManager.scheduleWidgetUpdates(context)
            
            // Reschedule clock/date updates
            SimpleWeatherWithClockWidgetReceiver.scheduleNextClockUpdate(context)
            SimpleWeatherWithDateWidgetReceiver.scheduleNextDateUpdate(context)
            
            // Request immediate update for all widgets
            WeatherWidgetManager.requestAllWidgetsUpdate(context)
        } else {
            WidgetsLogger.i(LOG_TAG, "No active widgets found")
        }
    }
    
    private fun handleAppUpdated(context: Context) {
        // Similar to boot, but also re-render to apply any style changes
        val activeWidgets = WeatherWidgetManager.getAllActiveWidgetIds(context)
        
        if (activeWidgets.isNotEmpty()) {
            WidgetsLogger.i(LOG_TAG, "App updated with ${activeWidgets.size} active widgets")
            
            // Reschedule everything
            WeatherWidgetManager.scheduleWidgetUpdates(context)
            SimpleWeatherWithClockWidgetReceiver.scheduleNextClockUpdate(context)
            SimpleWeatherWithDateWidgetReceiver.scheduleNextDateUpdate(context)
            
            // Re-render with new styles
            WeatherWidgetManager.reRenderAllWidgets(context)
            
            // Request fresh data
            WeatherWidgetManager.requestAllWidgetsUpdate(context)
        }
    }
}