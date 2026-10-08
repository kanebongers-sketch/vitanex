// ─── LifeOS — lead tracker: opslag (SERVER-ONLY) ────────────────────────────
// Leest en schrijft `pt_leads` (migraties 350 + 352) via de service-role. Elke
// schrijfactie is gescoped op de PT'er achter de link (`LeadLink`): een PT'er
// kan nooit een lead van een ander zien of wijzigen. Toegang: zie links.ts.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isClub } from '@/lib/lifeos/pt-dashboard/clubs'
import { isBron, isInteresse, isStap, isStatus, type Lead, type NieuweLead } from './leads'
import type { LeadLink } from './links'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'te_veel' | 'niet_gevonden' }

/** Zoveel nieuwe leads per uur per PT'er; meer is eerder een kapotte knop of misbruik. */
const MAX_PER_UUR = 40

const KOLOMMEN =
  'id, naam, contact, locatie, bron, interesse, status, volgende_stap, opvolgdatum, review_gevraagd, referral_gevraagd, kent_iemand, notitie, gesproken_op, aangemaakt_op'

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
  gesproken_op: string
  aangemaakt_op: string
}

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
  return { ok: true, waarde: vanRijen(data) }
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
  return lead ? { ok: true, waarde: lead } : { ok: false, reden: 'db' }
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
  return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'niet_gevonden' }
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

/** Alle leads van meerdere PT'ers (coachgesprek, team-overzicht), per persoon_id. */
export async function haalLeadsVoor(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, Lead[]>> {
  const uit = new Map<string, Lead[]>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_leads')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .in('persoon_id', [...persoonIds])
    .order('aangemaakt_op', { ascending: false })
    .limit(5000)
  if (error) return uit
  for (const r of (data ?? []) as (Rij & { persoon_id: string })[]) {
    const l = vanRij(r)
    if (!l) continue
    const lijst = uit.get(r.persoon_id) ?? []
    lijst.push(l)
    uit.set(r.persoon_id, lijst)
  }
  return uit
}
