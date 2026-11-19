// ─── AI Your Gym: mail aan de platform-eigenaar versturen (SERVER-ONLY) ──────
// Best-effort en na het antwoord (after() in de route): een mislukte mail laat
// de aanvraag nooit mislukken, want die staat al in de database. Zonder
// mailinstelling gebeurt er niets; mislukt het versturen, dan een regel in
// club_fouten zonder gegevens van de aanvrager.

import type { SupabaseClient } from '@supabase/supabase-js'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { stuurClubMail } from '@/lib/club/medewerker-login/uitnodig-mail'
import { platformMeldAdressen } from '@/lib/club/platform-login/opslag'
import { meldingOntvangers, type PlatformMail } from './aanvraag-melding'

export async function mailPlatform(admin: SupabaseClient, mail: PlatformMail, route: string, env: Record<string, string | undefined> = process.env): Promise<void> {
  const naar = meldingOntvangers(env, env.AIYOURGYM_MELDINGEN_AAN ? [] : await platformMeldAdressen(admin))
  if (naar.length === 0) return
  const uitkomsten = await Promise.all(naar.map((adres) => stuurClubMail(adres, mail.onderwerp, mail.tekst, 'melding platform', env)))
  if (uitkomsten.includes('mislukt')) {
    await meldFout({ fout: 'Mail aan het platform over een nieuwe aanvraag mislukt', route, methode: 'POST', soort: 'handmatig' }, admin)
  }
}
