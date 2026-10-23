// ─── Club, health: de adapters per bron (PUUR) ──────────────────────────────
// Alleen bronnen die via de server (OAuth) lopen. Apple Gezondheid en Health
// Connect lopen via de app op de telefoon (native.ts) en hebben hier geen adapter.

import type { HealthAdapter } from '../adapter'
import type { BronId } from '../typen'
import { oura } from './oura'
import { polar } from './polar'
import { strava } from './strava'
import { whoop } from './whoop'
import { withings } from './withings'

export const ADAPTERS: Partial<Readonly<Record<BronId, HealthAdapter>>> = { withings, strava, polar, oura, whoop }

export function adapterVoor(bron: BronId): HealthAdapter | null {
  return ADAPTERS[bron] ?? null
}
