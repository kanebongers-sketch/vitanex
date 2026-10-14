// ─── Fit Factory Club: wie werkt er en hoe staan de taken (PUUR) ────────────
// Voor Vandaag: de diensten van vandaag (wie staat er nu, wie komt nog) en de
// stand van de dagtaken en de afsluitronde. Alleen lezen en tellen; de regels
// voor welke taak vandaag hoort, komen uit src/lib/club/taken/voortgang.ts.

import type { Dienst, Kleur, PersoneelLid } from '@/lib/club/personeel/typen'
import type { Afsluitronde } from '@/lib/club/taken/typen'
import type { VandaagTaak } from '@/lib/club/taken/voortgang'

export type DienstFase = 'nu' | 'straks' | 'geweest'

export interface DienstVandaag {
  id: string
  /** Null bij een open dienst (nog niemand ingepland). */
  naam: string | null
  kleur: Kleur | null
  begin: string
  eind: string
  fase: DienstFase
}

const FASE_VOLGORDE: Record<DienstFase, number> = { nu: 0, straks: 1, geweest: 2 }

/** "HH:MM"; een eindtijd van 00:00 (of voor het begin) loopt door tot middernacht. */
function eindVan(d: Pick<Dienst, 'begin' | 'eind'>): string {
  return d.eind <= d.begin ? '24:00' : d.eind
}

export function dienstFase(d: Pick<Dienst, 'begin' | 'eind'>, nuTijd: string): DienstFase {
  if (nuTijd < d.begin) return 'straks'
  return nuTijd < eindVan(d) ? 'nu' : 'geweest'
}

/**
 * De werkdiensten van vandaag, wie nu staat eerst, dan wie nog komt, dan wie
 * er al geweest is. Ziekmeldingen, verlof en ziekte-uren tellen niet.
 */
export function dienstenVandaag(diensten: readonly Dienst[], team: readonly PersoneelLid[], vandaag: string, nuTijd: string): DienstVandaag[] {
  const perId = new Map(team.map((m) => [m.id, m]))
  return diensten
    .filter((d) => d.datum === vandaag && d.status !== 'ziek' && d.uursoort === 'werk')
    .map((d) => {
      const m = d.medewerkerId ? perId.get(d.medewerkerId) : undefined
      const naam = d.medewerkerId ? (m?.naam ?? 'Onbekende medewerker') : null
      return { id: d.id, naam, kleur: m?.kleur ?? null, begin: d.begin, eind: d.eind, fase: dienstFase(d, nuTijd) }
    })
    .sort((a, b) => FASE_VOLGORDE[a.fase] - FASE_VOLGORDE[b.fase] || a.begin.localeCompare(b.begin) || (a.naam ?? '').localeCompare(b.naam ?? ''))
}

export interface TakenStand {
  /** Taken die vandaag moeten (dagtaken en weektaken die nog nodig zijn). */
  verplicht: number
  gedaan: number
  /** Taken met moment afsluiten. */
  afsluiten: number
  afsluitenGedaan: number
  /** De eerste open verplichte taken, op volgorde. */
  open: string[]
  afsluitronde: Afsluitronde | null
}

export function takenStand(items: readonly VandaagTaak[], rondes: readonly Afsluitronde[], vandaag: string, toonOpen = 3): TakenStand {
  const verplicht = items.filter((i) => i.soort === 'verplicht')
  const afsluiten = verplicht.filter((i) => i.taak.moment === 'afsluiten')
  return {
    verplicht: verplicht.length,
    gedaan: verplicht.filter((i) => i.afgevinkt).length,
    afsluiten: afsluiten.length,
    afsluitenGedaan: afsluiten.filter((i) => i.afgevinkt).length,
    open: verplicht.filter((i) => !i.afgevinkt).slice(0, toonOpen).map((i) => i.taak.naam),
    afsluitronde: rondes.filter((r) => r.datum === vandaag).sort((a, b) => b.op.localeCompare(a.op))[0] ?? null,
  }
}
