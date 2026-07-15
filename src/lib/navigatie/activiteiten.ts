// ─── MentaForce — loggings-ingangen ─────────────────────────────────────────
// LET OP: dit is NIET het pijler-model. De canonieke 6 pijlers staan in
// `@/lib/pijlers/pijlers` en zijn de meeteenheid van de app.
//
// Dit bestand beschrijft de PAGINA'S waar je iets vastlegt. Een ingang is een
// handeling, geen pijler: mediteren is iets dat je dóét en dat je stress helpt —
// het is zelf geen vlak dat we meten. Daarom declareert elke ingang expliciet
// wélke canonieke pijler hij voedt. Zo kan er nooit meer een tweede,
// concurrerend zesje ontstaan (de week-strip toont uitsluitend `PIJLER_KEYS`).
//
// Kleur: geen. Strikt navy + cyan (ui.md) — de badge gebruikt `--brand`.
// Iconen: lucide-namen, nooit emoji (ui.md). Dit bestand blijft puur (geen
// React/lucide-import); de UI mapt de naam naar een component, zoals bij pijlers.

import type { PijlerKey } from '@/lib/pijlers/pijlers'

export type ActiviteitKey =
  | 'stemming'
  | 'sport'
  | 'water'
  | 'slaap'
  | 'meditatie'
  | 'dankbaarheid'

export interface ActiviteitDef {
  key: ActiviteitKey
  /** Weergavenaam (NL). */
  label: string
  /** Route van de loggings-pagina. Gelijk aan de key, zodat ze niet uiteenlopen. */
  href: string
  /** lucide-react icoonnaam (UI mapt naar component). */
  icoon: string
  /** De canonieke pijler die deze ingang voedt. */
  pijler: PijlerKey
  /** Eén-zins uitleg — wat je hier vastlegt. */
  beschrijving: string
}

export const ACTIVITEITEN: readonly ActiviteitDef[] = [
  {
    key: 'stemming',
    label: 'Stemming',
    href: '/stemming',
    icoon: 'Smile',
    pijler: 'stemming',
    beschrijving: 'Hoe je je voelt en hoeveel energie je hebt.',
  },
  {
    key: 'sport',
    label: 'Sport',
    href: '/sport',
    icoon: 'Dumbbell',
    pijler: 'beweging',
    beschrijving: 'Trainingen en fysieke inspanning.',
  },
  {
    key: 'water',
    label: 'Water',
    href: '/water',
    icoon: 'Droplet',
    pijler: 'voeding',
    beschrijving: 'Hydratatie door de dag heen.',
  },
  {
    key: 'slaap',
    label: 'Slaap',
    href: '/slaap',
    icoon: 'Moon',
    pijler: 'slaap',
    beschrijving: 'Slaapduur en hoe uitgerust je opstond.',
  },
  {
    key: 'meditatie',
    label: 'Meditatie',
    href: '/meditatie',
    icoon: 'Wind',
    pijler: 'stress',
    beschrijving: 'Ademhaling en momenten van rust.',
  },
  {
    key: 'dankbaarheid',
    label: 'Dankbaarheid',
    href: '/dankbaarheid',
    icoon: 'Heart',
    pijler: 'stemming',
    beschrijving: 'Positieve reflectie op je dag.',
  },
] as const

const ACTIVITEIT_MAP: Readonly<Record<ActiviteitKey, ActiviteitDef>> = Object.freeze(
  Object.fromEntries(ACTIVITEITEN.map((a) => [a.key, a])) as Record<ActiviteitKey, ActiviteitDef>,
)

/**
 * Definitie op key. Totaal over `ActiviteitKey`, dus geen non-null assertion en
 * geen `undefined`-tak: een onbekende key is een compile-fout, geen runtime-gok.
 */
export function getActiviteit(key: ActiviteitKey): ActiviteitDef {
  return ACTIVITEIT_MAP[key]
}
