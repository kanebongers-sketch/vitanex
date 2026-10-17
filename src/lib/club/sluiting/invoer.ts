// ─── Club, sluitingsdagen: invoer controleren (PUUR) ────────────────────────
// Systeemgrens voor de API: alles wat binnenkomt is unknown tot het hier klopt.

import { hoortBij, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { isDatum, isTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { isFeestdagSleutel, MAX_JAAR, MIN_JAAR } from './feestdagen'
import { isSluitingSoort, MAX_REDEN, type SluitingSoort } from './model'
import type { FeestdagKeuze, NieuweSluiting } from './regels'

export type Gecontroleerd<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const mis = <T>(fout: string): Gecontroleerd<T> => ({ ok: false, fout })

function alsObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** null of '' = alle vestigingen; anders moet hij bij deze sportschool horen. */
function leesVestiging(v: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<string | null> {
  if (v === null || v === undefined || v === '') return { ok: true, waarde: null }
  return hoortBij(vestigingen, v) ? { ok: true, waarde: v } : mis('Onbekende vestiging.')
}

/** Soort plus tijden: bij 'afwijkend' moeten beide tijden kloppen en sluiten na openen. */
function leesTijden(soort: unknown, van: unknown, tot: unknown): Gecontroleerd<{ soort: SluitingSoort; van: string | null; tot: string | null }> {
  if (!isSluitingSoort(soort)) return mis('Kies gesloten of afwijkende tijden.')
  if (soort === 'gesloten') return { ok: true, waarde: { soort, van: null, tot: null } }
  if (!isTijd(van) || !isTijd(tot)) return mis('Vul een open- en sluittijd in.')
  if (tijdNaarMinuten(tot) <= tijdNaarMinuten(van)) return mis('Sluiten moet na openen.')
  return { ok: true, waarde: { soort, van: van.slice(0, 5), tot: tot.slice(0, 5) } }
}

function jaarVan(datum: string): number {
  return Number(datum.slice(0, 4))
}

/** Een sluitingsdag uit het formulier (nieuw of wijzigen). */
export function leesSluiting(ruw: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<NieuweSluiting> {
  const b = alsObject(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  if (!isDatum(b.datum) || jaarVan(b.datum) < MIN_JAAR || jaarVan(b.datum) > MAX_JAAR) return mis('Kies een geldige datum.')
  const vestiging = leesVestiging(b.vestiging, vestigingen)
  if (!vestiging.ok) return vestiging
  const tijden = leesTijden(b.soort, b.van, b.tot)
  if (!tijden.ok) return tijden
  const reden = typeof b.reden === 'string' ? b.reden.trim().replace(/\s+/g, ' ') : ''
  if (reden.length === 0) return mis('Vul een reden in, bijvoorbeeld "Tweede Kerstdag".')
  if (reden.length > MAX_REDEN) return mis(`De reden mag hoogstens ${MAX_REDEN} tekens zijn.`)
  return { ok: true, waarde: { datum: b.datum, vestiging: vestiging.waarde, ...tijden.waarde, reden } }
}

export interface FeestdagenInvoer {
  jaar: number
  vestiging: string | null
  keuzes: FeestdagKeuze[]
}

/** De knop "Nederlandse feestdagen toevoegen": jaar, voor welke vestiging(en) en per feestdag de keuze. */
export function leesFeestdagen(ruw: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<FeestdagenInvoer> {
  const b = alsObject(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  const jaar = b.jaar
  if (typeof jaar !== 'number' || !Number.isInteger(jaar) || jaar < MIN_JAAR || jaar > MAX_JAAR) return mis('Kies een geldig jaar.')
  const vestiging = leesVestiging(b.vestiging, vestigingen)
  if (!vestiging.ok) return vestiging
  if (!Array.isArray(b.keuzes) || b.keuzes.length === 0) return mis('Kies minstens een feestdag.')
  if (b.keuzes.length > 20) return mis('Te veel feestdagen in een keer.')
  const keuzes: FeestdagKeuze[] = []
  for (const k of b.keuzes) {
    const o = alsObject(k)
    if (!o || !isFeestdagSleutel(o.sleutel)) return mis('Onbekende feestdag.')
    const tijden = leesTijden(o.soort, o.van, o.tot)
    if (!tijden.ok) return tijden
    keuzes.push({ sleutel: o.sleutel, ...tijden.waarde })
  }
  return { ok: true, waarde: { jaar, vestiging: vestiging.waarde, keuzes } }
}

/** Het jaar uit de URL (?jaar=2027); ongeldig = het huidige jaar. */
export function jaarUitParam(ruw: string | string[] | undefined, huidig: number): number {
  const waarde = Number(Array.isArray(ruw) ? ruw[0] : ruw)
  return Number.isInteger(waarde) && waarde >= MIN_JAAR && waarde <= MAX_JAAR ? waarde : huidig
}
