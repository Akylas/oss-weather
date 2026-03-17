package com.akylas.weather.widgets

import android.app.Activity
import android.appwidget.AppWidgetHostView
import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.Gravity
import android.widget.FrameLayout
import androidx.annotation.RequiresApi
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.glance.appwidget.ExperimentalGlanceRemoteViewsApi
import androidx.glance.appwidget.GlanceRemoteViews
import kotlinx.coroutines.runBlocking

/**
 * An activity that acts as a host for independently rendering glance composable content in
 * screenshot tests.
 *
 * See README.md for usage.
 *
 * NOTE: The device and screenshot framework you use should support hardware acceleration and
 * `clipToOutline` to see rounded corners. For robolectric, see
 * https://github.com/robolectric/robolectric/issues/8081#issuecomment-1478137890.
 * When using an emulator, you may use Espresso's `captureToBitmap` to ensure that the corner radius
 * is captured.
 */
public class GlanceScreenshotTestActivity : Activity() {
    private var state: Any? = null
    private var size: DpSize = DpSize(Dp.Companion.Unspecified, Dp.Companion.Unspecified)
    private var wrapContentSize: Boolean = false
    private lateinit var hostView: AppWidgetHostView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.test_activity_layout)
    }

    /**
     * Sets the appwidget state that can be accessed via LocalState composition local.
     */
    public fun <T> setState(state: T) {
        this.state = state
    }

    /**
     * Sets the size of appwidget to be assumed for the test. This corresponds to the "LocalSize"
     * composition local.
     *
     * Content will be rendered in this size, unless wrapContentSize was set.
     */
    public fun setAppWidgetSize(size: DpSize) {
        this.size = size
    }

    /**
     * Sets the size of rendering area to wrap size of the composable under test instead of using
     * the same size as one provided in [setAppWidgetSize]. This is useful when you are testing a
     * small part of the appwidget independently.
     *
     * Note: Calling [wrapContentSize] doesn't impact "LocalSize" compositionLocal. Use
     * [setAppWidgetSize] to set the value that should be used for the compositionLocal.
     */
    public fun wrapContentSize() {
        this.wrapContentSize = true
    }

    /**
     * Renders the given glance composable in the activity.
     *
     * Provide appwidget size before calling this.
     */
    @OptIn(ExperimentalGlanceRemoteViewsApi::class)
    public fun renderComposable(composable: @Composable () -> Unit) {
        runBlocking {
            val remoteViews = GlanceRemoteViews().compose(
                context = applicationContext,
                size = size,
                state = state,
                content = composable
            ).remoteViews

            val activityFrame = findViewById<FrameLayout>(R.id.content)
            hostView = TestHostView(applicationContext)
            hostView.setBackgroundColor(Color.WHITE)
            activityFrame.addView(hostView)

            val view = remoteViews.apply(applicationContext, hostView)
            hostView.addView(view)

            adjustHostViewSize()
        }
    }

    private fun adjustHostViewSize() {
        val displayMetrics = resources.displayMetrics

        if (wrapContentSize) {
            hostView.layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        } else {
            val hostViewPadding = Rect()
            val width =
                size.width.toPixels(displayMetrics) + hostViewPadding.left + hostViewPadding.right
            val height =
                size.height.toPixels(displayMetrics) + hostViewPadding.top + hostViewPadding.bottom

            hostView.layoutParams = FrameLayout.LayoutParams(width, height, Gravity.CENTER)
        }

        hostView.requestLayout()
    }

    private fun Dp.toPixels(displayMetrics: DisplayMetrics) =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, displayMetrics).toInt()

    @RequiresApi(Build.VERSION_CODES.O)
    private class TestHostView(context: Context) : AppWidgetHostView(context) {
        init {
            // Prevent asynchronous inflation of the App Widget
            setExecutor(null)
            layoutDirection = LAYOUT_DIRECTION_LOCALE
        }
    }
}