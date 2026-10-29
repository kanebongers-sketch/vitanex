// ─── Club, health: metingen controleren en samenvatten (PUUR) ───────────────
// Alles wat van buiten komt (een leverancier of de app op de telefoon) gaat hier
// door: onzinwaarden, toekomstige data en te lange teksten vallen af. Zo komt er
// nooit een gewicht van 0 of 900 kg in Club.

import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import { DATA_SOORTEN, isBronId, isDataSoort, type BronId, type DataSoort, type Meting, type TrainingDetails } from './typen'

/** Redelijke grenzen per soort (inclusief). */
export const GRENZEN: Readonly<Record<DataSoort, { min: number; max: number }>> = {
  gewicht_kg: { min: 20, max: 350 },
  vetpercentage: { min: 2, max: 75 },
  spiermassa_kg: { min: 5, max: 150 },
  stappen: { min: 0, max: 150_000 },
  slaap_minuten: { min: 0, max: 24 * 60 },
  rusthartslag: { min: 25, max: 200 },
  hrv_ms: { min: 1, max: 400 },
  training: { min: 1, max: 24 * 60 },
  vo2max: { min: 10, max: 95 },
}

/** Hoe ver terug we iets aannemen (dagen); ouder is voor de sportschool niet zinvol. */
export const MAX_DAGEN_TERUG = 400
/** Een klok die iets voorloopt mag; verder in de toekomst niet. */
const MAX_TOEKOMST_MS = 10 * 60_000
const MAX_EXTERN_ID = 120
const MAX_TRAINING_SOORT = 40

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function binnen(soort: DataSoort, waarde: number): boolean {
  const g = GRENZEN[soort]
  return waarde >= g.min && waarde <= g.max
}

/** Afronden op een vast aantal decimalen per soort. */
export function rondAf(soort: DataSoort, waarde: number): number {
  if (soort === 'stappen' || soort === 'slaap_minuten' || soort === 'rusthartslag' || soort === 'training') return Math.round(waarde)
  return Math.round(waarde * 10) / 10
}

function geldigMoment(iso: string, nu: Date): boolean {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return false
  return t <= nu.getTime() + MAX_TOEKOMST_MS && t >= nu.getTime() - MAX_DAGEN_TERUG * 86_400_000
}

function schoneTraining(t: TrainingDetails): TrainingDetails | null {
  const duurSec = Math.round(t.duurSec)
  if (!Number.isFinite(duurSec) || duurSec < 60 || duurSec > 24 * 3600) return null
  const kcal = t.kcal !== null && t.kcal > 0 && t.kcal < 10_000 ? Math.round(t.kcal) : null
  const hr = t.gemHartslag !== null && t.gemHartslag >= 30 && t.gemHartslag <= 230 ? Math.round(t.gemHartslag) : null
  const soort = t.soort.trim().slice(0, MAX_TRAINING_SOORT) || 'Training'
  return { soort, duurSec, kcal, gemHartslag: hr }
}

/** Een meting zoals Club hem bewaart, of null als hij niet klopt. */
export function schoneMeting(m: Meting, nu: Date): Meting | null {
  const externId = m.externId.trim().slice(0, MAX_EXTERN_ID)
  if (!externId || !geldigMoment(m.gemetenOp, nu)) return null
  if (m.soort === 'training') {
    if (!m.training) return null
    const training = schoneTraining(m.training)
    if (!training) return null
    return { ...m, externId, waarde: Math.round(training.duurSec / 60), training, gemetenOp: new Date(m.gemetenOp).toISOString() }
  }
  if (!binnen(m.soort, m.waarde)) return null
  return { ...m, externId, waarde: rondAf(m.soort, m.waarde), training: null, gemetenOp: new Date(m.gemetenOp).toISOString() }
}

/** Alleen de geldige metingen, zonder dubbelen (laatste wint). */
export function schoneMetingen(lijst: readonly Meting[], nu: Date): Meting[] {
  const per = new Map<string, Meting>()
  for (const m of lijst) {
    const schoon = schoneMeting(m, nu)
    if (schoon) per.set(`${schoon.bron}|${schoon.externId}`, schoon)
  }
  return [...per.values()]
}

function leesTraining(v: unknown): TrainingDetails | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  const duurSec = getal(r.duurSec)
  if (duurSec === null) return null
  return { soort: typeof r.soort === 'string' ? r.soort : 'Training', duurSec, kcal: getal(r.kcal), gemHartslag: getal(r.gemHartslag) }
}

/** Een meting uit een JSON-body (de app op de telefoon), of null. De bron wordt opgelegd, nooit gelezen. */
export function leesMeting(v: unknown, bron: BronId): Meting | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null
  const r = v as Record<string, unknown>
  if (!isDataSoort(r.soort) || typeof r.externId !== 'string' || typeof r.gemetenOp !== 'string') return null
  const training = r.soort === 'training' ? leesTraining(r.training) : null
  const waarde = r.soort === 'training' ? (training ? training.duurSec / 60 : null) : getal(r.waarde)
  if (waarde === null) return null
  return { soort: r.soort, waarde, training, bron, externId: r.externId, gemetenOp: r.gemetenOp }
}

export const MAX_NATIVE_METINGEN = 2000

/** De body van POST /api/club/lid/health/native. */
export function leesNativeBody(body: unknown): { ok: true; bron: 'apple_health' | 'health_connect'; metingen: Meting[] } | { ok: false; fout: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, fout: 'Ongeldig verzoek.' }
  const r = body as Record<string, unknown>
  if (!isBronId(r.bron) || (r.bron !== 'apple_health' && r.bron !== 'health_connect')) return { ok: false, fout: 'Onbekende bron.' }
  const bron = r.bron
  if (!Array.isArray(r.metingen) || r.metingen.length > MAX_NATIVE_METINGEN) return { ok: false, fout: 'Te veel of geen metingen.' }
  const metingen = r.metingen.map((m) => leesMeting(m, bron)).filter((m): m is Meting => m !== null)
  return { ok: true, bron, metingen }
}

/** De laatste meting per soort (voor het overzicht), in de vaste volgorde. */
export function laatstePerSoort(lijst: readonly Meting[]): Meting[] {
  const per = new Map<DataSoort, Meting>()
  for (const m of lijst) {
    const huidig = per.get(m.soort)
    if (!huidig || Date.parse(m.gemetenOp) > Date.parse(huidig.gemetenOp)) per.set(m.soort, m)
  }
  return DATA_SOORTEN.filter((s) => per.has(s)).map((s) => per.get(s) as Meting)
}

/** De waarde als korte tekst met eenheid, bijvoorbeeld "82,4 kg". */
export function waardeTekst(m: Pick<Meting, 'soort' | 'waarde' | 'training'>, taal: Taal = 'nl'): string {
  const nl = new Intl.NumberFormat(LOCALE[taal], { maximumFractionDigits: 1 })
  const e = HEALTH[taal].eenheid
  switch (m.soort) {
    case 'gewicht_kg':
    case 'spiermassa_kg':
      return `${nl.format(m.waarde)} kg`
    case 'vetpercentage':
      return `${nl.format(m.waarde)}%`
    case 'stappen':
      return `${nl.format(m.waarde)} ${e.stappen}`
    case 'slaap_minuten':
      return `${Math.floor(m.waarde / 60)} ${e.uur} ${m.waarde % 60} min`
    case 'rusthartslag':
      return `${nl.format(m.waarde)} bpm`
    case 'hrv_ms':
      return `${nl.format(m.waarde)} ms`
    case 'vo2max':
      return `${nl.format(m.waarde)} ml/kg/min`
    case 'training':
      return m.training ? `${m.training.soort}, ${nl.format(m.waarde)} min` : `${nl.format(m.waarde)} min`
  }
}
