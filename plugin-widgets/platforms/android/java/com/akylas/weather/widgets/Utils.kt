package com.akylas.weather.widgets

import android.graphics.Color

/**
 * Parse color hex strings supporting:
 *  - #rrggbbaa (RGBA)  <- your case
 *  - #aarrggbb (AARRGGBB)
 *  - #rrggbb
 *  - #rgb
 *  - #rgba
 *
 * Returns an Android color int (AARRGGBB).
 */
fun String.toColorIntRgba(): Int {
    var hex = this.trim()
    if (hex.startsWith("#")) hex = hex.substring(1)
    if (hex.isEmpty()) throw IllegalArgumentException("Empty color string")

    // Expand shorthand forms
    when (hex.length) {
        3 -> {
            // rgb -> rrggbb, add full alpha
            val r = "${hex[0]}${hex[0]}"
            val g = "${hex[1]}${hex[1]}"
            val b = "${hex[2]}${hex[2]}"
            hex = "FF$r$g$b" // AARRGGBB
        }
        4 -> {
            // rgba -> rrggbbaa -> convert to aarrggbb
            val r = "${hex[0]}${hex[0]}"
            val g = "${hex[1]}${hex[1]}"
            val b = "${hex[2]}${hex[2]}"
            val a = "${hex[3]}${hex[3]}"
            hex = a + r + g + b
        }
        6 -> {
            // rrggbb -> prefix alpha FF
            hex = "FF$hex"
        }
        8 -> {
            // ambiguous: treat as rrggbbaa (RGBA) per project expectation -> convert to aarrggbb
            val rrggbb = hex.substring(0, 6)
            val aa = hex.substring(6, 8)
            hex = aa + rrggbb
        }
        else -> throw IllegalArgumentException("Unsupported color format: $this")
    }

    // Now hex is AARRGGBB
    return Color.parseColor("#$hex")
}