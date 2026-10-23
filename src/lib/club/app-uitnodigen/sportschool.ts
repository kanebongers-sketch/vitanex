// ─── Club, leden op de app: welke sportschool vraagt een link aan (SERVER-ONLY) ──
// Op het adres van de sportschool (aiyourgym.com/<slug>, of het subdomein) telt dat; op
// fitfactorypt.nl de parameter ?s=<slug of id> (van de poster). Een
// sportschool telt alleen als de ledenapp er aan staat en het geen demo is.

import type { SupabaseClient } from '@supabase/supabase-js'
import { ORGANISATIE_KOLOMMEN, moduleAan, organisatieUitRij, type Organisatie } from '@/lib/club/kern/organisatie'
import { adresVanVerzoek } from '@/lib/club/kern/adres-verzoek'
import { DEMO_SPORTSCHOOL_ID } from '@/lib/club/meldingen/beleid'
import type { SportschoolSleutel } from './regels'

async function zoek(admin: SupabaseClient, sleutel: SportschoolSleutel): Promise<Organisatie | null> {
  const { data, error } = await admin.from('club_organisaties').select(ORGANISATIE_KOLOMMEN).eq(sleutel.kolom, sleutel.waarde).maybeSingle()
  if (error) console.error('[club/app-uitnodigen] sportschool lezen mislukt', error.message)
  return organisatieUitRij(data)
}

/** De sportschool van dit verzoek, of null (onbekend, app uit of demo). */
export async function sportschoolVoorAanvraag(admin: SupabaseClient, uitVraag: SportschoolSleutel | null): Promise<Organisatie | null> {
  // Het pad of subdomein gaat voor de vraag (?s= van de poster); de cookie van de laatst geopende omgeving telt daarna.
  const adres = await adresVanVerzoek()
  const vanAdres: SportschoolSleutel | null = adres ? { kolom: 'slug', waarde: adres.slug } : null
  const sleutel: SportschoolSleutel | null = adres?.vast ? vanAdres : (uitVraag ?? vanAdres)
  if (!sleutel) return null
  const org = await zoek(admin, sleutel)
  if (!org || org.demo || org.id === DEMO_SPORTSCHOOL_ID || !moduleAan(org, 'app')) return null
  return org
}
