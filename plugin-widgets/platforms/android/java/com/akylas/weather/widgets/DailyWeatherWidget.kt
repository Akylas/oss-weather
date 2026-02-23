package com.akylas.weather.widgets

import android.annotation.SuppressLint
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
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.layout.*
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "DailyWeatherWidget"

class DailyWeatherWidget : WeatherWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Medium widget
            DpSize(260.dp, 120.dp),
            // Large widget
            DpSize(260.dp, 200.dp)
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
        iconPath = "icon_themes/meteocons/images/800d.png",
        description = "Partly Cloudy",
        locationName = "Grenoble",
        date = "Mon, Feb 24",
        lastUpdate = System.currentTimeMillis(),
        loadingState = WidgetLoadingState.LOADED,
        dailyData = listOf(
            DailyData(day = "Mon", iconPath = "icon_themes/meteocons/images/800d.png", temperatureHigh = "12 °C", temperatureLow = "4 °C", precipAccumulation = "0 mm", precipitation = "5 %", windSpeed = "14 km/h"),
            DailyData(day = "Tue", iconPath = "icon_themes/meteocons/images/801d.png", temperatureHigh = "14 °C", temperatureLow = "6 °C", precipAccumulation = "0 mm", precipitation = "10 %", windSpeed = "12 km/h"),
            DailyData(day = "Wed", iconPath = "icon_themes/meteocons/images/500d.png", temperatureHigh = "10 °C", temperatureLow = "5 °C", precipAccumulation = "3 mm", precipitation = "60 %", windSpeed = "18 km/h"),
            DailyData(day = "Thu", iconPath = "icon_themes/meteocons/images/501d.png", temperatureHigh = "9 °C", temperatureLow = "3 °C", precipAccumulation = "8 mm", precipitation = "80 %", windSpeed = "22 km/h"),
            DailyData(day = "Fri", iconPath = "icon_themes/meteocons/images/802d.png", temperatureHigh = "11 °C", temperatureLow = "4 °C", precipAccumulation = "0 mm", precipitation = "20 %", windSpeed = "16 km/h"),
            DailyData(day = "Sat", iconPath = "icon_themes/meteocons/images/800d.png", temperatureHigh = "15 °C", temperatureLow = "7 °C", precipAccumulation = "0 mm", precipitation = "5 %", windSpeed = "10 km/h")
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
    private fun Preview() {
        WeatherContent(
            config = WidgetConfig(), data = fakeWeatherWidgetData,
            size = LocalSize.current,
            context = null
        )
    }

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 260, heightDp = 200)
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
        WidgetsLogger.d(LOG_TAG, "Rendering daily content for ${data.locationName}, size=$size")
        
        com.akylas.weather.widgets.generated.DailyWeatherWidgetContent(
            context = context,
            config = config,
            data = data,
            size = size
        )
    }
}