// ─── Club startwizard: "Klaar voor je eerste dag" (PUUR) ────────────────────
// Na de laatste stap een korte checklist met wat er op de eerste dag moet
// kloppen. Wat in de wizard zit, wijst naar die stap (nooit naar een andere
// pagina: alles stel je in de wizard in). Wat pas na afronden kan (check-in,
// de ledenapp bekijken, sluitingsdagen) krijgt een link zodra je hebt
// afgerond. Onderdelen die uit staan komen niet in de lijst.

import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Module } from '@/lib/club/kern/organisatie'
import { startPad, stapNummer, type StapSleutel, type StartFeiten } from './stappen'

export interface EersteDagPunt {
  id: string
  titel: string
  uitleg: string
  /** Waar je het doet, of null als het pas na afronden kan. */
  pad: string | null
  /** true = staat er al, false = nog doen, null = niet af te lezen (gewoon even nalopen). */
  af: boolean | null
}

interface Punt extends Omit<EersteDagPunt, 'pad' | 'af'> {
  /** De wizardstap waar je het instelt. */
  stap?: StapSleutel
  /** Of: de pagina die na afronden open gaat. */
  pagina?: string
  module?: Module
  af: (f: StartFeiten) => boolean | null
}

const PUNTEN: readonly Punt[] = [
  { id: 'huisstijl', titel: 'Logo, kleur en adres', uitleg: 'Je leden zien je eigen merk in de app en in hun mails.', stap: 'huisstijl', af: (f) => f.heeftLogo },
  { id: 'tijden', titel: 'Openingstijden', uitleg: 'Leden en de check-in weten wanneer je open bent.', stap: 'vestigingen', af: (f) => f.vestigingenIngericht > 0 },
  { id: 'rooster', titel: 'Vaste lessen', uitleg: 'Je vaste lessen per week staan in het rooster, dus leden kunnen reserveren.', stap: 'lessen', module: 'rooster', af: (f) => f.vasteLessen > 0 },
  { id: 'team', titel: 'Je team', uitleg: 'Staat je team erin en is iedereen uitgenodigd? Ieder kiest zelf een wachtwoord en logt in met het eigen e-mailadres.', stap: 'team', af: (f) => f.medewerkers > 0 },
  { id: 'leden', titel: 'Ledenbestand', uitleg: 'Lees je leden in, dan vindt de balie iedereen op naam.', stap: 'leden', module: 'leden', af: (f) => f.leden > 0 },
  { id: 'checkin', titel: 'Check-in aan de balie', uitleg: 'Open de check-in op de tablet of pc bij de ingang en scan een QR-code.', pagina: '/checkin', module: 'checkin', af: () => null },
  { id: 'app', titel: 'Ledenapp bekijken', uitleg: 'Zie de app zoals een lid hem op de telefoon ziet.', pagina: '/app', module: 'app', af: () => null },
  { id: 'sluiting', titel: 'Feestdagen en sluiting', uitleg: 'Zet de dagen dat je dicht bent erin; het rooster houdt er rekening mee.', pagina: '/beheer/sluiting', af: () => null },
]

function padVan(p: Punt, vestiging: Vestiging | null, afgerond: boolean): string | null {
  if (p.stap) return startPad(stapNummer(p.stap), vestiging)
  if (!p.pagina || !afgerond) return null
  return vestiging ? clubPad(p.pagina, vestiging) : `/club${p.pagina}`
}

/** De checklist voor de eerste dag, zonder onderdelen die uit staan. */
export function eersteDag(f: StartFeiten, vestiging: Vestiging | null, afgerond = false): EersteDagPunt[] {
  return PUNTEN.filter((p) => !p.module || !f.uit.includes(p.module)).map((p) => ({
    id: p.id,
    titel: p.titel,
    uitleg: p.uitleg,
    pad: padVan(p, vestiging, afgerond),
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
