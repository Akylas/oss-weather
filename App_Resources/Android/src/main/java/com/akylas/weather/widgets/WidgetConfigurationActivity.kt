package com.akylas.weather.widgets

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

/**
 * Configuration activity for weather widgets
 * Configuration is done from JS side (Settings.svelte), 
 * this activity just initializes the widget with default config
 */
private const val LOG_TAG = "WidgetConfigurationActivity"

class WidgetConfigurationActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        WidgetsLogger.d(LOG_TAG, "onCreate start extras=${intent?.extras?.keySet()?.joinToString(",")}")
        super.onCreate(savedInstanceState)
        
        // Set result to CANCELED initially
        setResult(RESULT_CANCELED)

        // Get widget ID from intent
        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        // Create default configuration
        // val defaultConfig = WidgetConfig(
        //     locationName = "current",
        //     latitude = 0.0,
        //     longitude = 0.0,
        //     model = "default"
        // )
        
        // // Load all existing configs
        // val allConfigs = WeatherWidgetManager.getAllWidgetConfigs(this).toMutableMap()
        // if(allConfigs[appWidgetId] == null) {

        //     // Add this widget's config
        //     allConfigs[appWidgetId] = defaultConfig
        //     // Save all configs
        //     WeatherWidgetManager.saveAllWidgetConfigs(this, allConfigs)
        // }
        // ensure config exists
        val config = WeatherWidgetManager.loadWidgetConfig(this, appWidgetId);

        WeatherWidgetManager.addActiveWidget(this, appWidgetId)
        WeatherWidgetManager.sendWidgetAdded(this, appWidgetId)
        
        // // Request initial data update
        WeatherWidgetManager.requestWidgetUpdate(this, appWidgetId)

        // Return result
        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(RESULT_OK, resultValue)
        finish()
        WidgetsLogger.i(LOG_TAG, "onCreate done")
    }

    override fun onDestroy() {
        WidgetsLogger.d(LOG_TAG, "onDestroy called")
        super.onDestroy()
    }

    // Add widgets configuration save/load logging where appropriate
    // Example:
    // private fun saveConfig(...) {
    //     WidgetsLogger.d(LOG_TAG, "saveConfig for widgetId=$widgetId")
    //     // ...existing code...
    //     WidgetsLogger.i(LOG_TAG, "saveConfig completed for widgetId=$widgetId")
    // }
}