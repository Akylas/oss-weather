package com.akylas.weather.widgets

import android.annotation.SuppressLint
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
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "ForecastWeatherWidgetOld"

class ForecastWeatherWidgetOld : WeatherWidget() {
    
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

    @Composable
    private fun WeatherContent(
        data: WeatherWidgetData,
        size: DpSize
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering forecast content for ${data.locationName}")

        val isLarge = size.width > 240.dp
        val isWidthLarge = size.width > 150.dp

        WidgetComposables.WidgetContainer() {
            Column(modifier = GlanceModifier.fillMaxSize()) {
                // Current weather section
                WidgetComposables.CurrentWeatherSection(data)
                
                Spacer(modifier = GlanceModifier.height(8.dp))
                
                // Hourly section
                Text(
                    text = "Hourly",
                    style = TextStyle(
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = GlanceTheme.colors.onSurfaceVariant
                    )
                )
                
                Spacer(modifier = GlanceModifier.height(4.dp))

                Row(
                    modifier = GlanceModifier.height(if (isLarge) 80.dp else 70.dp).fillMaxWidth()
                ) {
                    data.hourlyData.take(8).forEach { hour ->
                        HourlyForecastItem(hour, isLarge)
                    }
                }
                
                Spacer(modifier = GlanceModifier.height(8.dp))
                
                // Daily section
                Text(
                    text = "Daily",
                    style = TextStyle(
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = GlanceTheme.colors.onSurfaceVariant
                    )
                )
                
                Spacer(modifier = GlanceModifier.height(4.dp))

                LazyColumn(
                    modifier = GlanceModifier.fillMaxSize()
                ) {
                    items(data.dailyData) { day ->
                        DailyItem(day, isWidthLarge)
                    }
                }
            }
        }
    }

    @Composable
    private fun HourlyForecastItem(
        hour: HourlyData,
        isLarge: Boolean
    ) {
        Column(
            modifier = GlanceModifier
                .width(50.dp)
                .padding(horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = hour.time,
                style = TextStyle(
                    fontSize = 10.sp,
                    color = GlanceTheme.colors.onSurfaceVariant
                ),
                maxLines = 1
            )
            
            Spacer(modifier = GlanceModifier.height(2.dp))
            
            WidgetComposables.WeatherIcon(hour.iconPath, hour.description, 28.dp)
            
            Spacer(modifier = GlanceModifier.height(2.dp))
            
            Text(
                text = hour.temperature,
                style = TextStyle(
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = GlanceTheme.colors.onSurface
                ),
                maxLines = 1
            )
            
            // Add precipAccumulation
            if (hour.precipAccumulation.isNotEmpty() && hour.precipAccumulation != "0mm" && hour.precipAccumulation != "0\"") {
                Spacer(modifier = GlanceModifier.height(2.dp))
                WidgetComposables.PrecipitationText(hour.precipAccumulation, 9.sp)
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun DailyItem(
        day: DailyData,
        showExtraData: Boolean,
    ) {
        WidgetComposables.CardItem() {
            // Day name
            Text(
                text = day.day,
                style = TextStyle(
                    color = GlanceTheme.colors.onBackground,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                ),
                modifier = GlanceModifier.defaultWeight(),
                maxLines = 1
            )

            Spacer(modifier = GlanceModifier.width(8.dp))

            // Weather icon - bigger
            WidgetComposables.WeatherIcon( day.iconPath, day.description, 28.dp)

            Spacer(modifier = GlanceModifier.width(8.dp))

            // Temperature range
            Row(
                verticalAlignment = Alignment.Vertical.CenterVertically,
                horizontalAlignment = Alignment.End,
                modifier = GlanceModifier.defaultWeight()
            ) {
                // Add precipAccumulation before temperatures
                if (day.precipAccumulation.isNotEmpty() && day.precipAccumulation != "0mm" && day.precipAccumulation != "0\"") {
                    WidgetComposables.PrecipitationText(day.precipAccumulation, 10.sp)
                    Spacer(modifier = GlanceModifier.width(6.dp))
                }

                Text(
                    text = day.temperatureHigh,
                    style = TextStyle(
                        color = GlanceTheme.colors.onBackground,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    maxLines = 1
                )

                Spacer(modifier = GlanceModifier.width(4.dp))

                Text(
                    text = day.temperatureLow,
                    style = TextStyle(
                        color = GlanceTheme.colors.onSurfaceVariant,
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
                        "💧",
                        day.precipitation,
                        useAccentColor = true
                    )
                }

                // Wind speed
                if (day.windSpeed.isNotEmpty()) {
                    WidgetComposables.DataLabel(
                        "💨",
                        day.windSpeed,
                        useAccentColor = false
                    )
                }
            }
        }

    }
}