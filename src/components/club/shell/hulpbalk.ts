// ─── Club: de hulpbalk onderaan (PUUR) ──────────────────────────────────────
// Idee Kane (23-10-2026), op onze eigen manier: onderaan elke pagina van Club
// een rustige balk met wat je niet elke dag nodig hebt, maar wel snel wilt
// vinden. Op de pc een balk over de volle breedte, op de telefoon onderaan in
// het menupaneel (Meer). Instellingen en Hulp staan daardoor niet meer onder
// Beheer: elk ding een plek. Alles volgt de rechten van de persoon.

import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { VESTIGING_PARAM } from '@/lib/club/kern/vestiging'
import { zichtbareKoppelingen } from '@/lib/club/kern/koppelingen'
import { ONDERDELEN, actiefOnderdeel, isActief, isZichtbaar, toetsTekst } from './onderdelen'

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
  { sleutel: 'instellingen', label: 'Instellingen', uitleg: 'Alles van je sportschool instellen, op een plek', pad: '/beheer', trefwoorden: 'instellingencentrum beheer', onderdeel: 'beheer' },
  { sleutel: 'koppelingen', label: 'Koppelingen', uitleg: 'Betalen, boekingswidget, ledenapp, mail en exports met hun stand', pad: '/koppelingen', trefwoorden: 'integraties stripe widget export csv mail' },
  { sleutel: 'ledenapp', label: 'Ledenapp', uitleg: 'Zo ziet een lid de app, met de poster en de uitnodiging', pad: '/app', trefwoorden: 'bekijken voorvertoning voorbeeld telefoon poster qr uitnodigen', onderdeel: 'app' },
  { sleutel: 'nieuw', label: 'Wat is nieuw', uitleg: 'Wat er per datum bij is gekomen in Club', pad: '/nieuw', trefwoorden: 'updates nieuws veranderingen' },
  { sleutel: 'hulp', label: 'Hulp', uitleg: 'Handleidingen en een vraag of probleem melden', pad: '/hulp', trefwoorden: 'support handleiding vraag probleem melden', onderdeel: 'hulp' },
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

/** De items in vaste volgorde, alleen de sleutels die iemand heeft. */
export function hulpItems(sleutels: readonly HulpSleutel[]): HulpItem[] {
  return HULPBALK.filter((i) => sleutels.includes(i.sleutel))
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
  const basis = `/club${pad}`
  return vestiging ? `${basis}?${VESTIGING_PARAM}=${encodeURIComponent(vestiging)}` : basis
}

/** Wie er kijkt, voor wat hij al zag bij Wat is nieuw: per sportschool en per persoon. */
export function kijkerSleutel(t: { userId: string; persoonId: string | null; beheerderId: string }): string {
  return `${t.userId}:${t.persoonId ?? t.beheerderId}`
}
