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
                style = TextStyle(fontSize = when { size.width.value < 100 -> 24.sp; size.width.value < 150 -> 32.sp; else -> 48.sp }, color = GlanceTheme.colors.onSurface)
            )
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                if (data.iconPath.isNotEmpty()) {
                    Image(
                        provider = ImageProvider(resId = R.drawable.data.iconPath),
                        contentDescription = null,
                        modifier = GlanceModifier.size(when { size.width.value < 100 -> 32.dp; size.width.value < 150 -> 40.dp; else -> 56.dp })
                    )
                }
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = when { size.width.value < 100 -> 18.sp; size.width.value < 150 -> 24.sp; else -> 32.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
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
                style = TextStyle(fontSize = when { size.width.value < 100 -> 8.sp; size.width.value < 150 -> 10.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant)
                maxLines = 1
            )
        }
    }
}

data class SimpleWeatherWithClockWidgetData(
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