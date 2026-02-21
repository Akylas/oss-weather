package com.akylas.weather.widgets

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.glance.color.ColorProvider
import androidx.glance.color.DayNightColorProvider
import androidx.glance.color.colorProviders
import androidx.glance.material3.ColorProviders

object WidgetTheme {
    val colors = colorProviders(
         primary = ColorProvider(Color(0xFF1976D2), Color(0xFF64B5F6)),
     onPrimary = ColorProvider(Color(0xFFFFFFFF), Color(0xFF003258)),
     primaryContainer = ColorProvider(Color(0xFFBBDEFB), Color(0xFF00497D)),
     onPrimaryContainer = ColorProvider(Color(0xFF388E3C), Color(0xFFCCE5FF)),

     secondary = ColorProvider(Color(0xFF388E3C), Color(0xFF81C784)),
     onSecondary = ColorProvider(Color(0xFFFFFFFF), Color(0xFF00390D)),
     secondaryContainer = ColorProvider(Color(0xFFC8E6C9), Color(0xFF005316)),
     onSecondaryContainer = ColorProvider(Color(0xFF00260E), Color(0xFFB7F397)),

     tertiary = ColorProvider(Color(0xFF6200EA), Color(0xFFB388FF)),
     onTertiary = ColorProvider(Color(0xFFFFFFFF), Color(0xFF3700B3)),
     tertiaryContainer = ColorProvider(Color(0xFFE1BEE7), Color(0xFF4A148C)),
     onTertiaryContainer = ColorProvider(Color(0xFF23004D), Color(0xFFE1BEE7)),

     error = ColorProvider(Color(0xFFCF6679), Color(0xFFCF6679)),
     onError = ColorProvider(Color(0xFFFFFFFF), Color(0xFF690005)),
     errorContainer = ColorProvider(Color(0xFFFDE7E9), Color(0xFF93000A)),
     onErrorContainer = ColorProvider(Color(0xFF410002), Color(0xFFFFDAD6)),

     widgetBackground = ColorProvider(Color(0xFFF5FFFFFF), Color(0xE6000000)),
     background = ColorProvider(Color(0xFFF5FFFFFF), Color(0xE6000000)),
     onBackground = ColorProvider(Color(0xFF000000), Color(0xFFFFFFFF)),



     surface = ColorProvider(Color(0x12000000), Color(0x1AFFFFFF)),
     onSurface = ColorProvider(Color(0xFF000000), Color(0xFFFFFFFF)),
     surfaceVariant = ColorProvider(Color(0x1F000000), Color(0x26FFFFFF)),
     onSurfaceVariant = ColorProvider(Color(0x99000000), Color(0xB3FFFFFF)),


     outline = ColorProvider(Color(0x4D000000), Color(0x4DFFFFFF)),

     inverseSurface = ColorProvider(Color(0xFF2E2E2E), Color(0xFFE0E0E0)),
     inverseOnSurface = ColorProvider(Color(0xFFFFFFFF), Color(0xFF1C1C1C)),
     inversePrimary = ColorProvider(Color(0xFF90CAF9), Color(0xFF1976D2))
    )
}
