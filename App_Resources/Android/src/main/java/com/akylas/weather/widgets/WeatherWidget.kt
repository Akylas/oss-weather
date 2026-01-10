package com.akylas.weather.widgets

import android.content.BroadcastReceiver
import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.akylas.weather.widgets.WeatherWidgetManager.getUpdateFrequency
import java.util.concurrent.TimeUnit
import kotlin.time.Duration.Companion.minutes
import kotlin.time.toJavaDuration

private const val LOG_TAG = "WeatherWidget"
abstract class WeatherWidget : GlanceAppWidget() {
    class WeatherWidgetWorker(
        appContext: Context,
        params: WorkerParameters
    ) : CoroutineWorker(appContext, params) {
        override suspend fun doWork(): Result {
            WeatherWidgetManager.requestAllWidgetsUpdate(applicationContext)

            return Result.success()
        }
    }

    fun setupUpdateWorker(context: Context) {
        WidgetsLogger.d(LOG_TAG, "setupUpdateWorker for class; ${this.javaClass.simpleName}")

        // Create unique periodic work to keep this widget updated at a regular interval.
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "weatherWidgetUpdateWorker",
            ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequest.Builder(
                WeatherWidgetWorker::class.java,
                getUpdateFrequency(context),
                TimeUnit.MINUTES
            ).setInitialDelay(getUpdateFrequency(context).minutes.toJavaDuration()).build()
        )
    }
}