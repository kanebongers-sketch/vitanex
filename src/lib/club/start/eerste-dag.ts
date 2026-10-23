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
  /** De wizardstap waar je het instelt (af = die stap is af). */
  stap?: Exclude<StapSleutel, 'klaar'>
  /** Of: de pagina die na afronden open gaat (niet af te lezen). */
  pagina?: string
  module?: Module
}

const PUNTEN: readonly Punt[] = [
  { id: 'huisstijl', titel: 'Logo, kleur en adres', uitleg: 'Je leden zien je eigen merk in de app en in hun mails.', stap: 'huisstijl' },
  { id: 'tijden', titel: 'Adres en openingstijden', uitleg: 'Leden zien waar je zit en wanneer je open bent; de check-in weet het ook.', stap: 'vestigingen' },
  { id: 'rooster', titel: 'Lessen', uitleg: 'Je lestypen en vaste lessen staan in het rooster, of je koos bewust voor geen vaste lessen.', stap: 'lessen', module: 'rooster' },
  { id: 'team', titel: 'Je team', uitleg: 'Je team staat erin en is uitgenodigd, of je werkt alleen. Ieder kiest zelf een wachtwoord en logt in met het eigen e-mailadres.', stap: 'team' },
  { id: 'leden', titel: 'Ledenbestand', uitleg: 'Je leden staan erin, of je begint bewust zonder en ze komen via de app.', stap: 'leden', module: 'leden' },
  { id: 'checkin', titel: 'Check-in aan de balie', uitleg: 'Open de check-in op de tablet of pc bij de ingang en scan een QR-code.', pagina: '/checkin', module: 'checkin' },
  { id: 'app', titel: 'Ledenapp bekijken', uitleg: 'Zie de app zoals een lid hem op de telefoon ziet.', pagina: '/app', module: 'app' },
  { id: 'sluiting', titel: 'Feestdagen en sluiting', uitleg: 'Zet de dagen dat je dicht bent erin; het rooster houdt er rekening mee.', pagina: '/beheer/sluiting' },
]

function padVan(p: Punt, vestiging: Vestiging | null, afgerond: boolean): string | null {
  if (p.stap) return startPad(stapNummer(p.stap), vestiging)
  if (!p.pagina || !afgerond) return null
  return vestiging ? clubPad(p.pagina, vestiging) : `/club${p.pagina}`
}

/** De checklist voor de eerste dag, zonder onderdelen die uit staan. */
export function eersteDag(f: StartFeiten, vestiging: Vestiging | null, afgerond = false, v: StartVoortgang | null = null): EersteDagPunt[] {
  return PUNTEN.filter((p) => !p.module || !f.uit.includes(p.module)).map((p) => ({
    id: p.id,
    titel: p.titel,
    uitleg: p.uitleg,
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
