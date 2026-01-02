package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "HourlyWeatherWidgetOld"

class HourlyWeatherWidgetOld : WeatherWidget() {
    
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

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
            val widgetData = WeatherWidgetManager.getWidgetData(context, widgetId)

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

    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering hourly content for ${data.locationName}")

        // Support smaller heights
        val padding = when {
            size.height < 60.dp -> 2.dp
            size.height < 80.dp -> 4.dp
            else -> 6.dp
        }
        
        val isSmall = size.height < 80.dp

        WidgetComposables.WidgetContainer(padding = padding) {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                if (!isSmall) {
                    WidgetComposables.LocationHeader(data.locationName, 14.sp)
                    Spacer(modifier = GlanceModifier.height(4.dp))
                }

                Row(
                    modifier = GlanceModifier.fillMaxSize()
                ) {
                    data.hourlyData.take(8).forEach { hour ->
                        HourlyItem(hour, size)
                    }
                }
            }
        }
    }

    @Composable
    private fun HourlyItem(
        hour: HourlyData,
        size: DpSize
    ) {
        val isVerySmall = size.height < 60.dp
        val isSmall = size.height < 80.dp
        
        Column(
            modifier = GlanceModifier
                .width(56.dp)
                .fillMaxHeight()
                .padding(horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.Vertical.Top
        ) {
            // Time
            val timeFontSize = if (isVerySmall) 9.sp else 11.sp
            Text(
                text = hour.time,
                style = TextStyle(
                    fontSize = timeFontSize,
                    color = WidgetTheme.colors.onSurfaceVariant
                ),
                maxLines = 1
            )
            
            if (!isVerySmall) {
                Spacer(modifier = GlanceModifier.height(2.dp))
            }
            
            // Icon - bigger
            val iconSize = when {
                isVerySmall -> 24.dp
                isSmall -> 28.dp
                else -> 32.dp
            }
            WidgetComposables.WeatherIcon(hour.iconPath, hour.description, iconSize)
            
            if (!isVerySmall) {
                Spacer(modifier = GlanceModifier.height(2.dp))
            }
            
            // Temperature
            val tempFontSize = if (isVerySmall) 12.sp else 14.sp
            Text(
                text = hour.temperature,
                style = TextStyle(
                    fontSize = tempFontSize,
                    fontWeight = FontWeight.Bold,
                    color = WidgetTheme.colors.onSurface
                ),
                maxLines = 1
            )
            
            // Add precipAccumulation if present and not very small
            if (!isVerySmall && hour.precipAccumulation.isNotEmpty() && hour.precipAccumulation != "0mm" && hour.precipAccumulation != "0\"") {
                Spacer(modifier = GlanceModifier.height(2.dp))
                WidgetComposables.PrecipitationText(hour.precipAccumulation, if (isSmall) 9.sp else 10.sp)
            }
        }
    }
}