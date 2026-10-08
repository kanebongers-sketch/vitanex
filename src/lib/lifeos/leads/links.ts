// ─── LifeOS — PT-dashboard: link, pincode en sessie (SERVER-ONLY) ────────────
// Elke PT'er heeft een eigen pagina: mentaforce.nl/<naam> (bv. /joey). De naam is
// te raden, dus alles daarachter zit achter een pincode die de PT'er zelf kiest
// en Kane goedkeurt (migratie 351); daarna één keer inloggen per toestel.
// Een user_id, persoon_id of pin-hash gaat nooit naar de browser.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { CODE_PATROON, isPinStatus, linkCodeVoor, type PinActie, type PinStatus } from './leads'
import { SESSIE_DAGEN, hashPin, nieuwSessieToken, pinKlopt, tokenHash } from './pin'

/** `pt` = een PT'er met eigen leads en klanten; `eigenaar` = kijkt mee met het hele team (alleen lezen). */
export type LinkRol = 'pt' | 'eigenaar'

export interface LeadLink {
  rol: LinkRol
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

const LINK_KOLOMMEN = 'rol, user_id, persoon_id, code, actief, pin_hash, pin_status, mislukt, geblokkeerd_tot'

/** Bij welke CRM-groep elke rol hoort: een PT'er zit in het PT-team, een eigenaar in management. */
const GROEP_VOOR_ROL: Record<LinkRol, string> = { pt: 'pt_team', eigenaar: 'management' }

/**
 * De PT'er (of eigenaar) achter een code — alleen als de link actief is en de
 * persoon nog actief in de bijbehorende CRM-groep staat (PT-team of management).
 */
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
  const rol: LinkRol = link.rol === 'eigenaar' ? 'eigenaar' : 'pt'
  if (!p || p.groep !== GROEP_VOOR_ROL[rol] || p.status === 'inactief' || isVergadering(p.naam)) return null
  return {
    rol,
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

/** Een eigenaar met zijn link, voor het PT-team-overzicht in LifeOS (pin goedkeuren). */
export interface EigenaarLink extends LinkInfo {
  id: string
  naam: string
}

/** De actieve eigenaren (rol `eigenaar`, CRM-groep management) met hun link. Null = lezen mislukt. */
export async function haalEigenaren(admin: SupabaseClient, userId: string): Promise<EigenaarLink[] | null> {
  const { data: links, error } = await admin
    .from('pt_lead_links')
    .select('persoon_id, code, pin_status, pin_aangevraagd_op')
    .eq('user_id', userId)
    .eq('rol', 'eigenaar')
    .eq('actief', true)
  if (error || !Array.isArray(links)) return null
  const rijen = links as { persoon_id: string; code: string; pin_status: string; pin_aangevraagd_op: string | null }[]
  if (rijen.length === 0) return []
  const { data: personen, error: fout } = await admin
    .from('crm_personen')
    .select('id, naam, groep, status')
    .eq('user_id', userId)
    .in('id', rijen.map((r) => r.persoon_id))
  if (fout) return null
  const naamVan = new Map(
    ((personen ?? []) as { id: string; naam: string; groep: string; status: string }[])
      .filter((p) => p.groep === GROEP_VOOR_ROL.eigenaar && p.status !== 'inactief')
      .map((p) => [p.id, p.naam]),
  )
  return rijen.flatMap((r) => {
    const naam = naamVan.get(r.persoon_id)
    return naam
      ? [{ id: r.persoon_id, naam, code: r.code, pinStatus: isPinStatus(r.pin_status) ? r.pin_status : 'geen', pinAangevraagdOp: r.pin_aangevraagd_op }]
      : []
  })
}

/** Voor de ochtendmail: wie (PT'er of eigenaar) koos een pincode die nog op jouw goedkeuring wacht? */
export async function pinSignalen(
  admin: SupabaseClient,
  userId: string,
  team: readonly { id: string; naam: string }[],
): Promise<{ naam: string; tekst: string }[]> {
  const [{ data, error }, eigenaren] = await Promise.all([
    team.length === 0
      ? Promise.resolve({ data: [] as { persoon_id: string }[], error: null })
      : admin.from('pt_lead_links').select('persoon_id').eq('user_id', userId).eq('pin_status', 'wacht').in('persoon_id', team.map((p) => p.id)),
    haalEigenaren(admin, userId),
  ])
  const wacht = new Set(error || !Array.isArray(data) ? [] : (data as { persoon_id: string }[]).map((r) => r.persoon_id))
  const pts = team
    .filter((p) => wacht.has(p.id))
    .map((p) => ({ naam: p.naam, tekst: `${p.naam} koos een pincode voor de lead tracker — keur goed op je dashboard (PT-gesprekken).` }))
  const eig = (eigenaren ?? [])
    .filter((e) => e.pinStatus === 'wacht')
    .map((e) => ({ naam: e.naam, tekst: `${e.naam} (eigenaar) koos een pincode voor de PT-app — keur goed bij PT-team.` }))
  return [...pts, ...eig]
}

/** Voor de publieke /FitFactoryPT-pagina: elke actieve PT'er met zijn link, op naam. Alleen voornaam + code. */
export async function haalActieveLinks(admin: SupabaseClient): Promise<{ code: string; naam: string }[]> {
  const { data: links, error } = await admin.from('pt_lead_links').select('persoon_id, code').eq('actief', true)
  if (error || !Array.isArray(links) || links.length === 0) return []
  const rijen = links as { persoon_id: string; code: string }[]
  const { data: personen } = await admin
    .from('crm_personen')
    .select('id, naam, groep, status')
    .in('id', rijen.map((l) => l.persoon_id))
  const actief = new Map(
    ((personen ?? []) as { id: string; naam: string; groep: string; status: string }[])
      .filter((p) => p.groep === 'pt_team' && p.status !== 'inactief' && !isVergadering(p.naam))
      .map((p) => [p.id, p.naam.split(' ')[0]]),
  )
  return rijen
    .flatMap((l) => {
      const naam = actief.get(l.persoon_id)
      return naam ? [{ code: l.code, naam }] : []
    })
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

/** Dit toestel uitloggen: de sessie verdwijnt uit de database. */
export async function logUit(admin: SupabaseClient, token: string): Promise<void> {
  if (token.length > 100) return
  await admin.from('pt_lead_sessies').delete().eq('token_hash', tokenHash(token))
}
