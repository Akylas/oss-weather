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
 * Generated content for Hourly Forecast
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun HourlyWeatherWidgetContent(context: Context, config: WidgetConfig, data: WeatherWidgetData, size: DpSize) {

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.Top,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        if (size.height.value >= 80) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.CenterVertically,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant),
                    maxLines = 1
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
            }
        }
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
                        text = item.time,
                        style = TextStyle(fontSize = when { size.height.value < 60 -> 9.sp; else -> 11.sp }, color = GlanceTheme.colors.onSurfaceVariant),
                        maxLines = 1
                    )
                    WeatherWidgetManager.getIconImageProviderFromPath(item.iconPath)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = item.iconPath,
                           modifier = GlanceModifier.size(when { size.height.value < 60 -> 24.dp; size.height.value < 80 -> 28.dp; else -> 32.dp })
                        )
                    }
                    Text(
                        text = item.temperature,
                        style = TextStyle(fontSize = when { size.height.value < 60 -> 12.sp; else -> 14.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface),
                        maxLines = 1
                    )
                    if ((size.height.value >= 60 && item.precipAccumulation.isNotEmpty())) {
                        Column(
                            modifier = GlanceModifier.fillMaxSize(),
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