package com.akylas.weather.widgets

import android.content.Context
import android.text.format.DateFormat
import android.util.TypedValue
import android.widget.RemoteViews
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.TextUnit
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.appwidget.AndroidRemoteViews
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.fillMaxWidth
import androidx.glance.text.TextAlign
import androidx.glance.unit.ColorProvider
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Time or date drawn by a TextClock: the launcher keeps it in sync with the system clock,
 * timezone and 12h/24h setting, so no alarm is needed to refresh it.
 *
 * [format] is a DateFormat pattern; null shows the system time format.
 * [weight] is light, normal, medium or bold (one layout each: RemoteViews cannot change the typeface).
 */
@Composable
fun WidgetTextClock(
    fontSize: TextUnit,
    color: ColorProvider,
    weight: String = "normal",
    format: String? = null,
    textAlign: TextAlign? = null,
    modifier: GlanceModifier = GlanceModifier
) {
    val context = LocalContext.current
    val layout = when (weight) {
        "light" -> R.layout.widget_text_clock_light
        "medium" -> R.layout.widget_text_clock_medium
        "bold" -> R.layout.widget_text_clock_bold
        else -> R.layout.widget_text_clock_normal
    }
    val remoteViews = RemoteViews(context.packageName, layout).apply {
        setTextViewTextSize(R.id.widget_text_clock, TypedValue.COMPLEX_UNIT_SP, fontSize.value)
        setTextColor(R.id.widget_text_clock, color.getColor(context).toArgb())
        if (format != null) {
            setCharSequence(R.id.widget_text_clock, "setFormat12Hour", format)
            setCharSequence(R.id.widget_text_clock, "setFormat24Hour", format)
        }
    }
    if (textAlign == null) {
        AndroidRemoteViews(remoteViews, modifier)
    } else {
        // wrap_content text has no room to align: the box gives it the width
        Box(
            modifier = modifier.fillMaxWidth(),
            contentAlignment = when (textAlign) {
                TextAlign.Center -> Alignment.Center
                TextAlign.End, TextAlign.Right -> Alignment.CenterEnd
                else -> Alignment.CenterStart
            }
        ) {
            AndroidRemoteViews(remoteViews)
        }
    }
}

/** DateFormat pattern of a widget date [style], following the system locale. */
fun widgetDatePattern(context: Context, style: String): String =
    // DateFormat.format prints a lone "y" as 2 digits, unlike SimpleDateFormat
    rawDatePattern(context, style).replace(Regex("(?<!y)y(?!y)"), "yyyy")

private fun rawDatePattern(context: Context, style: String): String =
    when (style) {
        "dayMonth" -> {
            val medium = DateFormat.getMediumDateFormat(context)
            if (medium is SimpleDateFormat) {
                medium.toPattern().replace(Regex("[\\s,./-]*y+[\\s,./-]*"), "").trim()
            } else {
                DateFormat.getBestDateTimePattern(Locale.getDefault(), "MMMd")
            }
        }
        "fullDate" -> patternOf(DateFormat.getLongDateFormat(context), "yMMMMd")
        "year" -> "yyyy"
        "month" -> "MMMM"
        else -> patternOf(DateFormat.getMediumDateFormat(context), "yMMMd")
    }

private fun patternOf(format: java.text.DateFormat, skeleton: String): String =
    (format as? SimpleDateFormat)?.toPattern() ?: DateFormat.getBestDateTimePattern(Locale.getDefault(), skeleton)
