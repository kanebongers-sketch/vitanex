// ─── Club startwizard: "Klaar voor je eerste dag" (PUUR) ────────────────────
// Na de laatste stap een korte checklist met wat er op de eerste dag moet
// kloppen. Wat in de wizard zit, wijst naar die stap (nooit naar een andere
// pagina: alles stel je in de wizard in). Wat pas na afronden kan (check-in,
// de ledenapp bekijken, sluitingsdagen) krijgt een link zodra je hebt
// afgerond. Onderdelen die uit staan komen niet in de lijst. Een punt van een
// wizardstap staat er precies als die stap af is (stapAf), dus de lijst en de
// stand bovenaan zeggen altijd hetzelfde.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Module } from '@/lib/club/kern/organisatie'
import { stapAf, startPad, stapNummer, type StapSleutel, type StartFeiten, type StartVoortgang } from './stappen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

// De Nederlandse teksten komen uit het woordenboek (bron); eersteDag() en liveActies() geven ze in de gekozen taal.
const ED = START_LIB.nl.eersteDag
const LV = START_LIB.nl.live

export interface EersteDagPunt {
  id: string
  titel: string
  uitleg: string
  /** Waar je het doet, of null als het pas na afronden kan. */
  pad: string | null
  /** true = staat er al, false = nog doen, null = niet af te lezen (gewoon even nalopen). */
  af: boolean | null
}

interface Punt extends Omit<EersteDagPunt, 'pad' | 'af' | 'id'> {
  id: keyof typeof ED
  /** De wizardstap waar je het instelt (af = die stap is af). */
  stap?: Exclude<StapSleutel, 'klaar'>
  /** Of: de pagina die na afronden open gaat (niet af te lezen). */
  pagina?: string
  module?: Module
}

const PUNTEN: readonly Punt[] = [
  { id: 'huisstijl', ...ED.huisstijl, stap: 'huisstijl' },
  { id: 'tijden', ...ED.tijden, stap: 'vestigingen' },
  { id: 'rooster', ...ED.rooster, stap: 'lessen', module: 'rooster' },
  { id: 'team', ...ED.team, stap: 'team' },
  { id: 'leden', ...ED.leden, stap: 'leden', module: 'leden' },
  { id: 'checkin', ...ED.checkin, pagina: '/checkin', module: 'checkin' },
  { id: 'app', ...ED.app, pagina: '/app', module: 'app' },
  { id: 'sluiting', ...ED.sluiting, pagina: '/beheer/sluiting' },
]

function padVan(p: Punt, vestiging: Vestiging | null, afgerond: boolean): string | null {
  if (p.stap) return startPad(stapNummer(p.stap), vestiging)
  if (!p.pagina || !afgerond) return null
  return vestiging ? clubPad(p.pagina, vestiging) : `/club${p.pagina}`
}

/** De checklist voor de eerste dag, zonder onderdelen die uit staan. */
export function eersteDag(f: StartFeiten, vestiging: Vestiging | null, afgerond = false, v: StartVoortgang | null = null, taal: Taal = 'nl'): EersteDagPunt[] {
  return PUNTEN.filter((p) => !p.module || !f.uit.includes(p.module)).map((p) => ({
    id: p.id,
    titel: START_LIB[taal].eersteDag[p.id].titel,
    uitleg: START_LIB[taal].eersteDag[p.id].uitleg,
    pad: padVan(p, vestiging, afgerond),
    af: p.stap ? stapAf(p.stap, v, f) : null,
  }))
}

/** Hoeveel punten al af zijn, van de punten die af te lezen zijn. */
export function eersteDagStand(punten: readonly EersteDagPunt[]): { af: number; meetbaar: number } {
  const meetbaar = punten.filter((p) => p.af !== null)
  return { af: meetbaar.filter((p) => p.af === true).length, meetbaar: meetbaar.length }
}

// ── "Je bent live": de drie dingen voor dag 1 ─────────────────────────────
// Na afronden: poster met QR printen, leden uitnodigen voor de app en de
// check-in openen. Alleen links naar pagina's die echt bestaan, en alleen als
// de onderdelen aan staan die ze nodig hebben.

export interface LiveActie {
  id: 'poster' | 'uitnodigen' | 'checkin'
  titel: string
  uitleg: string
  /** Tekst op de knop. */
  knop: string
  pad: string
}

interface LiveBron extends Omit<LiveActie, 'pad'> {
  pad: string
  nodig: readonly Module[]
}

const LIVE: readonly LiveBron[] = [
  {
    id: 'poster',
    ...LV.poster,
    pad: '/leden/app-poster',
    nodig: ['leden', 'app'],
  },
  {
    id: 'uitnodigen',
    ...LV.uitnodigen,
    pad: '/leden',
    nodig: ['leden', 'app'],
  },
  {
    id: 'checkin',
    ...LV.checkin,
    pad: '/checkin',
    nodig: ['checkin'],
  },
]

/** De acties voor dag 1, zonder wat niet kan omdat een onderdeel uit staat. */
export function liveActies(uit: readonly string[], vestiging: Vestiging | null, taal: Taal = 'nl'): LiveActie[] {
  return LIVE.filter((a) => a.nodig.every((m) => !uit.includes(m))).map((a) => ({
    id: a.id,
    ...START_LIB[taal].live[a.id],
    pad: vestiging ? clubPad(a.pad, vestiging) : `/club${a.pad}`,
  }))
}
