package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.updateAll
import androidx.glance.layout.*
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

private const val LOG_TAG = "SimpleWeatherWithDateWidget"

class SimpleWeatherWithDateWidget : WeatherWidget() {

    val fakeWeatherWidgetData = WeatherWidgetData(temperature = "8C", locationName = "Grenoble")
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Support down to 50dp height
            DpSize(120.dp, 50.dp),
            DpSize(120.dp, 80.dp),
            DpSize(180.dp, 80.dp),
            DpSize(260.dp, 120.dp)
        )
    )

    class WeatherWidgetDateWorker(
        appContext: Context,
        params: WorkerParameters
    ) : CoroutineWorker(appContext, params) {
        override suspend fun doWork(): Result {
            SimpleWeatherWithDateWidget().apply { updateAll(applicationContext) }
            return Result.success()
        }
    }

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        WidgetsLogger.d(LOG_TAG, "provideGlance(glanceId=$id)")
        setupUpdateWorker(context)
        registerThemeChangeReceiver(context);

        // Create unique periodic work to keep this widget updated at a regular interval.
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_YEAR, 1)
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        var delayUntilNextDay = calendar.timeInMillis - System.currentTimeMillis()
        if (delayUntilNextDay < 10000L) {
            delayUntilNextDay = 10000L
        }
        // Create unique periodic work to keep this widget updated at a regular interval.
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "weatherDateWidgetWorker",
            ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequest.Builder(
                WeatherWidgetDateWorker::class.java,
                1, TimeUnit.DAYS
            ).setInitialDelay(delayUntilNextDay, TimeUnit.MILLISECONDS).build()
        )

        // Initialize cache to populate StateFlow
        WeatherWidgetManager.loadWidgetDataCache(context)

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
            val widgetConfig = WeatherWidgetManager.loadWidgetConfig(context, widgetId) ?: WeatherWidgetManager.createDefaultConfig()

            // Observe widget data from StateFlow - triggers automatic recomposition
            val dataMap by WeatherWidgetManager.WidgetDataStore.widgetData.collectAsState()
            val widgetData = dataMap[widgetId]

            GlanceTheme(colors = WidgetTheme.colors) {
                WidgetComposables.WidgetBackground(enabled = !(widgetConfig.settings?.get("transparent") as? Boolean ?: true)) {
                    if (widgetData == null || widgetData.loadingState == WidgetLoadingState.NONE) {
                        WidgetComposables.NoDataContent()
                    } else if (widgetData.loadingState == WidgetLoadingState.LOADING) {
                        WidgetComposables.NoDataContent(WidgetLoadingState.LOADING)
                    } else if (widgetData.loadingState == WidgetLoadingState.ERROR) {
                        WidgetComposables.NoDataContent(
                            WidgetLoadingState.ERROR,
                            widgetData.errorMessage
                        )
                    } else {
                        val size = LocalSize.current
                        WeatherWithDateContent(context, config = widgetConfig, data = widgetData, size = size)
                    }
                }
            }
        }
    }

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 120, heightDp = 50)
    @Preview(widthDp = 120, heightDp = 80)
    @Preview(widthDp = 180, heightDp = 80)
    @Preview(widthDp = 260, heightDp = 120)
    @Composable
    private fun WeatherWithDateContent(
        context: Context,
        modifier: GlanceModifier = GlanceModifier,
        config: WidgetConfig = WidgetConfig(),
        data: WeatherWidgetData = fakeWeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather with date for ${data.locationName}")
        
        // Use the generated content from JSON layout definition
        com.akylas.weather.widgets.generated.SimpleWeatherWithDateWidgetContent(
            context = context,
            config = config,
            data = data,
            size = size
        )
    }
}