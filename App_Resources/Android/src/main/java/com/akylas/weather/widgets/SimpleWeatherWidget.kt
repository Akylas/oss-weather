package com.akylas.weather.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.appwidget.SizeMode
import androidx.glance.layout.*
import androidx.glance.appwidget.GlanceAppWidgetManager

private const val LOG_TAG = "SimpleWeatherWidget"

class SimpleWeatherWidget : GlanceAppWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            // Small widget
            DpSize(120.dp, 120.dp),
            // Medium widget
            DpSize(260.dp, 120.dp)
        )
    )

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        WidgetsLogger.d(LOG_TAG, "provideGlance(glanceId=$id)")

        provideContent {
                        val widgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)

            val widgetData = WeatherWidgetManager.getWidgetData(widgetId)
            val launchIntent = WeatherWidgetManager.createAppLaunchIntent(context)
            val openAction = launchIntent?.let { actionStartActivity(it.component!!) }

            if (widgetData == null || widgetData.loadingState == WidgetLoadingState.NONE) {
                WidgetComposables.NoDataContent(context)
            } else if (widgetData.loadingState == WidgetLoadingState.LOADING) {
                WidgetComposables.NoDataContent(context, WidgetLoadingState.LOADING)
            } else if (widgetData.loadingState == WidgetLoadingState.ERROR) {
                WidgetComposables.NoDataContent(context, WidgetLoadingState.ERROR, widgetData.errorMessage)
            } else {
                val size = LocalSize.current
                val isSmall = size.width < 200.dp
                
                WeatherContent(context, widgetData, openAction, isSmall)
            }
        }
    }

    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        openAction: androidx.glance.action.Action?,
        isSmall: Boolean
    ) {
        WidgetsLogger.d(LOG_TAG, "Rendering weather content for ${data.locationName}, isSmall=$isSmall")

        WidgetComposables.WidgetContainer(context, openAction) {
            if (isSmall) {
                // Small widget: Compact vertical layout
                Column(
                    modifier = GlanceModifier.fillMaxSize(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    WidgetComposables.LocationHeader(context, data.locationName, 12.sp)
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    WidgetComposables.WeatherIcon(context, data.iconPath, data.description, 48.dp)
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    WidgetComposables.TemperatureText(context, data.temperature, 32.sp)
                }
            } else {
                // Medium widget: More spacious layout
                Column(
                    modifier = GlanceModifier.fillMaxSize(),
                    verticalAlignment = Alignment.Vertical.CenterVertically,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    WidgetComposables.LocationHeader(context, data.locationName, 16.sp)
                    Spacer(modifier = GlanceModifier.height(8.dp))
                    WidgetComposables.WeatherIcon(context, data.iconPath, data.description, 64.dp)
                    Spacer(modifier = GlanceModifier.height(8.dp))
                    WidgetComposables.TemperatureText(context, data.temperature, 48.sp)
                    Spacer(modifier = GlanceModifier.height(4.dp))
                    if (data.description.isNotEmpty()) {
                        WidgetComposables.DescriptionText(context, data.description, 14.sp)
                    }
                }
            }
        }
    }
}