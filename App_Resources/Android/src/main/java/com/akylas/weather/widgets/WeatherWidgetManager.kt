package com.akylas.weather.widgets

import android.content.Context
import android.content.Intent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.glance.ImageProvider
import androidx.glance.appwidget.GlanceAppWidget
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonElement

import androidx.core.content.edit
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.launch

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Reactive data store for widget data using StateFlow
 */
object WidgetDataStore {
    private val _widgetData = MutableStateFlow<Map<Int, WeatherWidgetData>>(emptyMap())
    val widgetData: StateFlow<Map<Int, WeatherWidgetData>> = _widgetData.asStateFlow()
    
    fun updateWidgetData(widgetId: Int, data: WeatherWidgetData) {
        _widgetData.update { current ->
            current + (widgetId to data)
        }
        WidgetsLogger.d("WidgetDataStore", "Updated data for widgetId=$widgetId, total widgets=${_widgetData.value.size}")
    }
    
    fun removeWidgetData(widgetId: Int) {
        _widgetData.update { current ->
            current - widgetId
        }
        WidgetsLogger.d("WidgetDataStore", "Removed data for widgetId=$widgetId")
    }
    
    fun initializeFromCache(cache: Map<Int, WeatherWidgetData>) {
        _widgetData.value = cache
        WidgetsLogger.d("WidgetDataStore", "Initialized with ${cache.size} cached widgets")
    }
    /**
     * Returns a StateFlow that only emits when the specific widget's data.
     * This prevents unnecessary recomposition of other widgets when a different widget's data changes.
     */
    fun getWidgetDataFlow(widgetId: Int): StateFlow<WeatherWidgetData?> {
        return _widgetData
            .map { data -> data[widgetId] }
            .distinctUntilChanged()
            .stateIn(
                scope = CoroutineScope(SupervisorJob() + Dispatchers.Default),
                started = SharingStarted.Eagerly,
                initialValue = _widgetData.value[widgetId]
            )
    }
}

/**
 * Reactive config store for widget configurations using StateFlow
 * Enables automatic widget recomposition when settings change
 */
object WidgetConfigStore {
    private val _widgetConfigs = MutableStateFlow<Map<Int, WidgetConfig>>(emptyMap())
    val widgetConfigs: StateFlow<Map<Int, WidgetConfig>> = _widgetConfigs.asStateFlow()
    
    fun updateWidgetConfig(widgetId: Int, config: WidgetConfig) {
        _widgetConfigs.update { current ->
            current + (widgetId to config)
        }
        WidgetsLogger.d("WidgetConfigStore", "Updated config for widgetId=$widgetId, total widgets=${_widgetConfigs.value.size}")
    }
    
    fun removeWidgetConfig(widgetId: Int) {
        _widgetConfigs.update { current ->
            current - widgetId
        }
        WidgetsLogger.d("WidgetConfigStore", "Removed config for widgetId=$widgetId")
    }
    
    fun initializeFromStorage(configs: Map<Int, WidgetConfig>) {
        _widgetConfigs.value = configs
        WidgetsLogger.d("WidgetConfigStore", "Initialized with ${configs.size} widget configs")
    }
    
    fun getConfig(widgetId: Int): WidgetConfig? {
        return _widgetConfigs.value[widgetId]
    }
    
    /**
     * Returns a StateFlow that only emits when the specific widget's settings change.
     * This prevents unnecessary recomposition of other widgets when a different widget's config changes.
     */
    fun getWidgetSettingsFlow(widgetId: Int): StateFlow<JsonObject?> {
        return widgetConfigs
            .map { configs -> configs[widgetId]?.settings }
            .distinctUntilChanged()
            .stateIn(
                scope = CoroutineScope(SupervisorJob() + Dispatchers.Default),
                started = SharingStarted.Eagerly,
                initialValue = _widgetConfigs.value[widgetId]?.settings
            )
    }
}

/**
 * Manages weather widget updates and scheduling
 */
object WeatherWidgetManager {
    private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private const val WIDGET_PREFS_FILE = "prefs.db"
    private const val UPDATE_FREQUENCY_KEY = "widget_update_frequency"
    private const val WIDGET_CONFIGS_KEY = "widget_configs" // per-instance configs
    private const val WIDGET_KIND_CONFIGS_KEY = "widget_kind_configs" // per-kind default configs
    private const val ACTIVE_WIDGETS_KEY = "active_widget_ids"
    private const val WIDGET_DATA_CACHE_KEY = "widget_data_cache"
    private const val DEFAULT_UPDATE_FREQUENCY = 30L

    private const val LOG_TAG = "WeatherWidgetManager"

    private val JSON = Json { ignoreUnknownKeys = true; isLenient = true }

    init {
        WidgetsLogger.d(LOG_TAG, "WeatherWidgetManager loaded")
    }

    // Widget data cache - for persistence only
    private val widgetDataCache = mutableMapOf<Int, WeatherWidgetData>()
    private var cacheLoaded = false

    /**
     * Load widget data cache from SharedPreferences and initialize StateFlow
     * Made internal so widgets can ensure cache is loaded before observing StateFlow
     */
    internal fun loadWidgetDataCache(context: Context) {
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
            
            // Initialize StateFlow with cached data
            WidgetDataStore.initializeFromCache(widgetDataCache.toMap())
            
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
                val dataJson = Json.encodeToString(WeatherWidgetData.serializer(), data)
                jsonObject.put(widgetId.toString(), dataJson)
            }
            
            prefs.edit { putString(WIDGET_DATA_CACHE_KEY, jsonObject.toString()) }
            WidgetsLogger.d(LOG_TAG, "Saved ${widgetDataCache.size} widgets to persisted cache")
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to save widget data cache", e)
        }
    }

    fun deleteWidgetCache(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "deleteWidgetCache(widgetId=$widgetId) called")
        // Delete cached data
        loadWidgetDataCache(context)
        widgetDataCache.remove(widgetId)
        saveWidgetDataCache(context)
        
        // Remove from StateFlow
        WidgetDataStore.removeWidgetData(widgetId)
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
        prefs.edit { putString(ACTIVE_WIDGETS_KEY, array.toString()) }
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


    /**
     * Update only clock widgets (for time changes)
     */
    // @JvmStatic
    // fun updateClockWidgets(context: Context) {
    //     WidgetsLogger.d(LOG_TAG, "updateClockWidgets() called")

    //     val appWidgetManager = AppWidgetManager.getInstance(context)
    //     val clockWidgetIds = appWidgetManager.getAppWidgetIds(
    //         ComponentName(context, SimpleWeatherWithClockWidgetReceiver::class.java)
    //     )

    //     if (clockWidgetIds.isNotEmpty()) {
    //         val intent = Intent(context, SimpleWeatherWithClockWidgetReceiver::class.java).apply {
    //             action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
    //             putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, clockWidgetIds)
    //         }
    //         context.sendBroadcast(intent)
    //         WidgetsLogger.d(LOG_TAG, "Updated ${clockWidgetIds.size} clock widgets")
    //     }
    // }

    /**
     * Update only date widgets (for date changes)
     */
    // @JvmStatic
    // fun updateDateWidgets(context: Context) {
    //     WidgetsLogger.d(LOG_TAG, "updateDateWidgets() called")

    //     val appWidgetManager = AppWidgetManager.getInstance(context)
    //     val dateWidgetIds = appWidgetManager.getAppWidgetIds(
    //         ComponentName(context, SimpleWeatherWithDateWidgetReceiver::class.java)
    //     )

    //     if (dateWidgetIds.isNotEmpty()) {
    //         val intent = Intent(context, SimpleWeatherWithDateWidgetReceiver::class.java).apply {
    //             action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
    //             putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, dateWidgetIds)
    //         }
    //         context.sendBroadcast(intent)
    //         WidgetsLogger.d(LOG_TAG, "Updated ${dateWidgetIds.size} date widgets")
    //     }
    // }

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
    @JvmStatic
    fun onWidgetAdded(context: Context, widgetId: Int) {
        WidgetsLogger.i(LOG_TAG, "onWidgetAdded(widgetId=$widgetId)")
        
        // ensure config exists
        loadWidgetConfig(context, widgetId, true)
        // Add to active list
        addActiveWidget(context, widgetId)
        sendWidgetAdded(context, widgetId)
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
        deleteWidgetCache(context, widgetId)
    }

    /**
     * Request immediate update for a specific widget
     */
    @JvmStatic
    fun requestWidgetUpdate(context: Context, widgetId: Int) {
        // ensure config exists
        loadWidgetConfig(context, widgetId, false) ?: return
        WidgetsLogger.d(LOG_TAG, "requestWidgetUpdate(widgetId=$widgetId)")
        // Send broadcast to JS side to request weather data
        val intent = Intent("com.akylas.weather.WIDGET_UPDATE_REQUEST")
        intent.putExtra("widgetId", widgetId)
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)
        WidgetsLogger.i(LOG_TAG, "Sent WIDGET_UPDATE_REQUEST for widgetId=$widgetId")
        
    }
    /**
     * Request immediate update for a specific widget
     */
    @JvmStatic
    fun sendWidgetAdded(context: Context, widgetId: Int) {
        // ensure config exists
        loadWidgetConfig(context, widgetId, false) ?: return
        WidgetsLogger.d(LOG_TAG, "sendWidgetAdded(widgetId=$widgetId)")
        // Send broadcast to JS side to request weather data
        val intent = Intent("com.akylas.weather.WIDGET_ADDED")
        intent.putExtra("widgetId", widgetId)
        intent.setPackage(context.packageName)
        context.sendBroadcast(intent)
        WidgetsLogger.i(LOG_TAG, "Sent WIDGET_ADDED for widgetId=$widgetId")
        
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
        
        // Update StateFlow - triggers automatic recomposition
        WidgetDataStore.updateWidgetData(widgetId, loadingData)
        
        // Also update cache for persistence
        widgetDataCache[widgetId] = loadingData
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
        
        // Update StateFlow - triggers automatic recomposition
        WidgetDataStore.updateWidgetData(widgetId, errorData)
        
        // Also update cache for persistence
        widgetDataCache[widgetId] = errorData
    }

    /**
    * Get the Glance widget class for a widget ID
    * NOTE: This is no longer used for forcing updates with StateFlow pattern,
    * but kept for potential future diagnostics
    */
    private fun getGlanceWidgetClass(context: Context, widgetId: Int): Class<out GlanceAppWidget>? {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        val receiverToWidgetMap = mapOf(
            SimpleWeatherWidgetReceiver::class.java to SimpleWeatherWidgetOld::class.java,
            SimpleWeatherWithDateWidgetReceiver::class.java to SimpleWeatherWithDateWidgetOld::class.java,
            SimpleWeatherWithClockWidgetReceiver::class.java to SimpleWeatherWithClockWidgetOld::class.java,
            HourlyWeatherWidgetReceiver::class.java to HourlyWeatherWidgetOld::class.java,
            DailyWeatherWidgetReceiver::class.java to DailyWeatherWidgetOld::class.java,
            ForecastWeatherWidgetReceiver::class.java to ForecastWeatherWidgetOld::class.java
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
    * DEPRECATED: Force a Glance widget to update
    * 
    * This method is no longer used. With the StateFlow-based reactive architecture,
    * widgets automatically recompose when data changes via collectAsState.
    * Keeping this commented out for reference during transition period.
    */
    // private fun forceGlanceUpdate(context: Context, widgetId: Int) {
    //     WidgetsLogger.d(LOG_TAG, "forceGlanceUpdate for widget $widgetId=")
    //     coroutineScope.launch {
    //         try {
    //             val widgetClass = getGlanceWidgetClass(context, widgetId)
    //             
    //             if (widgetClass != null) {
    //                 val widget = widgetClass.getDeclaredConstructor().newInstance()
    //                 
    //                 val glanceManager = GlanceAppWidgetManager(context)
    //                 val glanceIds = glanceManager.getGlanceIds(widgetClass)
    //                 
    //                 // Find matching GlanceId
    //                 val matchingGlanceId = glanceIds.find { glanceManager.getAppWidgetId(it) == widgetId }
    //                 WidgetsLogger.d(LOG_TAG, "Updating widget $widgetId of class=${widgetClass}")
    //                 
    //                 if (matchingGlanceId != null) {
    //                     widget.update(context, matchingGlanceId)
    //                     WidgetsLogger.d(LOG_TAG, "Updated Glance widget ${widgetId}")
    //                 } else {
    //                     // Update all widgets of this type
    //                     widget.updateAll(context)
    //                     WidgetsLogger.d(LOG_TAG, "Updated all widgets of type ${widgetClass.simpleName}")
    //                 }
    //                 // sendWidgetUpdate(context, widgetId, widgetClass)
    //             } else {
    //                 WidgetsLogger.w(LOG_TAG, "Could not find widget class for ${widgetId}")
    //             }
    //         } catch (e: Exception) {
    //             WidgetsLogger.e(LOG_TAG, "Error updating Glance widget ${widgetId}", e)
    //         }
    //     }
    // }
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
            WidgetDataStore.removeWidgetData(widgetId)

            WidgetsLogger.i(LOG_TAG, "Cleared widget data for widgetId=$widgetId")
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
     * Get cached widget data - now reads from StateFlow
     */
    fun getWidgetData(context: Context, widgetId: Int): WeatherWidgetData? {
        loadWidgetDataCache(context)
        // Read from StateFlow for most up-to-date data
        val data = WidgetDataStore.widgetData.value[widgetId]
        WidgetsLogger.d(LOG_TAG, "getWidgetData(widgetId=$widgetId) -> found=${data != null}")
        return data
    }

    /**
     * Common handler used by both JSON and object update paths
     * Now uses StateFlow for reactive updates instead of manual widget.update()
     */
    private fun handleParsedWidgetData(context: Context, widgetId: Int, data: WeatherWidgetData) {
        WidgetsLogger.d(LOG_TAG, "handleParsedWidgetData(widgetId=$widgetId, temperature=${data.temperature}, location=${data.locationName}, loadingState=${data.loadingState})")
        
        loadWidgetDataCache(context)
        widgetDataCache[widgetId] = data
        saveWidgetDataCache(context) // Persist after update
        
        // Update StateFlow - triggers automatic recomposition in all observing widgets
        WidgetDataStore.updateWidgetData(widgetId, data)
        
        WidgetsLogger.i(LOG_TAG, "Widget data updated for widgetId=$widgetId (reactive)")
    }

    /**
     * Explicit method to clear widget data
     */
    @JvmStatic
    fun clearWidgetData(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "clearWidgetData(widgetId=$widgetId) called")
        
        deleteWidgetCache(context, widgetId) // Persist after removal
        
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
            WidgetsLogger.d(LOG_TAG, "parseWeatherWidgetDataFromJson succeeded for widget. temperature=${parsed.temperature} location=${parsed.locationName} state=${parsed.loadingState} errorMessage=${parsed.errorMessage}")
            parsed
        } catch (t: Throwable) {
            WidgetsLogger.e(LOG_TAG, "parseWeatherWidgetDataFromJson failed", t)
            null
        }
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

    /**
     * Update specific widget
     */
    private fun updateWidget(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "updateWidget(widgetId=$widgetId) scanning receivers")
        val widgetClass = getGlanceWidgetClass(context, widgetId)
        if (widgetClass != null) {
            sendWidgetUpdate(context, widgetId, widgetClass)
        }
    }

    /**
     * Update specific widget
     */
    private fun sendWidgetUpdate(context: Context, widgetId: Int, receiverClass: Class<out GlanceAppWidget>) {
        WidgetsLogger.d(LOG_TAG, "sendWidgetUpdate matched receiver ${receiverClass.simpleName} for widgetId=$widgetId")
        val intent = Intent(context, receiverClass)
        intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
        context.sendBroadcast(intent)
        WidgetsLogger.i(LOG_TAG, "Sent ACTION_APPWIDGET_UPDATE broadcast to ${receiverClass.simpleName} for widgetId=$widgetId")
    }

    /**
     * Get all per-kind default configurations
     */
    @JvmStatic
    fun getAllKindConfigs(context: Context): Map<String, WidgetConfig> {
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val json = prefs.getString(WIDGET_KIND_CONFIGS_KEY, null) ?: run {
            WidgetsLogger.d(LOG_TAG, "getAllKindConfigs() -> no stored configs")
            return emptyMap()
        }

        return try {
            val configs = mutableMapOf<String, WidgetConfig>()
            val jsonObject = JSONObject(json)
            val keys = jsonObject.keys()

            while (keys.hasNext()) {
                val widgetKind = keys.next()
                val configJson = jsonObject.getJSONObject(widgetKind)
                configs[widgetKind] = parseWidgetConfig(configJson)
            }
            WidgetsLogger.i(LOG_TAG, "Loaded ${configs.size} widget kind configurations")
            configs
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to parse widget kind configurations", e)
            emptyMap()
        }
    }

    /**
     * Save all per-kind default configurations
     */
    @JvmStatic
    fun saveAllKindConfigs(context: Context, configs: Map<String, WidgetConfig>) {
        WidgetsLogger.d(LOG_TAG, "saveAllKindConfigs() saving ${configs.size} configs")
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val jsonObject = JSONObject()

        configs.forEach { (widgetKind, config) ->
            jsonObject.put(widgetKind, widgetConfigToJson(config))
        }

        prefs.edit { putString(WIDGET_KIND_CONFIGS_KEY, jsonObject.toString()) }
        WidgetsLogger.i(LOG_TAG, "All widget kind configurations saved")
    }

    /**
     * Get configuration for a specific widget kind (default settings)
     */
    @JvmStatic
    fun getKindConfig(context: Context, widgetKind: String): WidgetConfig {
        val configs = getAllKindConfigs(context)
        val config = configs[widgetKind]
        
        if (config == null) {
            WidgetsLogger.d(LOG_TAG, "No kind config for $widgetKind, creating with defaults from JSON")
            val defaultConfig = initializeKindConfigWithDefaults(context, widgetKind)
            saveKindConfig(context, widgetKind, defaultConfig)
            return defaultConfig
        }
        
        return config
    }

    /**
     * Save configuration for a specific widget kind
     */
    @JvmStatic
    fun saveKindConfig(context: Context, widgetKind: String, config: WidgetConfig) {
        WidgetsLogger.d(LOG_TAG, "saveKindConfig(widgetKind=$widgetKind)")
        val configs = getAllKindConfigs(context).toMutableMap()
        configs[widgetKind] = config
        saveAllKindConfigs(context, configs)
    }

    /**
     * Get all per-instance widget configurations
     */
    @JvmStatic
    fun getAllWidgetConfigs(context: Context): Map<Int, WidgetConfig> {
        // First check if configs are already in StateFlow
        val cachedConfigs = WidgetConfigStore.widgetConfigs.value
        if (cachedConfigs.isNotEmpty()) {
            WidgetsLogger.d(LOG_TAG, "getAllWidgetConfigs() -> returning ${cachedConfigs.size} from StateFlow")
            return cachedConfigs
        }
        
        // Load from SharedPreferences and initialize StateFlow
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
                configs[widgetId.toInt()] = parseWidgetConfig(configJson)
                WidgetsLogger.i(LOG_TAG, "Loaded widget configuration ${widgetId.toInt()}:${configs[widgetId.toInt()]}")
            }
            WidgetsLogger.i(LOG_TAG, "Loaded ${configs.size} widget configurations")
            
            // Initialize StateFlow with loaded configs
            WidgetConfigStore.initializeFromStorage(configs)
            
            configs
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to parse widget configurations", e)
            emptyMap()
        }
    }

    /**
     * Save all per-instance widget configurations
     */
    @JvmStatic
    fun saveAllWidgetConfigs(context: Context, configs: Map<Int, WidgetConfig>) {
        WidgetsLogger.d(LOG_TAG, "saveAllWidgetConfigs() saving ${configs.size} configs")
        val prefs = context.getSharedPreferences(WIDGET_PREFS_FILE, Context.MODE_PRIVATE)
        val jsonObject = JSONObject()

        configs.forEach { (widgetId, config) ->
            jsonObject.put(widgetId.toString(), widgetConfigToJson(config))
        }

        prefs.edit { putString(WIDGET_CONFIGS_KEY, jsonObject.toString()) }
        WidgetsLogger.i(LOG_TAG, "All widget configurations saved: ${jsonObject.toString()}")
    }

    /**
     * Create widget instance configuration from kind defaults
     * Called when a new widget is added
     */
    @JvmStatic
    fun createInstanceConfig(context: Context, widgetId: Int, widgetKind: String): WidgetConfig {
        WidgetsLogger.d(LOG_TAG, "createInstanceConfig(widgetId=$widgetId, widgetKind=$widgetKind)")
        
        // Get kind defaults (with settings initialized from JSON)
        val kindConfig = getKindConfig(context, widgetKind)
        
        // Create instance config with widgetKind set and copy settings
        val instanceConfig = WidgetConfig(
            locationName = kindConfig.locationName,
            latitude = kindConfig.latitude,
            longitude = kindConfig.longitude,
            model = kindConfig.model,
            provider = kindConfig.provider,
            widgetKind = widgetKind,
            settings = kindConfig.settings?.let { JsonObject(it) } // Create a copy of settings
        )
        
        // Save instance config
        saveWidgetConfig(context, widgetId, instanceConfig)
        
        WidgetsLogger.i(LOG_TAG, "Created instance config for widget $widgetId from kind $widgetKind (settings=${instanceConfig.settings})")
        return instanceConfig
    }

    /**
     * Load widget configuration for specific widget instance
     * If no instance config exists, creates one from kind defaults
     */
    @JvmStatic
    fun loadWidgetConfig(context: Context, widgetId: Int, canCreate: Boolean = true): WidgetConfig? {
        WidgetsLogger.d(LOG_TAG, "loadWidgetConfig(widgetId=$widgetId)")
        val config = getAllWidgetConfigs(context)[widgetId]
        
        if (config != null || !canCreate) {
            WidgetsLogger.d(LOG_TAG, "loadWidgetConfig(widgetId=$widgetId) -> found instance config:$config")
            return config
        }
        
        // No instance config - try to determine widget kind and create from defaults
        val widgetKind = getWidgetKindForId(context, widgetId)
        if (widgetKind != null) {
            WidgetsLogger.d(LOG_TAG, "loadWidgetConfig(widgetId=$widgetId) -> creating from kind $widgetKind")
            return createInstanceConfig(context, widgetId, widgetKind)
        }
        
        WidgetsLogger.w(LOG_TAG, "loadWidgetConfig(widgetId=$widgetId) -> no config found, returning default")
        return createDefaultConfig()
    }

    /**
     * Save widget configuration for specific widget instance
     */
    @JvmStatic
    fun saveWidgetConfig(context: Context, widgetId: Int, config: WidgetConfig) {
        WidgetsLogger.d(LOG_TAG, "saveWidgetConfig(widgetId=$widgetId, config=$config)")
        val configs = getAllWidgetConfigs(context).toMutableMap()
        configs[widgetId] = config
        saveAllWidgetConfigs(context, configs)
        
        // Update StateFlow to trigger reactive recomposition
        // Only update settings to avoid triggering data refetch
        WidgetConfigStore.updateWidgetConfig(widgetId, config)
        WidgetsLogger.i(LOG_TAG, "Updated WidgetConfigStore for widgetId=$widgetId - widgets will recompose automatically")
    }

    /**
     * Delete widget configuration and data for specific instance
     */
    @JvmStatic
    fun deleteWidgetConfig(context: Context, widgetId: Int) {
        WidgetsLogger.d(LOG_TAG, "deleteWidgetConfig(widgetId=$widgetId) called")
        
        // Delete instance config
        val configs = getAllWidgetConfigs(context).toMutableMap()
        configs.remove(widgetId)
        saveAllWidgetConfigs(context, configs)
        
        // Remove from StateFlow
        WidgetConfigStore.removeWidgetConfig(widgetId)
        // reloadConfigs()
 
        WidgetsLogger.i(LOG_TAG, "Deleted config and cache for widgetId=$widgetId")
    }

    /**
     * Get all widget IDs for a specific kind
     */
    @JvmStatic
    fun getInstancesOfKind(context: Context, widgetKind: String): List<Int> {
        val configs = getAllWidgetConfigs(context)
        val instances = configs.filter { it.value.widgetKind == widgetKind }.keys.toList()
        WidgetsLogger.d(LOG_TAG, "getInstancesOfKind($widgetKind) -> ${instances.size} instances")
        return instances
    }

    /**
     * Determine widget kind from widget ID by checking all receivers
     */
    private fun getWidgetKindForId(context: Context, widgetId: Int): String? {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        val receiverToKindMap = mapOf(
            SimpleWeatherWidgetReceiver::class.java to "SimpleWeatherWidget",
            SimpleWeatherWithDateWidgetReceiver::class.java to "SimpleWeatherWithDateWidget",
            SimpleWeatherWithClockWidgetReceiver::class.java to "SimpleWeatherWithClockWidget",
            HourlyWeatherWidgetReceiver::class.java to "HourlyWeatherWidget",
            DailyWeatherWidgetReceiver::class.java to "DailyWeatherWidget",
            ForecastWeatherWidgetReceiver::class.java to "ForecastWeatherWidget"
        )
        
        for ((receiverClass, widgetKind) in receiverToKindMap) {
            val allIds = appWidgetManager.getAppWidgetIds(ComponentName(context, receiverClass))
            if (widgetId in allIds) {
                WidgetsLogger.d(LOG_TAG, "Widget $widgetId is of kind $widgetKind")
                return widgetKind
            }
        }
        
        WidgetsLogger.w(LOG_TAG, "Could not determine widget kind for $widgetId")
        return null
    }

    /**
     * Parse WidgetConfig from JSONObject
     */
    private fun parseWidgetConfig(json: JSONObject): WidgetConfig {
        WidgetsLogger.i(LOG_TAG, "parseWidgetConfig $json")
        
        return WidgetConfig(
            locationName = json.optString("locationName", "current"),
            latitude = json.optDouble("latitude", 0.0),
            longitude = json.optDouble("longitude", 0.0),
            model = json.optString("model", null),
            provider = json.optString("provider", null),
            widgetKind = json.optString("widgetKind", null),
            settings = json.optJSONObject("settings") as JsonObject?
        )
    }

    /**
     * Convert WidgetConfig to JSONObject
     */
    private fun widgetConfigToJson(config: WidgetConfig): JSONObject {
        WidgetsLogger.d(LOG_TAG, "widgetConfigToJson $config")
        return JSONObject().apply {
            put("locationName", config.locationName)
            put("latitude", config.latitude)
            put("longitude", config.longitude)
            config.model?.let { put("model", it) }
            config.provider?.let { put("provider", it) }
            config.widgetKind?.let { put("widgetKind", it) }
            put("settings", config.settings)
        }
    }

    /**
     * Create default config
     */
    @JvmStatic
    fun createDefaultConfig(): WidgetConfig {
        return WidgetConfig(
            locationName = "current",
            settings = null
        )
    }
    
    /**
     * Load widget JSON schema and extract default settings
     */
    private fun loadDefaultSettingsForKind(context: Context, widgetKind: String): JsonObject? {
        try {
            // Map widget kind to JSON file name
            val jsonFileName = "${widgetKind}.json"
            
            // Load JSON from assets
            val jsonString = context.assets.open("app/widget-layouts/widgets/$jsonFileName").bufferedReader().use { it.readText() }
            val jsonObject = JSONObject(jsonString)
            
            // Extract settings with defaults
            if (!jsonObject.has("settings")) {
                return null
            }
            
            val settingsSchema = jsonObject.getJSONObject("settings")
            val defaultSettings = mutableMapOf<String, JsonElement>()
            
            val keys = settingsSchema.keys()
            while (keys.hasNext()) {
                val settingKey = keys.next()
                val settingDef = settingsSchema.getJSONObject(settingKey)
                
                if (settingDef.has("default")) {
                    val defaultValue = settingDef.get("default")
                    defaultSettings[settingKey] = when (defaultValue) {
                        is Boolean -> JsonPrimitive(defaultValue)
                        is Int -> JsonPrimitive(defaultValue)
                        is Long -> JsonPrimitive(defaultValue)
                        is Double -> JsonPrimitive(defaultValue)
                        is String -> JsonPrimitive(defaultValue)
                        else -> JsonPrimitive(defaultValue.toString())
                    }
                }
            }
            
            WidgetsLogger.d(LOG_TAG, "Loaded ${defaultSettings.size} default settings for $widgetKind")
            return if (defaultSettings.isEmpty()) null else JsonObject(defaultSettings)
        } catch (e: Exception) {
            WidgetsLogger.e(LOG_TAG, "Failed to load default settings for $widgetKind", e)
            return null
        }
    }
    
    /**
     * Initialize kind config with default settings from JSON schema
     */
    private fun initializeKindConfigWithDefaults(context: Context, widgetKind: String): WidgetConfig {
        val defaultSettings = loadDefaultSettingsForKind(context, widgetKind)
        return WidgetConfig(
            locationName = "current",
            widgetKind = widgetKind,
            settings = defaultSettings
        )
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
    val latitude: Double? = 0.0,
    val longitude: Double? = 0.0,
    val model: String? = null,
    val provider: String? = null,
    val widgetKind: String? = null,
    val settings: JsonObject? = null
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