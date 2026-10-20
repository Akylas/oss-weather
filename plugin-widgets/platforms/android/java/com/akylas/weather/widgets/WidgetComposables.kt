package com.akylas.weather.widgets

import android.text.format.DateUtils
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
import androidx.glance.LocalSize
import androidx.glance.action.actionStartActivity
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.action.ActionParameters
import androidx.glance.background
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.akylas.weather.widgets.WeatherWidgetManager.getOpenAppOnTap

object WidgetComposables {

    val openSettingsTypeKey = ActionParameters.Key<String>("openSettings")

    @Composable
    fun NoDataContent(
        loadingState: WidgetLoadingState = WidgetLoadingState.NONE,
        errorMessage: String = "",
        networkError: Boolean = false,
        iconPath: String = ""
    ) {
        val context = LocalContext.current
        // what is shown follows the real widget height: nothing may be clipped on small widgets
        val height = LocalSize.current.height.value
        val openOnClick = getOpenAppOnTap(context)
        val launchIntent = if (openOnClick) null else WeatherWidgetManager.createAppLaunchIntent(context)
        val openAction = launchIntent?.let { actionStartActivity(it.component!!) }
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .then(if (openAction != null) GlanceModifier.clickable(openAction) else GlanceModifier)
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalAlignment = Alignment.Vertical.CenterVertically
            ) {
                when (loadingState) {
                    WidgetLoadingState.LOADING -> {
                        // paddings 16 + glyph 38 + gap 8 + text 20
                        if (height >= 85f) {
                            Text(
                                text = "⟳",
                                style = TextStyle(
                                    color = GlanceTheme.colors.onBackground,
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Spacer(modifier = GlanceModifier.height(8.dp))
                        }
                        Text(
                            text = context.getString(R.string.widget_loading),
                            maxLines = 1,
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium
                            )
                        )
                    }
                    
                    WidgetLoadingState.ERROR -> ErrorContent(errorMessage, networkError, iconPath)

                    else -> {
                        Text(
                            text = context.getString(R.string.widget_no_location),
                            maxLines = 2,
                            style = TextStyle(
                                color = GlanceTheme.colors.onBackground,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        )
                        // paddings 16 + title 2 lines 40 + gap 4 + hint 15
                        if (height >= 80f) {
                            Spacer(modifier = GlanceModifier.height(4.dp))
                            Text(
                                text = context.getString(R.string.widget_tap_configure),
                                maxLines = 1,
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
    }

    // a connection / provider failure is generic, a real error shows its message (the icon gives it room) and asks to be reported.
    // What is shown follows the real widget height: nothing may be clipped on small widgets
    @Composable
    private fun ErrorContent(errorMessage: String, networkError: Boolean, iconPath: String) {
        val context = LocalContext.current
        val height = LocalSize.current.height.value
        val icon = WeatherWidgetManager.getIconImageProviderFromPath(iconPath, context)
        if (networkError) {
            // paddings 16 + icon 28 + gaps 8 + title 2 lines 34 + hint 15
            if (icon != null && height >= 85f) {
                Image(
                    provider = icon,
                    contentDescription = null,
                    modifier = GlanceModifier.size(28.dp),
                    colorFilter = ColorFilter.tint(GlanceTheme.colors.onSurfaceVariant)
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
            }
            Text(
                text = context.getString(R.string.widget_error_network),
                maxLines = if (height >= 50f) 2 else 1,
                style = TextStyle(
                    color = GlanceTheme.colors.onBackground,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            )
            if (height >= 110f) {
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = context.getString(R.string.widget_tap_open_app),
                    maxLines = 1,
                    style = TextStyle(
                        color = GlanceTheme.colors.onSurfaceVariant,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                )
            }
        } else {
            val showIcon = icon != null && height >= 90f
            val showHint = height >= 70f
            // paddings 16 + icon 20 + gaps 8 + hint 2 lines 28, what is left holds the message lines of 15
            val reserved = 16f + (if (showIcon) 24f else 0f) + (if (showHint) 32f else 0f)
            if (showIcon) {
                Image(
                    provider = icon!!,
                    contentDescription = null,
                    modifier = GlanceModifier.size(20.dp),
                    colorFilter = ColorFilter.tint(GlanceTheme.colors.error)
                )
                Spacer(modifier = GlanceModifier.height(4.dp))
            }
            Text(
                text = errorMessage.ifEmpty { context.getString(R.string.widget_error_loading) },
                maxLines = ((height - reserved) / 15f).toInt().coerceIn(1, 6),
                style = TextStyle(
                    color = GlanceTheme.colors.onBackground,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            )
            if (showHint) {
                Spacer(modifier = GlanceModifier.height(4.dp))
                Text(
                    text = context.getString(R.string.widget_error_report),
                    maxLines = 2,
                    style = TextStyle(
                        color = GlanceTheme.colors.onSurfaceVariant,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                )
            }
        }
    }

    @Composable
    fun WidgetBackground(
        enabled: Boolean = true,
        modifier: GlanceModifier = GlanceModifier,
        color: ColorProvider? = GlanceTheme.colors.widgetBackground,
        staleSince: Long = 0L,
        content: @Composable () -> Unit,
    ) {
        val context = LocalContext.current
        val providedColor = color ?: GlanceTheme.colors.widgetBackground
        val composeColor = providedColor.getColor(context)
        val alpha = if (composeColor != null) composeColor.alpha else 1f
        val openOnClick = getOpenAppOnTap(context)

        // If we could extract the color, split alpha and tint color (tint must not carry alpha)
        val tintColorProvider = if (composeColor != null) {
            val tintColor = Color(red = composeColor.red, green = composeColor.green, blue = composeColor.blue, alpha = 1f)
            ColorProvider(tintColor)
        } else {
            // fallback: use provided color as tint (may ignore any alpha)
            providedColor
        }
        
        val launchIntent = if (openOnClick) WeatherWidgetManager.createAppLaunchIntent(context) else null
        val openAction = launchIntent?.let { 
            actionStartActivity(it.component!!, actionParametersOf(openSettingsTypeKey to "false"))
         }
        Box(
            modifier = modifier.fillMaxSize().then(
                if (enabled) GlanceModifier.background(
                    imageProvider = ImageProvider(R.drawable.app_widget_background),
                    alpha = alpha,
                    colorFilter = ColorFilter.tint(tintColorProvider)
                ) else GlanceModifier
            ).then(if (openAction != null) GlanceModifier.clickable(openAction) else GlanceModifier)
        ) {
            content()
            if (staleSince > 0L) {
                val updatedAgo = DateUtils.getRelativeTimeSpanString(staleSince, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS, DateUtils.FORMAT_ABBREV_RELATIVE)
                Box(
                    modifier = GlanceModifier.fillMaxSize().padding(4.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    Text(
                        text = context.getString(R.string.widget_updated_ago, updatedAgo),
                        style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 10.sp)
                    )
                }
            }
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
}
