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
                        WeatherContent(data = widgetData, size = size)
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
        modifier: GlanceModifier = GlanceModifier,
        data: WeatherWidgetData = fakeWeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather content for ${data.locationName}")

        // Adjust padding based on size
        val padding = when {
            size.width < 100.dp -> 4.dp
            size.width < 150.dp -> 6.dp
            else -> 8.dp
        }

        WidgetComposables.WidgetContainer(padding = padding) {
            if (size.width < 80.dp) {
                // Very Small widget: Vertical layout with large icon and small temp
                Column(
                    modifier = modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(modifier = GlanceModifier.defaultWeight())

                    // Large icon
                    val iconSize = (size.width.value * 0.5f).dp.coerceAtLeast(32.dp)
                    WidgetComposables.WeatherIcon(data.iconPath, data.description, iconSize)

                    Spacer(modifier = GlanceModifier.height(4.dp))

                    // Small temperature
                    WidgetComposables.TemperatureText(data.temperature, 14.sp)

                    Spacer(modifier = GlanceModifier.height(4.dp))

                    // Location at bottom, scaled with size
                    val locationFontSize = (size.width.value / 15).coerceIn(8f, 12f).sp
                    WidgetComposables.LocationHeader(data.locationName, locationFontSize, maxLines = 1)
                }
            } else if (size.width < 200.dp) {
                // Small widget: Vertical layout
                Column(
                    modifier = modifier.fillMaxSize(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    WidgetComposables.LocationHeader(data.locationName, 12.sp)
                    Spacer(modifier = GlanceModifier.height(4.dp))

                    // Bigger icon - 40% of width
                    val iconSize = (size.width.value * 0.4f).dp.coerceAtLeast(48.dp)
                    WidgetComposables.WeatherIcon(data.iconPath, data.description, iconSize)

                    Spacer(modifier = GlanceModifier.height(4.dp))
                    WidgetComposables.TemperatureText(data.temperature, 32.sp)
                }
            } else {
                // Medium widget: More spacious layout with bigger icon
                Column(
                    modifier = modifier.fillMaxSize(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    WidgetComposables.LocationHeader(data.locationName, 16.sp)
                    Spacer(modifier = GlanceModifier.height(8.dp))

                    // Bigger icon
                    WidgetComposables.WeatherIcon(data.iconPath, data.description, 72.dp)

                    Spacer(modifier = GlanceModifier.height(8.dp))
                    WidgetComposables.TemperatureText(data.temperature, 48.sp)
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    if (data.description.isNotEmpty()) {
                        WidgetComposables.DescriptionText(data.description, 14.sp)
                    }
                }
            }
        }
    }
}