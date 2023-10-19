package com.akylas.weather.benchmark

import android.graphics.Point
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {
    @RequiresApi(Build.VERSION_CODES.P)
    @get:Rule
    val baselineProfileRule = BaselineProfileRule()

    @RequiresApi(Build.VERSION_CODES.P)
    @Test
    fun startup() = baselineProfileRule.collect(
        packageName = PACKAGE_NAME,
        profileBlock = {
            startActivityAndWait()

            // Waits for content to be visible, which represents time to fully drawn.
            device.wait(Until.hasObject(By.scrollable(true)), 5_000)
            val recycler = device.findObject(By.scrollable(true))
            // Setting a gesture margin is important otherwise gesture nav is triggered.
            recycler.setGestureMargin(device.displayWidth / 5)
//            recycler.swipe(Direction.DOWN, 0.8f)
//            device.waitForIdle()

            // From center we scroll 2/3 of it which is 1/3 of the screen.
            recycler.drag(Point(0, recycler.visibleCenter.y / 3))
            device.waitForIdle()
            device.pressBack()
        }
    )

    companion object {
        private const val PACKAGE_NAME = "com.akylas.weather"
        private const val RECYCLER_ID = "main_collectionview"
    }
}