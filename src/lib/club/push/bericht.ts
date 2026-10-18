// ─── Club, push: het bericht en het verzoek aan de push-dienst (PUUR) ───────
// In de push staat alleen wat de melding op het scherm toont: een titel, de
// korte tekst, het icoon en een link binnen /mijn. Geen lidnummer, geen
// e-mailadres, geen id's van het lid.

import { MAX_TEKST_BYTES, versleutel, type Vast } from './versleutelen'
import { vapidKop, type VapidSleutels } from './vapid'
import { uitB64u } from './base64url'
import type { PushAbonnement } from './abonnement'

export interface PushInhoud {
  titel: string
  tekst: string
  /** Altijd een pad binnen /mijn. */
  url: string
  /** Pad van het icoon van de sportschool. */
  icoon: string
  /** Meldingen met dezelfde tag vervangen elkaar op het toestel. */
  tag: string
}

export const ICOON = '/api/club/ledenapp/icoon?soort=192'
export const STANDAARD_URL = '/mijn?tab=meldingen'
const MAX_TITEL = 80
const MAX_TEKST = 240
/** Hoe lang de push-dienst een melding bewaart als het toestel uit staat. */
export const TTL_SEC = 6 * 3600

function kort(tekst: string, max: number): string {
  const schoon = tekst.replace(/\s+/g, ' ').trim()
  return schoon.length <= max ? schoon : `${schoon.slice(0, max - 1).trimEnd()}…`
}

/** Alleen een pad binnen /mijn; al het andere wordt de meldingenlijst. */
export function veiligeUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/mijn') || url.startsWith('//') || /[\s\\]/.test(url)) return STANDAARD_URL
  return url.slice(0, 200)
}

export function maakInhoud(rij: { id: string; onderwerp: string; inhoud: string; url?: string | null }): PushInhoud {
  return { titel: kort(rij.onderwerp, MAX_TITEL), tekst: kort(rij.inhoud, MAX_TEKST), url: veiligeUrl(rij.url), icoon: ICOON, tag: `club-${rij.id}` }
}

/** De JSON die de service worker leest (korte sleutels, ruim onder de grens). */
export function inhoudNaarBytes(i: PushInhoud): Buffer {
  const bytes = Buffer.from(JSON.stringify({ t: i.titel, b: i.tekst, u: i.url, i: i.icoon, g: i.tag }), 'utf8')
  if (bytes.length > MAX_TEKST_BYTES) throw new Error('Push te groot')
  return bytes
}

export interface PushVerzoek {
  url: string
  headers: Record<string, string>
  body: Buffer
}

/** Het complete verzoek: versleuteld, met VAPID, TTL en urgentie. */
export function bouwVerzoek(ab: PushAbonnement, inhoud: PushInhoud, sleutels: VapidSleutels, nu: Date, vast?: Vast): PushVerzoek {
  const p256dh = uitB64u(ab.p256dh)
  const auth = uitB64u(ab.auth)
  if (!p256dh || !auth) throw new Error('Ongeldige sleutels van het toestel')
  const body = versleutel(inhoudNaarBytes(inhoud), { p256dh, auth }, vast)
  return {
    url: ab.endpoint,
    headers: {
      Authorization: vapidKop(ab.endpoint, sleutels, nu),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(TTL_SEC),
      Urgency: 'normal',
    },
    body,
  }
}

export type DienstUitslag = 'ok' | 'weg' | 'opnieuw' | 'fout'

/** Wat het antwoord van de push-dienst betekent. 404/410: het abonnement bestaat niet meer. */
export function beoordeelAntwoord(status: number): DienstUitslag {
  if (status >= 200 && status < 300) return 'ok'
  if (status === 404 || status === 410) return 'weg'
  if (status === 429 || status >= 500) return 'opnieuw'
  return 'fout'
}
