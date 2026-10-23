// ─── Club, leden op de app: de regels zonder database (PUUR) ────────────────
// Bij de start moet een sportschool al haar leden in een keer op de app
// krijgen. Drie wegen:
//   1. een lid vraagt zelf een link aan op /mijn/aanvragen (e-mailadres);
//   2. de sportschool nodigt iedereen uit vanuit de ledenlijst;
//   3. een poster met QR-code naar /mijn/aanvragen.
// De mail loopt via de wachtrij van de meldingen (club_meldingen, migratie
// 435). De link zelf staat nooit in de wachtrij: de cron maakt hem pas bij het
// versturen (link-voor-mail.ts). Hier: invoer lezen, wie een uitnodiging
// krijgt, de rem, de sleutels, de teksten en het adres op de poster.

import { remSleutel } from '@/lib/club/kern/rem-hash'
import { magTrainen, type LidStatus } from '@/lib/club/kern/lid'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { isEchtAdres } from '@/lib/club/meldingen/beleid'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { AANVRAAG_PAD, HONINGPOT_VELD } from './velden'

export { AANVRAAG_PAD, HONINGPOT_VELD }

/** Het ene antwoord na een aanvraag: verraadt nooit of een adres bekend is. */
export const AANVRAAG_ANTWOORD = 'Als dit adres bij ons bekend is, krijg je zo een mail met je persoonlijke link.'
/** Zonder mail-instellingen kan er niets per mail. */
export const AANVRAAG_GEEN_MAIL = 'Vraag je link aan de balie. Daar maken ze hem meteen voor je.'

// ─── Invoer van de aanvraag ─────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Een e-mailadres in kleine letters zonder spaties, of null als het geen adres is. */
export function normaliseerEmail(ruw: unknown): string | null {
  if (typeof ruw !== 'string') return null
  const email = ruw.trim().toLowerCase()
  return email.length <= 254 && EMAIL.test(email) ? email : null
}

/** Een ILIKE-patroon dat precies dit adres zoekt (zonder jokers), hoofdletters maken niet uit. */
export function exactPatroon(email: string): string {
  return email.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export type SportschoolSleutel = { kolom: 'slug' | 'id'; waarde: string }

/** De ?s=-parameter: een slug of het id van de sportschool (Fit Factory heeft nog geen slug). */
export function leesSportschoolSleutel(ruw: unknown): SportschoolSleutel | null {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  if (typeof w !== 'string') return null
  const schoon = w.trim().toLowerCase()
  if (isUuid(schoon)) return { kolom: 'id', waarde: schoon }
  const slug = leesSlug(schoon)
  return slug.ok ? { kolom: 'slug', waarde: slug.slug } : null
}

export type AanvraagInvoer = { soort: 'ok'; email: string; sportschool: SportschoolSleutel | null } | { soort: 'robot' } | { soort: 'ongeldig' }

/** Wat het formulier stuurt. Is het honingpotveld gevuld, dan is het een robot. */
export function leesAanvraag(body: unknown): AanvraagInvoer {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { soort: 'ongeldig' }
  const b = body as Record<string, unknown>
  const honing = b[HONINGPOT_VELD]
  if (typeof honing === 'string' && honing.trim() !== '') return { soort: 'robot' }
  const email = normaliseerEmail(b.email)
  if (!email) return { soort: 'ongeldig' }
  return { soort: 'ok', email, sportschool: leesSportschoolSleutel(b.s) }
}

// ─── De rem (in de database, per adres en per IP) ───────────────────────────

export const AANVRAAG_MAX_PER_ADRES = 3
export const AANVRAAG_MAX_PER_IP = 10
export const AANVRAAG_VENSTER_MS = 60 * 60_000

/** Een hash voor de rem: zo staat er geen adres of IP in de database. */
export function remHash(soort: 'email' | 'ip', waarde: string): string {
  return remSleutel(`club-app-aanvraag|${soort}`, waarde)
}

export type RemOordeel = 'ok' | 'adres' | 'ip'

/** Telt mee: de aanvragen in het laatste uur, deze aanvraag nog niet meegeteld. */
export function remOordeel(perAdres: number, perIp: number): RemOordeel {
  if (perIp >= AANVRAAG_MAX_PER_IP) return 'ip'
  if (perAdres >= AANVRAAG_MAX_PER_ADRES) return 'adres'
  return 'ok'
}

// ─── Iedereen uitnodigen ────────────────────────────────────────────────────

export interface UitnodigInvoer {
  vestigingen: string[]
  alleenZonderApp: boolean
}

/** Wat de sportschool kiest. Alleen vestigingen die deze persoon mag zien. */
export function leesUitnodigInvoer(body: unknown, toegestaan: readonly string[]): { ok: true; waarde: UitnodigInvoer } | { ok: false; fout: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Onleesbare invoer.' }
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.vestigingen) || b.vestigingen.length === 0 || b.vestigingen.length > 100) return { ok: false, fout: 'Kies minstens een vestiging.' }
  if (!b.vestigingen.every((v) => typeof v === 'string' && toegestaan.includes(v))) return { ok: false, fout: 'Kies geldige vestigingen.' }
  return { ok: true, waarde: { vestigingen: [...new Set(b.vestigingen as string[])], alleenZonderApp: b.alleenZonderApp !== false } }
}

export interface Kandidaat {
  id: string
  voornaam: string
  vestiging: string
  status: LidStatus
  email: string | null
  demo: boolean
}

export interface Selectie {
  teSturen: Kandidaat[]
  zonderEmail: number
  heeftApp: number
  afgemeld: number
  demo: number
}

/**
 * Wie krijgt een uitnodiging? Leden van de gekozen vestigingen die mogen
 * trainen, geen demo zijn, een echt e-mailadres hebben en zich niet afmeldden
 * voor mail. Met "alleen zonder app" niet wie de app al gebruikt.
 */
export function selecteer(leden: readonly Kandidaat[], invoer: UitnodigInvoer, metApp: ReadonlySet<string>, afgemeld: ReadonlySet<string>): Selectie {
  const uit: Selectie = { teSturen: [], zonderEmail: 0, heeftApp: 0, afgemeld: 0, demo: 0 }
  for (const lid of leden) {
    if (!invoer.vestigingen.includes(lid.vestiging) || !magTrainen(lid.status)) continue
    if (lid.demo) uit.demo++
    else if (invoer.alleenZonderApp && metApp.has(lid.id)) uit.heeftApp++
    else if (!lid.email || !isEchtAdres(lid.email.trim().toLowerCase())) uit.zonderEmail++
    else if (afgemeld.has(lid.id)) uit.afgemeld++
    else uit.teSturen.push(lid)
  }
  return uit
}

/** Per lid hooguit een uitnodiging per dag (Nederlandse tijd). */
export function uitnodigingSleutel(lidId: string, nu: Date): string {
  return `app_uitnodiging:${lidId}:${nlDelen(nu).datum}`
}

export function aanvraagSleutel(lidId: string, aanvraagId: string): string {
  return `app_link:${lidId}:${aanvraagId}`
}

/** De cron draait elke 5 minuten en mailt er hooguit 50: per ronde 30 uitnodigingen, zo blijft er ruimte voor de rest. */
export const PER_RONDE = 30
export const RONDE_MS = 5 * 60_000

/** Wanneer uitnodiging nummer `plek` (vanaf 0) aan de beurt is. */
export function spreidMoment(plek: number, nu: Date): Date {
  return new Date(nu.getTime() + Math.floor(Math.max(0, plek) / PER_RONDE) * RONDE_MS)
}

/** Hoe lang het versturen ongeveer duurt, voor de melding na het plannen. */
export function duurTekst(aantal: number): string {
  const minuten = Math.ceil(aantal / PER_RONDE) * (RONDE_MS / 60_000)
  if (aantal === 0) return 'Er is niets te versturen.'
  if (minuten <= 5) return 'De mails gaan binnen een paar minuten de deur uit.'
  if (minuten < 60) return `De mails gaan in ongeveer ${minuten} minuten de deur uit.`
  const uren = Math.round(minuten / 6) / 10
  return `De mails gaan rustig in ongeveer ${String(uren).replace('.', ',')} uur de deur uit.`
}

// ─── Teksten ────────────────────────────────────────────────────────────────

export interface MailTekst {
  onderwerp: string
  mail: string
}

export const KNOP_LABEL = 'Open de app'

function aanhef(voornaam: string): string {
  return `Hoi ${voornaam.trim() || 'daar'},`
}

export function uitnodigingTekst(voornaam: string, sportschool: string): MailTekst {
  return {
    onderwerp: `Je eigen app van ${sportschool} staat klaar`,
    mail: [
      aanhef(voornaam),
      `${sportschool} heeft een eigen app voor leden. Je boekt er lessen en afspraken, ziet je trainingsschema en houdt je voortgang bij.`,
      'Open de app met de knop hieronder, bevestig je e-mailadres en kies een wachtwoord. Daarna log je altijd in met je e-mailadres en dat wachtwoord. Zet de app op je beginscherm, dan staat hij er altijd.',
      'Deze link is persoonlijk, werkt een keer en is 7 dagen geldig. Stuur hem niet door.',
      `Sportieve groet,\n${sportschool}`,
    ].join('\n\n'),
  }
}

export function linkTekst(voornaam: string, sportschool: string): MailTekst {
  return {
    onderwerp: `Je link voor de app van ${sportschool}`,
    mail: [
      aanhef(voornaam),
      'Je vroeg een link aan voor de app. Open de link met de knop hieronder en kies een wachtwoord (ook als je je wachtwoord vergeten bent). Daarna log je in met je e-mailadres en dat wachtwoord.',
      'Heb je dit niet zelf gevraagd? Dan kun je deze mail gewoon negeren: je huidige wachtwoord blijft werken. Deze link is persoonlijk, werkt een keer en is 7 dagen geldig: stuur hem niet door.',
      `Sportieve groet,\n${sportschool}`,
    ].join('\n\n'),
  }
}

// ─── De poster ──────────────────────────────────────────────────────────────

/**
 * Waar de QR-code op de poster naartoe wijst. Met subdomeinen aan het adres
 * van de sportschool zelf; anders de aanvraagpagina met ?s=<slug> (of het id
 * als er nog geen slug is).
 */
export function posterDoel(org: { id: string; slug: string | null }, subdomeinenActief: boolean, clubDomein: string, basis: string): string {
  if (subdomeinenActief && org.slug) return `https://${org.slug}.${clubDomein}${AANVRAAG_PAD}`
  return `${basis.replace(/\/+$/, '')}${AANVRAAG_PAD}?s=${encodeURIComponent(org.slug ?? org.id)}`
}

// ─── Kan er gemaild worden ──────────────────────────────────────────────────

/** Mails kunnen alleen met CLUB_MAILS_ACTIEF=1 plus sleutel en afzender (zie meldingen/versturen.ts). */
export function mailKlaar(env: Readonly<Record<string, string | undefined>>): boolean {
  return env.CLUB_MAILS_ACTIEF === '1' && Boolean(env.CLUB_RESEND_API_KEY?.trim()) && Boolean(env.CLUB_RESEND_FROM?.trim())
}

export type UitnodigBlokkade = 'ledenapp_dicht' | 'module_uit' | 'demo' | 'mails_uit' | null

/** Waarom uitnodigen nu niet kan, of null als het kan. */
export function uitnodigBlokkade(o: { ledenLoginAan: boolean; appModuleAan: boolean; demo: boolean; mailKlaar: boolean }): UitnodigBlokkade {
  if (o.demo) return 'demo'
  if (!o.ledenLoginAan) return 'ledenapp_dicht'
  if (!o.appModuleAan) return 'module_uit'
  if (!o.mailKlaar) return 'mails_uit'
  return null
}

export const BLOKKADE_TEKST: Record<Exclude<UitnodigBlokkade, null>, string> = {
  demo: 'Dit is een demo-sportschool. Daar gaan nooit mails uit.',
  ledenapp_dicht: 'De ledenapp is nog niet open voor leden (CLUB_LEDEN_LOGIN staat uit). Er gaat niets de deur uit.',
  module_uit: 'De ledenapp staat uit bij deze sportschool. Zet hem aan in de instellingen.',
  mails_uit: 'Mails staan nog uit (CLUB_MAILS_ACTIEF, CLUB_RESEND_API_KEY of CLUB_RESEND_FROM ontbreekt). Er is niets gepland.',
}
