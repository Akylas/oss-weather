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

/**
 * Generated content for Weather with Date
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWithDateWidgetContent(context: Context, data: WeatherWidgetData, size: DpSize) {
    val prefs = context.getSharedPreferences("weather_widget_prefs", Context.MODE_PRIVATE)

    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.Vertical.CenterVertically,
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {
        if (size.width.value >= 200) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Text(
                        text = android.text.format.DateFormat.format("MMM dd, yyyy", System.currentTimeMillis()).toString(),
                        style = TextStyle(fontSize = 32.sp, color = GlanceTheme.colors.onSurface)
                    )
                    Row(
                        modifier = GlanceModifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.Horizontal.End,
                        verticalAlignment = Alignment.Vertical.CenterVertically
                    ) {
                        if (data.data.iconPath.isNotEmpty()) {
                            WeatherWidgetManager.getIconImageProviderFromPath(data.data.iconPath)?.let { provider ->
                                Image(
                                   provider = provider,
                                   contentDescription = data.data.iconPath,
                                   modifier = GlanceModifier.size(56.dp)
                                )
                            }
                        }
                        Text(
                            text = data.data.temperature,
                            style = TextStyle(fontSize = 40.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                        )
                    }
                }
                Spacer(modifier = GlanceModifier.height(4.dp))
            }
        }
        else {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                verticalAlignment = Alignment.Vertical.CenterVertically,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Text(
                    text = android.text.format.DateFormat.format("MMM dd, yyyy", System.currentTimeMillis()).toString(),
                    style = TextStyle(fontSize = when { size.width.value < 150 -> when { size.height.value < 60 -> 14.sp; size.height.value < 80 -> 18.sp; else -> 22.sp }; else -> when { size.height.value < 80 -> 20.sp; else -> 28.sp } }, color = GlanceTheme.colors.onSurface)
                )
                Spacer(modifier = GlanceModifier.defaultWeight())
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    if (data.data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.data.iconPath)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.data.iconPath,
                               modifier = GlanceModifier.size(when { size.height.value < 60 -> 28.dp; size.height.value < 80 -> 36.dp; else -> 48.dp })
                            )
                        }
                    }
                    Text(
                        text = data.data.temperature,
                        style = TextStyle(fontSize = when { size.height.value < 60 -> 18.sp; size.height.value < 80 -> 24.sp; else -> 32.sp }, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                }
                Spacer(modifier = GlanceModifier.height(when { size.height.value < 60 -> 4.dp; size.height.value < 80 -> 6.dp; else -> 8.dp }))
            }
        }
        Text(
            text = data.data.locationName,
            style = TextStyle(fontSize = when { size.height.value < 60 -> 9.sp; size.height.value < 80 -> 11.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.Start),
            maxLines = 1
        )
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager