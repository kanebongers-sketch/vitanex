// ─── Club, meldingen: mag deze melding nog, en mag hij per mail (PUUR) ──────
// Veiligheid eerst: mailen alleen met de schakelaar CLUB_MAILS_ACTIEF aan, met
// een sleutel en afzender, nooit naar demo-leden of leden van een
// demo-sportschool, nooit naar testadressen, en niet als het lid zich afmeldde.

import { isHerinnering, type Soort } from './soorten'

/** De demo-sportschool "Voorbeeld Gym" (migratie 403): daar gaat nooit mail heen, wat de vlag ook zegt. */
export const DEMO_SPORTSCHOOL_ID = 'de000000-0000-4000-8000-0000000000c1'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Domeinen die nooit echt zijn (RFC 2606) of van de demo zijn. */
const NEP_DOMEIN = /(^|\.)(example\.(com|net|org)|test|invalid|localhost|example|voorbeeld\.nl|voorbeeldgym\.nl)$/i

export interface MailOmgeving {
  /** CLUB_MAILS_ACTIEF === '1'. */
  actief: boolean
  /** CLUB_RESEND_API_KEY en CLUB_RESEND_FROM zijn er allebei. */
  ingesteld: boolean
}

export interface MailOntvanger {
  organisatieId: string
  organisatieDemo: boolean
  lidDemo: boolean
  rijDemo: boolean
  email: string | null
  /** null = geen voorkeur opgeslagen (alles aan). */
  voorkeur: { mails: boolean; herinneringenPerMail: boolean } | null
}

export type Beslissing = { ok: true; email: string } | { ok: false; reden: string }

export function isEchtAdres(email: string): boolean {
  if (!EMAIL.test(email) || email.length > 254) return false
  const domein = email.split('@')[1] ?? ''
  return !NEP_DOMEIN.test(domein)
}

/** Mag deze melding per mail naar dit lid? Zo nee, met een korte reden (zonder persoonsgegevens). */
export function mailBeslissing(soort: Soort, o: MailOntvanger, env: MailOmgeving): Beslissing {
  if (!env.actief) return { ok: false, reden: 'Mails staan uit (CLUB_MAILS_ACTIEF)' }
  if (!env.ingesteld) return { ok: false, reden: 'Geen afzender of sleutel ingesteld' }
  if (o.organisatieDemo || o.organisatieId === DEMO_SPORTSCHOOL_ID) return { ok: false, reden: 'Demo-sportschool' }
  if (o.lidDemo || o.rijDemo) return { ok: false, reden: 'Demo-lid' }
  const email = o.email?.trim().toLowerCase() ?? ''
  if (!email) return { ok: false, reden: 'Geen e-mailadres' }
  if (!isEchtAdres(email)) return { ok: false, reden: 'Ongeldig of testadres' }
  if (o.voorkeur && !o.voorkeur.mails) return { ok: false, reden: 'Lid heeft zich afgemeld voor mail' }
  if (o.voorkeur && isHerinnering(soort) && !o.voorkeur.herinneringenPerMail) return { ok: false, reden: 'Lid heeft herinneringen per mail uitgezet' }
  return { ok: true, email }
}

/** De stand van de bron (reservering of afspraak) op het moment van versturen. */
export interface BronStand {
  /** Status van de reservering of afspraak. */
  status: string
  /** Huidige starttijd (ISO). */
  start: string
  /** Is de les zelf geannuleerd? (alleen bij reserveringen) */
  lesGeannuleerd?: boolean
}

/** Hoe lang een directe melding mag blijven liggen voordat hij niet meer zinvol is. */
export const MAX_VERTRAGING_MS = 48 * 3_600_000

/**
 * Klopt de melding nog? Een herinnering alleen als de boeking nog staat, de
 * starttijd niet verschoof en de start nog moet komen. Een directe melding
 * alleen als hij niet te lang is blijven liggen.
 */
export function nogGeldig(soort: Soort, rij: { geplandOp: string; bronStart: string | null }, bron: BronStand | null, nu: Date): boolean {
  if (!isHerinnering(soort)) return nu.getTime() - Date.parse(rij.geplandOp) <= MAX_VERTRAGING_MS
  if (!bron || !rij.bronStart) return false
  const start = Date.parse(bron.start)
  if (Number.isNaN(start) || start <= nu.getTime() || start !== Date.parse(rij.bronStart)) return false
  if (soort === 'les_herinnering') return bron.status === 'geboekt' && bron.lesGeannuleerd !== true
  return bron.status === 'gepland'
}

/** Na een mislukte poging: opnieuw over een kwartier, tot drie keer. */
export const MAX_POGINGEN = 3
export const OPNIEUW_NA_MS = 15 * 60_000

export function volgendePoging(pogingen: number, nu: Date): { status: 'gepland'; op: string } | { status: 'mislukt' } {
  return pogingen + 1 < MAX_POGINGEN ? { status: 'gepland', op: new Date(nu.getTime() + OPNIEUW_NA_MS).toISOString() } : { status: 'mislukt' }
}
