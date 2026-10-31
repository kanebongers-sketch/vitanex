// ─── AI Your Gym: mail bij een andere staffel (tekst PUUR, versturen SERVER) ─
// Afspraak in de voorwaarden (besluit Kane 31-10-2026): de eigenaar krijgt een
// mail als de staffel van een vestiging verandert. Via Resend met
// AIYOURGYM_RESEND_FROM (mailAfzender). Zonder afzender gaat er geen mail; de
// wijziging staat dan alleen in Club bij Abonnement (uit het logboek). Nooit
// een bedrag in de mail: dat staat bij Stripe.
// De mail is in het Nederlands met daaronder het Engels: we weten hier niet welke
// taal de eigenaar in Club koos.

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { mailAfzender } from './config'
import { subdomeinenActief } from './schakelaar'
import { ABONNEMENT_PAD } from './abonnement'
import { staffelNaam } from './staffel-weergave'
import { STAFFEL } from './taal/woorden/club/staffel'
import type { StaffelWissel } from './staffel-telling'

export interface StaffelMailInvoer {
  voornaam: string
  sportschool: string
  vestiging: string
  actieveLeden: number
  oud: number
  nieuw: number
  adres: string
}

/** Onderwerp en tekst (PUUR, getest): Nederlands met het Engels eronder. */
export function staffelMailTekst(m: StaffelMailInvoer): { onderwerp: string; tekst: string } {
  const delen = (['nl', 'en'] as const).map((taal) =>
    STAFFEL[taal].mailTekst({ naam: m.voornaam, sportschool: m.sportschool, vestiging: m.vestiging, leden: m.actieveLeden, oud: staffelNaam(m.oud, taal), nieuw: staffelNaam(m.nieuw, taal), adres: m.adres }),
  )
  return { onderwerp: `${STAFFEL.nl.mailOnderwerp(m.vestiging)} | ${STAFFEL.en.mailOnderwerp(m.vestiging)}`, tekst: delen.join('\n\n\n') }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)
}

interface Ontvanger {
  email: string
  voornaam: string
}

async function eigenaarsVan(admin: SupabaseClient, organisatieId: string): Promise<Ontvanger[]> {
  const { data, error } = await admin.from('club_beheerders').select('naam, email').eq('organisatie_id', organisatieId).eq('rol', 'eigenaar').eq('actief', true).limit(5)
  if (error) return []
  return (data ?? []).flatMap((r) => {
    const b = r as { naam?: unknown; email?: unknown }
    return typeof b.email === 'string' && b.email ? [{ email: b.email, voornaam: typeof b.naam === 'string' && b.naam ? b.naam.split(' ')[0] : '' }] : []
  })
}

async function namenVan(admin: SupabaseClient, organisatieId: string, vestiging: string): Promise<{ sportschool: string; slug: string; vestiging: string } | null> {
  const [org, vest] = await Promise.all([
    admin.from('club_organisaties').select('naam, slug').eq('id', organisatieId).maybeSingle(),
    admin.from('club_vestigingen').select('naam').eq('user_id', organisatieId).eq('vestiging', vestiging).maybeSingle(),
  ])
  const o = org.data as { naam?: unknown; slug?: unknown } | null
  if (!o || typeof o.slug !== 'string') return null
  const v = vest.data as { naam?: unknown } | null
  return { sportschool: typeof o.naam === 'string' ? o.naam : '', slug: o.slug, vestiging: typeof v?.naam === 'string' ? v.naam : vestiging }
}

/** De eigenaar(s) mailen over een andere staffel. true als er minstens een mail weg is. */
export async function stuurStaffelMail(admin: SupabaseClient, w: StaffelWissel): Promise<boolean> {
  const van = mailAfzender()
  if (!van) return false
  const [namen, eigenaars] = await Promise.all([namenVan(admin, w.abonnement.organisatieId, w.abonnement.vestiging), eigenaarsVan(admin, w.abonnement.organisatieId)])
  if (!namen || eigenaars.length === 0) return false
  const adres = sportschoolUrl(namen.slug, subdomeinenActief(), ABONNEMENT_PAD)
  const resend = new Resend(process.env.RESEND_API_KEY)
  let verstuurd = false
  for (const o of eigenaars) {
    const { onderwerp, tekst } = staffelMailTekst({ voornaam: o.voornaam, sportschool: namen.sportschool, vestiging: namen.vestiging, actieveLeden: w.actieveLeden, oud: w.oud, nieuw: w.nieuw, adres })
    try {
      const { error } = await resend.emails.send({ from: van, to: o.email, subject: onderwerp, text: tekst, html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;white-space:pre-line">${escape(tekst)}</div>` })
      if (error) console.error('[aiyourgym] staffelmail mislukt', error.name)
      else verstuurd = true
    } catch (err) {
      console.error('[aiyourgym] staffelmail mislukt', err instanceof Error ? err.name : 'onbekend')
    }
  }
  return verstuurd
}
