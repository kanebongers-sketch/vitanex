// ─── Fit Factory Club, personeel: controle van een week en van een dienst (PUUR)
// Bundelt de regels tot leesbare meldingen voor de pagina en het zijpaneel.

import { isoWeekdag, minutenNaarTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { beschikbaarheidVoor, gaten, vindOverlap, vindRustTekort, type BeschikbaarUitkomst, type Blok } from './regels'
import type { Beschikbaarheid, PersoneelLid } from './typen'

export type MeldingSoort = 'overlap' | 'rust' | 'beschikbaar' | 'gat' | 'open'

export interface Melding {
  soort: MeldingSoort
  datum: string
  tekst: string
  dienstId: string | null
}

function naamVan(leden: readonly PersoneelLid[], id: string | null): string {
  return leden.find((l) => l.id === id)?.naam ?? 'Onbekend'
}

function uren(min: number): string {
  const u = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${u} uur` : `${u}:${String(m).padStart(2, '0')} uur`
}

export interface WeekInvoer {
  dagen: readonly string[]
  diensten: readonly Blok[]
  /** Diensten van de dag voor en na de week, alleen voor de rustregel. */
  randDiensten: readonly Blok[]
  beschikbaarheid: readonly Beschikbaarheid[]
  bemand: Openingstijden
  leden: readonly PersoneelLid[]
  minRustUren: number
}

/** Alle meldingen van een week, gesorteerd op datum. */
export function controleerWeek(w: WeekInvoer): Melding[] {
  const uit: Melding[] = []
  const byId = new Map(w.diensten.map((d) => [d.id, d]))
  for (const o of vindOverlap(w.diensten)) {
    const d = byId.get(o.a)
    if (d) uit.push({ soort: 'overlap', datum: d.datum, tekst: `${naamVan(w.leden, o.medewerkerId)} staat dubbel ingepland`, dienstId: o.a })
  }
  for (const r of vindRustTekort([...w.randDiensten, ...w.diensten], w.minRustUren)) {
    const d = byId.get(r.tweede)
    if (d) uit.push({ soort: 'rust', datum: d.datum, tekst: `${naamVan(w.leden, r.medewerkerId)} heeft maar ${uren(r.rustMin)} rust`, dienstId: d.id })
  }
  for (const d of w.diensten) {
    if (d.medewerkerId === null) {
      uit.push({ soort: 'open', datum: d.datum, tekst: `Open dienst ${d.begin} tot ${d.eind}`, dienstId: d.id })
      continue
    }
    if (d.uursoort !== 'werk') continue
    const b = beschikbaarheidVoor(d.medewerkerId, d.datum, d.begin, d.eind, w.beschikbaarheid)
    if (b.status === 'nee' || b.status === 'deels') uit.push({ soort: 'beschikbaar', datum: d.datum, tekst: `${naamVan(w.leden, d.medewerkerId)}: ${b.tekst}`, dienstId: d.id })
  }
  for (const datum of w.dagen) {
    const bemand = w.bemand[isoWeekdag(datum) - 1]
    if (!bemand) continue
    const vandaag = w.diensten.filter((d) => d.datum === datum)
    for (const g of gaten(vandaag, tijdNaarMinuten(bemand.van), tijdNaarMinuten(bemand.tot))) {
      uit.push({ soort: 'gat', datum, tekst: `Niemand van ${minutenNaarTijd(g.van)} tot ${minutenNaarTijd(g.tot)}`, dienstId: null })
    }
  }
  return uit.sort((a, b) => a.datum.localeCompare(b.datum))
}

export interface Kandidaat {
  lid: PersoneelLid
  beschikbaar: BeschikbaarUitkomst
  /** Al ingepland op een tijd die overlapt. */
  overlapt: boolean
  /** Te weinig rust met een dienst ervoor of erna. */
  rustTekort: boolean
  /** Kort: "Al ingepland", "Verlof" of null als alles goed is. */
  waarschuwing: string | null
}

/**
 * Wie kan deze dienst draaien? Beschikbaar en vrij bovenaan, daarna wie
 * onbekend is, en onderaan wie niet kan (met de reden als waarschuwing).
 */
export function kandidaten(
  dienst: Blok,
  leden: readonly PersoneelLid[],
  alle: readonly Blok[],
  beschikbaarheid: readonly Beschikbaarheid[],
  minRustUren: number,
): Kandidaat[] {
  const anderen = alle.filter((d) => d.id !== dienst.id)
  const lijst = leden.map((lid): Kandidaat => {
    const proef: Blok = { ...dienst, medewerkerId: lid.id, uursoort: 'werk' }
    const overlapt = vindOverlap([...anderen, proef]).some((o) => o.a === proef.id || o.b === proef.id)
    const rustTekort = vindRustTekort([...anderen, proef], minRustUren).some((r) => r.eerste === proef.id || r.tweede === proef.id)
    const b = beschikbaarheidVoor(lid.id, dienst.datum, dienst.begin, dienst.eind, beschikbaarheid)
    const waarschuwing = overlapt ? 'Al ingepland' : b.status === 'nee' ? b.tekst : rustTekort ? 'Te weinig rust' : b.status === 'deels' ? b.tekst : null
    return { lid, beschikbaar: b, overlapt, rustTekort, waarschuwing }
  })
  const rang = (k: Kandidaat) => (k.waarschuwing === null ? (k.beschikbaar.status === 'ja' ? 0 : 1) : k.overlapt || k.beschikbaar.status === 'nee' ? 3 : 2)
  return [...lijst].sort((a, b) => rang(a) - rang(b) || a.lid.naam.localeCompare(b.lid.naam))
}
