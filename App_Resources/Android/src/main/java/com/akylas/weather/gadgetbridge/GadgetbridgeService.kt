package com.akylas.weather.gadgetbridge

import android.content.Context
import android.content.Intent
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPOutputStream
import kotlin.concurrent.thread

/**
 * Gadgetbridge Service for broadcasting weather data to smartwatches
 * Implements the Gadgetbridge weather protocol with JSON + GZIP compression
 */
class GadgetbridgeService {
    companion object {
        private const val TAG = "JS"
        private const val ACTION = "nodomain.freeyourgadget.gadgetbridge.ACTION_GENERIC_WEATHER"
        
        /**
         * Broadcast weather data to Gadgetbridge on a background thread
         * @param context Android context
         * @param weatherDataJson Weather data as JSON string
         * @param locationJson Location data as JSON string
         */
        @JvmStatic
        fun broadcastWeather(context: Context, weatherDataJson: String, locationJson: String) {
            // Run on background thread to avoid blocking main thread
            thread {
                try {
                    val weatherData = JSONObject(weatherDataJson)
                    val location = JSONObject(locationJson)
                    
                    // Build Gadgetbridge data
                    val gadgetbridgeData = buildGadgetbridgeData(weatherData, location)
                    
                    // Compress with GZIP
                    val weatherGz = gzipCompress(gadgetbridgeData.toString())
                    
                    // Send broadcast
                    val intent = Intent(ACTION)
                    intent.putExtra("WeatherGz", weatherGz)
                    intent.putExtra("WeatherJson", gadgetbridgeData.toString())
                    intent.setFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES)
                    
                    context.sendBroadcast(intent)
                    
                    Log.d(TAG, "Weather data broadcasted successfully to Gadgetbridge")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to broadcast weather to Gadgetbridge", e)
                }
            }
        }
        
        /**
         * Build Gadgetbridge-compatible JSON from weather data
         */
        private fun buildGadgetbridgeData(weatherData: JSONObject, location: JSONObject): JSONObject {
            val result = JSONObject()
            
            try {
                val currently = weatherData.optJSONObject("currently")
                val daily = weatherData.optJSONObject("daily")?.optJSONArray("data")
                val hourly = weatherData.optJSONArray("hourly")
                
                // Timestamp (seconds)
                result.put("timestamp", (weatherData.optLong("time", 0) / 1000).toInt())
                
                // Location
                result.put("location", location.optString("name", ""))
                
                // Current weather
                currently?.let { current ->
                    result.put("currentTemp", kelvinFromCelsius(current.optDouble("temperature", 0.0)))
                    result.put("currentConditionCode", current.optInt("iconId", 3200))
                    result.put("currentCondition", current.optString("description", ""))
                    result.put("currentHumidity", current.optInt("relativeHumidity", 0))
                    result.put("windSpeed", current.optDouble("windSpeed", 0.0).toFloat())
                    result.put("windDirection", current.optInt("windBearing", 0))
                    result.put("uvIndex", current.optDouble("uvIndex", 0.0).toFloat())
                    result.put("feelsLikeTemp", kelvinFromCelsius(current.optDouble("apparentTemperature", 0.0)))
                    result.put("dewPoint", kelvinFromCelsius(current.optDouble("dewpoint", 0.0)))
                    result.put("pressure", current.optDouble("sealevelPressure", 0.0).toFloat())
                    result.put("cloudCover", current.optInt("cloudCover", 0))
                }
                
                // Today's min/max from first daily entry
                if (daily != null && daily.length() > 0) {
                    val today = daily.getJSONObject(0)
                    result.put("todayMaxTemp", kelvinFromCelsius(today.optDouble("temperatureMax", 0.0)))
                    result.put("todayMinTemp", kelvinFromCelsius(today.optDouble("temperatureMin", 0.0)))
                    result.put("precipProbability", today.optInt("precipProbability", 0))
                    result.put("sunRise", (today.optLong("sunriseTime", 0) / 1000).toInt())
                    result.put("sunSet", (today.optLong("sunsetTime", 0) / 1000).toInt())
                    result.put("moonRise", (today.optLong("moonRise", 0) / 1000).toInt())
                    result.put("moonSet", (today.optLong("moonSet", 0) / 1000).toInt())
                    result.put("moonPhase", today.optInt("moonPhase", 0))
                }
                
                // Daily forecasts (skip first day, include up to 7 days)
                if (daily != null && daily.length() > 1) {
                    val forecasts = JSONArray()
                    val maxForecasts = minOf(daily.length(), 8) // First + 7 more
                    for (i in 1 until maxForecasts) {
                        val day = daily.getJSONObject(i)
                        val forecast = JSONObject()
                        forecast.put("conditionCode", day.optInt("iconId", 3200))
                        forecast.put("maxTemp", kelvinFromCelsius(day.optDouble("temperatureMax", 0.0)))
                        forecast.put("minTemp", kelvinFromCelsius(day.optDouble("temperatureMin", 0.0)))
                        forecast.put("humidity", day.optInt("relativeHumidity", 0))
                        forecast.put("windSpeed", day.optDouble("windSpeed", 0.0).toFloat())
                        forecast.put("windDirection", day.optInt("windBearing", 0))
                        forecast.put("uvIndex", day.optDouble("uvIndex", 0.0).toFloat())
                        forecast.put("precipProbability", day.optInt("precipProbability", 0))
                        forecast.put("sunRise", (day.optLong("sunriseTime", 0) / 1000).toInt())
                        forecast.put("sunSet", (day.optLong("sunsetTime", 0) / 1000).toInt())
                        forecast.put("moonRise", (day.optLong("moonRise", 0) / 1000).toInt())
                        forecast.put("moonSet", (day.optLong("moonSet", 0) / 1000).toInt())
                        forecast.put("moonPhase", day.optInt("moonPhase", 0))
                        forecasts.put(forecast)
                    }
                    result.put("forecasts", forecasts)
                }
                
                // Hourly forecasts
                if (hourly != null && hourly.length() > 0) {
                    val hourlyForecasts = JSONArray()
                    for (i in 0 until minOf(hourly.length(), 48)) { // Up to 48 hours
                        val hour = hourly.getJSONObject(i)
                        val hourForecast = JSONObject()
                        hourForecast.put("timestamp", (hour.optLong("time", 0) / 1000).toInt())
                        hourForecast.put("temp", kelvinFromCelsius(hour.optDouble("temperature", 0.0)))
                        hourForecast.put("conditionCode", hour.optInt("iconId", 3200))
                        hourForecast.put("humidity", hour.optInt("relativeHumidity", 0))
                        hourForecast.put("windSpeed", hour.optDouble("windSpeed", 0.0).toFloat())
                        hourForecast.put("windDirection", hour.optInt("windBearing", 0))
                        hourForecast.put("uvIndex", hour.optDouble("uvIndex", 0.0).toFloat())
                        hourForecast.put("precipProbability", hour.optInt("precipProbability", 0))
                        hourlyForecasts.put(hourForecast)
                    }
                    result.put("hourly", hourlyForecasts)
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error building Gadgetbridge data", e)
            }
            
            return result
        }
        
        /**
         * Convert Celsius to Kelvin (rounded to int)
         */
        private fun kelvinFromCelsius(celsius: Double): Int {
            return (celsius + 273.15).toInt()
        }
        
        /**
         * Compress string data using GZIP
         */
        private fun gzipCompress(data: String): ByteArray {
            val outputStream = ByteArrayOutputStream()
            val gzipStream = GZIPOutputStream(outputStream)
            gzipStream.write(data.toByteArray(Charsets.UTF_8))
            gzipStream.close()
            return outputStream.toByteArray()
        }
    }
}
