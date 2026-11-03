// ─── De oude hulpbalk (PUUR, alleen nog voor de websiteschermen) ────────────
// Club zelf heeft sinds "Club in 10 minuten" (docs/club/EENVOUD-10-MINUTEN.md)
// geen hulpbalk meer: Instellingen staat in Beheer, de Ledenapp in Leden,
// Koppelingen in het instellingencentrum, en Hulp en Wat is nieuw rechtsboven
// (kop-hulp.ts). Deze lijst bestaat alleen nog omdat de schermen op de website
// (src/components/aiyourgym/mockups) de oude balk tekenen; weg zodra die mee zijn.

import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

const H = MENU.nl.hulpbalk

export type HulpSleutel = 'instellingen' | 'koppelingen' | 'ledenapp' | 'nieuw' | 'hulp'

export interface HulpItem {
  sleutel: HulpSleutel
  label: string
  /** Pad binnen /club. */
  pad: string
}

export const HULPBALK: readonly HulpItem[] = [
  { sleutel: 'instellingen', label: H.instellingen.label, pad: '/beheer' },
  { sleutel: 'koppelingen', label: H.koppelingen.label, pad: '/koppelingen' },
  { sleutel: 'ledenapp', label: H.ledenapp.label, pad: '/app' },
  { sleutel: 'nieuw', label: H.nieuw.label, pad: '/nieuw' },
  { sleutel: 'hulp', label: H.hulp.label, pad: '/hulp' },
]
