// ─── Club, nieuwe leden: de mail bij aanmelden (SERVER-ONLY) ────────────────
// Bij een aanmelding via een link gaat er altijd een mail naar het opgegeven
// adres: de code van 6 cijfers, of (als het adres al bij een lid van deze
// sportschool hoort) een mail dat er al een account is. Zo ziet alleen de
// eigenaar van het adres het verschil; het scherm is altijd hetzelfde. Dezelfde
// afzender als de uitnodiging van medewerkers (AIYOURGYM_RESEND_FROM en
// RESEND_API_KEY). Adres en code komen nooit in een log.

import { Resend } from 'resend'
import { mailAfzender } from '@/lib/aiyourgym/config'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/aanmelden'
import { CODE_MINUTEN } from './regels'

export interface AanmeldMail {
  naar: string
  onderwerp: string
  tekst: string
}

export type MailVerstuurder = (m: AanmeldMail) => Promise<boolean>

/** Kan er gemaild worden? Zonder afzender kan aanmelden via een link niet. */
export function aanmeldMailKlaar(env: Record<string, string | undefined> = process.env): boolean {
  return mailAfzender(env) !== null
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

/** De echte verstuurder (Resend). Gooit nooit. */
export const stuurViaResend: MailVerstuurder = async (m) => {
  const van = mailAfzender()
  if (!van) return false
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: van,
      to: m.naar,
      subject: m.onderwerp,
      text: m.tekst,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;white-space:pre-line">${escape(m.tekst)}</div>`,
    })
    if (error) console.error('[club/nieuwe-leden] aanmeldmail mislukt', error.name)
    return !error
  } catch (err) {
    console.error('[club/nieuwe-leden] aanmeldmail mislukt', err instanceof Error ? err.name : 'onbekend')
    return false
  }
}

/** De mail met de code (PUUR). */
export function codeMail(naar: string, voornaam: string, sportschool: string, code: string, taal: Taal): AanmeldMail {
  const t = AANMELDEN[taal].mail
  return { naar, onderwerp: t.codeOnderwerp(code, sportschool), tekst: t.code(voornaam, sportschool, code, CODE_MINUTEN) }
}

/** De mail als het adres al bij een lid hoort (PUUR). */
export function alLidMail(naar: string, voornaam: string, sportschool: string, links: { inloggen: string; aanvragen: string }, taal: Taal): AanmeldMail {
  const t = AANMELDEN[taal].mail
  return { naar, onderwerp: t.alLidOnderwerp(sportschool), tekst: t.alLid(voornaam, sportschool, links.inloggen, links.aanvragen) }
}
