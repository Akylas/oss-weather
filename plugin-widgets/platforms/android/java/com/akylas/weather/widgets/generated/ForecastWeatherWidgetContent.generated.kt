package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.DpSize
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
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.widgets.DailyData
import com.akylas.weather.widgets.HourlyData
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WeatherWidgetManager
import com.akylas.weather.widgets.WidgetComposables
import com.akylas.weather.widgets.WidgetTheme
import com.akylas.weather.widgets.WidgetConfig
import com.akylas.weather.widgets.WidgetLoadingState

/**
 * Generated content for Detailed Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */


val fakeWeatherWidgetData = WeatherWidgetData(
    temperature = "8 °C",
    iconPath = "icon_themes/meteocons/images/800d.png",
    description = "Partly Cloudy",
    locationName = "Grenoble",
    date = "Mon, Feb 24",
    lastUpdate = System.currentTimeMillis(),
    loadingState = WidgetLoadingState.LOADED,
    hourlyData = listOf(
        HourlyData(time = "06:00", temperature = "6 °C", iconPath = "icon_themes/meteocons/images/800d.png", precipAccumulation = "0 mm", windSpeed = "10 km/h"),
        HourlyData(time = "07:00", temperature = "7 °C", iconPath = "icon_themes/meteocons/images/800d.png", precipAccumulation = "0 mm", windSpeed = "10 km/h"),
        HourlyData(time = "08:00", temperature = "8 °C", iconPath = "icon_themes/meteocons/images/801d.png", precipAccumulation = "0 mm", windSpeed = "12 km/h"),
        HourlyData(time = "09:00", temperature = "10 °C", iconPath = "icon_themes/meteocons/images/801d.png", precipAccumulation = "0 mm", windSpeed = "12 km/h"),
        HourlyData(time = "10:00", temperature = "12 °C", iconPath = "icon_themes/meteocons/images/802d.png", precipAccumulation = "0 mm", windSpeed = "14 km/h"),
        HourlyData(time = "11:00", temperature = "13 °C", iconPath = "icon_themes/meteocons/images/802d.png", precipAccumulation = "0 mm", windSpeed = "14 km/h"),
        HourlyData(time = "12:00", temperature = "14 °C", iconPath = "icon_themes/meteocons/images/803d.png", precipAccumulation = "0.2 mm", windSpeed = "16 km/h"),
        HourlyData(time = "13:00", temperature = "14 °C", iconPath = "icon_themes/meteocons/images/803d.png", precipAccumulation = "0.5 mm", windSpeed = "16 km/h")
    ),
    dailyData = listOf(
        DailyData(day = "Mon", iconPath = "icon_themes/meteocons/images/800d.png", temperatureHigh = "12 °C", temperatureLow = "4 °C", precipAccumulation = "0 mm", precipitation = "5 %", windSpeed = "14 km/h"),
        DailyData(day = "Tue", iconPath = "icon_themes/meteocons/images/801d.png", temperatureHigh = "14 °C", temperatureLow = "6 °C", precipAccumulation = "0 mm", precipitation = "10 %", windSpeed = "12 km/h"),
        DailyData(day = "Wed", iconPath = "icon_themes/meteocons/images/500d.png", temperatureHigh = "10 °C", temperatureLow = "5 °C", precipAccumulation = "3 mm", precipitation = "60 %", windSpeed = "18 km/h"),
        DailyData(day = "Thu", iconPath = "icon_themes/meteocons/images/501d.png", temperatureHigh = "9 °C", temperatureLow = "3 °C", precipAccumulation = "8 mm", precipitation = "80 %", windSpeed = "22 km/h"),
        DailyData(day = "Fri", iconPath = "icon_themes/meteocons/images/802d.png", temperatureHigh = "11 °C", temperatureLow = "4 °C", precipAccumulation = "0 mm", precipitation = "20 %", windSpeed = "16 km/h"),
        DailyData(day = "Sat", iconPath = "icon_themes/meteocons/images/800d.png", temperatureHigh = "15 °C", temperatureLow = "7 °C", precipAccumulation = "0 mm", precipitation = "5 %", windSpeed = "10 km/h")
    )
)

val fakeErrorWeatherWidgetData = WeatherWidgetData(
    loadingState = WidgetLoadingState.ERROR,
    errorMessage = "Unable to fetch weather data"
)

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 50, heightDp = 50)
@Preview(widthDp = 80, heightDp = 80)
@Preview(widthDp = 120, heightDp = 120)
@Preview(widthDp = 260, heightDp = 120)
@Composable
private fun Preview() {
    ForecastWeatherWidgetContent(
        config = WidgetConfig(), data = fakeWeatherWidgetData,
    )
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 260, heightDp = 280)
@Composable
private fun ErrorPreview() {
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
fun ForecastWeatherWidgetContent(config: WidgetConfig, data: WeatherWidgetData) {
    val context = LocalContext.current
    val size = LocalSize.current
    Column(
        modifier = GlanceModifier,
        verticalAlignment = Alignment.Vertical.Top,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        Row(
            modifier = GlanceModifier.padding(horizontal = 8.dp),
            horizontalAlignment = Alignment.Horizontal.Start,
            verticalAlignment = Alignment.Vertical.Top
        ) {
            Column(
                modifier = GlanceModifier,
                verticalAlignment = Alignment.Vertical.Top,
                horizontalAlignment = Alignment.Horizontal.Start
            ) {
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                )
                Spacer(modifier = GlanceModifier.height(2.dp))
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Start),
                    maxLines = 1
                )
            }
            Spacer(modifier = GlanceModifier.defaultWeight())
            Column(
                modifier = GlanceModifier,
                verticalAlignment = Alignment.Vertical.Bottom,
                horizontalAlignment = Alignment.Horizontal.End
            ) {
                if (data.iconPath.isNotEmpty()) {
                    WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath, LocalContext.current)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = data.iconPath,
                           modifier = GlanceModifier.size(48.dp)
                        )
                    }
                }
                if (data.description.isNotEmpty()) {
                    Spacer(modifier = GlanceModifier.height(2.dp))
                }
                if (data.description.isNotEmpty()) {
                    Text(
                        text = data.description,
                        style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.End),
                        maxLines = 1
                    )
                }
            }
        }
        Spacer(modifier = GlanceModifier.height(8.dp))
        Text(
            text = context.getString(context.resources.getIdentifier("hourly", "string", context.packageName)),
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Start)
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        Row {
            data.hourlyData.take(8).forEach { item ->
                Column(
                    modifier = GlanceModifier.width(53.dp).padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Text(
                        text = item.time,
                        style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant),
                        maxLines = 1
                    )
                    Spacer(modifier = GlanceModifier.height(2.dp))
                    WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath, LocalContext.current)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = item.iconPath,
                           modifier = GlanceModifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = GlanceModifier.height(2.dp))
                    Text(
                        text = item.temperature,
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                        maxLines = 1
                    )
                    Spacer(modifier = GlanceModifier.height(2.dp))
                    if (item.precipAccumulation.isNotEmpty()) {
                        Text(
                            text = item.precipAccumulation,
                            style = TextStyle(fontSize = 9.sp, color = GlanceTheme.colors.onSurfaceVariant)
                        )
                    }
                }
            }
        }
        Spacer(modifier = GlanceModifier.height(8.dp))
        Text(
            text = context.getString(context.resources.getIdentifier("daily", "string", context.packageName)),
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Start)
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        LazyColumn {
            items(data.dailyData.take(10)) { item ->
                Column(
                    modifier = GlanceModifier.fillMaxWidth().padding(6.dp).background(GlanceTheme.colors.surface).cornerRadius(8.dp),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Row(
                        modifier = GlanceModifier,
                        horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        Text(
                            text = item.day,
                            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurface),
                            maxLines = 1
                        )
                        WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath, LocalContext.current)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = item.iconPath,
                               modifier = GlanceModifier.size(28.dp)
                            )
                        }
                        Spacer(modifier = GlanceModifier.height(8.dp))
                        Column(
                            modifier = GlanceModifier,
                            verticalAlignment = Alignment.Vertical.Bottom,
                            horizontalAlignment = Alignment.Horizontal.End
                        ) {
                            Row(
                                modifier = GlanceModifier,
                                horizontalAlignment = Alignment.Horizontal.End,
                                verticalAlignment = Alignment.Vertical.CenterVertically
                            ) {
                                Text(
                                    text = item.temperatureHigh,
                                    style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                                    maxLines = 1
                                )
                                Spacer(modifier = GlanceModifier.width(6.dp))
                                Text(
                                    text = item.temperatureLow,
                                    style = TextStyle(fontSize = 13.sp, color = GlanceTheme.colors.onSurfaceVariant),
                                    maxLines = 1
                                )
                            }
                            Row(
                                modifier = GlanceModifier,
                                horizontalAlignment = Alignment.Horizontal.End,
                                verticalAlignment = Alignment.Vertical.CenterVertically
                            ) {
                                if (item.precipAccumulation.isNotEmpty()) {
                                    Text(
                                        text = item.precipAccumulation,
                                        style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant)
                                    )
                                }
                                Spacer(modifier = GlanceModifier.width(6.dp))
                                if (item.precipitation.isNotEmpty()) {
                                    Text(
                                        text = "💧" + item.precipitation,
                                        style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager