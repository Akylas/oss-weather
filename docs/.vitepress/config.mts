import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "OSS Weather",
  description: "Open Source Weather App - Detailed weather data from multiple providers",
  base: '/oss-weather/',
  head: [
    ['link', { rel: 'icon', href: '/oss-weather/favicon.ico' }]
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/features/' },
      { text: 'Download', link: '/download' },
      { text: '❤️ Sponsor', link: 'https://github.com/sponsors/farfromrefug' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'API Keys', link: '/guide/api-keys' }
          ]
        },
        {
          text: 'Usage',
          items: [
            { text: 'Basic Usage', link: '/guide/basic-usage' },
            { text: 'Weather Providers', link: '/guide/weather-providers' },
            { text: 'Widgets', link: '/guide/widgets' },
            { text: 'Settings', link: '/guide/settings' }
          ]
        }
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Overview', link: '/features/' },
            { text: 'Weather Data', link: '/features/weather-data' },
            { text: 'Weather Radar', link: '/features/weather-radar' },
            { text: 'Hourly Charts', link: '/features/hourly-charts' },
            { text: 'Daily Forecasts', link: '/features/daily-forecasts' },
            { text: 'Weather Comparison', link: '/features/weather-comparison' },
            { text: 'Astronomy Data', link: '/features/astronomy' },
            { text: 'Air Quality', link: '/features/air-quality' },
            { text: 'Weather Map', link: '/features/weather-map' },
            { text: 'Home Widgets', link: '/features/home-widgets' },
            { text: 'Notifications', link: '/features/notifications' },
            { text: 'Smartwatch Support', link: '/features/smartwatch' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Akylas/oss-weather' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Martin Guillon'
    },

    search: {
      provider: 'local'
    }
  }
})
