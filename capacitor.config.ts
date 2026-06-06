import type { CapacitorConfig } from '@capacitor/cli'

const isProd = process.env.NODE_ENV === 'production'

const config: CapacitorConfig = {
  appId: 'nl.mentaforce.app',
  appName: 'MentaForce',
  webDir: 'out',

  server: {
    // Verander dit naar je productie-URL zodra de app live staat
    // Bijv. 'https://app.mentaforce.nl' of 'https://mentaforce.vercel.app'
    url: isProd
      ? process.env.CAPACITOR_SERVER_URL ?? 'https://mentaforce.nl'
      : 'http://localhost:3000', // via adb reverse tcp:3000 tcp:3000
    cleartext: !isProd,
    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0a0f1e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#1D9E75',
    },

    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0f1e',
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },

  ios: {
    contentInset: 'always',
  },
}

export default config
