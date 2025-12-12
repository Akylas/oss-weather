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
            style = TextStyle(fontSize = when { size.height.value < 60 -> 10.sp; size.height.value < 80 -> 12.sp; else -> 14.sp }, color = GlanceTheme.colors.onSurfaceVariant)
        )
        Spacer(modifier = GlanceModifier.defaultWeight())
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            if (data.iconPath.isNotEmpty()) {
                Image(
                    provider = ImageProvider(resId = R.drawable.data.iconPath),
                    contentDescription = null,
                    modifier = GlanceModifier.size(when { size.height.value < 60 -> 24.dp; size.height.value < 80 -> 32.dp; else -> 40.dp })
                )
            }
            Text(
                text = data.temperature,
                style = TextStyle(fontSize = when { size.height.value < 60 -> 16.sp; size.height.value < 80 -> 20.sp; else -> 24.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
            )
        }
        Spacer(modifier = GlanceModifier.defaultWeight())
        Text(
            text = data.locationName,
            style = TextStyle(fontSize = when { size.height.value < 60 -> 9.sp; size.height.value < 80 -> 11.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant)
            maxLines = 1
        )
    }
}

data class SimpleWeatherWithDateWidgetData(
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