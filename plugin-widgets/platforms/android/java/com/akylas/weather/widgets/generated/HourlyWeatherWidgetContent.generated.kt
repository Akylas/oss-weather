package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.cornerRadius
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WeatherWidgetManager
import com.akylas.weather.widgets.WidgetTheme
import com.akylas.weather.widgets.WidgetConfig
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import com.akylas.weather.widgets.HourlyData
import com.akylas.weather.widgets.WidgetComposables
import com.akylas.weather.widgets.WidgetLoadingState
import kotlin.math.min

/**
 * Generated content for Hourly Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 360, heightDp = 150)
@Preview(widthDp = 120, heightDp = 120)
@Preview(widthDp = 260, heightDp = 120)
@Composable
private fun Preview() {
    val fakeWeatherWidgetData = WeatherWidgetData(
        temperature = "12°",
        locationName = "Paris",
        description = "Partly Cloudy",
        date = "Mon, Feb 24",
        hourlyData = listOf(HourlyData(time = "06:00", temperature = "6°", iconPath = "icon_themes/meteocons/images/800d.png", precipAccumulation = "0 mm", windSpeed = "10 km/h"), HourlyData(time = "07:00", temperature = "7°", iconPath = "icon_themes/meteocons/images/800d.png", precipAccumulation = "0 mm", windSpeed = "10 km/h"), HourlyData(time = "08:00", temperature = "8°", iconPath = "icon_themes/meteocons/images/802d.png", precipAccumulation = "0 mm", windSpeed = "12 km/h"), HourlyData(time = "09:00", temperature = "10°", iconPath = "icon_themes/meteocons/images/500n.png", precipAccumulation = "0 mm", windSpeed = "12 km/h"), HourlyData(time = "10:00", temperature = "12°", iconPath = "icon_themes/meteocons/images/802d.png", precipAccumulation = "0 mm", windSpeed = "14 km/h"), HourlyData(time = "11:00", temperature = "13°", iconPath = "icon_themes/meteocons/images/802d.png", precipAccumulation = "0 mm", windSpeed = "14 km/h"), HourlyData(time = "12:00", temperature = "14°", iconPath = "icon_themes/meteocons/images/500n.png", precipAccumulation = "0.2 mm", windSpeed = "16 km/h"), HourlyData(time = "13:00", temperature = "14°", iconPath = "icon_themes/meteocons/images/500n.png", precipAccumulation = "0.5 mm", windSpeed = "16 km/h")),
        lastUpdate = System.currentTimeMillis(),
        loadingState = WidgetLoadingState.LOADED
    )
    HourlyWeatherWidgetContent(
        config = WidgetConfig(), data = fakeWeatherWidgetData,
    )
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 260, heightDp = 120)
@Composable
private fun ErrorPreview() {
    val fakeErrorWeatherWidgetData = WeatherWidgetData(
        loadingState = WidgetLoadingState.ERROR,
        errorMessage = "Unable to fetch weather data"
    )
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
fun HourlyWeatherWidgetContent(config: WidgetConfig, data: WeatherWidgetData) {
    val context = LocalContext.current
    val size = LocalSize.current

    Column(
        modifier = GlanceModifier.padding(when { size.height.value < 60 -> 2.dp; size.height.value < 80 -> 4.dp; else -> 6.dp }),
        verticalAlignment = Alignment.Vertical.Top,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        if (size.height.value >= 80) {
            Column(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.CenterVertically,
                horizontalAlignment = Alignment.Horizontal.Start
            ) {
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurface, textAlign = TextAlign.Start),
                    maxLines = 1
                )
                Spacer(modifier = GlanceModifier.height(2.dp))
            }
        }
        Row {
            data.hourlyData.take(8).forEach { item ->
                Column(
                    modifier = GlanceModifier.width(53.dp).fillMaxHeight().padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Text(
                        text = item.time,
                        style = TextStyle(fontSize = when { size.height.value < 60 -> 9.sp; else -> 11.sp }, color = GlanceTheme.colors.onSurfaceVariant),
                        maxLines = 1
                    )
                    Spacer(modifier = GlanceModifier.height(when { size.height.value < 60 -> 0.dp; else -> 2.dp }))
                    WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath, LocalContext.current)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = item.iconPath,
                           modifier = GlanceModifier.size(when { size.height.value < 60 -> 24.dp; size.height.value < 80 -> 28.dp; else -> 32.dp })
                        )
                    }
                    Spacer(modifier = GlanceModifier.height(when { size.height.value < 60 -> 0.dp; else -> 2.dp }))
                    Text(
                        text = item.temperature,
                        style = TextStyle(fontSize = when { size.height.value < 60 -> 12.sp; else -> 14.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                        maxLines = 1
                    )
                    Spacer(modifier = GlanceModifier.height(when { size.height.value < 60 -> 0.dp; else -> 2.dp }))
                    if ((size.height.value >= 60 && item.precipAccumulation.isNotEmpty())) {
                        Column(
                            modifier = GlanceModifier,
                            verticalAlignment = Alignment.Vertical.CenterVertically,
                            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                        ) {
                            if (size.height.value >= 60) {
                                Spacer(modifier = GlanceModifier.height(2.dp))
                            }
                            Text(
                                text = item.precipAccumulation,
                                style = TextStyle(fontSize = when { size.height.value < 80 -> 9.sp; else -> 10.sp }, color = GlanceTheme.colors.onSurfaceVariant)
                            )
                        }
                    }
                }
            }
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager