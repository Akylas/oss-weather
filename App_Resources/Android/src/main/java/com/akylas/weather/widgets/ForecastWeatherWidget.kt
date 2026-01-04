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
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "ForecastWeatherWidget"

class ForecastWeatherWidget : WeatherWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            DpSize(260.dp, 200.dp),
            DpSize(260.dp, 280.dp)
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
            val dataMap by WeatherWidgetManager.WidgetDataStore.widgetData.collectAsState()
            val widgetData = dataMap[widgetId]
            
            // Observe only this widget's settings - prevents unnecessary recomposition from other widgets
            val widgetSettings by WeatherWidgetManager.WidgetConfigStore.getWidgetSettingsFlow(widgetId).collectAsState()
            val widgetConfig = WidgetConfig(settings = widgetSettings)

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
                        WeatherContent(context, config = widgetConfig, data = widgetData, size = size)
                    }
                }
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context,
        config: WidgetConfig = WidgetConfig(),
        data: WeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering forecast content for ${data.locationName}")
        
        // Use the generated content from JSON layout definition
        com.akylas.weather.widgets.generated.ForecastWeatherWidgetContent(
            context = context,
            config = config,
            data = data,
            size = size
        )
    }
}