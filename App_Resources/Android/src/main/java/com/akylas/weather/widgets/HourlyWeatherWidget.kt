package com.akylas.weather.widgets

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.SizeMode
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.glance.appwidget.GlanceAppWidgetManager

private const val LOG_TAG = "HourlyWeatherWidget"

class HourlyWeatherWidget : GlanceAppWidget() {
    
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

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

            val widgetData = WeatherWidgetManager.getWidgetData(widgetId)
            val launchIntent = WeatherWidgetManager.createAppLaunchIntent(context)
            val openAction = launchIntent?.let { actionStartActivity(it.component!!) }

            if (widgetData == null || widgetData.loadingState == WidgetLoadingState.NONE) {
                WidgetComposables.NoDataContent(context)
            } else if (widgetData.loadingState == WidgetLoadingState.LOADING) {
                WidgetComposables.NoDataContent(context, WidgetLoadingState.LOADING)
            } else if (widgetData.loadingState == WidgetLoadingState.ERROR) {
                WidgetComposables.NoDataContent(context, WidgetLoadingState.ERROR, widgetData.errorMessage)
            } else {
                val size = LocalSize.current
                val isLarge = size.height > 150.dp
                
                WeatherContent(context, widgetData, openAction, isLarge)
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        openAction: androidx.glance.action.Action?,
        isLarge: Boolean
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering hourly content for ${data.locationName}, isLarge=$isLarge")

        WidgetComposables.WidgetContainer(context, openAction) {
            // Header
            WidgetComposables.LocationHeader(context, data.locationName, 14.sp)
            
            Spacer(modifier = GlanceModifier.height(8.dp))
            
            // Horizontal scrollable hourly forecast
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.Start
            ) {
                val maxItems = if (isLarge) 6 else 4
                data.hourlyData.take(maxItems).forEach { hour ->
                    HourlyItem(context, hour, isLarge)
                }
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun RowScope.HourlyItem(
        context: Context,
        hour: HourlyData,
        showExtraData: Boolean
    ) {
        Column(
            modifier = GlanceModifier
                .defaultWeight()
                .padding(horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Time
            Text(
                text = hour.time,
                style = TextStyle(
                    color = ColorProvider(WidgetColorProvider.getSecondaryTextColor(context)),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                ),
                maxLines = 1
            )
            
            Spacer(modifier = GlanceModifier.height(4.dp))
            
            // Icon
            WidgetComposables.WeatherIcon(context, hour.iconPath, "", 32.dp)
            
            Spacer(modifier = GlanceModifier.height(4.dp))
            
            // Temperature
            Text(
                text = hour.temperature,
                style = TextStyle(
                    color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                ),
                maxLines = 1
            )
            
            if (showExtraData) {
                Spacer(modifier = GlanceModifier.height(4.dp))
                
                // Precipitation
                if (hour.precipitation.isNotEmpty() && hour.precipitation != "0%") {
                    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                        Text(
                            text = "💧",
                            style = TextStyle(fontSize = 10.sp)
                        )
                        Text(
                            text = hour.precipitation,
                            style = TextStyle(
                                color = ColorProvider(WidgetColorProvider.getPrecipitationColor(context)),
                                fontSize = 10.sp
                            ),
                            maxLines = 1
                        )
                    }
                }
                
                // Wind
                if (hour.windSpeed.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                        Text(
                            text = "💨",
                            style = TextStyle(fontSize = 10.sp)
                        )
                        Text(
                            text = hour.windSpeed,
                            style = TextStyle(
                                color = ColorProvider(WidgetColorProvider.getWindColor(context)),
                                fontSize = 10.sp
                            ),
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}