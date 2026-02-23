package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import android.content.Context
import android.text.Layout
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.DpSize
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.cornerRadius
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.appwidget.background
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WeatherWidgetManager
import com.akylas.weather.widgets.WidgetComposables
import com.akylas.weather.widgets.WidgetTheme
import com.akylas.weather.widgets.WidgetConfig
import com.akylas.weather.widgets.WidgetLoadingState
import kotlin.math.min

/**
 * Generated content for Weather with Clock
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 120, heightDp = 50)
@Preview(widthDp = 80, heightDp = 80)
@Preview(widthDp = 120, heightDp = 120)
@Preview(widthDp = 260, heightDp = 120)
@Preview(widthDp = 260, heightDp = 260)
@Composable
private fun Preview() {

    val fakeWeatherWidgetData = WeatherWidgetData(
        temperature = "8 °C",
        iconPath = "icon_themes/meteocons/images/800d.png",
        description = "Partly Cloudy",
        locationName = "Grenoble",
        date = "Mon, Feb 24",
        lastUpdate = System.currentTimeMillis(),
        loadingState = WidgetLoadingState.LOADED
    )
    SimpleWeatherWithClockWidgetContent(
        config = WidgetConfig(), data = fakeWeatherWidgetData,
    )
}

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 260, heightDp = 120)
@Composable
private fun ErrorPreview() {

    val fakeErrorWeatherWidgetData = WeatherWidgetData(
        loadingState = WidgetLoadingState.ERROR,
        errorMessage = "Unable to fetch weather data"
    )
    GlanceTheme(colors = WidgetTheme.colors) {
        WidgetComposables.WidgetBackground {
            WidgetComposables.NoDataContent(
                WidgetLoadingState.ERROR,
                fakeErrorWeatherWidgetData.errorMessage
            )
        }
    }
}

@Composable
fun SimpleWeatherWithClockWidgetContent(config: WidgetConfig, data: WeatherWidgetData) {
    val context = LocalContext.current
    val size = LocalSize.current
    if (size.width.value >= 180) {
        Box(
            modifier = GlanceModifier.fillMaxSize().padding(4.dp)
        ) {
            Row(
                modifier = GlanceModifier.fillMaxWidth().fillMaxHeight().padding(8.dp),
                horizontalAlignment = Alignment.Horizontal.Start,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.Top,
                    horizontalAlignment = Alignment.Horizontal.Start
                ) {
                    Text(
                        text = android.text.format.DateFormat.format("HH:mm", System.currentTimeMillis()).toString(),
                        style = TextStyle(fontSize = 48.sp, fontWeight = if (config.settings?.get("clockBold") as? Boolean ?: true) FontWeight.Bold else FontWeight.Normal, color = GlanceTheme.colors.onSurface)
                    )
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    Text(
                        text = android.text.format.DateFormat.format("MMM dd, yyyy", System.currentTimeMillis()).toString(),
                        style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurfaceVariant)
                    )
                }
                Spacer(modifier = GlanceModifier.defaultWeight())
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath, LocalContext.current)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(62.dp)
                            )
                        }
                    }
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = min(size.width.value * 0.2, 15.0).sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface, textAlign = TextAlign.End)
                    )
                    Text(
                        text = data.description,
                        style = TextStyle(fontSize = min(size.width.value * 0.04, 15.0).sp, color = GlanceTheme.colors.onSurface, textAlign = TextAlign.End)
                    )
                }
            }
            Column(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.Bottom,
                horizontalAlignment = Alignment.Horizontal.Start
            ) {
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant),
                    maxLines = 1
                )
            }
        }
    }
    else {
        Box(
            modifier = GlanceModifier.fillMaxSize().padding(3.dp)
        ) {
            Column(
                modifier = GlanceModifier.padding(top = if (size.height.value <= 50)  0.dp else 10.dp ).fillMaxSize(),
                verticalAlignment = Alignment.Vertical.Top,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                Column(
                    modifier = GlanceModifier.fillMaxWidth(),
                    horizontalAlignment = if (size.height.value <= 50) Alignment.End else Alignment.CenterHorizontally
                ) {
                    Text(
                        modifier =  GlanceModifier,
                        text = android.text.format.DateFormat.format("HH:mm", System.currentTimeMillis()).toString(),
                        style = TextStyle(fontSize = min(size.height.value * 0.24, 40.0).sp, fontWeight = if (config.settings?.get("clockBold") as? Boolean ?: true) FontWeight.Bold else FontWeight.Normal, color = GlanceTheme.colors.onSurface, textAlign = if (size.height.value <= 50) TextAlign.Start else TextAlign.End),

                        )
                }
                Row(
                    modifier = GlanceModifier,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath, LocalContext.current)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(when { size.width.value < 100 -> 32.dp; size.width.value < 150 -> 40.dp; else -> 56.dp })
                            )
                        }
                    }
                    Spacer(modifier = GlanceModifier.width(when { size.width.value < 100 -> 4.dp; size.width.value < 150 -> 6.dp; else -> 8.dp }))
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = min(size.width.value * 0.2, 20.0).sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                }
                Spacer(modifier = GlanceModifier.height(when { size.width.value < 100 -> 2.dp; size.width.value < 150 -> 4.dp; else -> 8.dp }))
                Spacer(modifier = GlanceModifier.height(when { size.width.value < 100 -> 4.dp; size.width.value < 150 -> 6.dp; else -> 8.dp }))
            }
            Column(
                modifier = GlanceModifier,
                verticalAlignment = Alignment.Vertical.Bottom,
                horizontalAlignment = Alignment.Horizontal.End
            ) {
                Spacer(modifier = GlanceModifier.defaultWeight())
                Text(
                    text = data.locationName,
                    style = TextStyle(fontSize = when { size.width.value < 100 -> 8.sp; size.width.value < 150 -> 10.sp; else -> 12.sp }, color = GlanceTheme.colors.onSurfaceVariant),
                    maxLines = 1
                )
            }
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager