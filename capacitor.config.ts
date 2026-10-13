import type { CapacitorConfig } from '@capacitor/cli'

// Standaard productie: voorheen bakte een `npx cap sync` zonder NODE_ENV=production
// stilletjes http://localhost:3000 in de app (dan bereikt niets, ook de
// gezondheid-sync, de server). Lokaal testen via de laptop: CAP_DEV=1 npx cap sync.
const isProd = process.env.CAP_DEV !== '1'

const config: CapacitorConfig = {
  appId: 'nl.mentaforce.app',
  appName: 'MentaForce',
  webDir: 'out',

  server: {
    // Sinds 12-10-2026 draait MentaForce onder releasev.nl/mentaforce (mentaforce.nl
    // is losgekoppeld). Andere URL: CAPACITOR_SERVER_URL bij `npx cap sync`.
    url: isProd
      ? process.env.CAPACITOR_SERVER_URL ?? 'https://releasev.nl/mentaforce'
      : 'http://localhost:3000', // via adb reverse tcp:3000 tcp:3000
    cleartext: !isProd,
    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#101014',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#E8A33F',
    },

    StatusBar: {
      style: 'dark',
      backgroundColor: '#101014',
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
