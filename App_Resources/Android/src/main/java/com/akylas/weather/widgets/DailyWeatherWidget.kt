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

private const val LOG_TAG = "DailyWeatherWidget"

class DailyWeatherWidget : GlanceAppWidget() {
    
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
        WidgetsLogger.d(LOG_TAG, "Rendering daily content for ${data.locationName}, isLarge=$isLarge")

        WidgetComposables.WidgetContainer(context, openAction) {
            // Header
            WidgetComposables.LocationHeader(context, data.locationName, 14.sp)
            
            Spacer(modifier = GlanceModifier.height(8.dp))
            
            // Daily forecast items
            Column(
                modifier = GlanceModifier.fillMaxWidth()
            ) {
                val maxItems = if (isLarge) 5 else 3
                data.dailyData.take(maxItems).forEachIndexed { index, day ->
                    if (index > 0) {
                        Spacer(modifier = GlanceModifier.height(4.dp))
                    }
                    DailyItem(context, day, isLarge)
                }
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun DailyItem(
        context: Context,
        day: DailyData,
        showExtraData: Boolean
    ) {
        WidgetComposables.CardItem(context) {
            // Day name
            Text(
                text = day.day,
                style = TextStyle(
                    color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                ),
                modifier = GlanceModifier.defaultWeight(),
                maxLines = 1
            )
            
            Spacer(modifier = GlanceModifier.width(8.dp))
            
            // Weather icon
            WidgetComposables.WeatherIcon(context, day.iconPath, day.description, 24.dp)
            
            Spacer(modifier = GlanceModifier.width(8.dp))
            
            // Temperature range
            Row(
                verticalAlignment = Alignment.Vertical.CenterVertically,
                modifier = GlanceModifier.defaultWeight()
            ) {
                Text(
                    text = day.temperatureHigh,
                    style = TextStyle(
                        color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    maxLines = 1
                )
                
                Spacer(modifier = GlanceModifier.width(4.dp))
                
                Text(
                    text = day.temperatureLow,
                    style = TextStyle(
                        color = ColorProvider(WidgetColorProvider.getSecondaryTextColor(context)),
                        fontSize = 13.sp
                    ),
                    maxLines = 1
                )
            }
            
            if (showExtraData) {
                Spacer(modifier = GlanceModifier.width(8.dp))
                
                // Precipitation chance
                if (day.precipitation.isNotEmpty() && day.precipitation != "0%") {
                    WidgetComposables.DataLabel(
                        context,
                        "💧",
                        day.precipitation,
                        WidgetColorProvider.getPrecipitationColor(context)
                    )
                }
                
                // Wind speed
                if (day.windSpeed.isNotEmpty()) {
                    WidgetComposables.DataLabel(
                        context,
                        "💨",
                        day.windSpeed,
                        WidgetColorProvider.getWindColor(context)
                    )
                }
            }
        }
    }
}