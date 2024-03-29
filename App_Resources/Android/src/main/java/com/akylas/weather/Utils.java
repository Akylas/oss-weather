package com.akylas.weather;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.TypedArray;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.color.DynamicColors;
import java.util.Locale;
import android.util.Log;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

public class Utils {
    public static int getColorFromName(Context context, String name) {
        int resID = context.getResources().getIdentifier(name, "attr", context.getPackageName());
        TypedArray array = context.getTheme().obtainStyledAttributes(new int[]{resID}); 
        return  array.getColor(0, 0xFF00FF);
    }
    public static int getColorFromInt(Context context, int resId) {
        TypedArray array = context.getTheme().obtainStyledAttributes(new int[]{resId}); 
        return  array.getColor(0, 0xFF00FF);
    }
    public static float getDimensionFromInt(Context context, int resId) {
        TypedArray array = context.getTheme().obtainStyledAttributes(new int[]{resId}); 
        return  array.getDimension(0,0);
    }
    public static void applyDayNight(AppCompatActivity activity, boolean applyDynamicColors) {

        // we need to applyDayNight to update theme thus colors as we dont restart activity (configChanges:uiMode)
        // but then dynamic colors are lost so let s call DynamicColors.applyIfAvailable
        activity.getDelegate().applyDayNight();
        if (applyDynamicColors) {
            DynamicColors.applyIfAvailable(activity);
        }
    }
    public static void applyDynamicColors(AppCompatActivity activity) {
        DynamicColors.applyIfAvailable(activity);
    }

    public static void restartApp(Context ctx, AppCompatActivity activity) {
        PackageManager pm = ctx.getPackageManager();
        Intent intent = pm.getLaunchIntentForPackage(ctx.getPackageName());
        Intent mainIntent = Intent.makeRestartActivityTask(intent.getComponent());
        ctx.startActivity(mainIntent);
        Runtime.getRuntime().exit(0);
    }

    public static Locale getSystemLocale() {
        return androidx.core.os.ConfigurationCompat.getLocales(android.content.res.Resources.getSystem().getConfiguration()).get(0);
    }

    public static boolean isNetworkAvailable(Context context) {
        ConnectivityManager cm =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        return activeNetwork != null &&
                activeNetwork.isConnectedOrConnecting();
    }
    public static okhttp3.Interceptor getOfflineCacheInterceptor(Context context) {
        return new okhttp3.Interceptor() {
            @Override public okhttp3.Response intercept(okhttp3.Interceptor.Chain chain) throws java.io.IOException {
                okhttp3.Request request = chain.request();
                okhttp3.Response originalResponse = chain.proceed(chain.request());
                Log.d("JS", "interceptor "+ Utils.isNetworkAvailable(context));
                if (Utils.isNetworkAvailable(context)) {
                    return originalResponse.newBuilder()
                            .build();
                } else {
                    return originalResponse.newBuilder()
                            .header("Cache-Control", "public, only-if-cached")
                            .build();
                }
            }
        };
    }

}