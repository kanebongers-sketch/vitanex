// ─── Club, leden op de app: welke sportschool vraagt een link aan (SERVER-ONLY) ──
// Op het subdomein <slug>.aiyourgym.com (schakelaar aan) telt het adres; op
// fitfactorypt.nl de parameter ?s=<slug of id> (van de poster). Een
// sportschool telt alleen als de ledenapp er aan staat en het geen demo is.

import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ORGANISATIE_KOLOMMEN, moduleAan, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { slugUitHost } from '@/lib/club/kern/subdomein'
import { DEMO_SPORTSCHOOL_ID } from '@/lib/club/meldingen/beleid'
import type { SportschoolSleutel } from './regels'

async function zoek(admin: SupabaseClient, sleutel: SportschoolSleutel): Promise<Organisatie | null> {
  const { data, error } = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq(sleutel.kolom, sleutel.waarde).maybeSingle()
  if (error) console.error('[club/app-uitnodigen] sportschool lezen mislukt', error.message)
  return organisatieUitRij(data)
}

/** De sportschool van dit verzoek, of null (onbekend, app uit of demo). */
export async function sportschoolVoorAanvraag(admin: SupabaseClient, uitVraag: SportschoolSleutel | null): Promise<Organisatie | null> {
  const opSubdomein = process.env.CLUB_SUBDOMEINEN_ACTIEF === '1' ? slugUitHost((await headers()).get('host')) : null
  const sleutel: SportschoolSleutel | null = opSubdomein ? { kolom: 'slug', waarde: opSubdomein } : uitVraag
  if (!sleutel) return null
  const org = await zoek(admin, sleutel)
  if (!org || org.demo || org.id === DEMO_SPORTSCHOOL_ID || !moduleAan(org, 'app')) return null
  return org
}
