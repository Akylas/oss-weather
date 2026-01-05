package com.akylas.weather.widgets

import android.annotation.SuppressLint
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
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import java.text.SimpleDateFormat
import java.util.*
import androidx.glance.appwidget.GlanceAppWidgetManager

private const val LOG_TAG = "SimpleWeatherWithDateWidget"

class SimpleWeatherWithDateWidget : GlanceAppWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            DpSize(260.dp, 120.dp),
            DpSize(260.dp, 160.dp)
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
                val isLarge = size.height > 140.dp
                
                WeatherContent(context, widgetData, openAction, isLarge)
            }
        }
    }

    @SuppressLint("RestrictedApi")
    @Composable
    private fun WeatherContent(
        context: Context,
        data: WeatherWidgetData,
        openAction: androidx.glance.action.Action?,
        isLarge: Boolean
    ) {
        val dateFormat = SimpleDateFormat("EEEE, MMMM d", Locale.getDefault())
        val currentDate = dateFormat.format(Date())
        
        WidgetComposables.WidgetContainer(context, openAction) {
            // Location and date
            Column {
                WidgetComposables.LocationHeader(context, data.locationName, 14.sp)
                Spacer(modifier = GlanceModifier.height(2.dp))
                Text(
                    text = currentDate,
                    style = TextStyle(
                        color = ColorProvider(WidgetColorProvider.getSecondaryTextColor(context)),
                        fontSize = 12.sp
                    ),
                    maxLines = 1
                )
            }
            
            Spacer(modifier = GlanceModifier.height(8.dp))
            
            // Weather content
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                // Weather icon
                WidgetComposables.WeatherIcon(
                    context,
                    data.iconPath,
                    data.description,
                    if (isLarge) 64.dp else 56.dp
                )
                
                Spacer(modifier = GlanceModifier.width(16.dp))
                
                // Temperature and description
                Column(modifier = GlanceModifier.defaultWeight()) {
                    WidgetComposables.TemperatureText(
                        context,
                        data.temperature,
                        if (isLarge) 48.sp else 40.sp
                    )
                    if (data.description.isNotEmpty()) {
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        WidgetComposables.DescriptionText(
                            context,
                            data.description,
                            if (isLarge) 14.sp else 12.sp
                        )
                    }
                }
            }
        }
    }
}