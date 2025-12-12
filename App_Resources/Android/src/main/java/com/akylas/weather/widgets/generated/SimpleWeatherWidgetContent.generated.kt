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

/**
 * Generated content for Simple Weather
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWidgetContent(data: SimpleWeatherWidgetData) {
    val size = LocalSize.current

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.CenterVertically,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        if (size.width.value >= 80) {
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = when { size.width.value >= 200 -> 16.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center)
                maxLines = 1
            )
        }
        Spacer(modifier = GlanceModifier.height(when { size.width.value >= 200 -> 8.dp; else -> null }))
        if (data.iconPath.isNotEmpty()) {
            Image(
                provider = ImageProvider(resId = R.drawable.data.iconPath),
                contentDescription = null,
                modifier = GlanceModifier.size(when { size.width.value < 80 -> 32.dp; size.width.value < 200 -> 48.dp; else -> 72.dp })
            )
        }
        Spacer(modifier = GlanceModifier.height(when { size.width.value < 80 -> 4.dp; size.width.value >= 200 -> 8.dp; else -> null }))
        Text(
            text = data.temperature,
            style = TextStyle(fontSize = when { size.width.value < 80 -> 14.sp; size.width.value < 200 -> 32.sp; else -> 48.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface, textAlign = TextAlign.Center)
        )
        if ((size.width.value < 80 || size.width.value >= 200)) {
            Spacer(modifier = GlanceModifier.height(4.dp))
        }
        if (size.width.value < 80) {
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 8.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Center)
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

data class SimpleWeatherWidgetData(
    val temperature: String = "",
    val locationName: String = "",
    val description: String = "",
    val iconPath: String = "",
    val hourlyForecasts: List<HourlyForecast> = emptyList(),
    val dailyForecasts: List<DailyForecast> = emptyList()
)

data class HourlyForecast(
    val time: String = "",
    val temperature: String = "",
    val iconPath: String = ""
)

data class DailyForecast(
    val date: String = "",
    val high: String = "",
    val low: String = "",
    val iconPath: String = ""
)