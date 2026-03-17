package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.cornerRadius
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
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
import com.akylas.weather.widgets.WeatherWidgetData
import com.akylas.weather.widgets.WeatherWidgetManager
import com.akylas.weather.widgets.WidgetTheme
import com.akylas.weather.widgets.WidgetConfig
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import com.akylas.weather.widgets.WidgetComposables
import com.akylas.weather.widgets.WidgetLoadingState
import kotlin.math.min
import kotlinx.serialization.json.*

/**
 * Generated content for Simple Weather
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@OptIn(ExperimentalGlancePreviewApi::class)
@Preview(widthDp = 260, heightDp = 120)
@Preview(widthDp = 50, heightDp = 50)
@Preview(widthDp = 80, heightDp = 80)
@Preview(widthDp = 120, heightDp = 120)
@Composable
private fun Preview() {
    val fakeWeatherWidgetData = WeatherWidgetData(
        temperature = "8°",
        iconPath = "icon_themes/meteocons/images/800d.png",
        description = "Partly Cloudy",
        locationName = "Grenoble",
        date = "Mon, Feb 24",
        lastUpdate = System.currentTimeMillis(),
        loadingState = WidgetLoadingState.LOADED
    )
    SimpleWeatherWidgetContent(
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
fun SimpleWeatherWidgetContent(config: WidgetConfig, data: WeatherWidgetData) {
    val context = LocalContext.current
    val size = LocalSize.current

    if (size.width.value < 120) {
        Column(
            modifier = GlanceModifier.fillMaxWidth().fillMaxHeight().padding(3.dp),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            Column(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.CenterVertically,
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally
            ) {
                if (data.iconPath.isNotEmpty()) {
                    WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath, LocalContext.current)?.let { provider ->
                        Image(
                           provider = provider,
                           contentDescription = data.iconPath,
                           modifier = GlanceModifier.size((size.width.value * 0.44f).dp)
                        )
                    }
                }
                Text(
                    text = data.temperature,
                    style = TextStyle(fontSize = (size.width.value * 0.2f).sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                )
            }
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 8.sp, color = GlanceTheme.colors.onSurfaceVariant),
                maxLines = 1
            )
        }
    }
    else {
        Box(
            modifier = GlanceModifier.fillMaxWidth().fillMaxHeight().padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant),
                maxLines = 1
            )
            Row(
                modifier = GlanceModifier.fillMaxWidth().fillMaxHeight(),
                horizontalAlignment = Alignment.Horizontal.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                Column(
                    modifier = GlanceModifier.fillMaxHeight(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.Start
                ) {
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = (min((size.width.value * 0.26f), 30.0f)).sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                }
                Column(
                    modifier = GlanceModifier.fillMaxHeight().defaultWeight(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.End
                ) {
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath, LocalContext.current)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(64.dp)
                            )
                        }
                    }
                }
            }
            if (data.description.isNotEmpty()) {
                Box(
                    modifier = GlanceModifier.fillMaxWidth().fillMaxHeight(),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Text(
                        text = data.description,
                        style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.End)
                    )
                }
            }
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager