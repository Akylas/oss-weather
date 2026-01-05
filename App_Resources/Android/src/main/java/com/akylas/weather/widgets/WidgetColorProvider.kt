package com.akylas.weather.widgets

import android.content.Context
import android.content.res.Configuration
import androidx.compose.ui.graphics.Color
import androidx.glance.ImageProvider
import com.akylas.weather.R

/**
 * Provides colors for widgets based on dark mode state
 */
object WidgetColorProvider {
    
    /**
     * Check if device is in dark mode
     */
    fun isNightMode(context: Context): Boolean {
        val nightModeFlags = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        return nightModeFlags == Configuration.UI_MODE_NIGHT_YES
    }

    // Background colors
    fun getBackgroundColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xE6000000) // 90% opacity black
        } else {
            Color(0xF5FFFFFF) // 96% opacity white
        }
    }

    fun getCardBackgroundColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0x1AFFFFFF) // 10% white overlay
        } else {
            Color(0x12000000) // 7% black overlay
        }
    }

    // Text colors
    fun getPrimaryTextColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xFFFFFFFF) // Pure white
        } else {
            Color(0xFF000000) // Pure black
        }
    }

    fun getSecondaryTextColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xB3FFFFFF) // 70% white
        } else {
            Color(0x99000000) // 60% black
        }
    }

    fun getLocationTextColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xCCFFFFFF) // 80% white
        } else {
            Color(0xCC000000) // 80% black
        }
    }

    fun getTertiaryTextColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0x99FFFFFF) // 60% white
        } else {
            Color(0x66000000) // 40% black
        }
    }

    // Accent colors for precipitation, wind, etc.
    fun getPrecipitationColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xFF64B5F6) // Light blue
        } else {
            Color(0xFF1976D2) // Dark blue
        }
    }

    fun getWindColor(context: Context): Color {
        return if (isNightMode(context)) {
            Color(0xFF81C784) // Light green
        } else {
            Color(0xFF388E3C) // Dark green
        }
    }

    // Background image provider
    fun getBackgroundImageProvider(context: Context): ImageProvider {
        return if (isNightMode(context)) {
            ImageProvider(R.drawable.widget_background_dark)
        } else {
            ImageProvider(R.drawable.widget_background_light)
        }
    }

    fun getCardBackgroundImageProvider(context: Context): ImageProvider {
        return if (isNightMode(context)) {
            ImageProvider(R.drawable.widget_card_background_dark)
        } else {
            ImageProvider(R.drawable.widget_card_background_light)
        }
    }
}