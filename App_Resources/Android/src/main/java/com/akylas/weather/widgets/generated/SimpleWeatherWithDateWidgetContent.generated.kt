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
 * Generated content for Weather with Date
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWithDateWidgetContent(data: SimpleWeatherWithDateWidgetData) {
    val size = LocalSize.current

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.CenterVertically,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        Text(
            text = android.text.format.DateFormat.format("MMM dd, yyyy", System.currentTimeMillis()).toString(),
            style = TextStyle(fontSize = when { size.height.value < 60 -> 10.sp; size.height.value < 80 -> 12.sp; else -> 14.sp }, color = ColorProvider(WidgetTheme.onSurfaceVariant))
        )
        Spacer(modifier = GlanceModifier.defaultWeight())
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            if (data.iconPath.isNotEmpty()) {
                Image(
                    provider = ImageProvider(data.iconPath),
                    contentDescription = null,
                    modifier = GlanceModifier.size(when { size.height.value < 60 -> 24.dp; size.height.value < 80 -> 32.dp; else -> 40.dp })
                )
            }
            Text(
                text = data.temperature,
                style = TextStyle(fontSize = when { size.height.value < 60 -> 16.sp; size.height.value < 80 -> 20.sp; else -> 24.sp }, fontWeight = FontWeight.Bold, color = ColorProvider(WidgetTheme.onSurface))
            )
        }
        Spacer(modifier = GlanceModifier.defaultWeight())
        Text(
            text = data.locationName,
            style = TextStyle(fontSize = when { size.height.value < 60 -> 9.sp; size.height.value < 80 -> 11.sp; else -> 12.sp }, color = ColorProvider(WidgetTheme.onSurfaceVariant)),
            maxLines = 1
        )
    }
}

// Data classes (SimpleWeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager