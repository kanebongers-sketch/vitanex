// ─── LifeOS — lead tracker: opslag ──────────────────────────────────────────
// SERVER-ONLY. Leest en schrijft `pt_lead_links` + `pt_leads` (migratie 350) op
// het LifeOS-project via de service-role. De publieke lead-pagina komt binnen
// met de naam-code (/lead/joey) én — voor alles met leads — een geldige sessie,
// verkregen met de pincode die de PT'er zelf koos en Kane goedkeurde (migratie
// 351). Een user_id, persoon_id of pin-hash gaat nooit naar de browser.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { CODE_PATROON, isBron, isPinStatus, isStatus, linkCodeVoor, type Lead, type LeadStatus, type NieuweLead, type PinActie, type PinStatus } from './leads'
import { SESSIE_DAGEN, hashPin, nieuwSessieToken, pinKlopt, tokenHash } from './pin'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'te_veel' | 'niet_gevonden' }

/** Zoveel leads per uur per PT'er; meer is eerder een kapotte knop of misbruik. */
const MAX_PER_UUR = 30

const KOLOMMEN = 'id, naam, contact, bron, status, notitie, gesproken_op, aangemaakt_op'

interface Rij {
  id: string
  naam: string
  contact: string | null
  bron: string
  status: string
  notitie: string | null
  gesproken_op: string
  aangemaakt_op: string
}

function vanRij(r: Rij): Lead | null {
  if (!isBron(r.bron) || !isStatus(r.status)) return null
  return { id: r.id, naam: r.naam, contact: r.contact, bron: r.bron, status: r.status, notitie: r.notitie, gesprokenOp: r.gesproken_op, aangemaaktOp: r.aangemaakt_op }
}

function vanRijen(data: unknown): Lead[] {
  return (Array.isArray(data) ? (data as Rij[]) : []).flatMap((r) => {
    const l = vanRij(r)
    return l ? [l] : []
  })
}

export interface LeadLink {
  userId: string
  persoonId: string
  code: string
  /** Voornaam van de PT'er, voor de begroeting op de pagina. */
  naam: string
  pinStatus: PinStatus
  /** SERVER-ONLY: nooit naar de browser. */
  pinHash: string | null
  mislukt: number
  geblokkeerdTot: string | null
}

const LINK_KOLOMMEN = 'user_id, persoon_id, code, actief, pin_hash, pin_status, mislukt, geblokkeerd_tot'

/** De PT'er achter een code — alleen als de link actief is en hij nog in je actieve PT-team staat. */
export async function vindLink(admin: SupabaseClient, code: string): Promise<LeadLink | null> {
  if (!CODE_PATROON.test(code)) return null
  const { data: link, error } = await admin.from('pt_lead_links').select(LINK_KOLOMMEN).eq('code', code).maybeSingle()
  if (error || !link || link.actief !== true) return null

  const { data: p } = await admin
    .from('crm_personen')
    .select('naam, groep, status')
    .eq('id', link.persoon_id)
    .eq('user_id', link.user_id)
    .maybeSingle()
  if (!p || p.groep !== 'pt_team' || p.status === 'inactief' || isVergadering(p.naam)) return null
  return {
    userId: link.user_id,
    persoonId: link.persoon_id,
    code: link.code,
    naam: String(p.naam).split(' ')[0],
    pinStatus: isPinStatus(link.pin_status) ? link.pin_status : 'geen',
    pinHash: link.pin_hash,
    mislukt: link.mislukt ?? 0,
    geblokkeerdTot: link.geblokkeerd_tot,
  }
}

// ─── Pincode ──────────────────────────────────────────────────────────────────

/** Na zoveel foute pogingen gaat de link even dicht. */
const MAX_POGINGEN = 5
const BLOKKADE_MIN = 15

/** De PT'er kiest een pin. Alleen als er nog geen is (of Kane 'm afwees/resette). */
export async function kiesPin(admin: SupabaseClient, link: LeadLink, pin: string, nu: Date): Promise<'ok' | 'al_gekozen' | 'db'> {
  if (link.pinStatus !== 'geen') return 'al_gekozen'
  const { data, error } = await admin
    .from('pt_lead_links')
    .update({ pin_hash: hashPin(pin), pin_status: 'wacht', pin_aangevraagd_op: nu.toISOString(), mislukt: 0, geblokkeerd_tot: null })
    .eq('persoon_id', link.persoonId)
    .eq('pin_status', 'geen')
    .select('persoon_id')
  if (error) return 'db'
  return Array.isArray(data) && data.length === 1 ? 'ok' : 'al_gekozen'
}

export type InlogUitkomst =
  | { staat: 'ok'; token: string; verlooptOp: Date }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'niet_actief' }
  | { staat: 'db' }

/** Pin controleren; goed → een nieuw sessietoken voor dit toestel. */
export async function logIn(admin: SupabaseClient, link: LeadLink, pin: string, nu: Date): Promise<InlogUitkomst> {
  if (link.pinStatus !== 'actief') return { staat: 'niet_actief' }
  if (link.geblokkeerdTot && new Date(link.geblokkeerdTot).getTime() > nu.getTime()) return { staat: 'geblokkeerd', totOp: link.geblokkeerdTot }

  // Eerst een poging RESERVEREN (compare-and-set op de teller), dan pas de pin
  // checken. Zo kunnen tien parallelle verzoeken niet allemaal "poging 1" zijn:
  // wie de race verliest, krijgt geen pincheck.
  const poging = link.mislukt + 1
  const { data: gereserveerd, error: resFout } = await admin
    .from('pt_lead_links')
    .update({ mislukt: poging })
    .eq('persoon_id', link.persoonId)
    .eq('mislukt', link.mislukt)
    .select('persoon_id')
  if (resFout) return { staat: 'db' }
  if (!Array.isArray(gereserveerd) || gereserveerd.length !== 1) return { staat: 'fout', over: Math.max(0, MAX_POGINGEN - poging) }

  if (!pinKlopt(pin, link.pinHash)) {
    if (poging < MAX_POGINGEN) return { staat: 'fout', over: MAX_POGINGEN - poging }
    const totOp = new Date(nu.getTime() + BLOKKADE_MIN * 60_000).toISOString()
    await admin.from('pt_lead_links').update({ mislukt: 0, geblokkeerd_tot: totOp }).eq('persoon_id', link.persoonId)
    return { staat: 'geblokkeerd', totOp }
  }

  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + SESSIE_DAGEN * 24 * 60 * 60 * 1000)
  const { error } = await admin
    .from('pt_lead_sessies')
    .insert({ token_hash: tokenHash(token), persoon_id: link.persoonId, verloopt_op: verlooptOp.toISOString() })
  if (error) return { staat: 'db' }
  await admin.from('pt_lead_links').update({ mislukt: 0, geblokkeerd_tot: null }).eq('persoon_id', link.persoonId)
  return { staat: 'ok', token, verlooptOp }
}

/** Is dit toestel ingelogd op déze link (en is de pin nog actief)? */
export async function sessieGeldig(admin: SupabaseClient, link: LeadLink, token: string | undefined, nu: Date): Promise<boolean> {
  if (!token || link.pinStatus !== 'actief' || token.length > 100) return false
  const { data } = await admin
    .from('pt_lead_sessies')
    .select('persoon_id, verloopt_op')
    .eq('token_hash', tokenHash(token))
    .maybeSingle()
  return !!data && data.persoon_id === link.persoonId && new Date(data.verloopt_op).getTime() > nu.getTime()
}

/**
 * Kane in het dashboard: een gekozen pin goedkeuren of afwijzen, of resetten
 * (vergeten pin → de PT'er kiest een nieuwe; alle toestellen worden uitgelogd).
 */
export async function beoordeelPin(admin: SupabaseClient, userId: string, persoonId: string, actie: PinActie): Promise<'ok' | 'niet_gevonden' | 'db'> {
  const basis = admin.from('pt_lead_links')
  const query = actie === 'goedkeuren'
    ? basis.update({ pin_status: 'actief', mislukt: 0, geblokkeerd_tot: null }).eq('pin_status', 'wacht')
    : basis.update({ pin_status: 'geen', pin_hash: null, pin_aangevraagd_op: null, mislukt: 0, geblokkeerd_tot: null })
  const { data, error } = await query.eq('user_id', userId).eq('persoon_id', persoonId).select('persoon_id')
  if (error) return 'db'
  if (!Array.isArray(data) || data.length === 0) return 'niet_gevonden'
  if (actie !== 'goedkeuren') await admin.from('pt_lead_sessies').delete().eq('persoon_id', persoonId)
  return 'ok'
}

// ─── Leads ────────────────────────────────────────────────────────────────────

/** De leads van één PT'er, nieuwste eerst. */
export async function haalLeadsVan(admin: SupabaseClient, link: LeadLink, max = 100): Promise<Uitkomst<Lead[]>> {
  const { data, error } = await admin
    .from('pt_leads')
    .select(KOLOMMEN)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
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
    .insert({
      user_id: link.userId,
      persoon_id: link.persoonId,
      naam: nieuw.naam,
      contact: nieuw.contact,
      bron: nieuw.bron,
      status: nieuw.status,
      notitie: nieuw.notitie,
      gesproken_op: nieuw.gesprokenOp,
    })
    .select(KOLOMMEN)
    .single()
  const lead = !error && data ? vanRij(data as Rij) : null
  return lead ? { ok: true, waarde: lead } : { ok: false, reden: 'db' }
}

/** Status bijwerken — alleen een lead van déze PT'er. */
export async function wijzigLeadStatus(admin: SupabaseClient, link: LeadLink, id: string, status: LeadStatus): Promise<Uitkomst<Lead>> {
  const { data, error } = await admin
    .from('pt_leads')
    .update({ status, bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .select(KOLOMMEN)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  const lead = data ? vanRij(data as Rij) : null
  return lead ? { ok: true, waarde: lead } : { ok: false, reden: 'niet_gevonden' }
}

/** Wat het dashboard per PT'er over zijn lead-link weet. */
export interface LinkInfo {
  code: string
  pinStatus: PinStatus
  pinAangevraagdOp: string | null
}

/**
 * Elke PT'er in `team` heeft een link (/lead/<naam>); ontbrekende worden
 * aangemaakt. Geeft persoon_id → info terug. Een vergadering ("Vergadering Fit
 * Factory") is geen persoon en krijgt geen link.
 */
export async function zorgVoorLinks(
  admin: SupabaseClient,
  userId: string,
  team: readonly { id: string; naam: string }[],
): Promise<Map<string, LinkInfo>> {
  const mensen = team.filter((p) => !isVergadering(p.naam))
  const uit = new Map<string, LinkInfo>()
  if (mensen.length === 0) return uit
  const { data, error } = await admin.from('pt_lead_links').select('persoon_id, code, actief, pin_status, pin_aangevraagd_op')
  if (error) return uit
  const rijen = (data ?? []) as { persoon_id: string; code: string; actief: boolean; pin_status: string; pin_aangevraagd_op: string | null }[]
  const bezet = new Set(rijen.map((r) => r.code))
  for (const r of rijen) {
    if (r.actief) uit.set(r.persoon_id, { code: r.code, pinStatus: isPinStatus(r.pin_status) ? r.pin_status : 'geen', pinAangevraagdOp: r.pin_aangevraagd_op })
  }
  const bekend = new Set(rijen.map((r) => r.persoon_id))
  const nieuw = mensen.filter((p) => !bekend.has(p.id)).map((p) => {
    const code = linkCodeVoor(p.naam, bezet)
    bezet.add(code)
    return { persoon_id: p.id, user_id: userId, code }
  })
  if (nieuw.length > 0) {
    const { error: fout } = await admin.from('pt_lead_links').insert(nieuw)
    if (!fout) for (const n of nieuw) uit.set(n.persoon_id, { code: n.code, pinStatus: 'geen', pinAangevraagdOp: null })
  }
  return uit
}

/** Alle leads van meerdere PT'ers (voor het coachgesprek), per persoon_id. */
export async function haalLeadsVoor(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, Lead[]>> {
  const uit = new Map<string, Lead[]>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_leads')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .in('persoon_id', [...persoonIds])
    .order('aangemaakt_op', { ascending: false })
    .limit(2000)
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

/** Voor de ochtendmail: wie koos een pincode die nog op jouw goedkeuring wacht? */
export async function pinSignalen(
  admin: SupabaseClient,
  userId: string,
  team: readonly { id: string; naam: string }[],
): Promise<{ naam: string; tekst: string }[]> {
  if (team.length === 0) return []
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('persoon_id')
    .eq('user_id', userId)
    .eq('pin_status', 'wacht')
    .in('persoon_id', team.map((p) => p.id))
  if (error || !Array.isArray(data)) return []
  const wacht = new Set((data as { persoon_id: string }[]).map((r) => r.persoon_id))
  return team
    .filter((p) => wacht.has(p.id))
    .map((p) => ({ naam: p.naam, tekst: `${p.naam} koos een pincode voor de lead tracker — keur goed op je dashboard (PT-gesprekken).` }))
}
