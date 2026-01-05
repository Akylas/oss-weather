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

private const val LOG_TAG = "ForecastWeatherWidget"

class ForecastWeatherWidget : GlanceAppWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Large widget only
            DpSize(260.dp, 200.dp),
            DpSize(260.dp, 280.dp)
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
                val isExtraLarge = size.height > 240.dp
                
                WeatherContent(context, widgetData, openAction, isExtraLarge)
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        openAction: androidx.glance.action.Action?,
        isExtraLarge: Boolean
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering forecast content for ${data.locationName}, isExtraLarge=$isExtraLarge")

        WidgetComposables.WidgetContainer(context, openAction) {
            // Header with current conditions
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                Column(modifier = GlanceModifier.defaultWeight()) {
                    WidgetComposables.LocationHeader(context, data.locationName, 16.sp)
                    Spacer(modifier = GlanceModifier.height(2.dp))
                    if (data.description.isNotEmpty()) {
                        WidgetComposables.DescriptionText(context, data.description, 12.sp)
                    }
                }
                
                Spacer(modifier = GlanceModifier.width(8.dp))
                
                // Current temperature
                WidgetComposables.TemperatureText(context, data.temperature, 36.sp)
            }
            
            Spacer(modifier = GlanceModifier.height(12.dp))
            
            // Forecast data
            Column(modifier = GlanceModifier.fillMaxWidth()) {
                val maxItems = if (isExtraLarge) 7 else 5
                data.forecastData.take(maxItems).forEachIndexed { index, forecast ->
                    if (index > 0) {
                        Spacer(modifier = GlanceModifier.height(4.dp))
                    }
                    ForecastItem(context, forecast, isExtraLarge)
                }
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun ForecastItem(
        context: Context,
        forecast: ForecastData,
        showExtraData: Boolean
    ) {
        WidgetComposables.CardItem(context) {
            // Time/Day
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    text = forecast.dateTime,
                    style = TextStyle(
                        color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    maxLines = 1
                )
                if (showExtraData && forecast.dayName.isNotEmpty()) {
                    Text(
                        text = forecast.dayName,
                        style = TextStyle(
                            color = ColorProvider(WidgetColorProvider.getSecondaryTextColor(context)),
                            fontSize = 10.sp
                        ),
                        maxLines = 1
                    )
                }
            }
            
            Spacer(modifier = GlanceModifier.width(8.dp))
            
            // Weather icon
            WidgetComposables.WeatherIcon(context, forecast.iconPath, forecast.description, 24.dp)
            
            Spacer(modifier = GlanceModifier.width(8.dp))
            
            // Temperature
            Text(
                text = forecast.temperature,
                style = TextStyle(
                    color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                ),
                modifier = GlanceModifier.defaultWeight(),
                maxLines = 1
            )
            
            if (showExtraData) {
                Spacer(modifier = GlanceModifier.width(8.dp))
                
                // Precipitation
                if (forecast.precipitation.isNotEmpty() && forecast.precipitation != "0%") {
                    WidgetComposables.DataLabel(
                        context,
                        "💧",
                        forecast.precipitation,
                        WidgetColorProvider.getPrecipitationColor(context)
                    )
                }
                
                // Wind
                if (forecast.windSpeed.isNotEmpty()) {
                    WidgetComposables.DataLabel(
                        context,
                        "💨",
                        forecast.windSpeed,
                        WidgetColorProvider.getWindColor(context)
                    )
                }
            }
        }
    }
}