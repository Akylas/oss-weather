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
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.layout.*
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver
import com.akylas.weather.widgets.generated.HourlyWeatherWidgetContent

private const val LOG_TAG = "HourlyWeatherWidget"

class HourlyWeatherWidget : WeatherWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Support smaller heights
            DpSize(260.dp, 60.dp),
            DpSize(260.dp, 80.dp),
            DpSize(260.dp, 120.dp)
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        WidgetsLogger.d(LOG_TAG, "provideGlance(glanceId=$id)")
        setupUpdateWorker(context)
        registerThemeChangeReceiver(context);

        // Initialize caches to populate StateFlows
        WeatherWidgetManager.loadWidgetDataCache(context)
        WeatherWidgetManager.getAllWidgetConfigs(context) // Initializes WidgetConfigStore

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

            // Observe widget data from StateFlow - triggers automatic recomposition
            val widgetData by WidgetDataStore.getWidgetDataFlow(widgetId).collectAsState()
            
            // Observe only this widget's settings - prevents unnecessary recomposition from other widgets
            val widgetSettings by WidgetConfigStore.getWidgetSettingsFlow(widgetId).collectAsState()
            val widgetConfig = WidgetConfig(settings = widgetSettings)

            GlanceTheme(colors = WidgetTheme.colors) {
                WidgetComposables.WidgetBackground(enabled = !(widgetConfig.settings?.get("transparent") as? Boolean ?: false)) {
                    if (widgetData == null || widgetData!!.loadingState == WidgetLoadingState.NONE) {
                        WidgetComposables.NoDataContent()
                    } else if (widgetData!!.loadingState == WidgetLoadingState.LOADING) {
                        WidgetComposables.NoDataContent(WidgetLoadingState.LOADING)
                    } else if (widgetData!!.loadingState == WidgetLoadingState.ERROR) {
                        WidgetComposables.NoDataContent(
                            WidgetLoadingState.ERROR,
                            widgetData!!.errorMessage
                        )
                    } else {
                        val size = LocalSize.current
                        WeatherContent(context, config = widgetConfig, data = widgetData!!, size = size)
                    }
                }
            }
        }
    }
    val fakeWeatherWidgetData = WeatherWidgetData(
        temperature = "8 °C",
        iconPath = "800d",
        description = "Partly Cloudy",
        locationName = "Grenoble",
        date = "Mon, Feb 24",
        lastUpdate = System.currentTimeMillis(),
        loadingState = WidgetLoadingState.LOADED,
        hourlyData = listOf(
            HourlyData(time = "06:00", temperature = "6 °C", iconPath = "800d", precipAccumulation = "0 mm", windSpeed = "10 km/h"),
            HourlyData(time = "07:00", temperature = "7 °C", iconPath = "800d", precipAccumulation = "0 mm", windSpeed = "10 km/h"),
            HourlyData(time = "08:00", temperature = "8 °C", iconPath = "801d", precipAccumulation = "0 mm", windSpeed = "12 km/h"),
            HourlyData(time = "09:00", temperature = "10 °C", iconPath = "801d", precipAccumulation = "0 mm", windSpeed = "12 km/h"),
            HourlyData(time = "10:00", temperature = "12 °C", iconPath = "802d", precipAccumulation = "0 mm", windSpeed = "14 km/h"),
            HourlyData(time = "11:00", temperature = "13 °C", iconPath = "802d", precipAccumulation = "0 mm", windSpeed = "14 km/h"),
            HourlyData(time = "12:00", temperature = "14 °C", iconPath = "803d", precipAccumulation = "0.2 mm", windSpeed = "16 km/h"),
            HourlyData(time = "13:00", temperature = "14 °C", iconPath = "803d", precipAccumulation = "0.5 mm", windSpeed = "16 km/h")
        )
    )

    val fakeErrorWeatherWidgetData = WeatherWidgetData(
        loadingState = WidgetLoadingState.ERROR,
        errorMessage = "Unable to fetch weather data"
    )

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 50, heightDp = 50)
    @Preview(widthDp = 80, heightDp = 80)
    @Preview(widthDp = 120, heightDp = 120)
    @Preview(widthDp = 260, heightDp = 120)
    @Composable
    private fun HourlyPreview() {
        HourlyWeatherWidgetContent(
            config = WidgetConfig(), data = fakeWeatherWidgetData,
            size = LocalSize.current,
            context = null
        )
    }

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 260, heightDp = 80)
    @Composable
    private fun ErrorPreview() {
        GlanceTheme(colors = WidgetTheme.colors) {
            WidgetComposables.WidgetBackground {
                WidgetComposables.NoDataContent(
                    WidgetLoadingState.ERROR,
                    fakeErrorWeatherWidgetData.errorMessage
                )
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context?,
        config: WidgetConfig = WidgetConfig(),
        data: WeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering hourly content for ${data.locationName}")
        
        // Use the generated content from JSON layout definition
        com.akylas.weather.widgets.generated.HourlyWeatherWidgetContent(
            context = context,
            config = config,
            data = data,
            size = size
        )
    }
}