// ─── Club startwizard: "Klaar voor je eerste dag" (PUUR) ────────────────────
// Na de laatste stap een korte checklist met wat er op de eerste dag moet
// kloppen, elk met een link naar de plek waar je het doet. Wat we uit de data
// kunnen aflezen staat meteen op af; de rest is een gewone actie. Onderdelen
// die uit staan komen niet in de lijst.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Module } from '@/lib/club/kern/organisatie'
import type { StartFeiten } from './stappen'

export interface EersteDagPunt {
  id: string
  titel: string
  uitleg: string
  pad: string
  /** true = staat er al, false = nog doen, null = niet af te lezen (gewoon even nalopen). */
  af: boolean | null
}

interface Punt extends Omit<EersteDagPunt, 'pad' | 'af'> {
  pad: string
  module?: Module
  af: (f: StartFeiten) => boolean | null
}

const PUNTEN: readonly Punt[] = [
  { id: 'huisstijl', titel: 'Logo en kleur', uitleg: 'Je leden zien je eigen merk in de app en in hun mails.', pad: '/huisstijl', af: (f) => f.heeftLogo },
  { id: 'tijden', titel: 'Openingstijden', uitleg: 'Leden en de check-in weten wanneer je open bent.', pad: '/instellingen/regels', af: (f) => f.vestigingenIngericht > 0 },
  { id: 'rooster', titel: 'Vaste lessen', uitleg: 'Je vaste lessen per week. Zet ze in het rooster, dan kunnen leden reserveren.', pad: '/instellingen/weekrooster', module: 'rooster', af: (f) => f.vasteLessen > 0 },
  { id: 'team', titel: 'Je team', uitleg: 'Staat je team erin? Open een medewerker en kies Uitnodigen. Ieder kiest zelf een wachtwoord en logt in met het eigen e-mailadres.', pad: '/instellingen/medewerkers', af: (f) => f.medewerkers > 0 },
  { id: 'leden', titel: 'Ledenbestand', uitleg: 'Lees je leden in, dan vindt de balie iedereen op naam.', pad: '/leden/importeren', module: 'leden', af: (f) => f.leden > 0 },
  { id: 'checkin', titel: 'Check-in aan de balie', uitleg: 'Open de check-in op de tablet of pc bij de ingang en scan een QR-code.', pad: '/checkin', module: 'checkin', af: () => null },
  { id: 'app', titel: 'Ledenapp bekijken', uitleg: 'Zie de app zoals een lid hem op de telefoon ziet.', pad: '/app', module: 'app', af: () => null },
  { id: 'sluiting', titel: 'Feestdagen en sluiting', uitleg: 'Zet de dagen dat je dicht bent erin; het rooster houdt er rekening mee.', pad: '/beheer/sluiting', af: () => null },
]

/** De checklist voor de eerste dag, zonder onderdelen die uit staan. */
export function eersteDag(f: StartFeiten, vestiging: Vestiging | null): EersteDagPunt[] {
  return PUNTEN.filter((p) => !p.module || !f.uit.includes(p.module)).map((p) => ({
    id: p.id,
    titel: p.titel,
    uitleg: p.uitleg,
    pad: vestiging ? clubPad(p.pad, vestiging) : `/club${p.pad}`,
    af: p.af(f),
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
    titel: 'Poster met QR-code',
    uitleg: 'Een A4 voor de balie of de muur, in je eigen kleur en met je logo. Leden scannen de code, vullen hun e-mailadres in en kiezen een wachtwoord.',
    knop: 'Poster printen',
    pad: '/leden/app-poster',
    nodig: ['leden', 'app'],
  },
  {
    id: 'uitnodigen',
    titel: 'Leden uitnodigen voor de app',
    uitleg: 'Bij Leden kies je Leden uitnodigen voor de app. Je ziet eerst hoeveel mails er gaan; pas na bevestigen worden ze verstuurd.',
    knop: 'Naar Leden',
    pad: '/leden',
    nodig: ['leden', 'app'],
  },
  {
    id: 'checkin',
    titel: 'Check-in openen',
    uitleg: 'Open de check-in op de tablet of pc bij de ingang. Leden checken in met de QR-code uit hun app.',
    knop: 'Check-in openen',
    pad: '/checkin',
    nodig: ['checkin'],
  },
]

/** De acties voor dag 1, zonder wat niet kan omdat een onderdeel uit staat. */
export function liveActies(uit: readonly string[], vestiging: Vestiging | null): LiveActie[] {
  return LIVE.filter((a) => a.nodig.every((m) => !uit.includes(m))).map((a) => ({
    id: a.id,
    titel: a.titel,
    uitleg: a.uitleg,
    knop: a.knop,
    pad: vestiging ? clubPad(a.pad, vestiging) : `/club${a.pad}`,
  }))
}
