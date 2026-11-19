// ─── Club: wachtwoord vergeten voor eigenaar, clubmanager en medewerker (PUUR) ──
// Op /inloggen vraagt iemand met zijn e-mailadres zelf een link aan om een
// nieuw wachtwoord te kiezen (POST /api/club/inloggen/vergeten). Hier staan de
// regels zonder database: de invoer, de remmen, wie een mail krijgt en de mail.
//
// Twee vaste afspraken:
//  1. Het antwoord is altijd hetzelfde (NEUTRAAL), of het adres nu bekend is of
//     niet. Niemand kan zo uitzoeken wie een account heeft.
//  2. Aanvragen verandert niets aan het inloggen. Het oude wachtwoord en de
//     toestellen blijven werken tot de persoon met de link een nieuw wachtwoord
//     kiest. Een vreemde die een adres intikt sluit dus niemand buiten.
// Het master account van het platform doet niet mee: dat heeft een eigen
// startlink (SQL club_platform_startlink).

import type { DbRem } from '@/lib/club/kern/rem-db'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { VERGETEN_MAIL } from '@/lib/aiyourgym/taal/woorden/club/wachtwoord-vergeten'

export const VERGETEN_ROUTE = '/api/club/inloggen/vergeten'

/** Een verzoek is alleen een e-mailadres; groter is geen eerlijk verzoek. */
export const VERGETEN_MAX_BODY = 1024

/** Per netwerk: daarboven een 429 (dat verraadt niets over een adres). */
export const REM_IP: DbRem = { soort: 'club-vergeten-ip', max: 10, vensterMs: 15 * 60_000, bijStoring: 'geheugen' }
/** Per e-mailadres: daarboven stil geen mail meer, met hetzelfde neutrale antwoord. */
export const REM_EMAIL: DbRem = { soort: 'club-vergeten-email', max: 3, vensterMs: 60 * 60_000, bijStoring: 'geheugen' }

/** Het enige antwoord op een geldig verzoek. */
export const NEUTRAAL = { staat: 'ok' } as const

/** Het e-mailadres uit de body (kleine letters), of null als het geen adres is. */
export function leesVergeten(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  return normaalEmail((body as { email?: unknown }).email)
}

// ─── Wie krijgt een mail ────────────────────────────────────────────────────

/** Wat we van een gevonden account moeten weten; de opslag levert alleen actieve accounts met een wachtwoord. */
export interface Kandidaat {
  naam: string
  email: string | null
  /** De sportschool (club_organisaties.id). */
  organisatieId: string
  actief: boolean
  heeftWachtwoord: boolean
}

export interface Gevonden<B extends Kandidaat, M extends Kandidaat> {
  /** Het adres is van het master account van het platform. */
  platform: boolean
  beheerder: B | null
  medewerker: M | null
}

export type Ontvanger<B, M> = { soort: 'beheerder'; account: B } | { soort: 'medewerker'; account: M } | { soort: 'geen' }

function komtInAanmerking(k: Kandidaat | null, email: string): k is Kandidaat {
  return k !== null && k.actief && k.heeftWachtwoord && k.email !== null && k.email.toLowerCase() === email
}

/**
 * Alleen een actief account met een wachtwoord en precies dit adres krijgt een
 * link. Het master account nooit; een eigenaar of clubmanager gaat voor een
 * medewerker (een adres hoort bij een account). Wie nog nooit een wachtwoord
 * koos, heeft zijn uitnodiging nog en krijgt hier niets.
 */
export function kiesOntvanger<B extends Kandidaat, M extends Kandidaat>(email: string, g: Gevonden<B, M>): Ontvanger<B, M> {
  if (g.platform) return { soort: 'geen' }
  if (komtInAanmerking(g.beheerder, email)) return { soort: 'beheerder', account: g.beheerder }
  if (komtInAanmerking(g.medewerker, email)) return { soort: 'medewerker', account: g.medewerker }
  return { soort: 'geen' }
}

// ─── De mail ────────────────────────────────────────────────────────────────

export interface VergetenMail {
  naam: string
  sportschool: string
  /** De volledige eenmalige link. */
  link: string
}

/** De tekst van de mail in de taal van de aanvrager (PUUR). */
export function vergetenMailTekst(m: VergetenMail, taal: Taal): { onderwerp: string; tekst: string } {
  const t = VERGETEN_MAIL[taal]
  const voornaam = m.naam.trim().split(/\s+/)[0] || t.daar
  const regels = [t.aanhef(voornaam), '', t.aangevraagd(m.sportschool), '', t.open(m.link), '', t.geldig, '', t.nietZelf, '', m.sportschool]
  return { onderwerp: t.onderwerp(m.sportschool), tekst: regels.join('\n') }
}
