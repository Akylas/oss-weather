package com.akylas.weather.widgets

import android.annotation.SuppressLint
import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.Action
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.R

/**
 * Shared composables for all weather widgets
 */
object WidgetComposables {

    /**
     * Common "No Data" content - shows different states: no config, loading, error
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun NoDataContent(
        context: Context, 
        loadingState: WidgetLoadingState = WidgetLoadingState.NONE,
        errorMessage: String = ""
    ) {
        val textColor = WidgetColorProvider.getPrimaryTextColor(context)
        val secondaryColor = WidgetColorProvider.getSecondaryTextColor(context)
        val launchIntent = WeatherWidgetManager.createAppLaunchIntent(context)
        val openAction = launchIntent?.let { actionStartActivity(it.component!!) }


        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(WidgetColorProvider.getBackgroundImageProvider(context))
                .then(if (openAction != null) GlanceModifier.clickable(openAction) else GlanceModifier)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                when (loadingState) {
                    WidgetLoadingState.LOADING -> {
                        // Loading spinner (using text as Glance doesn't have native spinner)
                        Text(
                            text = "⟳",
                            style = TextStyle(
                                color = ColorProvider(textColor),
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(8.dp))
                        Text(
                            text = context.getString(R.string.widget_loading),
                            style = TextStyle(
                                color = ColorProvider(textColor),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                        )
                    }
                    
                    WidgetLoadingState.ERROR -> {
                        Text(
                            text = "⚠️",
                            style = TextStyle(
                                color = ColorProvider(textColor),
                                fontSize = 32.sp
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(8.dp))
                        Text(
                            text = errorMessage.ifEmpty { context.getString(R.string.widget_error_loading) },
                            style = TextStyle(
                                color = ColorProvider(textColor),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Text(
                            text = context.getString(R.string.widget_tap_configure),
                            style = TextStyle(
                                color = ColorProvider(secondaryColor),
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                    
                    else -> {
                        // No configuration
                        Text(
                            text = context.getString(R.string.widget_no_location),
                            style = TextStyle(
                                color = ColorProvider(textColor),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Text(
                            text = context.getString(R.string.widget_tap_configure),
                            style = TextStyle(
                                color = ColorProvider(secondaryColor),
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                }
            }
        }
    }

    /**
     * Common widget container with background and corner radius
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun WidgetContainer(
        context: Context,
        openAction: Action?,
        content: @Composable ColumnScope.() -> Unit
    ) {
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(WidgetColorProvider.getBackgroundImageProvider(context))
                .then(if (openAction != null) GlanceModifier.clickable(openAction) else GlanceModifier)
                .padding(12.dp)
        ) {
            Column(
                modifier = GlanceModifier.fillMaxSize(),
                content = content
            )
        }
    }

    /**
     * Location header text
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun LocationHeader(context: Context, locationName: String, fontSize: androidx.compose.ui.unit.TextUnit = 16.sp) {
        Text(
            text = locationName,
            style = TextStyle(
                color = ColorProvider(WidgetColorProvider.getLocationTextColor(context)),
                fontSize = fontSize,
                fontWeight = FontWeight.Medium
            ),
            maxLines = 1
        )
    }

    /**
     * Weather icon display
     */
    @Composable
    fun WeatherIcon(
        context: Context,
        iconPath: String,
        description: String,
        size: Dp = 64.dp
    ) {
        // Weather icon
        WeatherWidgetManager.getIconImageProviderFromPath(iconPath)?.let { provider ->
            Image(
                provider = provider,
                contentDescription = description,
                modifier = GlanceModifier.size(size)
            )
        }
    }

    /**
     * Temperature text display
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun TemperatureText(
        context: Context,
        temperature: String,
        fontSize: androidx.compose.ui.unit.TextUnit = 48.sp
    ) {
        Text(
            text = temperature,
            style = TextStyle(
                color = ColorProvider(WidgetColorProvider.getPrimaryTextColor(context)),
                fontSize = fontSize,
                fontWeight = FontWeight.Bold
            ),
            maxLines = 1
        )
    }

    /**
     * Weather description text
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun DescriptionText(
        context: Context,
        description: String,
        fontSize: androidx.compose.ui.unit.TextUnit = 14.sp
    ) {
        Text(
            text = description,
            style = TextStyle(
                color = ColorProvider(WidgetColorProvider.getSecondaryTextColor(context)),
                fontSize = fontSize
            ),
            maxLines = 1
        )
    }

    /**
     * Card item container for lists
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun CardItem(
        context: Context,
        content: @Composable RowScope.() -> Unit
    ) {
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .background(WidgetColorProvider.getCardBackgroundImageProvider(context))
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            content = content
        )
    }

    /**
     * Data label with optional icon
     */
    @SuppressLint("RestrictedApi")
    @Composable
    fun DataLabel(
        context: Context,
        icon: String,
        value: String,
        color: androidx.compose.ui.graphics.Color? = null
    ) {
        Row(
            verticalAlignment = Alignment.Vertical.CenterVertically,
            modifier = GlanceModifier.padding(end = 8.dp)
        ) {
            Text(
                text = icon,
                style = TextStyle(
                    color = ColorProvider(color ?: WidgetColorProvider.getSecondaryTextColor(context)),
                    fontSize = 12.sp
                )
            )
            Spacer(modifier = GlanceModifier.width(2.dp))
            Text(
                text = value,
                style = TextStyle(
                    color = ColorProvider(color ?: WidgetColorProvider.getSecondaryTextColor(context)),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}