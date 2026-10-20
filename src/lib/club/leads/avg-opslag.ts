// ─── Club, AVG voor leads: lezen en wissen in de database (SERVER-ONLY) ─────
// Alles filtert op de sportschool (user_id) en de lead. Het wissen zelf zit in
// de database-functie club_lead_anonimiseren (migratie 449), niet hier.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Rij } from '@/lib/club/kern/avg-velden'
import type { LeadExportRuw } from './avg'

type Uitslag = { ok: true; ruw: LeadExportRuw; medewerkers: Map<string, string> } | { ok: false; fout: 'niet gevonden' | 'lezen mislukt' }

const MAX_RIJEN = 2000

function log(wat: string, bericht: string): void {
  console.error(`[club/leads/avg] ${wat} mislukt`, bericht)
}

async function leesMedewerkers(admin: SupabaseClient, userId: string): Promise<Map<string, string> | null> {
  const { data, error } = await admin.from('club_medewerkers').select('id, naam').eq('user_id', userId).limit(2000)
  if (error) {
    log('medewerkers lezen', error.message)
    return null
  }
  const paren = (data ?? []).flatMap((m): [string, string][] => (typeof m.id === 'string' && typeof m.naam === 'string' ? [[m.id, m.naam]] : []))
  return new Map(paren)
}

/** Alles wat Club over deze lead bewaart. Lukt een deel niet, dan geen half bestand maar een fout. */
export async function haalLeadExportRuw(admin: SupabaseClient, userId: string, leadId: string): Promise<Uitslag> {
  const { data: lead, error } = await admin
    .from('club_leads')
    .select('naam, email, telefoon, vestiging, bron, interesse, status, proefles_op, opvolgen_op, verloren_reden, medewerker_id, lid_id, toestemming_contact, aangemaakt_op, bijgewerkt_op, geanonimiseerd_op')
    .eq('user_id', userId)
    .eq('id', leadId)
    .maybeSingle()
  if (error) {
    log('lead lezen', error.message)
    return { ok: false, fout: 'lezen mislukt' }
  }
  if (!lead) return { ok: false, fout: 'niet gevonden' }
  const [historie, afspraken, medewerkers] = await Promise.all([
    admin.from('club_lead_historie').select('soort, tekst, auteur, op').eq('user_id', userId).eq('lead_id', leadId).order('op').limit(MAX_RIJEN),
    admin
      .from('club_afspraken')
      .select('start_op, eind_op, vestiging, medewerker_id, status, notitie, geannuleerd_op, club_afspraak_typen(naam)')
      .eq('user_id', userId)
      .eq('lead_id', leadId)
      .order('start_op')
      .limit(MAX_RIJEN),
    leesMedewerkers(admin, userId),
  ])
  if (historie.error || afspraken.error || !medewerkers) {
    log('export lezen', historie.error?.message ?? afspraken.error?.message ?? 'medewerkers')
    return { ok: false, fout: 'lezen mislukt' }
  }
  return {
    ok: true,
    ruw: { lead: lead as Rij, historie: (historie.data ?? []) as Rij[], afspraken: (afspraken.data ?? []) as unknown as Rij[] },
    medewerkers,
  }
}

/**
 * Wissen via de database-functie. true = gewist, false = niet gevonden of al
 * gewist, null = fout. Daarna nog de planning los: geen opvolgdatum meer en geen
 * proefles die nog moet komen (anders staat "Verwijderde lead" op het rooster).
 */
export async function wisLead(admin: SupabaseClient, userId: string, leadId: string, door: string, nu: Date): Promise<boolean | null> {
  const { data, error } = await admin.rpc('club_lead_anonimiseren', { p_user: userId, p_lead: leadId, p_wie: door.slice(0, 80) })
  if (error) {
    log('lead wissen', `${error.code ?? ''} ${error.message}`)
    return null
  }
  if (data !== true) return false
  const planning = await admin.from('club_leads').update({ opvolgen_op: null }).eq('user_id', userId).eq('id', leadId)
  const proefles = await admin
    .from('club_leads')
    .update({ proefles_op: null, proefles_les_id: null })
    .eq('user_id', userId)
    .eq('id', leadId)
    .gt('proefles_op', nu.toISOString())
  // Best-effort: de persoonsgegevens zijn al weg; een mislukte opruiming alleen loggen.
  if (planning.error || proefles.error) log('planning na wissen opruimen', planning.error?.message ?? proefles.error?.message ?? '')
  return true
}
