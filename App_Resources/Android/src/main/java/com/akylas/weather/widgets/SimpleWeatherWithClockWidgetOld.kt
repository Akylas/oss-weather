package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.components.Scaffold
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.preview.ExperimentalGlancePreviewApi
import androidx.glance.preview.Preview
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.akylas.weather.widgets.WeatherWidgetGlanceReceiver.Companion.registerThemeChangeReceiver
import java.text.SimpleDateFormat
import java.util.*

private const val LOG_TAG = "SimpleWeatherWithClockWidgetOld"

class SimpleWeatherWithClockWidgetOld : WeatherWidget() {

    val fakeWeatherWidgetData = WeatherWidgetData(temperature = "8C", locationName = "Grenoble")
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            DpSize(80.dp, 80.dp),
            DpSize(120.dp, 120.dp),
            DpSize(180.dp, 120.dp)
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        WidgetsLogger.d(LOG_TAG, "provideGlance(glanceId=$id)")
        setupUpdateWorker(context)
        registerThemeChangeReceiver(context);

        provideContent {
            val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
            // Observe widget config from StateFlow - triggers automatic recomposition when settings change
            val configMap by WidgetConfigStore.widgetConfigs.collectAsState()
            val widgetConfig = configMap[widgetId] ?: WeatherWidgetManager.createDefaultConfig()

            // Observe widget data from StateFlow - triggers automatic recomposition
            val dataMap by WidgetDataStore.widgetData.collectAsState()
            val widgetData = dataMap[widgetId]

            GlanceTheme(colors = WidgetTheme.colors) {
                WidgetComposables.WidgetBackground(enabled = !(widgetConfig.settings?.get("transparent") as? Boolean ?: true)) {
                    if (widgetData == null || widgetData.loadingState == WidgetLoadingState.NONE) {
                        WidgetComposables.NoDataContent()
                    } else if (widgetData.loadingState == WidgetLoadingState.LOADING) {
                        WidgetComposables.NoDataContent(WidgetLoadingState.LOADING)
                    } else if (widgetData.loadingState == WidgetLoadingState.ERROR) {
                        WidgetComposables.NoDataContent(
                            WidgetLoadingState.ERROR,
                            widgetData.errorMessage
                        )
                    } else {
                        val size = LocalSize.current
                        WeatherWithClockContent(data = widgetData, size = size, context = context)
                    }
                }
            }
        }
    }

    @OptIn(ExperimentalGlancePreviewApi::class)
    @Preview(widthDp = 80, heightDp = 80)
    @Preview(widthDp = 120, heightDp = 120)
    @Preview(widthDp = 180, heightDp = 120)
    @Composable
    private fun WeatherWithClockContent(
        modifier: GlanceModifier = GlanceModifier,
        data: WeatherWidgetData = fakeWeatherWidgetData,
        size: DpSize,
        context: Context
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather with clock for ${data.locationName}")

        // Read clock bold preference
        val prefs = context.getSharedPreferences("weather_widget_prefs", Context.MODE_PRIVATE)
        val clockBold = prefs.getBoolean("widget_clock_bold", true)

        // Adjust padding based on size
        val padding = when {
            size.width < 100.dp -> 4.dp
            size.width < 150.dp -> 6.dp
            else -> 8.dp
        }

        val isSmall = size.width < 150.dp

        WidgetComposables.WidgetContainer(padding = padding) {
            Box(modifier = modifier.fillMaxSize()) {
                Column(
                    modifier = GlanceModifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalAlignment = Alignment.Top
                ) {
                    // Clock at top
                    val clockFontSize = when {
                        size.width < 100.dp -> 24.sp
                        size.width < 150.dp -> 32.sp
                        else -> 48.sp
                    }
                    
                    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                    val currentTime = timeFormat.format(Date())
                    
                    Text(
                        text = currentTime,
                        style = TextStyle(
                            fontSize = clockFontSize,
                            fontWeight = if (clockBold) FontWeight.Bold else FontWeight.Normal,
                            color = GlanceTheme.colors.onSurface
                        )
                    )
                    
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    
                    // Weather info centered  
                    Row(
                        verticalAlignment = Alignment.Vertical.CenterVertically,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Bigger icon
                        val iconSize = when {
                            size.width < 100.dp -> 32.dp
                            size.width < 150.dp -> 40.dp
                            else -> 56.dp
                        }
                        
                        WidgetComposables.WeatherIcon(data.iconPath, data.description, iconSize)
                        
                        Spacer(modifier = GlanceModifier.width(if (isSmall) 4.dp else 8.dp))
                        
                        val tempFontSize = when {
                            size.width < 100.dp -> 18.sp
                            size.width < 150.dp -> 24.sp
                            else -> 32.sp
                        }
                        
                        WidgetComposables.TemperatureText(data.temperature, tempFontSize)
                    }
                    
                    Spacer(modifier = GlanceModifier.height(4.dp))
                }
                
                // Location at bottom right, scaled with size
                val locationFontSize = when {
                    size.width < 100.dp -> 8.sp
                    size.width < 150.dp -> 10.sp
                    else -> 12.sp
                }
                
                Box(
                    modifier = GlanceModifier.fillMaxSize(),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    WidgetComposables.LocationHeader(
                        data.locationName,
                        locationFontSize,
                        maxLines = 1,
                        modifier = GlanceModifier.padding(bottom = 2.dp, end = 2.dp)
                    )
                }
            }
        }
    }
}