package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
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

/**
 * Generated content for Simple Weather
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWidgetContent(data: WeatherWidgetData, size: DpSize) {

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.CenterVertically,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        if (size.width.value >= 80) {
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = when { size.width.value >= 200 -> 16.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center),
                maxLines = 1
            )
        }
        Spacer(modifier = GlanceModifier.height(when { size.width.value >= 200 -> 8.dp; else -> 8.dp }))
        if (data.iconPath.isNotEmpty()) {
            WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                Image(
                   provider = provider,
                   contentDescription = data.iconPath,
                   modifier = GlanceModifier.size(when { size.width.value < 80 -> 32.dp; size.width.value < 200 -> 56.dp; else -> 72.dp })
                )
            }
        }
        Spacer(modifier = GlanceModifier.height(when { size.width.value < 80 -> 0.dp; size.width.value >= 200 -> 8.dp; else -> 8.dp }))
        Text(
            text = data.temperature,
            style = TextStyle(fontSize = when { size.width.value < 80 -> 14.sp; size.width.value < 120 -> 22.sp; size.width.value < 200 -> 32.sp; else -> 48.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface, textAlign = TextAlign.Center)
        )
        if ((size.width.value < 80 || size.width.value >= 200)) {
            Spacer(modifier = GlanceModifier.height(4.dp))
        }
        if (size.width.value < 80) {
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 8.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center),
                maxLines = 1
            )
        }
        if ((data.description.isNotEmpty() && size.width.value >= 200)) {
            Text(
                text = data.description,
                style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center)
            )
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager