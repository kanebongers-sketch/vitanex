// ─── Club, push: kan dit toestel meldingen krijgen? (PUUR, ook in de browser) ─
// iPhone en iPad: alleen als de app vanaf het beginscherm draait (iOS 16.4 of
// nieuwer). Daarbuiten is er geen PushManager. Geen node-imports hier: dit
// draait ook in de browser.

export type PushStand = 'kan' | 'geweigerd' | 'ios-beginscherm' | 'geen-ondersteuning'

export interface PushToestel {
  heeftServiceWorker: boolean
  heeftPushManager: boolean
  heeftNotification: boolean
  ios: boolean
  standalone: boolean
  /** Notification.permission, of null als die er niet is. */
  toestemming: 'default' | 'granted' | 'denied' | null
}

export function pushStand(t: PushToestel): PushStand {
  // Op iOS buiten het beginscherm ontbreekt PushManager: leg dan uit hoe het wel kan.
  if (t.ios && !t.standalone) return 'ios-beginscherm'
  if (!t.heeftServiceWorker || !t.heeftPushManager || !t.heeftNotification) return t.ios ? 'ios-beginscherm' : 'geen-ondersteuning'
  if (t.toestemming === 'denied') return 'geweigerd'
  return 'kan'
}

/** base64url naar bytes voor applicationServerKey (browser-veilig, zonder Buffer). */
export function sleutelNaarBytes(b64u: string): Uint8Array<ArrayBuffer> {
  const opgevuld = b64u.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64u.length / 4) * 4, '=')
  const ruw = atob(opgevuld)
  const uit = new Uint8Array(new ArrayBuffer(ruw.length))
  for (let i = 0; i < ruw.length; i++) uit[i] = ruw.charCodeAt(i)
  return uit
}

/** De sleutel in localStorage als het lid de vraag op Home wegklikte. */
export const VRAAG_WEG_SLEUTEL = 'club-app-push-vraag-weg'
