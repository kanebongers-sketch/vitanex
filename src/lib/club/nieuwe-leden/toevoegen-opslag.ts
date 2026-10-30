// ─── Club, nieuwe leden: snel een lid toevoegen (SERVER-ONLY) ───────────────
// De sportschool vult naam en e-mail in (de rest is optioneel). Het lid komt
// in club_leden en krijgt meteen een uitnodiging: een werkende link voor de
// QR aan de balie, en (als de mails aan staan) een mail in de wachtrij van de
// meldingen (soort app_uitnodiging, gaat met de volgende ronde van de cron).
// Elke query filtert op de sportschool uit de sessie.

import type { SupabaseClient } from '@supabase/supabase-js'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { exactPatroon, mailKlaar, uitnodigingSleutel, uitnodigingTekst } from '@/lib/club/app-uitnodigen/regels'
import { linkUrl } from '@/lib/club/app-uitnodigen/link-voor-mail'
import { geefUitnodigingCode } from '@/lib/club/ledenlogin/opslag'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import type { SnelToevoegen } from './regels'

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/nieuwe-leden] ${wat} mislukt`, fout.message)
}

/** Een lid van deze sportschool met dit e-mailadres, of null. undefined bij een leesfout. */
export async function zoekZelfdeAdres(admin: SupabaseClient, userId: string, email: string): Promise<{ id: string; vestiging: string } | null | undefined> {
  const { data, error } = await admin.from('club_leden').select('id, vestiging').eq('user_id', userId).ilike('email', exactPatroon(email)).limit(1)
  log('dubbel zoeken', error)
  if (error) return undefined
  const r = (data ?? [])[0] as { id?: unknown; vestiging?: unknown } | undefined
  return r && typeof r.id === 'string' && typeof r.vestiging === 'string' ? { id: r.id, vestiging: r.vestiging } : null
}

export async function maakSnelLid(admin: SupabaseClient, userId: string, i: SnelToevoegen, vormNaam: string | null, nu: Date): Promise<string | null> {
  const { data, error } = await admin
    .from('club_leden')
    .insert({
      user_id: userId, vestiging: i.vestiging, voornaam: i.voornaam, achternaam: i.achternaam, email: i.email,
      telefoon: i.telefoon, status: 'actief', lid_sinds: dagSleutelNl(nu), abonnement: vormNaam,
    })
    .select('id')
    .single()
  log('lid toevoegen', error)
  const id = (data as { id?: unknown } | null)?.id
  return !error && typeof id === 'string' ? id : null
}

export type Uitnodiging =
  /** De link voor de QR aan de balie; mail = de mail staat in de wachtrij. */
  | { staat: 'ok'; url: string; mail: boolean }
  | { staat: 'uit' }

/**
 * De uitnodiging voor de ledenapp: altijd een werkende link (voor de QR), en
 * een mail als de mails aan staan. Raakt nooit een bestaand wachtwoord.
 */
export async function nodigUit(admin: SupabaseClient, org: Pick<Organisatie, 'id' | 'naam' | 'slug'>, lid: { id: string; voornaam: string }, nu: Date): Promise<Uitnodiging> {
  const code = await geefUitnodigingCode(admin, org.id, lid.id, nu)
  if (code.staat !== 'ok') return { staat: 'uit' }
  const url = linkUrl(org.slug, code.code)
  if (!mailKlaar(process.env)) return { staat: 'ok', url, mail: false }
  const tekst = uitnodigingTekst(lid.voornaam, org.naam)
  const { error } = await admin.from('club_meldingen').upsert(
    {
      user_id: org.id, lid_id: lid.id, soort: 'app_uitnodiging', kanaal: 'email', sleutel: uitnodigingSleutel(lid.id, nu),
      onderwerp: tekst.onderwerp.slice(0, 200), inhoud: tekst.mail, status: 'gepland', gepland_op: nu.toISOString(),
    },
    { onConflict: 'user_id,sleutel,kanaal', ignoreDuplicates: true },
  )
  log('uitnodiging inplannen', error)
  return { staat: 'ok', url, mail: !error }
}
