package com.akylas.weather.widgets

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.ComponentName
import java.util.Calendar

private const val LOG_TAG = "WeatherWidgetGlanceReceiver"

abstract class WeatherWidgetGlanceReceiver : GlanceAppWidgetReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        WidgetsLogger.d(LOG_TAG, "onReceive action=${intent.action} extras=${intent.extras?.keySet()?.joinToString(",")}")
        super.onReceive(context, intent)
        
        // After handling the update, reschedule if it's a clock/date widget
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            when (this) {
                is SimpleWeatherWithClockWidgetReceiver -> SimpleWeatherWithClockWidgetReceiver.scheduleNextClockUpdate(context)
                is SimpleWeatherWithDateWidgetReceiver -> SimpleWeatherWithDateWidgetReceiver.scheduleNextDateUpdate(context)
            }
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        WidgetsLogger.d(LOG_TAG, "${this::class.simpleName} onUpdate widgetIds=${appWidgetIds.joinToString(",")}")
        super.onUpdate(context, appWidgetManager, appWidgetIds)
    }

    override fun onEnabled(context: Context) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onEnabled - first widget added")
        super.onEnabled(context)
        WeatherWidgetManager.scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        WidgetsLogger.i(LOG_TAG, "${this::class.simpleName} onDisabled - last widget removed")
        super.onDisabled(context)
        WeatherWidgetManager.cancelWidgetUpdates(context)
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

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        WidgetsLogger.i(LOG_TAG, "SimpleWeatherWithDateWidgetReceiver onUpdate - scheduling clock updates")
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        scheduleNextDateUpdate(context)
    }
    
    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WidgetsLogger.i(LOG_TAG, "SimpleWeatherWithDateWidget last widget removed - canceling date updates")
        cancelDateUpdates(context)
    }

    companion object {
        private const val DATE_UPDATE_REQUEST_CODE = 1001
        
        @SuppressLint("ScheduleExactAlarm")
        fun scheduleNextDateUpdate(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            
            // Calculate next midnight (synced to system clock)
            val calendar = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            
            // Create intent to update ALL date widgets at once
            val intent = Intent(context, SimpleWeatherWithDateWidgetReceiver::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                // Get all widget IDs for this type
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetIds = appWidgetManager.getAppWidgetIds(
                    ComponentName(context, SimpleWeatherWithDateWidgetReceiver::class.java)
                )
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                DATE_UPDATE_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Use setExact for precise midnight updates
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
            
            WidgetsLogger.d(LOG_TAG, "Scheduled date update for all widgets at ${calendar.time}")
        }
        
        fun cancelDateUpdates(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, SimpleWeatherWithDateWidgetReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                DATE_UPDATE_REQUEST_CODE,
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
 * Receiver for Simple Weather Widget with Clock
 */
class SimpleWeatherWithClockWidgetReceiver : WeatherWidgetGlanceReceiver() {
    override val glanceAppWidget: GlanceAppWidget = SimpleWeatherWithClockWidget()

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        WidgetsLogger.i(LOG_TAG, "SimpleWeatherWithClockWidget onUpdate - scheduling clock updates")
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
            
            // Calculate next minute boundary (synced to system clock)
            val calendar = Calendar.getInstance().apply {
                // Add 1 minute and truncate seconds/millis to sync to the minute
                add(Calendar.MINUTE, 1)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            
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
            
            // Use setExact for precise minute-synced updates (like status bar clock)
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
            
            WidgetsLogger.d(LOG_TAG, "Scheduled clock update for all widgets at ${calendar.time}")
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
