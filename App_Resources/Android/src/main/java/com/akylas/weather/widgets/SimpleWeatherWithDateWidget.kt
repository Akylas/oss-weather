package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.runtime.Composable
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

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
            val widgetData = WeatherWidgetManager.getWidgetData(context, widgetId)

            GlanceTheme(colors = WidgetTheme.colors) {
                WidgetComposables.WidgetBackground {
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
                        WeatherWithDateContent(data = widgetData, size = size)
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
        modifier: GlanceModifier = GlanceModifier,
        data: WeatherWidgetData = fakeWeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather with date for ${data.locationName}")

        // Support down to 50dp height
        val padding = when {
            size.height < 60.dp -> 2.dp
            size.height < 80.dp -> 4.dp
            else -> 6.dp
        }
        
        val isVerySmall = size.height < 60.dp

        WidgetComposables.WidgetContainer(padding = padding) {
            Column(
                modifier = modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Date
                val dateFontSize = when {
                    isVerySmall -> 10.sp
                    size.height < 80.dp -> 12.sp
                    else -> 14.sp
                }
                
                val dateFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
                val currentDate = dateFormat.format(Date())
                
                Text(
                    text = currentDate,
                    style = TextStyle(
                        fontSize = dateFontSize,
                        color = GlanceTheme.colors.onSurface
                    ),
                    maxLines = 1
                )
                
                // Weather info
                Row(
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Bigger icon
                    val iconSize = when {
                        isVerySmall -> 24.dp
                        size.height < 80.dp -> 32.dp
                        else -> 40.dp
                    }
                    
                    WidgetComposables.WeatherIcon(data.iconPath, data.description, iconSize)
                    
                    Spacer(modifier = GlanceModifier.width(if (isVerySmall) 4.dp else 8.dp))
                    
                    val tempFontSize = when {
                        isVerySmall -> 16.sp
                        size.height < 80.dp -> 20.sp
                        else -> 24.sp
                    }
                    
                    WidgetComposables.TemperatureText(data.temperature, tempFontSize)
                }
                
                // Location
                val locationFontSize = when {
                    isVerySmall -> 9.sp
                    size.height < 80.dp -> 11.sp
                    else -> 12.sp
                }
                
                WidgetComposables.LocationHeader(data.locationName, locationFontSize, maxLines = 1)
            }
        }
    }
}