// ─── Club, nieuwe leden: de regels zonder database (PUUR) ───────────────────
// Besluit Kane (30-10-2026): leden melden zich nooit aan via een openbare
// pagina. Er zijn twee wegen:
//   A. de sportschool voegt het lid toe (naam en e-mail), daarna gaat er een
//      uitnodiging (mail met de activatielink, of de QR aan de balie);
//   B. het lid meldt zich zelf aan via een aanmeldlink of QR die de
//      sportschool maakt en deelt (geheime code, per vestiging, optioneel vast
//      aan een lidmaatschapsvorm, met vervaldatum en aantal keer gebruiken,
//      altijd in te trekken).
// Een aanmelding via een link wordt meteen een proeflid (status 'proef'): het
// lid kan direct de app in en de intake doen, en de sportschool ziet de
// melding en zet het lidmaatschap daarna definitief. Betalen zit er nog niet in.
// Het e-mailadres wordt bewezen met een code van 6 cijfers per mail; zo laat de
// aanmelding nooit merken of een adres al bij een lid hoort.

import { isUuid } from '@/lib/club/kern/organisatie'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'

/** Het geheime deel van een aanmeldlink: 24 tekens base64url (144 bits), net als de uitnodiging. */
export const LINK_CODE = /^[A-Za-z0-9_-]{24}$/
/** Het token van een lopende aanmelding: 32 bytes base64url. */
export const AANMELD_TOKEN = /^[A-Za-z0-9_-]{43}$/
/** De code uit de mail. */
export const MAIL_CODE = /^\d{6}$/

/** Zo lang werkt de code uit de mail. */
export const CODE_MINUTEN = 30
/** Zo vaak mag de code fout. */
export const MAX_CODE_POGINGEN = 5
/** Zo vaak per aanmelding een (nieuwe) code mailen. */
export const MAX_VERSTUURD = 3
/** De versie van de toestemmingstekst bij aanmelden en in de intake (vastgelegd per lid). */
export const TOESTEMMING_VERSIE = '2026-10-30'

/** Remmen per uur, bovenop de rem in het geheugen. */
export const REM = { perIp: 10, perEmail: 3, perLink: 60 } as const

const DAG_MS = 86_400_000

export function aanmeldPad(code: string): string {
  return `/mijn/aanmelden/${code}`
}

// ─── Aanmeldlinks ───────────────────────────────────────────────────────────

export interface Aanmeldlink {
  id: string
  userId: string
  vestiging: string
  code: string
  naam: string | null
  vormId: string | null
  /** null = onbeperkt. */
  maxGebruik: number | null
  gebruikt: number
  verlooptOp: string | null
  ingetrokkenOp: string | null
  aangemaaktOp: string
  gemaaktDoor: string | null
}

export const LINK_KOLOMMEN = 'id, user_id, vestiging, code, naam, vorm_id, max_gebruik, gebruikt, verloopt_op, ingetrokken_op, aangemaakt_op, gemaakt_door'

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

/** Systeemgrens: een rij naar een link, of null als iets niet klopt. */
export function linkUitRij(rij: unknown): Aanmeldlink | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || !isUuid(r.user_id) || typeof r.code !== 'string' || !LINK_CODE.test(r.code)) return null
  const vestiging = tekst(r.vestiging)
  const aangemaaktOp = tekst(r.aangemaakt_op)
  if (!vestiging || !aangemaaktOp) return null
  return {
    id: r.id,
    userId: r.user_id,
    vestiging,
    code: r.code,
    naam: tekst(r.naam),
    vormId: isUuid(r.vorm_id) ? r.vorm_id : null,
    maxGebruik: getal(r.max_gebruik),
    gebruikt: getal(r.gebruikt) ?? 0,
    verlooptOp: tekst(r.verloopt_op),
    ingetrokkenOp: tekst(r.ingetrokken_op),
    aangemaaktOp,
    gemaaktDoor: tekst(r.gemaakt_door),
  }
}

export type LinkStaat = 'open' | 'verlopen' | 'vol' | 'ingetrokken'

export function linkStaat(l: Pick<Aanmeldlink, 'ingetrokkenOp' | 'verlooptOp' | 'maxGebruik' | 'gebruikt'>, nu: Date): LinkStaat {
  if (l.ingetrokkenOp) return 'ingetrokken'
  if (l.verlooptOp && new Date(l.verlooptOp).getTime() <= nu.getTime()) return 'verlopen'
  if (l.maxGebruik !== null && l.gebruikt >= l.maxGebruik) return 'vol'
  return 'open'
}

export const GELDIG_KEUZES = [7, 30, 90, 0] as const
export type GeldigKeuze = (typeof GELDIG_KEUZES)[number]
export const LINK_SOORTEN = ['eenmalig', 'herbruikbaar'] as const
export type LinkSoort = (typeof LINK_SOORTEN)[number]

export interface LinkInvoer {
  vestiging: string
  vormId: string | null
  soort: LinkSoort
  /** Dagen geldig; 0 = geen einddatum (alleen herbruikbaar). */
  geldig: GeldigKeuze
  naam: string | null
}

export type LinkInvoerFout = 'vestiging' | 'vorm' | 'soort' | 'geldig'

/** Een nieuwe link uit het formulier. Eenmalig is altijd 1 persoon en hooguit 90 dagen. */
export function leesLinkInvoer(body: unknown, vestigingen: readonly string[], vormIds: readonly string[]): { ok: true; waarde: LinkInvoer } | { ok: false; fout: LinkInvoerFout } {
  const r = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (typeof r.vestiging !== 'string' || !vestigingen.includes(r.vestiging)) return { ok: false, fout: 'vestiging' }
  const vormId = r.vormId === null || r.vormId === undefined || r.vormId === '' ? null : r.vormId
  if (vormId !== null && (typeof vormId !== 'string' || !vormIds.includes(vormId))) return { ok: false, fout: 'vorm' }
  if (!(LINK_SOORTEN as readonly unknown[]).includes(r.soort)) return { ok: false, fout: 'soort' }
  const soort = r.soort as LinkSoort
  const geldig = typeof r.geldig === 'string' ? Number(r.geldig) : r.geldig
  if (!(GELDIG_KEUZES as readonly unknown[]).includes(geldig)) return { ok: false, fout: 'geldig' }
  if (soort === 'eenmalig' && geldig === 0) return { ok: false, fout: 'geldig' }
  const naam = typeof r.naam === 'string' && r.naam.trim() ? r.naam.trim().slice(0, 80) : null
  return { ok: true, waarde: { vestiging: r.vestiging, vormId, soort, geldig: geldig as GeldigKeuze, naam } }
}

/** De kolommen van een nieuwe link (zonder sportschool, code en maker). */
export function linkVelden(i: LinkInvoer, nu: Date): { vestiging: string; vorm_id: string | null; naam: string | null; max_gebruik: number | null; verloopt_op: string | null } {
  return {
    vestiging: i.vestiging,
    vorm_id: i.vormId,
    naam: i.naam,
    max_gebruik: i.soort === 'eenmalig' ? 1 : null,
    verloopt_op: i.geldig === 0 ? null : new Date(nu.getTime() + i.geldig * DAG_MS).toISOString(),
  }
}

// ─── Een aanmelding via een link ────────────────────────────────────────────

export interface AanmeldGegevens {
  code: string
  voornaam: string
  achternaam: string
  email: string
  telefoon: string | null
  geboortedatum: string | null
}

export type AanmeldVeld = 'link' | 'voornaam' | 'achternaam' | 'email' | 'telefoon' | 'geboortedatum' | 'akkoord'

export type AanmeldStart = { soort: 'robot' } | { soort: 'ongeldig'; veld: AanmeldVeld } | { soort: 'ok'; waarde: AanmeldGegevens }

function naamDeel(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const n = v.trim().replace(/\s+/g, ' ')
  return n.length >= 1 && n.length <= max ? n : null
}

/** Een telefoonnummer zoals mensen het tikken: cijfers, spaties, plus, haakjes en streepjes. */
export function leesTelefoon(v: unknown): string | null | false {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return null
  if (typeof v !== 'string') return false
  const t = v.trim()
  const cijfers = t.replace(/\D/g, '')
  return /^[+0-9 ()-]{6,30}$/.test(t) && cijfers.length >= 6 && cijfers.length <= 15 ? t : false
}

/** Een geboortedatum (jjjj-mm-dd) van iemand tussen 10 en 110 jaar. */
export function leesGeboortedatum(v: unknown, nu: Date): string | null | false {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T12:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false
  const jaren = (nu.getTime() - d.getTime()) / (365.25 * DAG_MS)
  return jaren >= 10 && jaren <= 110 ? v : false
}

/** Stap 1: de gegevens. Een ingevuld honingpotveld (website) is een robot. */
export function leesAanmeldStart(body: unknown, nu: Date): AanmeldStart {
  const r = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (typeof r.website === 'string' && r.website.trim() !== '') return { soort: 'robot' }
  if (typeof r.code !== 'string' || !LINK_CODE.test(r.code)) return { soort: 'ongeldig', veld: 'link' }
  const voornaam = naamDeel(r.voornaam, 60)
  if (!voornaam) return { soort: 'ongeldig', veld: 'voornaam' }
  const achternaam = naamDeel(r.achternaam, 80)
  if (!achternaam) return { soort: 'ongeldig', veld: 'achternaam' }
  const email = normaalEmail(r.email)
  if (!email) return { soort: 'ongeldig', veld: 'email' }
  const telefoon = leesTelefoon(r.telefoon)
  if (telefoon === false) return { soort: 'ongeldig', veld: 'telefoon' }
  const geboortedatum = leesGeboortedatum(r.geboortedatum, nu)
  if (geboortedatum === false) return { soort: 'ongeldig', veld: 'geboortedatum' }
  if (r.akkoord !== true) return { soort: 'ongeldig', veld: 'akkoord' }
  return { soort: 'ok', waarde: { code: r.code, voornaam, achternaam, email, telefoon, geboortedatum } }
}

export interface AanmeldAfronden {
  token: string
  mailCode: string
  wachtwoord: string
  vormId: string | null
}

/** De laatste stap: het token van de aanmelding, de code uit de mail, het wachtwoord en (misschien) de vorm. */
export function leesAanmeldAfronden(body: unknown): AanmeldAfronden | null {
  const r = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (typeof r.token !== 'string' || !AANMELD_TOKEN.test(r.token)) return null
  const mailCode = typeof r.mailCode === 'string' ? r.mailCode.replace(/\s/g, '') : ''
  if (!MAIL_CODE.test(mailCode)) return null
  if (typeof r.wachtwoord !== 'string' || r.wachtwoord.length === 0 || r.wachtwoord.length > 128) return null
  const vormId = isUuid(r.vormId) ? r.vormId : null
  return { token: r.token, mailCode, wachtwoord: r.wachtwoord, vormId }
}

export type RemUitslag = 'ok' | 'stil' | 'netwerk' | 'link'

/**
 * De rem op het aanmelden (het aantal van het laatste uur, deze nog niet
 * meegeteld). Te veel van dit netwerk of via deze link: 429. Te vaak hetzelfde
 * adres: hetzelfde antwoord als altijd, maar geen mail (stil), zodat de rem
 * niets verraadt over het adres.
 */
export function remAanmelden(perIp: number, perEmail: number, perLink: number): RemUitslag {
  if (perIp >= REM.perIp) return 'netwerk'
  if (perLink >= REM.perLink) return 'link'
  if (perEmail >= REM.perEmail) return 'stil'
  return 'ok'
}

export type CodeOordeel = 'goed' | 'fout' | 'op' | 'verlopen'

/** Mag deze code nog geprobeerd worden, en klopt hij? (De hash-vergelijking gebeurt op de server.) */
export function codeOordeel(a: { pogingen: number; verlooptOp: string; afgerondOp: string | null; codeHash: string | null }, klopt: boolean, nu: Date): CodeOordeel {
  if (a.afgerondOp || new Date(a.verlooptOp).getTime() <= nu.getTime()) return 'verlopen'
  if (a.pogingen >= MAX_CODE_POGINGEN) return 'op'
  return a.codeHash && klopt ? 'goed' : 'fout'
}

/** Kies de vorm: vast in de link, anders de keuze van het lid als die bij de vestiging hoort. */
export function kiesVorm(linkVorm: string | null, gekozen: string | null, toegestaan: readonly string[]): string | null {
  if (linkVorm) return linkVorm
  return gekozen && toegestaan.includes(gekozen) ? gekozen : null
}

// ─── Snel een lid toevoegen (door de sportschool) ───────────────────────────

export interface SnelToevoegen {
  voornaam: string
  achternaam: string
  email: string
  telefoon: string | null
  vestiging: string
  vormId: string | null
  uitnodigen: boolean
}

export type SnelFout = 'voornaam' | 'achternaam' | 'email' | 'telefoon' | 'vestiging' | 'vorm'

export function leesSnelToevoegen(body: unknown, vestigingen: readonly string[], vormIds: readonly string[]): { ok: true; waarde: SnelToevoegen } | { ok: false; fout: SnelFout } {
  const r = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const voornaam = naamDeel(r.voornaam, 60)
  if (!voornaam) return { ok: false, fout: 'voornaam' }
  const achternaam = naamDeel(r.achternaam, 80)
  if (!achternaam) return { ok: false, fout: 'achternaam' }
  const email = normaalEmail(r.email)
  if (!email) return { ok: false, fout: 'email' }
  const telefoon = leesTelefoon(r.telefoon)
  if (telefoon === false) return { ok: false, fout: 'telefoon' }
  if (typeof r.vestiging !== 'string' || !vestigingen.includes(r.vestiging)) return { ok: false, fout: 'vestiging' }
  const vormId = r.vormId === null || r.vormId === undefined || r.vormId === '' ? null : r.vormId
  if (vormId !== null && (typeof vormId !== 'string' || !vormIds.includes(vormId))) return { ok: false, fout: 'vorm' }
  return { ok: true, waarde: { voornaam, achternaam, email, telefoon, vestiging: r.vestiging, vormId, uitnodigen: r.uitnodigen !== false } }
}

/** De vormen die een lid van deze vestiging kan kiezen: actief en voor deze vestiging (null = alle). */
export function vormenVoorVestiging<T extends { actief: boolean; vestigingen: string[] | null }>(vormen: readonly T[], vestiging: string): T[] {
  return vormen.filter((v) => v.actief && (v.vestigingen === null || v.vestigingen.includes(vestiging)))
}
