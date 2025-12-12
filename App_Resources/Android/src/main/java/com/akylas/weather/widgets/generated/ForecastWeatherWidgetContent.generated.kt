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
                provider = ImageProvider(resId = R.drawable.${data.iconPath}),
                contentDescription = null,
                modifier = GlanceModifier.size(40.dp)
            )
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Text(
                    text = "${data.temperature}",
                    style = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                )
                Text(
                    text = "${data.locationName}",
                    style = TextStyle(fontSize = 11.sp, color = GlanceTheme.colors.onSurfaceVariant)
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
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant)
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
                            text = "${data.item.hour}",
                            style = TextStyle(fontSize = 10.sp, color = GlanceTheme.colors.onSurfaceVariant)
                        )
                        Image(
                            provider = ImageProvider(resId = R.drawable.${data.item.iconPath}),
                            contentDescription = null,
                            modifier = GlanceModifier.size(28.dp)
                        )
                        Text(
                            text = "${data.item.temperature}",
                            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                        )
                        if (item.precipAccumulation) {
                            Text(
                                text = "${data.item.precipAccumulation}",
                                style = TextStyle(fontSize = 9.sp, color = GlanceTheme.colors.onSurfaceVariant)
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
            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = GlanceTheme.colors.onSurfaceVariant)
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
                        style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurface)
                    )
                    Image(
                        provider = ImageProvider(resId = R.drawable.${data.item.iconPath}),
                        contentDescription = null,
                        modifier = GlanceModifier.size(24.dp)
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
                        Text(
                            text = "${data.item.temperatureHigh}/${data.item.temperatureLow}",
                            style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                        )
                    }
                }
            }
        }
    }
}

data class ForecastWeatherWidgetData(
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