// ─── Club, community: de ranglijst van een groep (PUUR) ─────────────────────
// Uit bestaande data: bezoekdagen deze kalendermaand, of de score in de
// gekoppelde challenge. Alleen leden die er zelf voor kozen staan erop, met de
// privacynaam. Het lid zelf ziet altijd de eigen score; staat het lid er niet
// op, dan staat die rij los onder de lijst ("alleen jij ziet dit").

import { privacyNaam } from '@/lib/club/challenges/voortgang'
import { nlDatum } from '@/lib/club/challenges/periode'

export interface GroepDeelnemer {
  lidId: string
  voornaam: string
  achternaam: string
}

export interface RangRij {
  positie: number
  naam: string
  score: number
  ik: boolean
}

export interface GroepRanglijst {
  rijen: RangRij[]
  /** De eigen rij als het lid niet op de ranglijst staat (alleen voor het lid zelf). */
  eigenLos: { score: number } | null
  /** Hoeveel groepsleden er niet op staan (geen namen). */
  verborgen: number
}

/** Zoveel plekken toont de app. */
export const RANG_TOP = 10

/** Zoveel lid-id's per verzoek, zodat de URL kort genoeg blijft (zoals haal-risico.ts). */
export const BLOK_IDS = 150

/** Knip een lijst in blokken van hoogstens `grootte`. */
export function inBlokken<T>(lijst: readonly T[], grootte = BLOK_IDS): T[][] {
  if (grootte < 1) return [[...lijst]]
  const uit: T[][] = []
  for (let i = 0; i < lijst.length; i += grootte) uit.push(lijst.slice(i, i + grootte))
  return uit
}

/** Bezoekdagen per lid in een maand (yyyy-mm, Nederlandse tijd): een dag met een check-in telt een keer. */
export function bezoekdagenInMaand(rijen: readonly { lidId: string; op: string }[], maand: string): Map<string, number> {
  const dagen = new Map<string, Set<string>>()
  for (const r of rijen) {
    const dag = nlDatum(r.op)
    if (!dag.startsWith(maand)) continue
    const set = dagen.get(r.lidId) ?? new Set<string>()
    set.add(dag)
    dagen.set(r.lidId, set)
  }
  return new Map([...dagen].map(([lid, set]) => [lid, set.size]))
}

/** Het venster (ISO) rond een kalendermaand, ruim genoeg voor de tijdzone. */
export function maandVenster(maand: string): { van: string; tot: string } {
  const [j, m] = maand.split('-').map(Number)
  return { van: new Date(Date.UTC(j, m - 1, 1) - 86_400_000).toISOString(), tot: new Date(Date.UTC(j, m, 1) + 86_400_000).toISOString() }
}

/** De ranglijst: hoogste score eerst, gelijke score gelijke plek, bij gelijke score op naam. */
export function groepRanglijst(deelnemers: readonly GroepDeelnemer[], scores: ReadonlyMap<string, number>, opLijst: ReadonlySet<string>, lidId: string, top = RANG_TOP): GroepRanglijst {
  const zichtbaar = deelnemers
    .filter((d) => opLijst.has(d.lidId))
    .map((d) => ({ d, naam: privacyNaam(d.voornaam, d.achternaam), score: scores.get(d.lidId) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.naam.localeCompare(b.naam, 'nl'))
  const eersteVan = new Map<number, number>()
  zichtbaar.forEach((r, i) => {
    if (!eersteVan.has(r.score)) eersteVan.set(r.score, i + 1)
  })
  const alle = zichtbaar.map((r) => ({ positie: eersteVan.get(r.score) ?? 1, naam: r.naam, score: r.score, ik: r.d.lidId === lidId }))
  const eigen = alle.find((r) => r.ik)
  const rijen = alle.slice(0, top)
  const metEigen = eigen && !rijen.includes(eigen) ? [...rijen, eigen] : rijen
  const zelfInGroep = deelnemers.some((d) => d.lidId === lidId)
  return {
    rijen: metEigen,
    eigenLos: zelfInGroep && !opLijst.has(lidId) ? { score: scores.get(lidId) ?? 0 } : null,
    verborgen: deelnemers.filter((d) => !opLijst.has(d.lidId)).length,
  }
}
