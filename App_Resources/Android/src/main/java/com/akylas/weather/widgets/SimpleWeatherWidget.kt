package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.glance.appwidget.components.Scaffold
import androidx.compose.runtime.Composable
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
import androidx.glance.layout.*
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "SimpleWeatherWidget"

class SimpleWeatherWidget : WeatherWidget() {

    val fakeWeatherWidgetData = WeatherWidgetData(temperature = "8C", locationName = "Grenoble")
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Very small widget
            DpSize(50.dp, 50.dp),
            DpSize(80.dp, 80.dp),
            // Small widget
            DpSize(120.dp, 120.dp),
            // Medium widget
            DpSize(260.dp, 120.dp)
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        WidgetsLogger.d(LOG_TAG, "provideGlance(glanceId=$id)")
        setupUpdateWorker(context)
        registerThemeChangeReceiver(context);

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
                        WeatherContent(context, data = widgetData, size = size)
                    }
                }
            }
        }
    }

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 50, heightDp = 50)
    @Preview(widthDp = 80, heightDp = 80)
    @Preview(widthDp = 120, heightDp = 120)
    @Preview(widthDp = 260, heightDp = 120)
    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData = fakeWeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather content for ${data.locationName}")
        
        // Use the generated content from JSON layout definition
        com.akylas.weather.widgets.generated.SimpleWeatherWidgetContent(
            context = context,
            data = data,
            size = size
        )
    }
}