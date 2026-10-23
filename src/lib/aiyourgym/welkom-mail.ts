// ─── AI Your Gym: welkomstmail (SERVER-ONLY) ────────────────────────────────
// Alleen naar de eigenaar die zich zelf aanmeldde, en alleen als Kane er een
// afzender voor instelde (AIYOURGYM_RESEND_FROM plus RESEND_API_KEY). Zonder:
// geen mail. Inloggen gaat met e-mailadres en wachtwoord; de mail bevat dus geen
// geheime link en nooit het wachtwoord.

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { platformEigenaarId } from '@/lib/club/kern/database'
import { mailAfzender } from './config'
import { PROEFDAGEN } from './pakketten'
import { AYG_WEBSITE } from './links'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import type { AanmeldingRij } from './opslag'
import { maakSportschool, ruimSportschoolOp } from './sportschool'
import type { VerwerkDeps } from './verwerk'

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

/** De tekst van de mail (PUUR). */
export function welkomTekst(voornaam: string, sportschool: string, inlogAdres: string, loginOpen: boolean): { onderwerp: string; tekst: string } {
  const regels = [
    `Hoi ${voornaam},`,
    '',
    `${sportschool} staat klaar in AI Your Gym. Je proefperiode van ${PROEFDAGEN} dagen is gestart.`,
    '',
    loginOpen
      ? `Log in op ${inlogAdres} met dit e-mailadres en het wachtwoord dat je bij het aanmelden koos. De startwizard helpt je daarna in ongeveer een kwartier op weg.`
      : `Inloggen opent na de lancering. Dan log je in op ${inlogAdres} met dit e-mailadres en het wachtwoord dat je bij het aanmelden koos.`,
    '',
    'Team AI Your Gym',
  ]
  return { onderwerp: `${sportschool} staat klaar`, tekst: regels.join('\n') }
}

export async function stuurWelkomMail(_admin: SupabaseClient, a: AanmeldingRij): Promise<void> {
  const van = mailAfzender()
  if (!van) return
  // Inloggen op het eigen adres: aiyourgym.com/<slug>/inloggen (of het subdomein met de schakelaar aan).
  const inlog = a.slug ? sportschoolUrl(a.slug, process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', '/inloggen') : `${AYG_WEBSITE}/inloggen`
  const { onderwerp, tekst } = welkomTekst(a.eigenaarNaam.split(' ')[0], a.sportschoolNaam, inlog, CLUB_EIGEN_LOGIN)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: van,
      to: a.eigenaarEmail,
      subject: onderwerp,
      text: tekst,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;white-space:pre-line">${escape(tekst)}</div>`,
    })
    if (error) console.error('[aiyourgym] welkomstmail mislukt', error.name)
  } catch (err) {
    console.error('[aiyourgym] welkomstmail mislukt', err instanceof Error ? err.name : 'onbekend')
  }
}

/** De echte afhankelijkheden voor verwerkSessie en verwerkEvent. */
export function standaardDeps(): VerwerkDeps {
  return {
    maakSportschool,
    ruimOp: (admin, id) => ruimSportschoolOp(admin, id, platformEigenaarId()),
    welkom: stuurWelkomMail,
    nu: () => new Date(),
  }
}
