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
 * Generated content for Weather with Clock
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWithClockWidgetContent(data: SimpleWeatherWithClockWidgetData) {
    val size = LocalSize.current

    Box(
        modifier = GlanceModifier.fillMaxSize()
    ) {
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            Text(
                text = android.text.format.DateFormat.format("HH:mm", System.currentTimeMillis()).toString(),
                style = TextStyle(fontSize = when { size.width.value < 100 -> 24.sp; size.width.value < 150 -> 32.sp; else -> 48.sp }, color = ColorProvider(WidgetTheme.onSurface))
            )
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                if (data.iconPath.isNotEmpty()) {
                    Image(
                        provider = ImageProvider(data.iconPath),
                        contentDescription = null,
                        modifier = GlanceModifier.size(when { size.width.value < 100 -> 32.dp; size.width.value < 150 -> 40.dp; else -> 56.dp })
                    )
                }
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = when { size.width.value < 100 -> 18.sp; size.width.value < 150 -> 24.sp; else -> 32.sp }, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
                )
            }
            Spacer(modifier = GlanceModifier.defaultWeight())
        }
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.Bottom,
            horizontalAlignment = Alignment.Horizontal.End
        ) {
            Spacer(modifier = GlanceModifier.defaultWeight())
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = when { size.width.value < 100 -> 8.sp; size.width.value < 150 -> 10.sp; else -> 12.sp }, color = ColorProvider(WidgetTheme.onSurfaceVariant)),
                maxLines = 1
            )
        }
    }
}

// Data classes (SimpleWeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager