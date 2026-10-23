// ─── AI Your Gym: een aanmelding controleren (PUUR) ─────────────────────────
// Systeemgrens van het aanmeldformulier: alles wat van de pagina komt, gaat
// hierdoor. Per veld een Nederlandse foutmelding, zodat het formulier hem bij
// het juiste veld kan tonen.

import { wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { vindPakket, type PakketSleutel } from './pakketten'

/** Een body groter dan dit lezen we niet eens. */
export const MAX_BODY_BYTES = 4_096
export const MAX_NAAM = 60
export const MAX_EMAIL = 120
/** Ook in een pakket zonder maximum: meer vestigingen regelen we persoonlijk. */
export const MAX_VESTIGINGEN_ONLINE = 40

export interface Aanmelding {
  pakket: PakketSleutel
  sportschoolNaam: string
  aantalVestigingen: number
  slug: string
  eigenaarNaam: string
  eigenaarEmail: string
  eigenaarTelefoon: string
  /** Het gekozen wachtwoord, alleen onderweg naar de server; opgeslagen wordt alleen de hash. */
  wachtwoord: string
}

export type AanmeldVeld = keyof Aanmelding | 'akkoord' | 'wachtwoordHerhaal'
export type AanmeldUitslag = { ok: true; waarde: Aanmelding } | { ok: false; fouten: Partial<Record<AanmeldVeld, string>> }

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/
const TELEFOON_TEKENS = /^\+?[0-9 ()-]+$/

function tekst(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

/** Geen stuurtekens of tekens die in een mail of de database vreemd doen. */
function heeftRareTekens(s: string): boolean {
  return /[\u0000-\u001f\u007f<>]/.test(s)
}

function naamFout(naam: string, wat: string): string | null {
  if (naam.length < 2) return `Vul ${wat} in.`
  if (naam.length > MAX_NAAM) return `Maximaal ${MAX_NAAM} tekens.`
  if (heeftRareTekens(naam)) return 'Gebruik geen speciale tekens zoals < of >.'
  return null
}

export function leesTelefoon(ruw: unknown): string | null {
  const t = tekst(ruw)
  if (!t || t.length > 20 || !TELEFOON_TEKENS.test(t)) return null
  const cijfers = t.replace(/\D/g, '')
  return cijfers.length >= 8 && cijfers.length <= 15 ? t : null
}

export function leesEmail(ruw: unknown): string | null {
  const e = tekst(ruw).toLowerCase()
  return e.length <= MAX_EMAIL && EMAIL.test(e) && !heeftRareTekens(e) ? e : null
}

/** Hoeveel vestigingen dit pakket online mag hebben. */
export function maxVestigingenVoor(sleutel: PakketSleutel): number {
  const pakket = vindPakket(sleutel)
  return Math.min(pakket?.maxVestigingen ?? MAX_VESTIGINGEN_ONLINE, MAX_VESTIGINGEN_ONLINE)
}

function leesAantal(ruw: unknown, max: number): number | null {
  const n = typeof ruw === 'number' ? ruw : typeof ruw === 'string' && /^\d{1,3}$/.test(ruw.trim()) ? Number(ruw) : NaN
  return Number.isInteger(n) && n >= 1 && n <= max ? n : null
}

export function leesAanmelding(body: unknown): AanmeldUitslag {
  const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const fouten: Partial<Record<AanmeldVeld, string>> = {}

  const pakket = vindPakket(b.pakket)
  if (!pakket) fouten.pakket = 'Kies een pakket.'

  const sportschoolNaam = tekst(b.sportschoolNaam)
  const naamProbleem = naamFout(sportschoolNaam, 'de naam van je sportschool')
  if (naamProbleem) fouten.sportschoolNaam = naamProbleem

  const max = pakket ? maxVestigingenVoor(pakket.sleutel) : MAX_VESTIGINGEN_ONLINE
  const aantalVestigingen = leesAantal(b.aantalVestigingen, max)
  if (aantalVestigingen === null) fouten.aantalVestigingen = max === 1 ? 'Dit pakket is voor een vestiging.' : `Kies 1 tot ${max} vestigingen.`

  const slug = leesSlug(b.slug)
  if (!slug.ok) fouten.slug = slug.fout

  const eigenaarNaam = tekst(b.eigenaarNaam)
  const eigenaarProbleem = naamFout(eigenaarNaam, 'je naam')
  if (eigenaarProbleem) fouten.eigenaarNaam = eigenaarProbleem

  const eigenaarEmail = leesEmail(b.eigenaarEmail)
  if (!eigenaarEmail) fouten.eigenaarEmail = 'Vul een geldig e-mailadres in.'

  const eigenaarTelefoon = leesTelefoon(b.eigenaarTelefoon)
  if (!eigenaarTelefoon) fouten.eigenaarTelefoon = 'Vul een geldig telefoonnummer in.'

  const wachtwoord = typeof b.wachtwoord === 'string' ? b.wachtwoord : ''
  const wachtwoordProbleem = wachtwoordFout(wachtwoord, { email: eigenaarEmail, naam: eigenaarNaam })
  if (wachtwoordProbleem) fouten.wachtwoord = wachtwoordProbleem
  // De herhaling controleert alleen de browser; de server krijgt hem niet mee.
  if (b.wachtwoordHerhaal !== undefined && b.wachtwoordHerhaal !== wachtwoord) fouten.wachtwoordHerhaal = 'De twee wachtwoorden zijn niet gelijk.'

  if (b.akkoord !== true) fouten.akkoord = 'Ga akkoord met de voorwaarden en de privacyverklaring.'

  if (Object.keys(fouten).length > 0 || !pakket || aantalVestigingen === null || !slug.ok || !eigenaarEmail || !eigenaarTelefoon) {
    return { ok: false, fouten }
  }
  return { ok: true, waarde: { pakket: pakket.sleutel, sportschoolNaam, aantalVestigingen, slug: slug.slug, eigenaarNaam, eigenaarEmail, eigenaarTelefoon, wachtwoord } }
}

/** Een onzichtbaar veld dat mensen leeg laten; robots vullen het vaak wel. */
export function isRobot(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const v = (body as Record<string, unknown>).website
  return typeof v === 'string' && v.trim().length > 0
}
