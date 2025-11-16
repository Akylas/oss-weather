package com.akylas.weather.widgets

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/**
 * Worker for periodic widget updates
 */
private const val LOG_TAG = "WeatherWidgetUpdateWorker"

class WeatherWidgetUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        WidgetsLogger.d(LOG_TAG, "doWork started")
        return try {
            // Check if any widgets are still active
            val activeWidgetIds = WeatherWidgetManager.getAllActiveWidgetIds(applicationContext)
            
            if (activeWidgetIds.isEmpty()) {
                WidgetsLogger.w(LOG_TAG, "No active widgets found, cancelling future updates")
                WeatherWidgetManager.cancelWidgetUpdates(applicationContext)
                return Result.success()
            }

            WidgetsLogger.d(LOG_TAG, "Updating ${activeWidgetIds.size} active widgets")
            
            // Request update for all active widgets
            WeatherWidgetManager.requestAllWidgetsUpdate(applicationContext)
            
            WidgetsLogger.i(LOG_TAG, "doWork completed successfully")
            Result.success()
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "doWork failed", t)
            Result.failure()
        }
    }
}