package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.R
import com.akylas.weather.services.widgets.WidgetTheme

/**
 * Generated content for Daily Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun DailyWeatherWidgetContent(data: DailyWeatherWidgetData) {
    val size = LocalSize.current

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.Top,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        Text(
            text = data.locationName,
            style = TextStyle(fontSize = 14.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant)),
            maxLines = 1
        )
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            data.dailyData.take(case,<=,get,size.height,150,3,5).forEach { item ->
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = "${item.day}",
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = ColorProvider(WidgetTheme.onSurface))
                    )
                    Image(
                        provider = ImageProvider(item.iconPath),
                        contentDescription = null,
                        modifier = GlanceModifier.size(28.dp)
                    )
                    Row(
                        modifier = GlanceModifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Horizontal.End,
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        if (item.precipAccumulation.isNotEmpty()) {
                            Text(
                                text = "${item.precipAccumulation}",
                                style = TextStyle(fontSize = 10.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant))
                            )
                        }
                        Row(
                            modifier = GlanceModifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                            verticalAlignment = Alignment.Vertical.CenterVertically
                        ) {
                            Text(
                                text = "${item.temperatureHigh}",
                                style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
                            )
                            Text(
                                text = "${item.temperatureLow}",
                                style = TextStyle(fontSize = 13.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant))
                            )
                        }
                    }
                }
            }
        }
    }
}

// Data classes (SimpleWeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager