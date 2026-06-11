/**
 * Orchestreert gezondheidsdata-synchronisatie per platform:
 *   iOS app     → Apple Health (HealthKit) → /api/health/sync
 *   Android app → Health Connect           → /api/health/sync
 *   Web         → Google Fit (server haalt zelf op via /api/google-fit/sync)
 */
import { authFetch } from './auth-fetch'
import { isAndroidApp, leesHealthBereik } from './health-connect'
import { isIosApp, leesAppleHealthBereik } from './apple-health'
import { heeftMeetwaarde, type DagMeting, type HealthBron } from './health-data'

const SYNC_DAGEN = 14
const THROTTLE_MS = 30 * 60 * 1000 // hooguit elke 30 minuten automatisch
const OPSLAG_SLEUTEL = 'mf-health-sync'

export interface SyncUitkomst {
  bron: HealthBron
  opgeslagen: number
}

export interface LaatsteSyncInfo {
  tijd: string
  bron: HealthBron
}

export function laatsteSyncInfo(): LaatsteSyncInfo | null {
  try {
    const raw = localStorage.getItem(OPSLAG_SLEUTEL)
    return raw ? JSON.parse(raw) as LaatsteSyncInfo : null
  } catch {
    return null
  }
}

function onthoudSync(bron: HealthBron) {
  try {
    localStorage.setItem(OPSLAG_SLEUTEL, JSON.stringify({ tijd: new Date().toISOString(), bron }))
  } catch { /* localStorage kan vol of geblokkeerd zijn */ }
}

async function pushNaarServer(bron: HealthBron, dagen: DagMeting[]): Promise<SyncUitkomst | null> {
  const metData = dagen.filter(heeftMeetwaarde)
  if (metData.length === 0) return null

  const res = await authFetch('/api/health/sync', {
    method: 'POST',
    body: JSON.stringify({ bron, dagen: metData }),
  })
  if (!res.ok) return null
  const json = await res.json() as { opgeslagen?: number }
  onthoudSync(bron)
  return { bron, opgeslagen: json.opgeslagen ?? metData.length }
}

async function syncGoogleFit(): Promise<SyncUitkomst | null> {
  const res = await authFetch('/api/google-fit/sync', { method: 'POST' })
  if (!res.ok) return null // 404 = niet gekoppeld, andere fouten zijn niet fataal
  const json = await res.json() as { opgeslagen?: number }
  onthoudSync('google_fit')
  return { bron: 'google_fit', opgeslagen: json.opgeslagen ?? 0 }
}

/**
 * Synchroniseert gezondheidsdata van het actieve platform.
 * Geeft null terug als er geen bron beschikbaar is of de throttle actief is.
 */
export async function syncGezondheidsdata(opties?: { forceer?: boolean }): Promise<SyncUitkomst | null> {
  if (!opties?.forceer) {
    const vorige = laatsteSyncInfo()
    if (vorige && Date.now() - new Date(vorige.tijd).getTime() < THROTTLE_MS) return null
  }

  try {
    if (isIosApp()) {
      return await pushNaarServer('apple_health', await leesAppleHealthBereik(SYNC_DAGEN))
    }
    if (isAndroidApp()) {
      return await pushNaarServer('health_connect', await leesHealthBereik(SYNC_DAGEN))
    }
    return await syncGoogleFit()
  } catch {
    return null
  }
}
