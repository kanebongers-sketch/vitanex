// ─── LifeOS — PT-dashboard: klanten met abonnement (SERVER-ONLY) ────────────
// `pt_klanten` (migratie 352). Net als de leads altijd gescoped op de PT'er
// achter de link; de founder-kant leest via `haalKlantenVoor`.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import { isClub } from './clubs'
import { isAbonnement, isKlantStatus, isStopReden, type KlantInvoer, type PtKlant } from './abonnementen'

export type KlantUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' | 'te_veel' }

/** Zoveel nieuwe klanten per uur per trainer; meer is eerder een kapotte knop of misbruik (zelfde grens als leads). */
export const MAX_KLANTEN_PER_UUR = 40

const KOLOMMEN = 'id, naam, contact, duo_partner, locatie, abonnement, startdatum, status, opgezegd_op, notitie, lead_id, prijs_afwijkend, stop_reden'

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
  prijs_afwijkend: number | string | null
  stop_reden: string | null
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
    // numeric komt als string uit PostgREST.
    prijsAfwijkend: r.prijs_afwijkend === null ? null : Number(r.prijs_afwijkend),
    stopReden: isStopReden(r.stop_reden) ? r.stop_reden : null,
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
    stop_reden: k.stopReden,
    // Alleen meesturen als hij in de invoer zat; anders blijft de opgeslagen prijs staan.
    ...(k.prijsAfwijkend !== undefined ? { prijs_afwijkend: k.prijsAfwijkend } : {}),
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

export async function voegKlantToe(admin: SupabaseClient, link: LeadLink, k: KlantInvoer, nu = new Date()): Promise<KlantUitkomst<PtKlant>> {
  const uurGeleden = new Date(nu.getTime() - 60 * 60 * 1000).toISOString()
  const { count, error: telFout } = await admin
    .from('pt_klanten')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .gte('aangemaakt_op', uurGeleden)
  if (telFout) return { ok: false, reden: 'db' }
  if ((count ?? 0) >= MAX_KLANTEN_PER_UUR) return { ok: false, reden: 'te_veel' }

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

/** De tabellen die per klant een `persoon_id` (trainer) dragen en met de klant mee verhuizen. */
const DOSSIER_TABELLEN = ['pt_intakes', 'pt_metingen'] as const

/**
 * Een klant naar een andere trainer verplaatsen (alleen de beheerder; de
 * aanroeper controleerde de trainer). Het dossier (intake, metingen) verhuist
 * mee: anders ziet de nieuwe trainer een leeg dossier en houdt de oude trainer
 * rechten op gezondheidsgegevens van een klant die niet meer van hem is. De
 * klant-rij gaat eerst (compare-and-set op de oude trainer, dus twee gelijktijdige
 * verplaatsingen kunnen niet allebei slagen); migratie 361 bewaakt dezelfde
 * invariant ook in de database.
 */
export async function verplaatsKlant(admin: SupabaseClient, link: LeadLink, id: string, naarPersoonId: string): Promise<KlantUitkomst<null>> {
  const { data, error } = await admin
    .from('pt_klanten')
    .update({ persoon_id: naarPersoonId, bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select('id')
  if (error) return { ok: false, reden: 'db' }
  if (!Array.isArray(data) || data.length !== 1) return { ok: false, reden: 'niet_gevonden' }
  for (const tabel of DOSSIER_TABELLEN) {
    const { error: fout } = await admin
      .from(tabel)
      .update({ persoon_id: naarPersoonId })
      .eq('klant_id', id)
      .eq('user_id', link.userId)
      .eq('persoon_id', link.persoonId)
    if (fout) return { ok: false, reden: 'db' }
  }
  return { ok: true, waarde: null }
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
