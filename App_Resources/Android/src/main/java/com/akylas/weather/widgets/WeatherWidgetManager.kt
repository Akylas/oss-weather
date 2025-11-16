package com.akylas.weather.widgets

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.glance.ImageProvider
import androidx.glance.appwidget.GlanceAppWidget
import androidx.work.*
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import androidx.core.content.edit
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

/**
 * Manages weather widget updates and scheduling
 */
object WeatherWidgetManager {
    private val coroutineScope = MainScope()
    private const val WIDGET_UPDATE_WORK_TAG = "weather_widget_update"
    private const val WIDGET_PREFS_FILE = "widget_preferences"
    private const val UPDATE_FREQUENCY_KEY = "widget_update_frequency"
    private const val WIDGET_CONFIGS_KEY = "widget_configs"
    private const val ACTIVE_WIDGETS_KEY = "active_widget_ids"
    private const val WIDGET_DATA_CACHE_KEY = "widget_data_cache" // New
    private const val DEFAULT_UPDATE_FREQUENCY = 30L

    private const val LOG_TAG = "WeatherWidgetManager"

    private val JSON = Json { ignoreUnknownKeys = true; isLenient = true }

    init {
        WidgetsLogger.d(LOG_TAG, "WeatherWidgetManager loaded")
    }

    // Widget data cache - now lazy loaded from prefs
    private val widgetDataCache = mutableMapOf<Int, WeatherWidgetData>()
    private var cacheLoaded = false

    /**
     * Load widget data cache from SharedPreferences
     */
    private fun loadWidgetDataCache(context: Context) {
        if (cacheLoaded) return
        
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val json = prefs.getString(WIDGET_DATA_CACHE_KEY, null)
        
        if (json.isNullOrEmpty()) {
            WidgetsLogger.d(LOG_TAG, "No persisted widget data cache found")
            cacheLoaded = true
            return
        }
        
        try {
            val jsonObject = JSONObject(json)
            val keys = jsonObject.keys()
            
            while (keys.hasNext()) {
                val widgetId = keys.next().toInt()
                val dataJson = jsonObject.getString(widgetId.toString())
                val data = JSON.decodeFromString<WeatherWidgetData>(dataJson)
                widgetDataCache[widgetId] = data
            }
            
            WidgetsLogger.i(LOG_TAG, "Loaded ${widgetDataCache.size} widgets from persisted cache")
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to load widget data cache", e)
        }
        
        cacheLoaded = true
    }

    /**
     * Save widget data cache to SharedPreferences
     */
    private fun saveWidgetDataCache(context: Context) {
        try {
            val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
            val jsonObject = JSONObject()
            
            widgetDataCache.forEach { (widgetId, data) ->
                val dataJson = Json.encodeToString(data)
                jsonObject.put(widgetId.toString(), dataJson)
            }
            
            prefs.edit().putString(WIDGET_DATA_CACHE_KEY, jsonObject.toString()).apply()
            WidgetsLogger.d(LOG_TAG, "Saved ${widgetDataCache.size} widgets to persisted cache")
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to save widget data cache", e)
        }
    }

    /**
     * Get list of active widget IDs from persistent storage
     */
    private fun getActiveWidgetIdsFromPrefs(context: Context): MutableSet<Int> {
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val json = prefs.getString(ACTIVE_WIDGETS_KEY, null)
        
        if (json.isNullOrEmpty()) {
            return mutableSetOf()
        }
        
        return try {
            val array = JSONArray(json)
            val ids = mutableSetOf<Int>()
            for (i in 0 until array.length()) {
                ids.add(array.getInt(i))
            }
            WidgetsLogger.d(LOG_TAG, "Loaded ${ids.size} active widget IDs from prefs")
            ids
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to parse active widget IDs", e)
            mutableSetOf()
        }
    }

    /**
     * Save list of active widget IDs to persistent storage
     */
    private fun saveActiveWidgetIdsToPrefs(context: Context, widgetIds: Set<Int>) {
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val array = JSONArray(widgetIds.toList())
        prefs.edit().putString(ACTIVE_WIDGETS_KEY, array.toString()).apply()
        WidgetsLogger.d(LOG_TAG, "Saved ${widgetIds.size} active widget IDs to prefs")
    }

    /**
     * Add widget ID to active list
     */
    @JvmStatic
    fun addActiveWidget(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "addActiveWidget(widgetId=$widgetId)")
        val activeIds = getActiveWidgetIdsFromPrefs(context)
        if (activeIds.add(widgetId)) {
            saveActiveWidgetIdsToPrefs(context, activeIds)
            WidgetsLogger.i(LOG_TAG, "Added widgetId=$widgetId to active list (total=${activeIds.size})")
        } else {
            WidgetsLogger.d(LOG_TAG, "Widget $widgetId already in active list")
        }
    }

    /**
     * Remove widget ID from active list
     */
    @JvmStatic
    fun removeActiveWidget(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "removeActiveWidget(widgetId=$widgetId)")
        val activeIds = getActiveWidgetIdsFromPrefs(context)
        if (activeIds.remove(widgetId)) {
            saveActiveWidgetIdsToPrefs(context, activeIds)
            WidgetsLogger.i(LOG_TAG, "Removed widgetId=$widgetId from active list (remaining=${activeIds.size})")
        } else {
            WidgetsLogger.d(LOG_TAG, "Widget $widgetId not in active list")
        }
    }

    /**
     * Check if a widget is in the active list
     */
    @JvmStatic
    fun isWidgetAddedToLauncher(context: Context, widgetId: Int): Boolean {
        val activeIds = getActiveWidgetIdsFromPrefs(context)
        val isActive = activeIds.contains(widgetId)
        WidgetsLogger.d(LOG_TAG, "isWidgetAddedToLauncher(widgetId=$widgetId) -> $isActive")
        return isActive
    }

    /**
     * Get all active widget IDs from persistent list
     */
    @JvmStatic
    fun getAllActiveWidgetIds(context: Context): List<Int> {
        val activeIds = getActiveWidgetIdsFromPrefs(context)
        WidgetsLogger.d(LOG_TAG, "getAllActiveWidgetIds() -> ${activeIds.size} widgets")
        return activeIds.toList()
    }

    /**
     * Request update for all active widgets
     */
    @JvmStatic
    fun requestAllWidgetsUpdate(context: Context) {
        WidgetsLogger.d(LOG_TAG, "requestAllWidgetsUpdate() called")
        val activeIds = getActiveWidgetIdsFromPrefs(context)
        
        if (activeIds.isEmpty()) {
            WidgetsLogger.i(LOG_TAG, "No active widgets to update")
            return
        }

        WidgetsLogger.d(LOG_TAG, "Requesting update for ${activeIds.size} active widgets")
        var successCount = 0
        
        activeIds.forEach { widgetId ->
            try {
                WidgetsLogger.d(LOG_TAG, "Requesting update for widgetId=$widgetId")
                requestWidgetUpdate(context, widgetId)
                successCount++
            } catch (e: Exception) {
                WidgetsLogger.e(LOG_TAG, "Failed to request update for widgetId=$widgetId", e)
            }
        }
        
        WidgetsLogger.i(LOG_TAG, "Completed requestAllWidgetsUpdate: requested=$successCount of ${activeIds.size}")
    }

    /**
     * Re-render all widgets without fetching new data (e.g., for theme changes)
     */
    @JvmStatic
    fun reRenderAllWidgets(context: Context) {
        WidgetsLogger.d(LOG_TAG, "reRenderAllWidgets() called")
        coroutineScope.launch {
            SimpleWeatherWithClockWidget().apply { updateAll(context) }
            SimpleWeatherWithDateWidget().apply { updateAll(context) }
            SimpleWeatherWidget().apply { updateAll(context) }
            DailyWeatherWidget().apply { updateAll(context) }
            HourlyWeatherWidget().apply { updateAll(context) }
            ForecastWeatherWidget().apply { updateAll(context) }
        }
    }

     fun reRenderClockWidgets(context: Context) {
         WidgetsLogger.d(LOG_TAG, "reRenderClockWidgets() called")
         coroutineScope.launch {
             SimpleWeatherWithClockWidget().apply { updateAll(context) }
         }
    }


    /**
     * Update only clock widgets (for time changes)
     */
    @JvmStatic
    fun updateClockWidgets(context: Context) {
        WidgetsLogger.d(LOG_TAG, "updateClockWidgets() called")

        val appWidgetManager = AppWidgetManager.getInstance(context)
        val clockWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, SimpleWeatherWithClockWidgetReceiver::class.java)
        )

        if (clockWidgetIds.isNotEmpty()) {
            val intent = Intent(context, SimpleWeatherWithClockWidgetReceiver::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, clockWidgetIds)
            }
            context.sendBroadcast(intent)
            WidgetsLogger.d(LOG_TAG, "Updated ${clockWidgetIds.size} clock widgets")
        }
    }

    /**
     * Update only date widgets (for date changes)
     */
    @JvmStatic
    fun updateDateWidgets(context: Context) {
        WidgetsLogger.d(LOG_TAG, "updateDateWidgets() called")

        val appWidgetManager = AppWidgetManager.getInstance(context)
        val dateWidgetIds = appWidgetManager.getAppWidgetIds(
            ComponentName(context, SimpleWeatherWithDateWidgetReceiver::class.java)
        )

        if (dateWidgetIds.isNotEmpty()) {
            val intent = Intent(context, SimpleWeatherWithDateWidgetReceiver::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, dateWidgetIds)
            }
            context.sendBroadcast(intent)
            WidgetsLogger.d(LOG_TAG, "Updated ${dateWidgetIds.size} date widgets")
        }
    }

    /**
     * Schedule periodic widget updates - only schedules if widgets are active
     */
//    @SuppressLint("UseKtx")
//    @JvmStatic
//    fun scheduleWidgetUpdates(context: Context, frequencyMinutes: Long = getUpdateFrequency(context)) {
//        WidgetsLogger.d(LOG_TAG, "scheduleWidgetUpdates(frequencyMinutes=$frequencyMinutes)")
//
//        // Check if any widgets are active
//        val activeWidgets = getAllActiveWidgetIds(context)
//        if (activeWidgets.isEmpty()) {
//            WidgetsLogger.i(LOG_TAG, "No active widgets found, cancelling scheduled updates")
//            cancelWidgetUpdates(context)
//            return
//        }
//
//        // Save frequency preference
//        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
//        prefs.edit { putLong(UPDATE_FREQUENCY_KEY, frequencyMinutes) }
//        WidgetsLogger.i(LOG_TAG, "Saved update frequency: $frequencyMinutes minutes")
//
//        // Build constraints
//        val constraints = Constraints.Builder()
//            .setRequiredNetworkType(NetworkType.CONNECTED)
//            .setRequiresBatteryNotLow(true) // Don't run when battery is low
//            .build()
//
//        // Create periodic work request
//        val updateRequest = PeriodicWorkRequestBuilder<WeatherWidgetUpdateWorker>(
//            frequencyMinutes,
//            TimeUnit.MINUTES
//        )
//            .setConstraints(constraints)
//            .setInitialDelay(0, TimeUnit.MINUTES)
//            .addTag(WIDGET_UPDATE_WORK_TAG)
//            .build()
//
//        WidgetsLogger.d(LOG_TAG, "Enqueueing WorkManager job with tag $WIDGET_UPDATE_WORK_TAG for ${activeWidgets.size} widgets")
//        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
//            WIDGET_UPDATE_WORK_TAG,
//            ExistingPeriodicWorkPolicy.REPLACE,
//            updateRequest
//        )
//        WidgetsLogger.i(LOG_TAG, "Scheduled periodic widget updates every $frequencyMinutes minutes with battery constraint")
//    }
//
//    /**
//     * Cancel scheduled widget updates
//     */
//    @JvmStatic
//    fun cancelWidgetUpdates(context: Context) {
//        WidgetsLogger.i(LOG_TAG, "cancelWidgetUpdates() called; cancelling work with tag $WIDGET_UPDATE_WORK_TAG")
//        WorkManager.getInstance(context).cancelAllWorkByTag(WIDGET_UPDATE_WORK_TAG)
//    }

    /**
     * Get current update frequency from preferences
     */
    @JvmStatic
    fun getUpdateFrequency(context: Context): Long {
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val freq = prefs.getLong(UPDATE_FREQUENCY_KEY, DEFAULT_UPDATE_FREQUENCY)
        WidgetsLogger.d(LOG_TAG, "getUpdateFrequency() -> $freq")
        return freq
    }

    /**
     * Set update frequency and reschedule if widgets are active
     */
    @JvmStatic
    fun setUpdateFrequency(context: Context, frequencyMinutes: Long) {
        WidgetsLogger.d(LOG_TAG, "setUpdateFrequency(frequencyMinutes=$frequencyMinutes)")
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        prefs.edit { putLong(UPDATE_FREQUENCY_KEY, frequencyMinutes) }
        
        // Reschedule with new frequency if widgets are active
        requestAllWidgetsUpdate(context)
    }

    /**
     * Called when a widget is added - ensure updates are scheduled
     */
    fun onWidgetAdded(context: Context, widgetId: Int) {
        WidgetsLogger.i(LOG_TAG, "onWidgetAdded(widgetId=$widgetId)")
        
        // Add to active list
        addActiveWidget(context, widgetId)
        
        // Schedule updates now that we have at least one widget
//        scheduleWidgetUpdates(context)
        
        // Request immediate update for the new widget
        requestWidgetUpdate(context, widgetId)
    }

    /**
     * Called when a widget is removed - cancel updates if no more widgets
     */
    fun onWidgetRemoved(context: Context, widgetId: Int) {
        WidgetsLogger.i(LOG_TAG, "onWidgetRemoved(widgetId=$widgetId)")
        
        // Remove from active list
        removeActiveWidget(context, widgetId)
        
        // Delete widget config and data
        deleteWidgetConfig(context, widgetId)
        
        // Check if any widgets remain
//        val activeWidgets = getAllActiveWidgetIds(context)
//        if (activeWidgets.isEmpty()) {
//            WidgetsLogger.i(LOG_TAG, "No more active widgets, cancelling scheduled updates")
//            cancelWidgetUpdates(context)
//        }
    }

    /**
     * Request immediate update for a specific widget
     */
    @JvmStatic
    fun requestWidgetUpdate(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "requestWidgetUpdate(widgetId=$widgetId)")
        // Send broadcast to JS side to request weather data
        val intent = Intent("com.akylas.weather.WIDGET_UPDATE_REQUEST")
        intent.putExtra("widgetId", widgetId)
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)
        WidgetsLogger.i(LOG_TAG, "Sent WIDGET_UPDATE_REQUEST for widgetId=$widgetId")
        
    }

    /**
     * Set widget to loading state
     */
    @JvmStatic
    fun setWidgetLoading(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "setWidgetLoading(widgetId=$widgetId)")
        
        val loadingData = WeatherWidgetData(
            loadingState = WidgetLoadingState.LOADING
        )
        
        // Update cache
        widgetDataCache[widgetId] = loadingData
        
        // Trigger widget update
        forceGlanceUpdate(context, widgetId)
    }
    
    /**
     * Set widget to error state
     */
    @JvmStatic
    fun setWidgetError(context: Context, widgetId: Int, errorMessage: String) {
        WidgetsLogger.d(LOG_TAG, "setWidgetError(widgetId=$widgetId, error=$errorMessage)")
        
        val errorData = WeatherWidgetData(
            loadingState = WidgetLoadingState.ERROR,
            errorMessage = errorMessage
        )
        
        // Update cache
        widgetDataCache[widgetId] = errorData
        
        // Trigger widget update
        forceGlanceUpdate(context, widgetId)
    }

    /**
    * Get the Glance widget class for a widget ID
    */
    private fun getGlanceWidgetClass(context: Context, widgetId: Int): Class<out GlanceAppWidget>? {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        val receiverToWidgetMap = mapOf(
            SimpleWeatherWidgetReceiver::class.java to SimpleWeatherWidget::class.java,
            SimpleWeatherWithDateWidgetReceiver::class.java to SimpleWeatherWithDateWidget::class.java,
            SimpleWeatherWithClockWidgetReceiver::class.java to SimpleWeatherWithClockWidget::class.java,
            HourlyWeatherWidgetReceiver::class.java to HourlyWeatherWidget::class.java,
            DailyWeatherWidgetReceiver::class.java to DailyWeatherWidget::class.java,
            ForecastWeatherWidgetReceiver::class.java to ForecastWeatherWidget::class.java
        )
        
        for ((receiverClass, widgetClass) in receiverToWidgetMap) {
            val allIds = appWidgetManager.getAppWidgetIds(ComponentName(context, receiverClass))
            if (widgetId in allIds) {
                return widgetClass
            }
        }
        
        return null
    }

    /**
    * Force a Glance widget to update
    */
    private fun forceGlanceUpdate(context: Context, widgetId: Int) {
        coroutineScope.launch {
            try {
                val widgetClass = getGlanceWidgetClass(context, widgetId)
                
                if (widgetClass != null) {
                    val widget = widgetClass.getDeclaredConstructor().newInstance()
                    
                    val glanceManager = GlanceAppWidgetManager(context)
                    val glanceIds = glanceManager.getGlanceIds(widgetClass)
                    
                    // Find matching GlanceId
                    val matchingGlanceId = glanceIds.find { it.toString().hashCode() == widgetId }
                    
                    if (matchingGlanceId != null) {
                        widget.update(context, matchingGlanceId)
                        WidgetsLogger.d(LOG_TAG, "Updated Glance widget $widgetId")
                    } else {
                        // Update all widgets of this type
                        widget.updateAll(context)
                        WidgetsLogger.d(LOG_TAG, "Updated all widgets of type ${widgetClass.simpleName}")
                    }
                } else {
                    WidgetsLogger.w(LOG_TAG, "Could not find widget class for $widgetId")
                }
            } catch (e: Exception) {
                WidgetsLogger.e(LOG_TAG, "Error updating Glance widget $widgetId", e)
            }
        }
    }
    /**
     * Update widget with weather data received from JS
     *
     * NEW: Accepts WeatherWidgetData? - null indicates we should clear the widget data/cache for a widget.
     */
    @JvmStatic
    fun updateWidgetData(context: Context, widgetId: Int, data: WeatherWidgetData?) {
        if (data == null) {
            WidgetsLogger.i(LOG_TAG, "updateWidgetData(widgetId=$widgetId) received null data -> clearing cache")
            widgetDataCache.remove(widgetId)

            // Trigger widget update so UI can reflect "no data" state
            updateWidget(context, widgetId)
            WidgetsLogger.i(LOG_TAG, "Cleared widget data and requested update for widgetId=$widgetId")
            return
        }

        WidgetsLogger.d(LOG_TAG, "updateWidgetData(widgetId=$widgetId) (object)")
        handleParsedWidgetData(context, widgetId, data)
    }

    /**
     * New: Updates widget by parsing JSON string into a WeatherWidgetData instance.
     * Accepts nullable JSON; null means clear data for this widget.
     */
    @JvmStatic
    fun updateWidgetData(context: Context, widgetId: Int, dataJson: String?) {
        if (dataJson == null || dataJson.isBlank()) {
            WidgetsLogger.w(LOG_TAG, "Received null data for widget $widgetId")
            setWidgetError(context, widgetId, "No data received")
            return
        }

        if (dataJson.isBlank()) {
            WidgetsLogger.w(LOG_TAG, "updateWidgetData(widgetId=$widgetId) received blank json; ignoring")
            return
        }

        try {
            val data = parseWeatherWidgetDataFromJson(dataJson)
            if (data == null) {
                WidgetsLogger.e(LOG_TAG, "Failed to parse widget data for widget $widgetId")
                setWidgetError(context, widgetId, "Invalid data format")
                return
            }
            
            // Mark as loaded
            val loadedData = data.copy(loadingState = WidgetLoadingState.LOADED)

            handleParsedWidgetData(context, widgetId, loadedData)
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Error updating widget $widgetId", e)
            setWidgetError(context, widgetId, e.message ?: "Unknown error")
        }
    }

    /**
     * Get cached widget data
     */
    fun getWidgetData(context: Context, widgetId: Int): WeatherWidgetData? {
        loadWidgetDataCache(context)
        val found = widgetDataCache[widgetId] != null
        WidgetsLogger.d(LOG_TAG, "getWidgetData(widgetId=$widgetId) -> found=$found")
        return widgetDataCache[widgetId]
    }

    /**
     * Common handler used by both JSON and object update paths
     */
    private fun handleParsedWidgetData(context: Context, widgetId: Int, data: WeatherWidgetData) {
        WidgetsLogger.d(LOG_TAG, "handleParsedWidgetData(widgetId=$widgetId, temperature=${data.temperature}, location=${data.locationName})")
        
        loadWidgetDataCache(context)
        widgetDataCache[widgetId] = data
        saveWidgetDataCache(context) // Persist after update
        
        forceGlanceUpdate(context, widgetId)
        WidgetsLogger.i(LOG_TAG, "Widget data updated for widgetId=$widgetId")
    }

    /**
     * Explicit method to clear widget data
     */
    @JvmStatic
    fun clearWidgetData(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "clearWidgetData(widgetId=$widgetId) called")
        
        loadWidgetDataCache(context)
        widgetDataCache.remove(widgetId)
        saveWidgetDataCache(context) // Persist after removal
        
        updateWidget(context, widgetId)
        WidgetsLogger.i(LOG_TAG, "Cleared widget data for widgetId=$widgetId")
    }

    /**
     * Parse JSON produced by JS bridge into a WeatherWidgetData instance.
     */
    private fun parseWeatherWidgetDataFromJson(dataJson: String): WeatherWidgetData? {
        WidgetsLogger.d(LOG_TAG, "parseWeatherWidgetDataFromJson(length=${dataJson.length})")
        return try {
            val parsed = JSON.decodeFromString<WeatherWidgetData>(dataJson)
            WidgetsLogger.d(LOG_TAG, "parseWeatherWidgetDataFromJson succeeded for widget. temperature=${parsed.temperature} location=${parsed.locationName}")
            parsed
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "parseWeatherWidgetDataFromJson failed", t)
            null
        }
    }

    /**
     * Update specific widget
     */
    private fun updateWidget(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "updateWidget(widgetId=$widgetId) scanning receivers")
        val appWidgetManager = AppWidgetManager.getInstance(context)

        // Find which receiver this widget belongs to
        val receivers = listOf(
            SimpleWeatherWidgetReceiver::class.java,
            SimpleWeatherWithDateWidgetReceiver::class.java,
            SimpleWeatherWithClockWidgetReceiver::class.java,
            HourlyWeatherWidgetReceiver::class.java,
            DailyWeatherWidgetReceiver::class.java,
            ForecastWeatherWidgetReceiver::class.java
        )

        receivers.forEach { receiverClass ->
            val widgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, receiverClass)
            )
            if (widgetIds.contains(widgetId)) {
                WidgetsLogger.d(LOG_TAG, "updateWidget matched receiver ${receiverClass.simpleName} for widgetId=$widgetId")
                val intent = Intent(context, receiverClass)
                intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
                context.sendBroadcast(intent)
                WidgetsLogger.i(LOG_TAG, "Sent ACTION_APPWIDGET_UPDATE broadcast to ${receiverClass.simpleName} for widgetId=$widgetId")
            }
        }
    }

    /**
     * Get all widget configurations from SharedPreferences
     */
    fun getAllWidgetConfigs(context: Context): Map<Int, WidgetConfig> {
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val json = prefs.getString(WIDGET_CONFIGS_KEY, null) ?: run {
            WidgetsLogger.d(LOG_TAG, "getAllWidgetConfigs() -> no stored configs")
            return emptyMap()
        }

        return try {
            val configs = mutableMapOf<Int, WidgetConfig>()
            val jsonObject = JSONObject(json)
            val keys = jsonObject.keys()

            while (keys.hasNext()) {
                val widgetId = keys.next()
                val configJson = jsonObject.getJSONObject(widgetId)
                configs[widgetId.toInt()] = WidgetConfig(
                    locationName = configJson.optString("locationName", "current"),
                    latitude = configJson.optDouble("latitude", 0.0),
                    longitude = configJson.optDouble("longitude", 0.0),
                    model = configJson.optString("model", "default")
                )
            }
            WidgetsLogger.i(LOG_TAG, "Loaded ${configs.size} widget configurations")
            configs
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to parse widget configurations", e)
            emptyMap()
        }
    }

    /**
     * Save all widget configurations to SharedPreferences
     */
    fun saveAllWidgetConfigs(context: Context, configs: Map<Int, WidgetConfig>) {
        WidgetsLogger.d(LOG_TAG, "saveAllWidgetConfigs() saving ${configs.size} configs")
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val jsonObject = JSONObject()

        configs.forEach { (widgetId, config) ->
            val configJson = JSONObject().apply {
                put("locationName", config.locationName)
                put("latitude", config.latitude)
                put("longitude", config.longitude)
                put("model", config.model)
            }
            jsonObject.put(widgetId.toString(), configJson)
        }

        prefs.edit { putString(WIDGET_CONFIGS_KEY, jsonObject.toString()) }
        WidgetsLogger.i(LOG_TAG, "All widget configurations saved")
    }

    /**
     * Load widget configuration for specific widget
     */
    fun loadWidgetConfig(context: Context, widgetId: Int): WidgetConfig? {
        val config = getAllWidgetConfigs(context)[widgetId]
        WidgetsLogger.d(LOG_TAG, "loadWidgetConfig(widgetId=$widgetId) -> ${config != null}")
        return config
    }

    /**
     * Delete widget configuration
     */
    fun deleteWidgetConfig(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "deleteWidgetConfig(widgetId=$widgetId) called")
        val configs = getAllWidgetConfigs(context).toMutableMap()
        configs.remove(widgetId)
        saveAllWidgetConfigs(context, configs)
        
        loadWidgetDataCache(context)
        widgetDataCache.remove(widgetId)
        saveWidgetDataCache(context) // Persist after removal
        
        WidgetsLogger.i(LOG_TAG, "Deleted config and cache for widgetId=$widgetId")
    }

    /**
     * Decodes a file path into a Bitmap or returns null if that's not possible.
     */
    fun getIconBitmapFromPath(iconFilePath: String?): Bitmap? {
        if (iconFilePath.isNullOrBlank()) {
            WidgetsLogger.d(LOG_TAG, "Icon file path is null or blank")
            return null
        }
        val file = File(iconFilePath)
        if (!file.exists()) {
            return null
        }
        return try {
            BitmapFactory.decodeFile(iconFilePath)
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "Error decoding icon bitmap from $iconFilePath", t)
            null
        }
    }

    /**
     * Creates an ImageProvider wrapping the decoded Bitmap or returns null.
     * Use this inside widgets where the ImageProvider may be absent.
     */
    fun getIconImageProviderFromPath(iconFilePath: String?): ImageProvider? {
        val bmp = getIconBitmapFromPath(iconFilePath)
        val provider = bmp?.let { ImageProvider(it) }
        return provider
    }

    /**
     * Build an intent that will open the main app (launcher activity).
     * Returns null only if the package manager is not available for some reason.
     */
    fun createAppLaunchIntent(context: Context): Intent? {
        return try {
            val pm = context.packageManager
            var intent = pm.getLaunchIntentForPackage(context.packageName)
            if (intent == null) {
                intent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                    setPackage(context.packageName)
                }
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            WidgetsLogger.d(LOG_TAG, "createAppLaunchIntent: created intent for package ${context.packageName}")
            intent
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "createAppLaunchIntent failed", t)
            null
        }
    }
}

/**
 * Widget loading state
 */
@Serializable
enum class WidgetLoadingState {
    NONE,
    LOADING,
    LOADED,
    ERROR
}


/**
 * Widget configuration data class
 */
@Serializable
data class WidgetConfig(
    val locationName: String = "current",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val model: String = "default"
)

/**
 * Weather widget data class
 */
@Serializable
data class WeatherWidgetData(
    val temperature: String = "",
    val iconPath: String = "",
    val description: String = "",
    val locationName: String = "",
    val date: String = "",
    val hourlyData: List<HourlyData> = emptyList(),
    val dailyData: List<DailyData> = emptyList(),
    val forecastData: List<ForecastData> = emptyList(),
    val lastUpdate: Long = System.currentTimeMillis(),
    val loadingState: WidgetLoadingState = WidgetLoadingState.NONE,
    val errorMessage: String = ""
)

@Serializable
data class HourlyData(
    val time: String = "",
    val temperature: String = "",
    val description: String = "",
    val iconPath: String = "",
    val precipitation: String = "",
    val windSpeed: String = "",
    val precipAccumulation: String = "",
)

@Serializable
data class DailyData(
    val day: String = "",
    val description: String = "",
    val temperatureHigh: String = "",
    val temperatureLow: String = "",
    val windSpeed: String = "",
    val iconPath: String = "",
    val precipitation: String = "",
    val precipAccumulation: String = "",
)

@Serializable
data class ForecastData(
    val dateTime: String = "",
    val dayName: String = "",
    val windSpeed: String = "",
    val temperature: String = "",
    val iconPath: String = "",
    val description: String = "",
    val precipitation: String = "",
    val precipAccumulation: String = "",
)