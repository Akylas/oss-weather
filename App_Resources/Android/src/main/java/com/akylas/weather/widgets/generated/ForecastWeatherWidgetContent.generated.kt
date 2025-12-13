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
 * Generated content for Detailed Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun ForecastWeatherWidgetContent(data: ForecastWeatherWidgetData) {
    val size = LocalSize.current

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
            Image(
                provider = ImageProvider(data.iconPath),
                contentDescription = null,
                modifier = GlanceModifier.size(40.dp)
            )
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
                )
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = 11.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant))
                )
            }
            Spacer(modifier = GlanceModifier.defaultWeight())
        }
        Box(
            modifier = GlanceModifier.fillMaxWidth().height(1.dp)
                .background(GlanceTheme.colors.onSurfaceVariant)
        )
        Text(
            text = "Hourly Forecast",
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = ColorProvider(WidgetTheme.onSurfaceVariant))
        )
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                data.hourlyData.take(8).forEach { item ->
                    Column(
                        modifier = GlanceModifier.fillMaxSize(),
                        verticalAlignment = Alignment.Vertical.CenterVertically,
                        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                    ) {
                        Text(
                            text = "${item.hour}",
                            style = TextStyle(fontSize = 10.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant))
                        )
                        Image(
                            provider = ImageProvider(item.iconPath),
                            contentDescription = null,
                            modifier = GlanceModifier.size(28.dp)
                        )
                        Text(
                            text = "${item.temperature}",
                            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
                        )
                        if (item.precipAccumulation.isNotEmpty()) {
                            Text(
                                text = "${item.precipAccumulation}",
                                style = TextStyle(fontSize = 9.sp, color = ColorProvider(WidgetTheme.onSurfaceVariant))
                            )
                        }
                    }
                }
            }
        }
        Box(
            modifier = GlanceModifier.fillMaxWidth().height(1.dp)
                .background(GlanceTheme.colors.onSurfaceVariant)
        )
        Text(
            text = "7-Day Forecast",
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = ColorProvider(WidgetTheme.onSurfaceVariant))
        )
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            data.dailyData.take(case,<=,get,size.height,240,3,5).forEach { item ->
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = "${item.day}",
                        style = TextStyle(fontSize = 12.sp, color = ColorProvider(WidgetTheme.onSurface))
                    )
                    Image(
                        provider = ImageProvider(item.iconPath),
                        contentDescription = null,
                        modifier = GlanceModifier.size(24.dp)
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
                        Text(
                            text = "${item.temperatureHigh}/${item.temperatureLow}",
                            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
                        )
                    }
                }
            }
        }
    }
}

// Data classes (SimpleWeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager