// ─── MentaForce /1 — invoer van buiten controleren (puur) ───────────────────
// Elke body die de /1-API binnenkomt is onbetrouwbaar. Hier wordt hij gelezen en
// gecontroleerd; de routes zelf casten niets.

import type { ActieSoort, Intensiteit } from './types'

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function schaal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null
}

export interface CheckInInvoer {
  stemming: number
  energie: number
  stress: number
}

/** Drie schuifjes, elk een geheel getal 1–5. */
export function leesCheckIn(body: unknown): Validatie<CheckInInvoer> {
  const o = obj(body)
  const stemming = schaal(o?.stemming)
  const energie = schaal(o?.energie)
  const stress = schaal(o?.stress)
  if (stemming === null || energie === null || stress === null) {
    return { ok: false, fout: 'Stemming, energie en stress moeten elk een getal van 1 tot en met 5 zijn.' }
  }
  return { ok: true, waarde: { stemming, energie, stress } }
}

export const ACTIES: readonly ActieSoort[] = ['training', 'rust', 'bewegen', 'ademhaling', 'bedtijd', 'pauze', 'minder', 'checkin', 'plan']
export type Keuze = 'oke' | 'later' | 'nee'
const KEUZES: readonly Keuze[] = ['oke', 'later', 'nee']
const TONEN = ['normaal', 'aanpassen', 'rustig', 'onbekend'] as const

export interface ActieInvoer {
  actie: ActieSoort
  keuze: Keuze
  toon: (typeof TONEN)[number] | null
}

export function leesActie(body: unknown): Validatie<ActieInvoer> {
  const o = obj(body)
  const actie = ACTIES.find((a) => a === o?.actie)
  const keuze = KEUZES.find((k) => k === o?.keuze)
  if (!actie || !keuze) return { ok: false, fout: 'Onbekende actie of keuze.' }
  const toon = TONEN.find((t) => t === o?.toon) ?? null
  return { ok: true, waarde: { actie, keuze, toon } }
}

export interface PlanRegel {
  weekdag: number
  soort: string
  intensiteit: Intensiteit
  tijd: string | null
}

const TIJD = /^([01]\d|2[0-3]):[0-5]\d$/

/** Een weekplan: hooguit één regel per weekdag (0 = zondag … 6 = zaterdag). */
export function leesPlan(body: unknown): Validatie<PlanRegel[]> {
  const lijst = obj(body)?.dagen
  if (!Array.isArray(lijst) || lijst.length > 7) return { ok: false, fout: 'Geef een lijst van hooguit 7 dagen.' }
  const gezien = new Set<number>()
  const uit: PlanRegel[] = []
  for (const ruw of lijst) {
    const r = obj(ruw)
    const weekdag = r?.weekdag
    if (typeof weekdag !== 'number' || !Number.isInteger(weekdag) || weekdag < 0 || weekdag > 6 || gezien.has(weekdag)) {
      return { ok: false, fout: 'Elke dag mag één keer voorkomen (0 = zondag … 6 = zaterdag).' }
    }
    const soort = typeof r?.soort === 'string' ? r.soort.trim() : ''
    if (soort.length < 1 || soort.length > 40) return { ok: false, fout: 'Geef elke training een naam (hooguit 40 tekens).' }
    const intensiteit: Intensiteit | null = r?.intensiteit === 'zwaar' || r?.intensiteit === 'licht' ? r.intensiteit : null
    if (!intensiteit) return { ok: false, fout: 'Intensiteit is zwaar of licht.' }
    const tijdRuw = r?.tijd
    if (tijdRuw !== null && tijdRuw !== undefined && (typeof tijdRuw !== 'string' || !TIJD.test(tijdRuw))) {
      return { ok: false, fout: 'Tijd is UU:MM, of leeg.' }
    }
    gezien.add(weekdag)
    uit.push({ weekdag, soort, intensiteit, tijd: typeof tijdRuw === 'string' ? tijdRuw : null })
  }
  return { ok: true, waarde: uit.sort((a, b) => a.weekdag - b.weekdag) }
}
