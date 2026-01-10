package com.akylas.weather.widgets
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidgetManager
import com.akylas.weather.widgets.WeatherWidgetManager

class ThemeChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_CONFIGURATION_CHANGED) {
            // Update all your Glance widgets
            WeatherWidgetManager.reRenderAllWidgets(context)
        }
    }
}