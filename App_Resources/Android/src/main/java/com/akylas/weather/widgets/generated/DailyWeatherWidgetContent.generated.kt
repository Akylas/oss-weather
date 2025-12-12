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
            text = "${data.locationName}",
            style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant)
            maxLines = 1
        )
        Column(
            modifier = GlanceModifier.fillMaxSize(),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            data.dailyData.take(5).forEach { item ->
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = "${data.item.day}",
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurface)
                    )
                    Image(
                        provider = ImageProvider(resId = R.drawable.${data.item.iconPath}),
                        contentDescription = null,
                        modifier = GlanceModifier.size(28.dp)
                    )
                    Row(
                        modifier = GlanceModifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Horizontal.End,
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        if (item.precipAccumulation) {
                            Text(
                                text = "${data.item.precipAccumulation}",
                                style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant)
                            )
                        }
                        Row(
                            modifier = GlanceModifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                            verticalAlignment = Alignment.Vertical.CenterVertically
                        ) {
                            Text(
                                text = "${data.item.temperatureHigh}",
                                style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                            )
                            Text(
                                text = "${data.item.temperatureLow}",
                                style = TextStyle(fontSize = 13.sp, color = GlanceTheme.colors.onSurfaceVariant)
                            )
                        }
                    }
                }
            }
        }
    }
}

data class DailyWeatherWidgetData(
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