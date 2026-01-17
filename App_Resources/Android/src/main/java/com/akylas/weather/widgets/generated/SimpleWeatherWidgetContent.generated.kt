package com.akylas.weather.widgets.generated

import androidx.compose.runtime.Composable
import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.DpSize
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.appwidget.cornerRadius
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
import com.akylas.weather.widgets.WidgetConfig

/**
 * Generated content for Simple Weather
 * DO NOT EDIT - This file is auto-generated from JSON layout definitions
 */

@Composable
fun SimpleWeatherWidgetContent(context: Context, config: WidgetConfig, data: WeatherWidgetData, size: DpSize) {

    if (size.width.value < 80) {
        Column(
            modifier = GlanceModifier,
            verticalAlignment = Alignment.Vertical.CenterVertically,
            horizontalAlignment = Alignment.Horizontal.CenterHorizontally
        ) {
            Spacer(modifier = GlanceModifier.defaultWeight())
            if (data.iconPath.isNotEmpty()) {
                WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                    Image(
                       provider = provider,
                       contentDescription = data.iconPath,
                       modifier = GlanceModifier.size(32.dp)
                    )
                }
            }
            Spacer(modifier = GlanceModifier.height(4.dp))
            Text(
                text = data.temperature,
                style = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
            )
            Spacer(modifier = GlanceModifier.height(4.dp))
            Text(
                text = data.locationName,
                style = TextStyle(fontSize = 8.sp, color = GlanceTheme.colors.onSurfaceVariant),
                maxLines = 1
            )
        }
    }
    else {
        if ((size.width.value > size.height.value && size.width.value >= 200)) {
            Row(
                modifier = GlanceModifier,
                horizontalAlignment = Alignment.Horizontal.Start,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.Top,
                    horizontalAlignment = Alignment.Horizontal.Start
                ) {
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = 40.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    Text(
                        text = data.locationName,
                        style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant),
                        maxLines = 1
                    )
                }
                Spacer(modifier = GlanceModifier.defaultWeight())
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.Bottom,
                    horizontalAlignment = Alignment.Horizontal.End
                ) {
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(64.dp)
                            )
                        }
                    }
                    if (data.description.isNotEmpty()) {
                        Spacer(modifier = GlanceModifier.height(4.dp))
                    }
                    if (data.description.isNotEmpty()) {
                        Text(
                            text = data.description,
                            style = TextStyle(fontSize = 12.sp, color = GlanceTheme.colors.onSurfaceVariant, textAlign = TextAlign.End)
                        )
                    }
                }
            }
        }
        else {
            if (size.width.value < 200) {
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(48.dp)
                            )
                        }
                    }
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = 32.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                }
            }
            else {
                Column(
                    modifier = GlanceModifier,
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.Horizontal.CenterHorizontally
                ) {
                    Text(
                        text = data.locationName,
                        style = TextStyle(fontSize = 16.sp, color = GlanceTheme.colors.onSurface)
                    )
                    Spacer(modifier = GlanceModifier.height(8.dp))
                    if (data.iconPath.isNotEmpty()) {
                        WeatherWidgetManager.getIconImageProviderFromPath(data.iconPath)?.let { provider ->
                            Image(
                               provider = provider,
                               contentDescription = data.iconPath,
                               modifier = GlanceModifier.size(72.dp)
                            )
                        }
                    }
                    Spacer(modifier = GlanceModifier.height(8.dp))
                    Text(
                        text = data.temperature,
                        style = TextStyle(fontSize = 48.sp, fontWeight = FontWeight.Bold, color = GlanceTheme.colors.onSurface)
                    )
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    if (data.description.isNotEmpty()) {
                        Text(
                            text = data.description,
                            style = TextStyle(fontSize = 14.sp, color = GlanceTheme.colors.onSurface)
                        )
                    }
                }
            }
        }
    }
}

// Data classes (WeatherWidgetData, HourlyForecast, DailyForecast) are defined in WeatherWidgetManager