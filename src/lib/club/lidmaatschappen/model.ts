// ─── Club, lidmaatschappen: het model (PUUR) ────────────────────────────────
// Lidmaatschapsvormen (zoals ze in Sportivity heten) met hun toegangsregels, en
// labels: de nette lijst boven club_leden.tags. Geen prijzen of contracten:
// geld blijft in Sportivity (besluit Kane). Een lid hoort bij een vorm via
// club_leden.abonnement, op naam (zie vormSleutel).

import { normaliseerTijd } from '@/lib/club/rooster/tijd'
import { KLEUREN, KLEUR_LABEL, isKleur, type Kleur } from '@/lib/club/personeel/typen'

export { KLEUREN, KLEUR_LABEL, isKleur, type Kleur }

export const MAX_NAAM = 80
export const MAX_OMSCHRIJVING_VORM = 300
export const MAX_OMSCHRIJVING_LABEL = 200
export const MAX_LESSEN_PER_WEEK = 21

export interface Lidmaatschapsvorm {
  id: string
  naam: string
  omschrijving: string
  /** null = alle vestigingen van de sportschool. */
  vestigingen: string[] | null
  groepslessen: boolean
  /** null = geen maximum. */
  maxLessenPerWeek: number | null
  /** Daluren ("09:00" tot "16:00"); beide null = de hele dag. */
  dalVan: string | null
  dalTot: string | null
  /** In het weekend geldt het dalvenster niet. */
  dalWeekendVrij: boolean
  kleur: Kleur
  /** Uit = niet meer te koop; bestaande leden houden hun toegang. */
  actief: boolean
  demo: boolean
}

export interface Label {
  id: string
  naam: string
  omschrijving: string
  kleur: Kleur
  demo: boolean
}

export const VORM_KOLOMMEN =
  'id, naam, omschrijving, vestigingen, groepslessen, max_lessen_per_week, daluren_van, daluren_tot, daluren_weekend_vrij, kleur, actief, demo'
export const LABEL_KOLOMMEN = 'id, naam, omschrijving, kleur, demo'

function alsRij(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function tekstLijst(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  const lijst = v.filter((x): x is string => typeof x === 'string' && x !== '')
  return lijst.length > 0 ? lijst : null
}

/** Systeemgrens: een databaserij naar een vorm, of null als hij niet klopt. */
export function vormUitRij(ruw: unknown): Lidmaatschapsvorm | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string' || r.naam.trim() === '') return null
  const van = normaliseerTijd(r.daluren_van)
  const tot = normaliseerTijd(r.daluren_tot)
  const heeftDal = van !== null && tot !== null && van < tot
  const max = typeof r.max_lessen_per_week === 'number' && Number.isInteger(r.max_lessen_per_week) && r.max_lessen_per_week > 0 ? r.max_lessen_per_week : null
  return {
    id: r.id,
    naam: r.naam,
    omschrijving: typeof r.omschrijving === 'string' ? r.omschrijving : '',
    vestigingen: tekstLijst(r.vestigingen),
    groepslessen: r.groepslessen !== false,
    maxLessenPerWeek: max,
    dalVan: heeftDal ? van : null,
    dalTot: heeftDal ? tot : null,
    dalWeekendVrij: heeftDal && r.daluren_weekend_vrij === true,
    kleur: isKleur(r.kleur) ? r.kleur : 'amber',
    actief: r.actief !== false,
    demo: r.demo === true,
  }
}

export function labelUitRij(ruw: unknown): Label | null {
  const r = alsRij(ruw)
  if (!r || typeof r.id !== 'string' || typeof r.naam !== 'string' || r.naam === '') return null
  return {
    id: r.id,
    naam: r.naam,
    omschrijving: typeof r.omschrijving === 'string' ? r.omschrijving : '',
    kleur: isKleur(r.kleur) ? r.kleur : 'blauw',
    demo: r.demo === true,
  }
}

export function rijenNaar<T>(rijen: readonly unknown[] | null | undefined, naar: (r: unknown) => T | null): T[] {
  return (rijen ?? []).flatMap((r) => {
    const x = naar(r)
    return x ? [x] : []
  })
}

/** "  All-in  12 Maanden " en "all-in 12 maanden" zijn dezelfde vorm. */
export function vormSleutel(naam: string): string {
  return naam.trim().replace(/\s+/g, ' ').toLocaleLowerCase('nl')
}

const NL = new Intl.Collator('nl', { sensitivity: 'base', numeric: true })

/** Actieve vormen eerst, dan op naam. */
export function sorteerVormen(lijst: readonly Lidmaatschapsvorm[]): Lidmaatschapsvorm[] {
  return [...lijst].sort((a, b) => (a.actief === b.actief ? NL.compare(a.naam, b.naam) : a.actief ? -1 : 1))
}

export function sorteerLabels(lijst: readonly Label[]): Label[] {
  return [...lijst].sort((a, b) => NL.compare(a.naam, b.naam))
}
