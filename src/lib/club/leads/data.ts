// ─── Fit Factory Club: leads lezen en schrijven (SERVER-ONLY) ───────────────
// Alle queries filteren op user_id. Fouten worden gelogd en als null terug-
// gegeven; de pagina of route toont dan een nette Nederlandse melding.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { HISTORIE_KOLOMMEN, LEAD_KOLOMMEN, historieUitRij, leadUitRij, type HistorieRegel, type HistorieSoort, type Lead } from './model'
import { CONVERSIE_DAGEN } from './cijfers'
import { telefoonZoekpatroon, vindDubbelen, normaliseerEmail, type Contactgegevens, type DubbelKandidaat, type DubbelTreffer } from './dubbel'
import { PROEFLES_DAGEN, kiesbareLessen, lesUitRij, telPerLes, type ProeflesLes } from './lessen'

function log(wat: string, bericht: string): void {
  console.error(`[club/leads] ${wat} mislukt`, bericht)
}

/** De leads van een vestiging: alles wat loopt, plus wat de laatste 90 dagen binnenkwam of afsloot. */
export async function haalLeads(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu: Date): Promise<Lead[] | null> {
  const grens = new Date(nu.getTime() - (CONVERSIE_DAGEN + 1) * 86_400_000).toISOString()
  const { data, error } = await admin
    .from('club_leads')
    .select(LEAD_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .or(`status.not.in.(lid,verloren),aangemaakt_op.gte."${grens}",bijgewerkt_op.gte."${grens}"`)
    .order('aangemaakt_op', { ascending: false })
    .limit(1000)
  if (error) {
    log('leads lezen', error.message)
    return null
  }
  return (data ?? []).map(leadUitRij).filter((l): l is Lead => l !== null)
}

export async function haalLead(admin: SupabaseClient, userId: string, id: string): Promise<Lead | null> {
  const { data, error } = await admin.from('club_leads').select(LEAD_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) log('lead lezen', error.message)
  return error ? null : leadUitRij(data)
}

export async function haalHistorie(admin: SupabaseClient, userId: string, leadId: string): Promise<HistorieRegel[] | null> {
  const { data, error } = await admin
    .from('club_lead_historie')
    .select(HISTORIE_KOLOMMEN)
    .eq('user_id', userId)
    .eq('lead_id', leadId)
    .order('op', { ascending: false })
    .limit(200)
  if (error) {
    log('historie lezen', error.message)
    return null
  }
  return (data ?? []).map(historieUitRij).filter((h): h is HistorieRegel => h !== null)
}

export async function schrijfHistorie(
  admin: SupabaseClient,
  userId: string,
  leadId: string,
  regel: { soort: HistorieSoort; tekst: string | null; auteur: string },
): Promise<boolean> {
  const { error } = await admin.from('club_lead_historie').insert({
    user_id: userId,
    lead_id: leadId,
    soort: regel.soort,
    tekst: regel.tekst ? regel.tekst.slice(0, 1000) : null,
    auteur: regel.auteur.slice(0, 80),
  })
  if (error) log('historie schrijven', error.message)
  return !error
}

/** Werk een lead bij en geef de nieuwe versie terug (null = mislukt of niet gevonden). */
export async function werkLeadBij(admin: SupabaseClient, userId: string, id: string, velden: Record<string, unknown>): Promise<Lead | null> {
  const { data, error } = await admin
    .from('club_leads')
    .update({ ...velden, bijgewerkt_op: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .select(LEAD_KOLOMMEN)
    .maybeSingle()
  if (error) log('lead bijwerken', error.message)
  return error ? null : leadUitRij(data)
}

/** Geplande, niet-volle lessen van de komende 7 dagen in deze vestiging. */
export async function haalProeflesLessen(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu: Date): Promise<ProeflesLes[] | null> {
  const tot = new Date(nu.getTime() + PROEFLES_DAGEN * 86_400_000).toISOString()
  const { data, error } = await admin
    .from('club_lessen')
    .select('id, start_op, eind_op, capaciteit, status, lestype:club_lestypen(naam)')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .eq('status', 'gepland')
    .gt('start_op', nu.toISOString())
    .lte('start_op', tot)
    .order('start_op')
    .limit(300)
  if (error) {
    log('lessen lezen', error.message)
    return null
  }
  const rijen = data ?? []
  const ids = rijen.map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return []
  const [res, leads] = await Promise.all([
    admin.from('club_reserveringen').select('les_id').eq('user_id', userId).in('les_id', ids).in('status', ['geboekt', 'aanwezig']),
    admin.from('club_leads').select('proefles_les_id').eq('user_id', userId).eq('status', 'proefles').in('proefles_les_id', ids),
  ])
  if (res.error || leads.error) {
    log('bezetting lezen', res.error?.message ?? leads.error?.message ?? '')
    return null
  }
  const bezet = telPerLes([...(res.data ?? []).map((r) => r.les_id), ...(leads.data ?? []).map((r) => r.proefles_les_id)])
  const lessen = rijen.map((r) => lesUitRij(r, typeof r.id === 'string' ? (bezet.get(r.id) ?? 0) : 0)).filter((l): l is ProeflesLes => l !== null)
  return kiesbareLessen(lessen, nu)
}

function kandidaatUitRij(rij: unknown): DubbelKandidaat | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.voornaam !== 'string' || typeof r.achternaam !== 'string') return null
  return {
    id: r.id,
    voornaam: r.voornaam,
    achternaam: r.achternaam,
    email: typeof r.email === 'string' ? r.email : null,
    telefoon: typeof r.telefoon === 'string' ? r.telefoon : null,
    status: typeof r.status === 'string' ? r.status : 'actief',
  }
}

/** Leden in deze vestiging met hetzelfde e-mailadres of telefoonnummer. */
export async function zoekDubbeleLeden(
  admin: SupabaseClient,
  userId: string,
  vestiging: Vestiging,
  contact: Contactgegevens,
): Promise<DubbelTreffer[] | null> {
  const email = normaliseerEmail(contact.email)
  const tel = telefoonZoekpatroon(contact.telefoon)
  const voorwaarden = [email && !/[,()"\\]/.test(email) ? `email.ilike."${email}"` : null, tel ? `telefoon.ilike."${tel}"` : null].filter(Boolean)
  if (voorwaarden.length === 0) return []
  const { data, error } = await admin
    .from('club_leden')
    .select('id, voornaam, achternaam, email, telefoon, status')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .or(voorwaarden.join(','))
    .limit(20)
  if (error) {
    log('dubbele leden zoeken', error.message)
    return null
  }
  const kandidaten = (data ?? []).map(kandidaatUitRij).filter((k): k is DubbelKandidaat => k !== null)
  return vindDubbelen(contact, kandidaten)
}
