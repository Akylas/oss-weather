package com.akylas.weather.widgets

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle

object WidgetComposables {

    // Cache the background drawable resource ID after the first lookup to avoid repeated
    // reflection-based calls on every recomposition.
    private var bgResId: Int = 0
    private var bgResIdResolved: Boolean = false

    private fun resolveBackgroundResId(context: android.content.Context): Int {
        if (!bgResIdResolved) {
            bgResId = context.resources.getIdentifier("app_widget_background", "drawable", context.packageName)
            bgResIdResolved = true
        }
        return bgResId
    }

    @Composable
    fun NoDataContent(
        loadingState: WidgetLoadingState = WidgetLoadingState.NONE,
        errorMessage: String = ""
    ) {
        val context = LocalContext.current
        WidgetLocalizationProvider.ensureLoaded(context)
        val launchIntent = WeatherWidgetManager.createAppLaunchIntent(context)
        val openAction = launchIntent?.let { actionStartActivity(it.component!!) }
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
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
                        Text(
                            text = "⟳",
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(8.dp))
                        Text(
                            text = WidgetLocalizationProvider.loading,
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                        )
                    }
                    
                    WidgetLoadingState.ERROR -> {
                        Text(
                            text = "⚠️",
                            style = TextStyle(
                                color = GlanceTheme.colors.error,
                                fontSize = 32.sp
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(8.dp))
                        Text(
                            text = errorMessage.ifEmpty { WidgetLocalizationProvider.errorLoading },
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Text(
                            text = WidgetLocalizationProvider.tapConfigure,
                            style = TextStyle(
                                color = GlanceTheme.colors.onSurfaceVariant,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                    
                    else -> {
                        Text(
                            text = WidgetLocalizationProvider.noLocation,
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Text(
                            text = WidgetLocalizationProvider.tapConfigure,
                            style = TextStyle(
                                color = GlanceTheme.colors.onSurfaceVariant,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                }
            }
        }
    }

    @Composable
    fun WidgetBackground(
        enabled: Boolean = true,
        modifier: GlanceModifier = GlanceModifier,
        content: @Composable () -> Unit
    ) {
        val context = LocalContext.current
        val resId = resolveBackgroundResId(context)
        val backgroundModifier = when {
            !enabled -> modifier.fillMaxSize()
            resId != 0 -> modifier.fillMaxSize().background(
                imageProvider = ImageProvider(resId),
                colorFilter = ColorFilter.tint(GlanceTheme.colors.widgetBackground)
            )
            else -> modifier.fillMaxSize().background(GlanceTheme.colors.widgetBackground)
        }
        Box(modifier = backgroundModifier) {
            content()
        }
    }

    @Composable
    fun WidgetContainer(
        padding: Dp = 8.dp,
        modifier: GlanceModifier = GlanceModifier,
        content: @Composable () -> Unit
    ) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            content()
        }
    }

    @Composable
    fun LocationHeader(
        locationName: String,
        fontSize: TextUnit = 14.sp,
        maxLines: Int = 1,
        modifier: GlanceModifier = GlanceModifier
    ) {
        Text(
            text = locationName,
            style = TextStyle(
                fontSize = fontSize,
                color = GlanceTheme.colors.onSurface
            ),
            maxLines = maxLines,
            modifier = modifier
        )
    }

    @Composable
    fun WeatherIcon(
        iconPath: String?,
        description: String,
        size: Dp = 48.dp,
        modifier: GlanceModifier = GlanceModifier
    ) {
        WeatherWidgetManager.getIconImageProviderFromPath(iconPath)?.let { provider ->
            Image(
                provider = provider,
                contentDescription = description,
                modifier = modifier.size(size)
            )
        }
    }

    @Composable
    fun TemperatureText(
        temperature: String,
        fontSize: TextUnit = 32.sp,
        modifier: GlanceModifier = GlanceModifier
    ) {
        Text(
            text = temperature,
            style = TextStyle(
                fontSize = fontSize,
                fontWeight = FontWeight.Bold,
                color = GlanceTheme.colors.onSurface
            ),
            modifier = modifier
        )
    }

    @Composable
    fun DescriptionText(
        description: String,
        fontSize: TextUnit = 14.sp,
        modifier: GlanceModifier = GlanceModifier
    ) {
        Text(
            text = description,
            style = TextStyle(
                fontSize = fontSize,
                color = GlanceTheme.colors.onSurface
            ),
            modifier = modifier
        )
    }
    
    @Composable
    fun PrecipitationText(
        precipAccumulation: String,
        fontSize: TextUnit = 10.sp,
        modifier: GlanceModifier = GlanceModifier,
        useAccentColor: Boolean = false
    ) {
        Text(
            text = precipAccumulation,
            style = TextStyle(
                fontSize = fontSize,
                color = if (useAccentColor) GlanceTheme.colors.primary else GlanceTheme.colors.onSurfaceVariant
            ),
            modifier = modifier,
            maxLines = 1
        )
    }

    @Composable
    fun CurrentWeatherSection(
        data: WeatherWidgetData,
        modifier: GlanceModifier = GlanceModifier
    ) {
        Row(
            modifier = modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            // Weather icon
            WeatherIcon(data.iconPath, data.description, 40.dp)
            
            Spacer(modifier = GlanceModifier.width(8.dp))
            
            // Temperature and location
            Column(
                modifier = GlanceModifier.defaultWeight()
            ) {
                TemperatureText(data.temperature, 24.sp)
                Spacer(modifier = GlanceModifier.height(2.dp))
                LocationHeader(data.locationName, 11.sp)
            }
            
            Spacer(modifier = GlanceModifier.defaultWeight())
        }
    }

    @Composable
    fun CardItem(
        content: @Composable RowScope.() -> Unit
    ) {
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .background(GlanceTheme.colors.surface)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.Vertical.CenterVertically,
            content = content
        )
    }

    @Composable
    fun DataLabel(
        icon: String,
        value: String,
        useAccentColor: Boolean = false
    ) {
        Row(
            verticalAlignment = Alignment.Vertical.CenterVertically,
            modifier = GlanceModifier.padding(end = 8.dp)
        ) {
            Text(
                text = icon,
                style = TextStyle(
                    color = if (useAccentColor) GlanceTheme.colors.primary else GlanceTheme.colors.onSurfaceVariant,
                    fontSize = 12.sp
                )
            )
            Spacer(modifier = GlanceModifier.width(2.dp))
            Text(
                text = value,
                style = TextStyle(
                    color = if (useAccentColor) GlanceTheme.colors.primary else GlanceTheme.colors.onSurfaceVariant,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}