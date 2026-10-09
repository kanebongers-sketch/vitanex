/**
 * Orchestreert gezondheidsdata-synchronisatie per platform:
 *   iOS app     → Apple Health (HealthKit) → /api/health/sync
 *   Android app → Health Connect           → /api/health/sync
 *   Web         → Google Fit (server haalt zelf op via /api/google-fit/sync)
 *
 * Incrementeel: de eerste sync haalt 30 dagen op, daarna vanaf de laatste
 * geslaagde sync min 2 dagen (late horloge-uploads en nachten die over
 * middernacht lopen komen zo alsnog binnen). Herhalen is veilig: de server
 * upsert op (gebruiker, datum, bron).
 */
import { authFetch } from '@/lib/auth/auth-fetch'
import { isAndroidApp, leesHealthConnect, verleendeRechten } from './health-connect'
import { IOS_RECHTEN, isIosApp, leesAppleHealth } from './apple-health'
import { bepaalVanafDatum } from './health-sync-venster'
import { heeftMeetwaarde, type DagMeting, type HealthBron, type WorkoutMeting } from './health-data'

const THROTTLE_MS = 30 * 60 * 1000 // hooguit elke 30 minuten automatisch
const OPSLAG_SLEUTEL = 'mf-health-sync'

export interface SyncUitkomst {
  bron: HealthBron
  opgeslagen: number
  workouts?: number
}

export interface LaatsteSyncInfo {
  tijd: string
  bron: HealthBron
}

export type NativeBron = Extract<HealthBron, 'health_connect' | 'healthkit'>

/** Welke native bron draait hier? null op web. */
export function nativeBron(): NativeBron | null {
  if (isAndroidApp()) return 'health_connect'
  if (isIosApp()) return 'healthkit'
  return null
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
  } catch { /* localStorage kan vol of geblokkeerd zijn; de sync zelf is wel gelukt */ }
}

/** Laatste geslaagde sync van deze bron volgens de server, of null. */
async function laatsteServerSync(bron: NativeBron): Promise<string | null> {
  try {
    const res = await authFetch('/api/health/sync')
    if (!res.ok) return null
    const json = await res.json() as { status?: { bron: string; laatsteSync: string | null }[] }
    return json.status?.find(s => s.bron === bron)?.laatsteSync ?? null
  } catch {
    return null // geen status = volledige sync van 30 dagen; altijd veilig
  }
}

interface NativeData {
  dagen: DagMeting[]
  workouts: WorkoutMeting[]
  rechten: string[]
}

async function leesNative(bron: NativeBron, vanaf: string): Promise<NativeData> {
  if (bron === 'health_connect') {
    const [data, rechten] = await Promise.all([leesHealthConnect(vanaf), verleendeRechten()])
    return { ...data, rechten }
  }
  // iOS geeft niet prijs wat er verleend is; we registreren wat we vroegen.
  return { ...(await leesAppleHealth(vanaf)), rechten: [...IOS_RECHTEN] }
}

async function pushNaarServer(bron: NativeBron, data: NativeData): Promise<SyncUitkomst> {
  const dagen = data.dagen.filter(heeftMeetwaarde)
  const fout = dagen.length === 0 && data.workouts.length === 0
    ? 'Geen gegevens gevonden — controleer de toestemmingen'
    : null
  const res = await authFetch('/api/health/sync', {
    method: 'POST',
    body: JSON.stringify({ bron, dagen, workouts: data.workouts, rechten: data.rechten, fout }),
  })
  if (!res.ok) throw new Error(`Sync naar server mislukt (${res.status})`)
  const json = await res.json() as { opgeslagen?: number; workouts?: number }
  onthoudSync(bron)
  return { bron, opgeslagen: json.opgeslagen ?? 0, workouts: json.workouts ?? 0 }
}

/** Synchroniseert de native bron van dit toestel (Health Connect of HealthKit). */
export async function syncNative(bron: NativeBron): Promise<SyncUitkomst> {
  const vanaf = bepaalVanafDatum(await laatsteServerSync(bron))
  return pushNaarServer(bron, await leesNative(bron, vanaf))
}

async function syncGoogleFit(): Promise<SyncUitkomst | null> {
  const res = await authFetch('/api/google-fit/sync', { method: 'POST' })
  if (!res.ok) return null // 404 = niet gekoppeld; andere fouten zijn niet fataal
  const json = await res.json() as { opgeslagen?: number }
  onthoudSync('google_health')
  return { bron: 'google_health', opgeslagen: json.opgeslagen ?? 0 }
}

/**
 * Synchroniseert gezondheidsdata van het actieve platform.
 * Geeft null terug als er geen bron beschikbaar is, de throttle actief is
 * of de sync mislukte (de fout staat dan in de console en in de sync-status).
 */
export async function syncGezondheidsdata(opties?: { forceer?: boolean }): Promise<SyncUitkomst | null> {
  if (!opties?.forceer) {
    const vorige = laatsteSyncInfo()
    if (vorige && Date.now() - new Date(vorige.tijd).getTime() < THROTTLE_MS) return null
  }

  try {
    const bron = nativeBron()
    return bron ? await syncNative(bron) : await syncGoogleFit()
  } catch (err) {
    console.error('[health-sync]', err)
    return null
  }
}
