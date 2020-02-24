// function setupTheme(context: android.content.Context) {
//     const AppCompatDelegate = androidx.appcompat.app.AppCompatDelegate;
//     const Configuration = android.content.res.Configuration;
//     const res = context.getResources();
//     let mode = res.getConfiguration().uiMode;
//     const themeMode = context.getSharedPreferences('prefs.db', 0).getString('theme', 'dark');
//     console.log('setupTheme', mode, themeMode);
//     switch (themeMode) {
//         case 'black':
//         case 'dark':
//             AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
//             mode = Configuration.UI_MODE_NIGHT_YES;
//             break;
//         case 'light':
//             AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
//             mode = Configuration.UI_MODE_NIGHT_NO;
//             break;
//         default:
//             AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_AUTO);
//             break;
//     }

//     const config = new Configuration(res.getConfiguration());
//     config.uiMode = mode;
//     // if (Build.VERSION.SDK_INT >= 17) {
//     context = context.createConfigurationContext(config);
//     // } else {
//     // res.updateConfiguration(config, res.getDisplayMetrics());
//     // }
//     return context;
// }

@JavaProxy('com.akylas.weather.Application')
class Application extends com.akylas.weather.NightModeApplication {
    public onCreate(): void {
        super.onCreate();
        // const AppCompatDelegate = androidx.appcompat.app.AppCompatDelegate;
        // const theme = this.getSharedPreferences('prefs.db', 0).getString('theme', 'dark');
        // console.log('Application', 'onCreate', theme);
        // switch (theme) {
        //     case 'auto':
        //         AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
        //         break;
        //     case 'light':
        //         AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        //         break;
        //     case 'black':
        //     case 'dark':
        //     default:
        //         AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        //         break;
        // }
    }

    public attachBaseContext(baseContext: any) {
        super.attachBaseContext(baseContext);
        // super.attachBaseContext(setupTheme(baseContext));
    }
}
