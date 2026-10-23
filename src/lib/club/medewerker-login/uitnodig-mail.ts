// ─── Club: de uitnodiging van een medewerker per e-mail (SERVER-ONLY) ───────
// Als de eigenaar in de startwizard (of bij Medewerkers) op Uitnodigen drukt
// en de route `mailen: true` krijgt, sturen we de eenmalige link naar het
// e-mailadres van die medewerker. Alleen met een afzender (AIYOURGYM_RESEND_FROM
// plus RESEND_API_KEY), dezelfde Resend als de welkomstmail van AI Your Gym.
// Zonder afzender, of als versturen mislukt, krijgt de eigenaar de link te zien
// om zelf door te sturen; de route zegt eerlijk wat er gebeurde. De link en het
// e-mailadres komen nooit in een log.

import { Resend } from 'resend'
import { mailAfzender } from '@/lib/aiyourgym/config'

export type MailUitkomst = 'verstuurd' | 'niet_ingesteld' | 'mislukt'

interface UitnodigMail {
  naar: string
  /** De naam van de medewerker. */
  naam: string
  sportschool: string
  /** De volledige eenmalige link. */
  link: string
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

/** De tekst van de mail (PUUR). */
export function uitnodigMailTekst(naam: string, sportschool: string, link: string): { onderwerp: string; tekst: string } {
  const voornaam = naam.trim().split(/\s+/)[0] || 'daar'
  const regels = [
    `Hoi ${voornaam},`,
    '',
    `Je bent uitgenodigd om in te loggen bij ${sportschool}.`,
    '',
    `Open deze link en kies een wachtwoord: ${link}`,
    '',
    'De link werkt een keer en is 7 dagen geldig. Daarna log je in met dit e-mailadres en je eigen wachtwoord.',
    '',
    'Verwachtte je deze mail niet? Dan kun je hem negeren.',
    '',
    sportschool,
  ]
  return { onderwerp: `Je uitnodiging voor ${sportschool}`, tekst: regels.join('\n') }
}

export async function stuurUitnodigMail(m: UitnodigMail, env: Record<string, string | undefined> = process.env): Promise<MailUitkomst> {
  const van = mailAfzender(env)
  if (!van) return 'niet_ingesteld'
  const { onderwerp, tekst } = uitnodigMailTekst(m.naam, m.sportschool, m.link)
  try {
    const resend = new Resend(env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: van,
      to: m.naar,
      subject: onderwerp,
      text: tekst,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;white-space:pre-line">${escape(tekst)}</div>`,
    })
    if (error) console.error('[club] uitnodiging medewerker mailen mislukt', error.name)
    return error ? 'mislukt' : 'verstuurd'
  } catch (err) {
    console.error('[club] uitnodiging medewerker mailen mislukt', err instanceof Error ? err.name : 'onbekend')
    return 'mislukt'
  }
}
