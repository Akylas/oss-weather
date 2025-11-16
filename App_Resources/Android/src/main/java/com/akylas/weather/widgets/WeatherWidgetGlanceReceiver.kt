package com.akylas.weather.widgets

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import java.util.Calendar

private const val LOG_TAG = "WeatherWidgetGlanceReceiver"

abstract class WeatherWidgetGlanceReceiver : GlanceAppWidgetReceiver() {

    companion object {
        private var themeChangeReceiver: BroadcastReceiver? = null
         fun registerThemeChangeReceiver(context: Context) {
            if (themeChangeReceiver == null) {
                themeChangeReceiver = object : BroadcastReceiver() {
                    override fun onReceive(context: Context, intent: Intent) {
                        if (intent.action == Intent.ACTION_CONFIGURATION_CHANGED) {
                            // Update all widgets
                            updateAllWidgets(context)
                        }
                    }
                }

                val filter = IntentFilter(Intent.ACTION_CONFIGURATION_CHANGED)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.registerReceiver(
                        themeChangeReceiver,
                        filter,
                        Context.RECEIVER_NOT_EXPORTED
                    )
                } else {
                    context.registerReceiver(themeChangeReceiver, filter)
                }
            }
        }

        private fun updateAllWidgets(context: Context) {
            WeatherWidgetManager.reRenderAllWidgets(context)
        }
    }
    override fun onReceive(context: Context, intent: Intent) {
        WidgetsLogger.d(LOG_TAG, "onReceive action=${intent.action} extras=${intent.extras?.keySet()?.joinToString(",")}")
        super.onReceive(context, intent)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        WidgetsLogger.d(LOG_TAG, "${this::class.simpleName} onUpdate widgetIds=${appWidgetIds.joinToString(",")}")
        super.onUpdate(context, appWidgetManager, appWidgetIds)
    }

    override fun onEnabled(context: Context) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onEnabled - first widget added")
        super.onEnabled(context)
//        WeatherWidgetManager.scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onDisabled - last widget removed")
        super.onDisabled(context)
//        WeatherWidgetManager.cancelWidgetUpdates(context)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onDeleted widgetIds=${appWidgetIds.joinToString(",")}")
        super.onDeleted(context, appWidgetIds)
        
        appWidgetIds.forEach { widgetId ->
            WeatherWidgetManager.onWidgetRemoved(context, widgetId)
        }
    }

    override fun onRestored(context: Context, oldWidgetIds: IntArray, newWidgetIds: IntArray) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onRestored old=${oldWidgetIds.joinToString(",")} new=${newWidgetIds.joinToString(",")}")
        super.onRestored(context, oldWidgetIds, newWidgetIds)
        
        for (i in oldWidgetIds.indices) {
            if (i < newWidgetIds.size) {
                val oldId = oldWidgetIds[i]
                val newId = newWidgetIds[i]
                
                WeatherWidgetManager.removeActiveWidget(context, oldId)
                WeatherWidgetManager.addActiveWidget(context, newId)
                
                WidgetsLogger.d(LOG_TAG, "Restored widget: $oldId -> $newId")
            }
        }
    }
}

/**
 * Receiver for Simple Weather Widget
 */
class SimpleWeatherWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget
        get() = SimpleWeatherWidget()
}

/**
 * Receiver for Simple Weather Widget with Date
 */
class SimpleWeatherWithDateWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SimpleWeatherWithDateWidget()
}

/**
 * Receiver for Simple Weather Widget with Clock
 */
class SimpleWeatherWithClockWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SimpleWeatherWithClockWidget()
    override fun onRestored(context: Context, oldWidgetIds: IntArray, newWidgetIds: IntArray) {
        super.onRestored(context, oldWidgetIds, newWidgetIds)
        scheduleNextClockUpdate(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        scheduleNextClockUpdate(context)
    }
    override fun onEnabled(context: Context) {
        WidgetsLogger.i(LOG_TAG, "SimpleWeatherWithClockWidget onEnabled - scheduling clock updates")
        super.onEnabled(context)
        scheduleNextClockUpdate(context)
    }
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        WidgetsLogger.d(LOG_TAG, "SimpleWeatherWithClockWidget onUpdate widgetIds=${appWidgetIds.joinToString(",")}")
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        scheduleNextClockUpdate(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WidgetsLogger.i(LOG_TAG, "SimpleWeatherWithClockWidget last widget removed - canceling clock updates")
        cancelClockUpdates(context)
    }

    companion object {
        private const val CLOCK_UPDATE_REQUEST_CODE = 1002
        
        @SuppressLint("ScheduleExactAlarm")
        fun scheduleNextClockUpdate(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Create intent to update ALL clock widgets at once
            val intent = Intent(context, SimpleWeatherWithClockWidgetReceiver::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                // Get all widget IDs for this type
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetIds = appWidgetManager.getAppWidgetIds(
                    ComponentName(context, SimpleWeatherWithClockWidgetReceiver::class.java)
                )
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CLOCK_UPDATE_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Check if alarm is already scheduled
//            val existingIntent = PendingIntent.getBroadcast(
//                context,
//                CLOCK_UPDATE_REQUEST_CODE,
//                intent,
//                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
//            )
//
//            if (existingIntent != null) {
//                WidgetsLogger.d(LOG_TAG, "Clock update already scheduled, skipping")
//                return
//            }
            
            val now = System.currentTimeMillis()
            val nextMinute = (now / 60000 + 1) * 60000 + 200
            
            // Use setExact for precise minute-synced updates (like status bar clock)
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                nextMinute,
                pendingIntent
            )
            
            WidgetsLogger.d(LOG_TAG, "Scheduled clock update for all widgets at ${nextMinute}")
        }
        
        fun cancelClockUpdates(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, SimpleWeatherWithClockWidgetReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CLOCK_UPDATE_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            
            pendingIntent?.let {
                alarmManager.cancel(it)
                it.cancel()
            }
        }
    }
}

/**
 * Receiver for Hourly Weather Widget
 */
class HourlyWeatherWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget
        get() = HourlyWeatherWidget()
}

/**
 * Receiver for Daily Weather Widget
 */
class DailyWeatherWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget
        get() = DailyWeatherWidget()
}

/**
 * Receiver for Forecast Weather Widget
 */
class ForecastWeatherWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget
        get() = ForecastWeatherWidget()
}
