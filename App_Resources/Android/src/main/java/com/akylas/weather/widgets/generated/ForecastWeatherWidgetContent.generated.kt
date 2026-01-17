package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.DpSize
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
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
import com.akylas.weather.R
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WeatherWidgetManager
import com.akylas.weather.widgets.WidgetTheme
import com.akylas.weather.widgets.WidgetConfig

/**
 * Generated content for Detailed Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun ForecastWeatherWidgetContent(context: Context, config: WidgetConfig, data: WeatherWidgetData, size: DpSize) {

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.Top,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Horizontal.Start,
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.Start,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                if (data.iconPath.isNotEmpty()) {
                    WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = data.iconPath,
                           modifier = GlanceModifier.size(48.dp)
                        )
                    }
                }
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                )
            }
            Spacer(modifier = GlanceModifier.defaultWeight())
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant),
                maxLines = 1
            )
        }
        Spacer(modifier = GlanceModifier.height(8.dp))
        Text(
            text = context.getString(context.resources.getIdentifier("hourly", "string", context.packageName)),
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant)
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        Row {
            data.hourlyData.take(8).forEach { item ->
                Column(
                    modifier = GlanceModifier.fillMaxSize(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Text(
                        text = item.time,
                        style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant),
                        maxLines = 1
                    )
                    WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = item.iconPath,
                           modifier = GlanceModifier.size(28.dp)
                        )
                    }
                    Text(
                        text = item.temperature,
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                        maxLines = 1
                    )
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
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant)
        )
        Spacer(modifier = GlanceModifier.height(4.dp))
        LazyColumn {
            items(data.dailyData.take(10)) { item ->
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = item.day,
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurface),
                        maxLines = 1
                    )
                    WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = item.iconPath,
                           modifier = GlanceModifier.size(28.dp)
                        )
                    }
                    Row(
                        modifier = GlanceModifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Horizontal.End,
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        if (item.precipAccumulation.isNotEmpty()) {
                            Text(
                                text = item.precipAccumulation,
                                style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant)
                            )
                        }
                        Text(
                            text = item.temperatureHigh,
                            style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                            maxLines = 1
                        )
                        Text(
                            text = item.temperatureLow,
                            style = TextStyle(fontSize = 13.sp, color = GlanceTheme.colors.onSurfaceVariant),
                            maxLines = 1
                        )
                    }
                    if ((item.precipitation.isNotEmpty() || item.windSpeed.isNotEmpty())) {
                        Row(
                            modifier = GlanceModifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                            verticalAlignment = Alignment.Vertical.CenterVertically
                        ) {
                            if (item.precipitation.isNotEmpty()) {
                                Text(
                                    text = "💧" + item.precipitation,
                                    style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.primary)
                                )
                            }
                            if (item.windSpeed.isNotEmpty()) {
                                Text(
                                    text = "💨" + item.windSpeed,
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

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager