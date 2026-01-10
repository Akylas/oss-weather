package com.akylas.weather.widgets

import android.content.Context
import android.content.Intent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import android.app.AlarmManager
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * Worker to update clock widget every minute
 */
class ClockUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val LOG_TAG = "ClockUpdateWorker"

    override suspend fun doWork(): Result {
        WidgetsLogger.d(LOG_TAG, "doWork started (input=${inputData.keyValueMap})")
        return try {
            // Update clock widget
            val appWidgetManager = AppWidgetManager.getInstance(applicationContext)
            val widgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(applicationContext, SimpleWeatherWithClockWidgetReceiver::class.java)
            )

            if (widgetIds.isNotEmpty()) {
                val intent = Intent(applicationContext, SimpleWeatherWithClockWidgetReceiver::class.java)
                intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
                applicationContext.sendBroadcast(intent)
            }

            WidgetsLogger.i(LOG_TAG, "doWork finished successfully")
            Result.success()
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "doWork failed", t)
            Result.failure()
        }
    }

    companion object {
        private const val CLOCK_UPDATE_WORK_TAG = "clock_widget_update"

        fun scheduleClockUpdates(context: Context) {
            // Check if we have permission for exact alarms on Android 12+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                if (alarmManager?.canScheduleExactAlarms() == false) {
                    WidgetsLogger.w("ClockUpdateWorker", "Cannot schedule exact alarms - permission not granted")
                    // Fall back to periodic work request which doesn't require exact alarm permission
                    schedulePeriodicUpdates(context)
                    return
                }
            }
            
            schedulePeriodicUpdates(context)
        }
        
        private fun schedulePeriodicUpdates(context: Context) {
            val updateRequest = PeriodicWorkRequestBuilder<ClockUpdateWorker>(
                15, // Minimum is 15 minutes for PeriodicWork
                TimeUnit.MINUTES
            )
                .setInitialDelay(0, TimeUnit.MINUTES)
                .addTag(CLOCK_UPDATE_WORK_TAG)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                CLOCK_UPDATE_WORK_TAG,
                ExistingPeriodicWorkPolicy.REPLACE,
                updateRequest
            )
        }

        fun cancelClockUpdates(context: Context) {
            WorkManager.getInstance(context).cancelAllWorkByTag(CLOCK_UPDATE_WORK_TAG)
        }
    }
}