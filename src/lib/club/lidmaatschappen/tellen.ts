// ─── Club, lidmaatschappen: tellen, overnemen en hernoemen (PUUR) ───────────
// Hoeveel leden een vorm of label hebben, welke abonnementsnamen en tags uit
// de ledenlijst nog geen vorm of label zijn, en wat een hernoeming met de tags
// van een lid doet (dezelfde regel als de databasefunctie club_label_hernoemen).

import { normaliseerTag } from '@/lib/club/leden/invoer'
import { vormSleutel, type Label, type Lidmaatschapsvorm } from './model'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

/** Het stukje van een lid dat hier telt. */
export interface LidKenmerken {
  abonnement: string | null
  tags: readonly string[]
}

export interface Telling {
  /** Per vormSleutel van de abonnementsnaam. */
  perAbonnement: ReadonlyMap<string, number>
  /** De abonnementsnaam zoals hij het vaakst voorkomt, per vormSleutel. */
  naamPerAbonnement: ReadonlyMap<string, string>
  perTag: ReadonlyMap<string, number>
  leden: number
}

function plus(kaart: Map<string, number>, sleutel: string): void {
  kaart.set(sleutel, (kaart.get(sleutel) ?? 0) + 1)
}

export function telLeden(leden: readonly LidKenmerken[]): Telling {
  const perAbonnement = new Map<string, number>()
  const perNaam = new Map<string, Map<string, number>>()
  const perTag = new Map<string, number>()
  for (const lid of leden) {
    const naam = lid.abonnement?.trim().replace(/\s+/g, ' ')
    if (naam) {
      const sleutel = vormSleutel(naam)
      plus(perAbonnement, sleutel)
      const namen = perNaam.get(sleutel) ?? new Map<string, number>()
      plus(namen, naam)
      perNaam.set(sleutel, namen)
    }
    for (const tag of new Set(lid.tags)) plus(perTag, tag)
  }
  const naamPerAbonnement = new Map<string, string>()
  for (const [sleutel, namen] of perNaam) {
    const [beste] = [...namen].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    naamPerAbonnement.set(sleutel, beste[0])
  }
  return { perAbonnement, naamPerAbonnement, perTag, leden: leden.length }
}

export function ledenMetVorm(telling: Telling, vorm: Pick<Lidmaatschapsvorm, 'naam'>): number {
  return telling.perAbonnement.get(vormSleutel(vorm.naam)) ?? 0
}

export function ledenMetLabel(telling: Telling, label: Pick<Label, 'naam'>): number {
  return telling.perTag.get(label.naam) ?? 0
}

export interface Los {
  naam: string
  leden: number
}

const NL = new Intl.Collator('nl', { sensitivity: 'base', numeric: true })

function opAantal(a: Los, b: Los): number {
  return b.leden - a.leden || NL.compare(a.naam, b.naam)
}

/** Abonnementsnamen uit de ledenlijst die nog geen vorm zijn (meeste leden eerst). */
export function losseAbonnementen(telling: Telling, vormen: readonly Pick<Lidmaatschapsvorm, 'naam'>[]): Los[] {
  const bekend = new Set(vormen.map((v) => vormSleutel(v.naam)))
  return [...telling.perAbonnement]
    .filter(([sleutel]) => !bekend.has(sleutel))
    .map(([sleutel, leden]) => ({ naam: telling.naamPerAbonnement.get(sleutel) ?? sleutel, leden }))
    .sort(opAantal)
}

/** Tags van leden die nog geen label zijn (meeste leden eerst). Ongeldige tags vallen af. */
export function losseTags(telling: Telling, labels: readonly Pick<Label, 'naam'>[]): Los[] {
  const bekend = new Set(labels.map((l) => l.naam))
  return [...telling.perTag]
    .filter(([tag]) => !bekend.has(tag) && normaliseerTag(tag) === tag)
    .map(([naam, leden]) => ({ naam, leden }))
    .sort(opAantal)
}

/** De tags van een lid na het hernoemen van een label: volgorde blijft, nooit dubbel. */
export function hernoemTag(tags: readonly string[], oud: string, nieuw: string): string[] {
  const uit: string[] = []
  for (const tag of tags) {
    const t = tag === oud ? nieuw : tag
    if (!uit.includes(t)) uit.push(t)
  }
  return uit
}

/** De tags van een lid zonder dit label. */
export function verwijderTag(tags: readonly string[], naam: string): string[] {
  return tags.filter((t) => t !== naam)
}

export function ledenTekst(n: number, taal: Taal = 'nl'): string {
  return LIDMAATSCHAPPEN[taal].algemeen.leden(n)
}
