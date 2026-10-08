// ─── LifeOS — PT-dashboard: klanten met abonnement (SERVER-ONLY) ────────────
// `pt_klanten` (migratie 352). Net als de leads altijd gescoped op de PT'er
// achter de link; de founder-kant leest via `haalKlantenVoor`.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import { isClub } from './clubs'
import { isAbonnement, isKlantStatus, type KlantInvoer, type PtKlant } from './abonnementen'

export type KlantUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' }

const KOLOMMEN = 'id, naam, contact, duo_partner, locatie, abonnement, startdatum, status, opgezegd_op, notitie, lead_id'

interface Rij {
  id: string
  naam: string
  contact: string | null
  duo_partner: string | null
  locatie: string
  abonnement: string
  startdatum: string
  status: string
  opgezegd_op: string | null
  notitie: string | null
  lead_id: string | null
}

function vanRij(r: Rij): PtKlant | null {
  if (!isClub(r.locatie) || !isAbonnement(r.abonnement) || !isKlantStatus(r.status)) return null
  return {
    id: r.id,
    naam: r.naam,
    contact: r.contact,
    duoPartner: r.duo_partner,
    club: r.locatie,
    abonnement: r.abonnement,
    startdatum: r.startdatum,
    status: r.status,
    opgezegdOp: r.opgezegd_op,
    notitie: r.notitie,
    leadId: r.lead_id,
  }
}

function vanRijen(data: unknown): PtKlant[] {
  return (Array.isArray(data) ? (data as Rij[]) : []).flatMap((r) => {
    const k = vanRij(r)
    return k ? [k] : []
  })
}

function naarRij(k: KlantInvoer) {
  return {
    naam: k.naam,
    contact: k.contact,
    duo_partner: k.duoPartner,
    locatie: k.club,
    abonnement: k.abonnement,
    startdatum: k.startdatum,
    status: k.status,
    opgezegd_op: k.opgezegdOp,
    notitie: k.notitie,
    lead_id: k.leadId,
  }
}

export async function haalKlantenVan(admin: SupabaseClient, link: LeadLink): Promise<KlantUitkomst<PtKlant[]>> {
  const { data, error } = await admin
    .from('pt_klanten')
    .select(KOLOMMEN)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .order('startdatum', { ascending: false })
    .limit(500)
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: vanRijen(data) }
}

export async function voegKlantToe(admin: SupabaseClient, link: LeadLink, k: KlantInvoer): Promise<KlantUitkomst<PtKlant>> {
  // Een lead-koppeling alleen als het een lead van déze PT'er is.
  const leadId = k.leadId ? await eigenLead(admin, link, k.leadId) : null
  const { data, error } = await admin
    .from('pt_klanten')
    .insert({ user_id: link.userId, persoon_id: link.persoonId, ...naarRij({ ...k, leadId }) })
    .select(KOLOMMEN)
    .single()
  const uit = !error && data ? vanRij(data as Rij) : null
  return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'db' }
}

export async function wijzigKlant(admin: SupabaseClient, link: LeadLink, id: string, k: KlantInvoer): Promise<KlantUitkomst<PtKlant>> {
  const leadId = k.leadId ? await eigenLead(admin, link, k.leadId) : null
  const { data, error } = await admin
    .from('pt_klanten')
    .update({ ...naarRij({ ...k, leadId }), bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select(KOLOMMEN)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  const uit = data ? vanRij(data as Rij) : null
  return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'niet_gevonden' }
}

export async function verwijderKlant(admin: SupabaseClient, link: LeadLink, id: string): Promise<KlantUitkomst<null>> {
  const { data, error } = await admin
    .from('pt_klanten')
    .delete()
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select('id')
  if (error) return { ok: false, reden: 'db' }
  return Array.isArray(data) && data.length === 1 ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
}

async function eigenLead(admin: SupabaseClient, link: LeadLink, leadId: string): Promise<string | null> {
  const { data } = await admin
    .from('pt_leads')
    .select('id')
    .eq('id', leadId)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .maybeSingle()
  return data ? leadId : null
}

/** Klanten van meerdere PT'ers (team-overzicht, coachgesprek), per persoon_id. Bij een fout leeg (best-effort). */
export async function haalKlantenVoor(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, PtKlant[]>> {
  return (await haalKlantenVoorStrikt(admin, userId, persoonIds)) ?? new Map()
}

/** Als `haalKlantenVoor`, maar null bij een databasefout (export, weekmail). */
export async function haalKlantenVoorStrikt(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, PtKlant[]> | null> {
  const uit = new Map<string, PtKlant[]>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_klanten')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .in('persoon_id', [...persoonIds])
    .order('startdatum', { ascending: false })
    .limit(5000)
  if (error) return null
  for (const r of (data ?? []) as (Rij & { persoon_id: string })[]) {
    const k = vanRij(r)
    if (!k) continue
    const lijst = uit.get(r.persoon_id) ?? []
    lijst.push(k)
    uit.set(r.persoon_id, lijst)
  }
  return uit
}
