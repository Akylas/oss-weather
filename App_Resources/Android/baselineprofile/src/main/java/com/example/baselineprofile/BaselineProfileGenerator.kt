package com.example.baselineprofile

import android.Manifest
import android.graphics.Point
import android.util.Log
import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.espresso.Espresso
import androidx.test.espresso.action.ViewActions
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.rule.GrantPermissionRule;
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until

/**
 * This test class generates a basic startup baseline profile for the target package.
 *
 * We recommend you start with this but add important user flows to the profile to improve their performance.
 * Refer to the [baseline profile documentation](https://d.android.com/topic/performance/baselineprofiles)
 * for more information.
 *
 * You can run the generator with the "Generate Baseline Profile" run configuration in Android Studio or
 * the equivalent `generateBaselineProfile` gradle task:
 * ```
 * ./gradlew :app:generateReleaseBaselineProfile
 * ```
 * The run configuration runs the Gradle task and applies filtering to run only the generators.
 *
 * Check [documentation](https://d.android.com/topic/performance/benchmarking/macrobenchmark-instrumentation-args)
 * for more information about available instrumentation arguments.
 *
 * After you run the generator, you can verify the improvements running the [StartupBenchmarks] benchmark.
 *
 * When using this class to generate a baseline profile, only API 33+ or rooted API 28+ are supported.
 *
 * The minimum required version of androidx.benchmark to generate a baseline profile is 1.2.0.
 **/
@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    @get:Rule
    var grantPermissionRule: GrantPermissionRule =
        GrantPermissionRule.grant(Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE)

    @Test
    fun startup() {
        // This example works only with the variant with application id `com.akylas.weather`."
        rule.collect(
            packageName = PACKAGE_NAME,

            // See: https://d.android.com/topic/performance/baselineprofiles/dex-layout-optimizations
            includeInStartupProfile = true
        ) {
            // The block is re-run until the profile is stable, so every step must be idempotent:
            // the location chosen in the first iteration is persisted by the app.
            fun tapRelative(x: Float, y: Float) {
                device.click((device.displayWidth * x).toInt(), (device.displayHeight * y).toInt())
            }

            fun swipeRelative(fromY: Float, toY: Float) {
                device.swipe(
                    device.displayWidth / 2, (device.displayHeight * fromY).toInt(),
                    device.displayWidth / 2, (device.displayHeight * toY).toInt(), 30
                )
            }

            fun tapText(text: String) {
                device.findObject(By.text(text))?.click()
                device.waitForIdle()
                Thread.sleep(1_500)
            }

            pressHome()
            // startActivityAndWait() cannot confirm the launch of this app from framestats
            device.executeShellCommand("am start -W -n $PACKAGE_NAME/.MainActivity")
            device.wait(Until.hasObject(By.pkg(PACKAGE_NAME).depth(0)), 10_000)
            device.waitForIdle()
            Thread.sleep(3_000)

            // first run only: pick a location through the search page
            val searchButton = device.findObject(By.textContains("Search location"))
            if (searchButton != null) {
                searchButton.click()
                device.wait(Until.hasObject(By.clazz("android.widget.EditText")), 5_000)
                device.findObject(By.clazz("android.widget.EditText"))?.text = "Paris"
                device.wait(Until.hasObject(By.textContains("Île-de-France")), 15_000)
                device.findObject(By.textContains("Île-de-France"))?.click()
                Thread.sleep(8_000)
            }

            // main page: refresh, hourly popover, scroll
            swipeRelative(0.25f, 0.6f)
            Thread.sleep(6_000)
            tapRelative(0.5f, 0.42f)
            Thread.sleep(1_500)
            tapRelative(0.5f, 0.3f)
            Thread.sleep(500)
            swipeRelative(0.8f, 0.3f)
            swipeRelative(0.8f, 0.3f)
            device.waitForIdle()
            swipeRelative(0.3f, 0.8f)
            swipeRelative(0.3f, 0.8f)
            device.waitForIdle()

            // daily page: hourly modes, sun and moon, neighbouring days
            tapRelative(0.5f, 0.79f)
            Thread.sleep(3_000)
            tapText("Chart")
            tapText("Windy")
            tapText("Classic")
            swipeRelative(0.8f, 0.3f)
            device.waitForIdle()
            swipeRelative(0.3f, 0.8f)
            tapRelative(0.94f, 0.056f)
            Thread.sleep(2_000)
            tapRelative(0.94f, 0.056f)
            Thread.sleep(2_000)
            tapRelative(0.83f, 0.056f)
            Thread.sleep(2_000)
            device.pressBack()
            Thread.sleep(1_500)

            // drawer and overflow menu
            tapRelative(0.055f, 0.056f)
            Thread.sleep(1_500)
            device.pressBack()
            tapRelative(0.945f, 0.056f)
            Thread.sleep(1_500)
            device.pressBack()
            device.waitForIdle()
        }
    }

    companion object {
        private const val PACKAGE_NAME = "com.akylas.weather"

    }
}