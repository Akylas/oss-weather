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
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver

private const val LOG_TAG = "DailyWeatherWidgetOld"

class DailyWeatherWidgetOld : WeatherWidget() {
    
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
        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

            val widgetData = WeatherWidgetManager.getWidgetData(context, widgetId)
            GlanceTheme(colors = WidgetTheme.colors) {
                WidgetComposables.WidgetBackground {
                    if (widgetData == null || widgetData.loadingState == WidgetLoadingState.NONE) {
                        WidgetComposables.NoDataContent()
                    } else if (widgetData.loadingState == WidgetLoadingState.LOADING) {
                        WidgetComposables.NoDataContent( WidgetLoadingState.LOADING)
                    } else if (widgetData.loadingState == WidgetLoadingState.ERROR) {
                        WidgetComposables.NoDataContent(
                            WidgetLoadingState.ERROR,
                            widgetData.errorMessage
                        )
                    } else {
                        val size = LocalSize.current
                        val isLarge = size.width > 150.dp

                        WeatherContent( context, widgetData, isLarge)
                    }
                }
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        isLarge: Boolean
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering daily content for ${data.locationName}, isLarge=$isLarge")

        WidgetComposables.WidgetContainer() {
            // Header
            WidgetComposables.LocationHeader( data.locationName, 14.sp)
            
            Spacer(modifier = GlanceModifier.height(8.dp))
            
            // Daily forecast items
            LazyColumn(
                modifier = GlanceModifier.fillMaxSize()
            ) {
                items(data.dailyData) { day ->
                    DailyItem( day, isLarge)
                }
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun DailyItem(
        day: DailyData,
        showExtraData: Boolean,
    ) {
        Row(modifier = GlanceModifier.fillMaxWidth()) {
            Spacer(modifier = GlanceModifier.height(4.dp).fillMaxWidth())
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
}