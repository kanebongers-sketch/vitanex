// ─── Club: Hulp rechtsboven in de kop (PUUR) ────────────────────────────────
// Ontwerp "Club in 10 minuten" (docs/club/EENVOUD-10-MINUTEN.md): de hulpbalk
// onderaan is weg, een navigatie in plaats van twee. Instellingen staat nu in
// Beheer, de Ledenapp in Leden en Koppelingen in het instellingencentrum. Hulp
// en Wat is nieuw zitten achter het vraagteken rechtsboven, op elk scherm een
// tik weg; de teller van Wat is nieuw staat op het vraagteken. Wat is nieuw zijn
// updates van AI Your Gym over het product, niet de mededelingen van je eigen
// club (die staan op het Prikbord).

import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

const H = MENU.nl.hulpbalk

export type KopHulpSleutel = 'hulp' | 'nieuw'

export interface KopHulpItem {
  sleutel: KopHulpSleutel
  label: string
  uitleg: string
  /** Pad binnen /club. */
  pad: string
  /** Extra woorden voor het zoekveld. */
  trefwoorden: string
  /** Sneltoets op de pc (G en dan deze letter). */
  toets?: string
}

/** Iedereen die in Club binnen is, ziet beide. */
export const KOP_HULP: readonly KopHulpItem[] = [
  { sleutel: 'hulp', label: H.hulp.label, uitleg: H.hulp.uitleg, pad: '/hulp', trefwoorden: 'support handleiding vraag probleem melden vraagteken', toets: 'h' },
  { sleutel: 'nieuw', label: H.nieuw.label, uitleg: H.nieuw.uitleg, pad: '/nieuw', trefwoorden: 'updates nieuws veranderingen' },
]

/** Een item met naam en uitleg in de gekozen taal. */
export function kopHulpInTaal(i: KopHulpItem, taal: Taal): KopHulpItem {
  const t = MENU[taal].hulpbalk[i.sleutel]
  return { ...i, label: t.label, uitleg: t.uitleg }
}

function onder(pad: string, basis: string): boolean {
  return pad === basis || pad.startsWith(`${basis}/`)
}

/** Ben je op Hulp of Wat is nieuw? Dan licht het vraagteken op en geen plek. */
export function kopHulpOp(pad: string): KopHulpSleutel | null {
  if (onder(pad, '/club/nieuw')) return 'nieuw'
  if (onder(pad, '/club/hulp')) return 'hulp'
  return null
}

/** Een link binnen Club, met de gekozen vestiging erbij (zonder vestiging zonder ?v=). */
export function clubHref(pad: string, vestiging: string | null): string {
  const [voor, anker] = pad.split('#')
  const basis = `/club${voor}`
  const staart = anker ? `#${anker}` : ''
  if (!vestiging) return `${basis}${staart}`
  const scheiding = basis.includes('?') ? '&' : '?'
  return `${basis}${scheiding}${VESTIGING_PARAM}=${encodeURIComponent(vestiging)}${staart}`
}

/** Wie er kijkt, voor wat hij al zag bij Wat is nieuw: per sportschool en per persoon. */
export function kijkerSleutel(t: { userId: string; persoonId: string | null; beheerderId: string }): string {
  return `${t.userId}:${t.persoonId ?? t.beheerderId}`
}

/** De letters van een naam voor het rondje in de kop ("Kane Bongers" wordt "KB"). */
export function initialen(naam: string): string {
  const delen = naam.trim().split(/\s+/).filter(Boolean)
  if (delen.length === 0) return '?'
  const eerste = delen[0][0] ?? ''
  const laatste = delen.length > 1 ? (delen[delen.length - 1][0] ?? '') : ''
  return `${eerste}${laatste}`.toUpperCase()
}
