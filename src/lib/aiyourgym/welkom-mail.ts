// ─── AI Your Gym: welkomstmail met de inloglink (SERVER-ONLY) ───────────────
// Alleen naar de eigenaar die zich zelf aanmeldde, en alleen als Kane er een
// afzender voor instelde (AIYOURGYM_RESEND_FROM plus RESEND_API_KEY). Zonder:
// geen mail, de inloglink staat dan alleen op de welkomstpagina.

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { platformEigenaarId } from '@/lib/club/kern/database'
import { mailAfzender } from './config'
import { siteActief } from './schakelaar'
import { portaalLink } from './links'
import type { AanmeldingRij } from './opslag'
import { eigenaarCode, maakSportschool, ruimSportschoolOp } from './sportschool'
import type { VerwerkDeps } from './verwerk'

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

/** De tekst van de mail (PUUR). */
export function welkomTekst(voornaam: string, sportschool: string, link: string | null, loginOpen: boolean): { onderwerp: string; tekst: string } {
  const regels = [
    `Hoi ${voornaam},`,
    '',
    `${sportschool} staat klaar in AI Your Gym.`,
    '',
    link ? `Je persoonlijke inloglink: ${link}` : 'Je persoonlijke inloglink sturen we je apart.',
    loginOpen
      ? 'Bij je eerste bezoek kies je een pincode van 6 cijfers. Je krijgt dan een controlecode van 4 cijfers: noem die aan ons, dan zetten we je pincode aan.'
      : 'Inloggen opent na de lancering. Dan kies je via deze link een pincode van 6 cijfers; wij zetten hem aan zodra je ons de controlecode noemt.',
    '',
    'Bewaar deze link goed en deel hem met niemand: hij is alleen voor jou.',
    '',
    'Team AI Your Gym',
  ]
  return { onderwerp: `${sportschool} staat klaar`, tekst: regels.join('\n') }
}

export async function stuurWelkomMail(admin: SupabaseClient, a: AanmeldingRij, organisatieId: string): Promise<void> {
  const van = mailAfzender()
  if (!van) return
  const code = await eigenaarCode(admin, organisatieId, a.eigenaarEmail)
  if (!code) return
  const link = portaalLink({ code, slug: a.slug, subdomeinenAan: process.env.CLUB_SUBDOMEINEN_ACTIEF === '1', portaalUrl: process.env.AIYOURGYM_PORTAAL_URL ?? null, oorsprong: null, host: null, siteAan: siteActief() })
  const { onderwerp, tekst } = welkomTekst(a.eigenaarNaam.split(' ')[0], a.sportschoolNaam, link, CLUB_EIGEN_LOGIN)
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
