// ─── Club: de hulpbalk onderaan (PUUR) ──────────────────────────────────────
// Idee Kane (23-10-2026), op onze eigen manier: onderaan elke pagina van Club
// een rustige balk met wat je niet elke dag nodig hebt, maar wel snel wilt
// vinden. Op de pc een balk over de volle breedte, op de telefoon onderaan in
// het menupaneel (Meer). Instellingen en Hulp staan daardoor niet meer onder
// Beheer: elk ding een plek. Alles volgt de rechten van de persoon.

import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import { zichtbareKoppelingen } from '@/lib/club/kern/koppelingen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { ONDERDELEN, actiefOnderdeel, isActief, isZichtbaar, toetsTekst } from './onderdelen'

// De Nederlandse namen komen uit het woordenboek (bron); in beeld via hulpItems(sleutels, taal).
const H = MENU.nl.hulpbalk

export type HulpSleutel = 'instellingen' | 'koppelingen' | 'ledenapp' | 'nieuw' | 'hulp'

export interface HulpItem {
  sleutel: HulpSleutel
  label: string
  uitleg: string
  /** Pad binnen /club. */
  pad: string
  /** Extra woorden voor het zoekveld. */
  trefwoorden: string
  /** Het onderdeel (rechten, sneltoets) erachter, als dat er is. */
  onderdeel?: string
}

export const HULPBALK: readonly HulpItem[] = [
  { sleutel: 'instellingen', label: H.instellingen.label, uitleg: H.instellingen.uitleg, pad: '/beheer', trefwoorden: 'instellingencentrum beheer', onderdeel: 'beheer' },
  { sleutel: 'koppelingen', label: H.koppelingen.label, uitleg: H.koppelingen.uitleg, pad: '/koppelingen', trefwoorden: 'integraties stripe widget export csv mail' },
  { sleutel: 'ledenapp', label: H.ledenapp.label, uitleg: H.ledenapp.uitleg, pad: '/app', trefwoorden: 'bekijken voorvertoning voorbeeld telefoon poster qr uitnodigen', onderdeel: 'app' },
  { sleutel: 'nieuw', label: H.nieuw.label, uitleg: H.nieuw.uitleg, pad: '/nieuw', trefwoorden: 'updates nieuws veranderingen' },
  { sleutel: 'hulp', label: H.hulp.label, uitleg: H.hulp.uitleg, pad: '/hulp', trefwoorden: 'support handleiding vraag probleem melden', onderdeel: 'hulp' },
]

const LEDENAPP = ONDERDELEN.find((o) => o.sleutel === 'app')

/**
 * Wat deze persoon in de hulpbalk ziet. Instellingen alleen met iets om in te
 * stellen (`instellingen`, zie heeftInstellingen), Koppelingen alleen met
 * minstens een koppeling die hij mag zien, de Ledenapp met het recht en het
 * onderdeel aan. Wat is nieuw en Hulp heeft iedereen.
 */
export function hulpbalkVoor(k: InstelKijker, instellingen: boolean): HulpSleutel[] {
  const mag: Record<HulpSleutel, boolean> = {
    instellingen,
    koppelingen: zichtbareKoppelingen(k).length > 0,
    ledenapp: LEDENAPP ? isZichtbaar(LEDENAPP, k.uit, k.toegestaan) : false,
    nieuw: true,
    hulp: true,
  }
  return HULPBALK.filter((i) => mag[i.sleutel]).map((i) => i.sleutel)
}

/** Een item met naam en uitleg in de gekozen taal. */
export function hulpItemInTaal(i: HulpItem, taal: Taal): HulpItem {
  const t = MENU[taal].hulpbalk[i.sleutel]
  return { ...i, label: t.label, uitleg: t.uitleg }
}

/** De items in vaste volgorde, alleen de sleutels die iemand heeft, in de gekozen taal. */
export function hulpItems(sleutels: readonly HulpSleutel[], taal: Taal = 'nl'): HulpItem[] {
  return HULPBALK.filter((i) => sleutels.includes(i.sleutel)).map((i) => hulpItemInTaal(i, taal))
}

function onder(pad: string, basis: string): boolean {
  return pad === basis || pad.startsWith(`${basis}/`)
}

/** Het item in de hulpbalk waar je nu bent, of null. Elke instel-pagina valt onder Instellingen. */
export function hulpItemOp(pad: string): HulpSleutel | null {
  if (onder(pad, '/club/koppelingen')) return 'koppelingen'
  if (onder(pad, '/club/nieuw')) return 'nieuw'
  const o = actiefOnderdeel(pad)
  if (!isActief(o, pad)) return null
  if (o.sleutel === 'hulp') return 'hulp'
  if (o.sleutel === 'app') return 'ledenapp'
  if (o.sleutel === 'beheer' || o.inMenu === false) return 'instellingen'
  return null
}

/** De sneltoets van een item als tekst ("G I"), via zijn onderdeel. */
export function hulpToets(item: HulpItem): string | null {
  const o = item.onderdeel ? ONDERDELEN.find((x) => x.sleutel === item.onderdeel) : undefined
  return o ? toetsTekst(o) : null
}

/** Een link binnen Club, met de gekozen vestiging erbij (zonder vestiging zonder ?v=). */
export function clubHref(pad: string, vestiging: string | null): string {
  const [voor, anker] = pad.split('#')
  const basis = `/club${voor}`
  const staart = anker ? `#${anker}` : ''
  return vestiging ? `${basis}?${VESTIGING_PARAM}=${encodeURIComponent(vestiging)}${staart}` : `${basis}${staart}`
}

/** Wie er kijkt, voor wat hij al zag bij Wat is nieuw: per sportschool en per persoon. */
export function kijkerSleutel(t: { userId: string; persoonId: string | null; beheerderId: string }): string {
  return `${t.userId}:${t.persoonId ?? t.beheerderId}`
}
