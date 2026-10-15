// ─── LifeOS — lead tracker: opslag (SERVER-ONLY) ────────────────────────────
// Leest en schrijft `pt_leads` (migraties 350 + 352) via de service-role. Elke
// schrijfactie is gescoped op de PT'er achter de link (`LeadLink`): een PT'er
// kan nooit een lead van een ander zien of wijzigen. Toegang: zie links.ts.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isClub } from '@/lib/lifeos/pt-dashboard/clubs'
import { isBron, isGeenKlantReden, isInteresse, isStap, isStatus, type Lead, type LeadNotitie, type NieuweLead } from './leads'
import type { LeadLink } from './links'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'te_veel' | 'niet_gevonden' }

/** Zoveel nieuwe leads per uur per PT'er; meer is eerder een kapotte knop of misbruik. */
const MAX_PER_UUR = 40

const KOLOMMEN =
  'id, naam, contact, locatie, bron, interesse, status, volgende_stap, opvolgdatum, review_gevraagd, referral_gevraagd, kent_iemand, notitie, geen_klant_reden, gesproken_op, aangemaakt_op'

interface Rij {
  id: string
  naam: string
  contact: string | null
  locatie: string | null
  bron: string
  interesse: string | null
  status: string
  volgende_stap: string | null
  opvolgdatum: string | null
  review_gevraagd: boolean
  referral_gevraagd: boolean
  kent_iemand: string | null
  notitie: string | null
  geen_klant_reden: string | null
  gesproken_op: string
  aangemaakt_op: string
}

interface NotitieRij {
  id: string
  datum: string
  tekst: string
  door: string | null
  aangemaakt_op: string
}

const vanNotitieRij = (n: NotitieRij): LeadNotitie => ({ id: n.id, datum: n.datum, tekst: n.tekst, door: n.door, aangemaaktOp: n.aangemaakt_op })

function vanRij(r: Rij): Lead | null {
  if (!isBron(r.bron) || !isStatus(r.status)) return null
  return {
    id: r.id,
    naam: r.naam,
    contact: r.contact,
    club: isClub(r.locatie) ? r.locatie : null,
    bron: r.bron,
    interesse: isInteresse(r.interesse) ? r.interesse : null,
    status: r.status,
    volgendeStap: isStap(r.volgende_stap) ? r.volgende_stap : null,
    opvolgdatum: r.opvolgdatum,
    reviewGevraagd: r.review_gevraagd === true,
    referralGevraagd: r.referral_gevraagd === true,
    kentIemand: r.kent_iemand,
    notitie: r.notitie,
    geenKlantReden: r.status === 'geen_klant' && isGeenKlantReden(r.geen_klant_reden) ? r.geen_klant_reden : null,
    gesprokenOp: r.gesproken_op,
    aangemaaktOp: r.aangemaakt_op,
  }
}

function vanRijen(data: unknown): Lead[] {
  return (Array.isArray(data) ? (data as Rij[]) : []).flatMap((r) => {
    const l = vanRij(r)
    return l ? [l] : []
  })
}

function naarRij(l: NieuweLead) {
  return {
    naam: l.naam,
    contact: l.contact,
    locatie: l.club,
    bron: l.bron,
    interesse: l.interesse,
    status: l.status,
    volgende_stap: l.volgendeStap,
    opvolgdatum: l.opvolgdatum,
    review_gevraagd: l.reviewGevraagd,
    referral_gevraagd: l.referralGevraagd,
    kent_iemand: l.kentIemand,
    notitie: l.notitie,
    geen_klant_reden: l.geenKlantReden,
    gesproken_op: l.gesprokenOp,
  }
}

/** De leads van één PT'er, nieuwste eerst. */
export async function haalLeadsVan(admin: SupabaseClient, link: LeadLink, max = 500): Promise<Uitkomst<Lead[]>> {
  const { data, error } = await admin
    .from('pt_leads')
    .select(KOLOMMEN)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .order('gesproken_op', { ascending: false })
    .order('aangemaakt_op', { ascending: false })
    .limit(max)
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: await metLogboek(admin, link.userId, vanRijen(data)) }
}

export async function voegLeadToe(admin: SupabaseClient, link: LeadLink, nieuw: NieuweLead, nu: Date): Promise<Uitkomst<Lead>> {
  const uurGeleden = new Date(nu.getTime() - 60 * 60 * 1000).toISOString()
  const { count, error: telFout } = await admin
    .from('pt_leads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .gte('aangemaakt_op', uurGeleden)
  if (telFout) return { ok: false, reden: 'db' }
  if ((count ?? 0) >= MAX_PER_UUR) return { ok: false, reden: 'te_veel' }

  const { data, error } = await admin
    .from('pt_leads')
    .insert({ user_id: link.userId, persoon_id: link.persoonId, ...naarRij(nieuw) })
    .select(KOLOMMEN)
    .single()
  const lead = !error && data ? vanRij(data as Rij) : null
  return lead ? { ok: true, waarde: { ...lead, logboek: [] } } : { ok: false, reden: 'db' }
}

/** Een lead volledig bijwerken — alleen een lead van déze PT'er. */
export async function wijzigLead(admin: SupabaseClient, link: LeadLink, id: string, lead: NieuweLead): Promise<Uitkomst<Lead>> {
  const { data, error } = await admin
    .from('pt_leads')
    .update({ ...naarRij(lead), bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select(KOLOMMEN)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  const uit = data ? vanRij(data as Rij) : null
  return uit ? { ok: true, waarde: (await metLogboek(admin, link.userId, [uit]))[0] } : { ok: false, reden: 'niet_gevonden' }
}

export async function verwijderLead(admin: SupabaseClient, link: LeadLink, id: string): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('pt_leads')
    .delete()
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select('id')
  if (error) return { ok: false, reden: 'db' }
  return Array.isArray(data) && data.length === 1 ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
}

/** Een lead naar een andere trainer verplaatsen (alleen de beheerder; de aanroeper controleerde de trainer). */
export async function verplaatsLead(admin: SupabaseClient, link: LeadLink, id: string, naarPersoonId: string): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('pt_leads')
    .update({ persoon_id: naarPersoonId, bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select('id')
  if (error) return { ok: false, reden: 'db' }
  return Array.isArray(data) && data.length === 1 ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
}

/** Alle leads van meerdere PT'ers (coachgesprek, team-overzicht), per persoon_id. Bij een fout leeg (best-effort). */
export async function haalLeadsVoor(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, Lead[]>> {
  return (await haalLeadsVoorStrikt(admin, userId, persoonIds)) ?? new Map()
}

/** Als `haalLeadsVoor`, maar null bij een databasefout — voor waar "fout" niet als "niets" mag lijken (export, weekmail). */
export async function haalLeadsVoorStrikt(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, Lead[]> | null> {
  const uit = new Map<string, Lead[]>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_leads')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .in('persoon_id', [...persoonIds])
    .order('aangemaakt_op', { ascending: false })
    .limit(5000)
  if (error) return null
  const rijen = (data ?? []) as (Rij & { persoon_id: string })[]
  const logboeken = await haalLogboeken(admin, userId, rijen.map((r) => r.id))
  for (const r of rijen) {
    const kaal = vanRij(r)
    if (!kaal) continue
    const l = logboeken ? { ...kaal, logboek: logboeken.get(kaal.id) ?? [] } : kaal
    const lijst = uit.get(r.persoon_id) ?? []
    lijst.push(l)
    uit.set(r.persoon_id, lijst)
  }
  return uit
}

// ─── Logboek per lead (migratie 397) ────────────────────────────────────────

/** Zoveel lead-ids per query (de ids gaan in de URL). */
const LOGBOEK_BLOK = 150

/**
 * De logboeken van deze leads, nieuwste notitie eerst. Null = lezen mislukt;
 * de leads zelf blijven dan gewoon zichtbaar, alleen zonder logboek.
 */
async function haalLogboeken(admin: SupabaseClient, userId: string, leadIds: readonly string[]): Promise<Map<string, LeadNotitie[]> | null> {
  const uit = new Map<string, LeadNotitie[]>()
  const blokken: string[][] = []
  for (let i = 0; i < leadIds.length; i += LOGBOEK_BLOK) blokken.push(leadIds.slice(i, i + LOGBOEK_BLOK))
  const antwoorden = await Promise.all(
    blokken.map((ids) =>
      admin.from('pt_leadnotities').select('id, lead_id, datum, tekst, door, aangemaakt_op').eq('user_id', userId).in('lead_id', ids).order('aangemaakt_op', { ascending: false }),
    ),
  )
  if (antwoorden.some((a) => a.error)) return null
  for (const a of antwoorden) {
    for (const r of (a.data ?? []) as (NotitieRij & { lead_id: string })[]) {
      const lijst = uit.get(r.lead_id) ?? []
      lijst.push(vanNotitieRij(r))
      uit.set(r.lead_id, lijst)
    }
  }
  return uit
}

/** Leads met hun logboek erbij (best-effort: lukt het lezen niet, dan zonder). */
async function metLogboek(admin: SupabaseClient, userId: string, leads: Lead[]): Promise<Lead[]> {
  const logboeken = await haalLogboeken(admin, userId, leads.map((l) => l.id))
  return logboeken ? leads.map((l) => ({ ...l, logboek: logboeken.get(l.id) ?? [] })) : leads
}

/** Meer notities bij één lead is eerder een kapotte knop dan een echt verloop. */
const MAX_NOTITIES_PER_LEAD = 200

/** Is dit een lead van déze trainer (link: de PT'er zelf, of "als" de trainer via leadToegang)? */
async function eigenLeadId(admin: SupabaseClient, link: LeadLink, leadId: string): Promise<'ja' | 'nee' | 'db'> {
  const { data, error } = await admin.from('pt_leads').select('id').eq('id', leadId).eq('user_id', link.userId).eq('persoon_id', link.persoonId).maybeSingle()
  return error ? 'db' : data ? 'ja' : 'nee'
}

/**
 * Een notitie bij een lead — alleen een lead van déze trainer (zoals bij
 * wijzigLead). Raakt ook bijgewerkt_op van de lead (de bewaartermijn telt vanaf
 * het laatste contact).
 */
export async function voegLeadNotitieToe(
  admin: SupabaseClient,
  link: LeadLink,
  leadId: string,
  tekst: string,
  datum: string,
  door: string,
): Promise<Uitkomst<LeadNotitie>> {
  const userId = link.userId
  const [eigen, tel] = await Promise.all([
    eigenLeadId(admin, link, leadId),
    admin.from('pt_leadnotities').select('id', { count: 'exact', head: true }).eq('lead_id', leadId).eq('user_id', userId),
  ])
  if (eigen === 'db' || tel.error) return { ok: false, reden: 'db' }
  if (eigen === 'nee') return { ok: false, reden: 'niet_gevonden' }
  if ((tel.count ?? 0) >= MAX_NOTITIES_PER_LEAD) return { ok: false, reden: 'te_veel' }
  const { data, error } = await admin
    .from('pt_leadnotities')
    .insert({ lead_id: leadId, user_id: userId, datum, tekst, door })
    .select('id, datum, tekst, door, aangemaakt_op')
    .single()
  if (error || !data) return { ok: false, reden: 'db' }
  await admin.from('pt_leads').update({ bijgewerkt_op: new Date().toISOString() }).eq('id', leadId).eq('user_id', userId)
  return { ok: true, waarde: vanNotitieRij(data as NotitieRij) }
}

/** Een notitie weghalen (bv. een typfout). Alleen bij een lead van déze trainer. */
export async function verwijderLeadNotitie(admin: SupabaseClient, link: LeadLink, leadId: string, notitieId: string): Promise<Uitkomst<null>> {
  const userId = link.userId
  const eigen = await eigenLeadId(admin, link, leadId)
  if (eigen !== 'ja') return { ok: false, reden: eigen === 'db' ? 'db' : 'niet_gevonden' }
  const { data, error } = await admin
    .from('pt_leadnotities')
    .delete()
    .eq('id', notitieId)
    .eq('lead_id', leadId)
    .eq('user_id', userId)
    .select('id')
  if (error) return { ok: false, reden: 'db' }
  return (data ?? []).length === 0 ? { ok: false, reden: 'niet_gevonden' } : { ok: true, waarde: null }
}
