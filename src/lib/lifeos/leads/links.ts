// ─── LifeOS — PT-dashboard: link, pincode en sessie (SERVER-ONLY) ────────────
// Elke PT'er heeft een eigen pagina: mentaforce.nl/<naam> (bv. /joey). De naam is
// te raden, dus alles daarachter zit achter een pincode die de PT'er zelf kiest
// en Kane goedkeurt (migratie 351); daarna één keer inloggen per toestel.
// Een user_id, persoon_id of pin-hash gaat nooit naar de browser.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isVergadering } from '@/lib/lifeos/agenda/vergadering'
import { CODE_PATROON, isPinStatus, linkCodeVoor, type PinActie, type PinStatus } from './leads'
import {
  BEHEER_SESSIE_UUR, MAX_BLOKKADES, MAX_POGINGEN, MAX_SESSIES_PER_PERSOON, SESSIE_AANRAAK_MS, SESSIE_DAGEN, SESSIE_INACTIEF_DAGEN,
  blokkadeDuurMin, controleCode, hashPin, nieuwSessieToken, pinKlopt, tokenHash,
} from './pin'

/**
 * `pt` = een PT'er met eigen leads en klanten; `eigenaar` = kijkt mee met het
 * hele team (alleen lezen, eigen pincode); `beheerder` = Kane: ziet alles wat een
 * eigenaar ziet plus het beheer, en logt in via zijn MentaForce-hoofdaccount
 * (geen pincode — `pin_hash` blijft leeg, dus inloggen met een pin kan niet).
 */
export type LinkRol = 'pt' | 'eigenaar' | 'beheerder'

/** Kijkt deze rol mee met het hele team (eigenaar of beheerder)? */
export function kijktMee(rol: LinkRol): boolean {
  return rol !== 'pt'
}

function leesRol(v: unknown): LinkRol {
  return v === 'eigenaar' || v === 'beheerder' ? v : 'pt'
}

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
  /** Hoe vaak de link achter elkaar geblokkeerd raakte (migratie 361); een goede pin of een reset zet 'm op 0. */
  blokkades: number
}

const LINK_KOLOMMEN = 'rol, user_id, persoon_id, code, actief, pin_hash, pin_status, mislukt, geblokkeerd_tot, blokkades'

/** Bij welke CRM-groep elke rol hoort: een PT'er zit in het PT-team, een eigenaar in management. */
const GROEP_VOOR_ROL: Record<LinkRol, string> = { pt: 'pt_team', eigenaar: 'management', beheerder: 'management' }

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
  const rol = leesRol(link.rol)
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
    blokkades: typeof link.blokkades === 'number' ? link.blokkades : 0,
  }
}

/** Een beheerder logt in via zijn hoofdaccount: op zijn link bestaat geen pincode, nooit. */
function zonderPincode(link: Pick<LeadLink, 'rol'>): boolean {
  return link.rol === 'beheerder'
}

// ─── Pincode ──────────────────────────────────────────────────────────────────

/** Tellers schoon: na een goede pin, een goedkeuring of een reset. */
const TELLERS_SCHOON = { mislukt: 0, geblokkeerd_tot: null, blokkades: 0 } as const

/**
 * De PT'er kiest een pin. Alleen als er nog geen is (of Kane 'm afwees/resette),
 * en nooit op een beheerderslink (die heeft geen pincode).
 */
export type KiesUitkomst = { staat: 'ok'; controle: string } | { staat: 'al_gekozen' } | { staat: 'geen_pincode' } | { staat: 'db' }

export async function kiesPin(admin: SupabaseClient, link: LeadLink, pin: string, nu: Date): Promise<KiesUitkomst> {
  if (zonderPincode(link)) return { staat: 'geen_pincode' }
  if (link.pinStatus !== 'geen') return { staat: 'al_gekozen' }
  const hash = hashPin(pin)
  const { data, error } = await admin
    .from('pt_lead_links')
    .update({ pin_hash: hash, pin_status: 'wacht', pin_aangevraagd_op: nu.toISOString(), ...TELLERS_SCHOON })
    .eq('persoon_id', link.persoonId)
    .eq('pin_status', 'geen')
    .neq('rol', 'beheerder')
    .select('persoon_id')
  if (error) return { staat: 'db' }
  return Array.isArray(data) && data.length === 1 ? { staat: 'ok', controle: controleCode(hash) } : { staat: 'al_gekozen' }
}

export type InlogUitkomst =
  | { staat: 'ok'; token: string; verlooptOp: Date }
  | { staat: 'fout'; over: number }
  | { staat: 'geblokkeerd'; totOp: string }
  /** Te vaak geblokkeerd: dicht tot Kane de pincode reset. */
  | { staat: 'gesloten' }
  | { staat: 'niet_actief' }
  /** Een beheerderslink: inloggen gaat via het hoofdaccount. */
  | { staat: 'geen_pincode' }
  | { staat: 'db' }

/**
 * Pin controleren; goed → een nieuw sessietoken voor dit toestel.
 *
 * Bruteforce-rem in drie lagen (migraties 351 + 361):
 *   1. na MAX_POGINGEN foute pogingen een blokkade die per keer verdubbelt;
 *   2. na MAX_BLOKKADES blokkades gaat de link dicht tot Kane reset;
 *   3. de route erboven remt daarnaast per IP (toegang.ts).
 */
export async function logIn(admin: SupabaseClient, link: LeadLink, pin: string, nu: Date): Promise<InlogUitkomst> {
  if (zonderPincode(link)) return { staat: 'geen_pincode' }
  if (link.pinStatus !== 'actief') return { staat: 'niet_actief' }
  if (link.blokkades >= MAX_BLOKKADES) return { staat: 'gesloten' }
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
    return blokkeer(admin, link, nu)
  }

  const sessie = await maakSessie(admin, link.persoonId, nu)
  if (!sessie) return { staat: 'db' }
  await admin.from('pt_lead_links').update(TELLERS_SCHOON).eq('persoon_id', link.persoonId)
  return { staat: 'ok', ...sessie }
}

/** De zoveelste blokkade: langer dicht dan de vorige keer, en na de laatste helemaal. */
async function blokkeer(admin: SupabaseClient, link: LeadLink, nu: Date): Promise<InlogUitkomst> {
  const blokkades = link.blokkades + 1
  const gesloten = blokkades >= MAX_BLOKKADES
  const totOp = gesloten ? null : new Date(nu.getTime() + blokkadeDuurMin(blokkades) * 60_000).toISOString()
  const { error } = await admin
    .from('pt_lead_links')
    .update({ mislukt: 0, geblokkeerd_tot: totOp, blokkades })
    .eq('persoon_id', link.persoonId)
  if (error) return { staat: 'db' }
  return totOp ? { staat: 'geblokkeerd', totOp } : { staat: 'gesloten' }
}

// ─── Sessies ──────────────────────────────────────────────────────────────────

interface NieuweSessie {
  token: string
  verlooptOp: Date
}

/**
 * Eén nieuwe sessie voor een toestel: alleen de hash gaat de database in. Ruimt
 * meteen op wat deze persoon niet meer nodig heeft (verlopen rijen, te veel
 * toestellen), zodat de tabel niet eindeloos groeit en een gelekte pin niet
 * onbeperkt toestellen kan aanmelden.
 */
async function maakSessie(admin: SupabaseClient, persoonId: string, nu: Date, duurMs = SESSIE_DAGEN * 24 * 60 * 60 * 1000): Promise<NieuweSessie | null> {
  const token = nieuwSessieToken()
  const verlooptOp = new Date(nu.getTime() + duurMs)
  const { error } = await admin.from('pt_lead_sessies').insert({
    token_hash: tokenHash(token),
    persoon_id: persoonId,
    verloopt_op: verlooptOp.toISOString(),
    laatst_gebruikt_op: nu.toISOString(),
  })
  if (error) return null
  await snoeiSessies(admin, persoonId, nu)
  return { token, verlooptOp }
}

/** Verlopen sessies weg; daarna blijven hooguit MAX_SESSIES_PER_PERSOON van de nieuwste over. */
async function snoeiSessies(admin: SupabaseClient, persoonId: string, nu: Date): Promise<void> {
  await admin.from('pt_lead_sessies').delete().eq('persoon_id', persoonId).lt('verloopt_op', nu.toISOString())
  const { data } = await admin
    .from('pt_lead_sessies')
    .select('token_hash')
    .eq('persoon_id', persoonId)
    .order('aangemaakt_op', { ascending: false })
    .range(MAX_SESSIES_PER_PERSOON, MAX_SESSIES_PER_PERSOON + 99)
  const teVeel = (Array.isArray(data) ? (data as { token_hash: string }[]) : []).map((r) => r.token_hash)
  if (teVeel.length > 0) await admin.from('pt_lead_sessies').delete().in('token_hash', teVeel)
}

/**
 * Is dit toestel ingelogd op déze link (en is de pin nog actief)? Een sessie
 * verloopt hard na SESSIE_DAGEN en zacht na SESSIE_INACTIEF_DAGEN zonder gebruik;
 * "laatst gebruikt" wordt hooguit één keer per uur bijgewerkt.
 */
export async function sessieGeldig(admin: SupabaseClient, link: LeadLink, token: string | undefined, nu: Date): Promise<boolean> {
  if (!token || link.pinStatus !== 'actief' || token.length > 100) return false
  const hash = tokenHash(token)
  const { data } = await admin
    .from('pt_lead_sessies')
    .select('persoon_id, verloopt_op, laatst_gebruikt_op, aangemaakt_op')
    .eq('token_hash', hash)
    .maybeSingle()
  if (!data || data.persoon_id !== link.persoonId) return false

  const t = nu.getTime()
  const laatst = new Date(data.laatst_gebruikt_op ?? data.aangemaakt_op).getTime()
  const verlopen = new Date(data.verloopt_op).getTime() <= t || Number.isNaN(laatst) || t - laatst > SESSIE_INACTIEF_DAGEN * 24 * 60 * 60 * 1000
  if (verlopen) {
    await admin.from('pt_lead_sessies').delete().eq('token_hash', hash)
    return false
  }
  if (t - laatst > SESSIE_AANRAAK_MS) {
    await admin.from('pt_lead_sessies').update({ laatst_gebruikt_op: nu.toISOString() }).eq('token_hash', hash)
  }
  return true
}

/**
 * Kane in het dashboard: een gekozen pin goedkeuren of afwijzen, of resetten
 * (vergeten pin of dichtgelopen link → de PT'er kiest een nieuwe; alle toestellen
 * worden uitgelogd). Nooit op een beheerderslink: die heeft geen pincode, en een
 * reset zou 'm buitenspel zetten.
 */
export async function beoordeelPin(admin: SupabaseClient, userId: string, persoonId: string, actie: PinActie): Promise<'ok' | 'niet_gevonden' | 'db'> {
  const basis = admin.from('pt_lead_links')
  const query = actie === 'goedkeuren'
    ? basis.update({ pin_status: 'actief', ...TELLERS_SCHOON }).eq('pin_status', 'wacht')
    : basis.update({ pin_status: 'geen', pin_hash: null, pin_aangevraagd_op: null, ...TELLERS_SCHOON })
  const { data, error } = await query.eq('user_id', userId).eq('persoon_id', persoonId).neq('rol', 'beheerder').select('persoon_id')
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
  /** Bij een pin die op goedkeuring wacht: de controlecode om na te vragen (zie `controleCode`). */
  controle?: string
}

/** De controlecode alleen bij een wachtende pin; de hash zelf verlaat de server nooit. */
function controleVoor(pinStatus: string, pinHash: string | null): { controle?: string } {
  return pinStatus === 'wacht' && pinHash ? { controle: controleCode(pinHash) } : {}
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
  const { data, error } = await admin.from('pt_lead_links').select('persoon_id, code, actief, pin_status, pin_aangevraagd_op, pin_hash')
  if (error) return uit
  const rijen = (data ?? []) as { persoon_id: string; code: string; actief: boolean; pin_status: string; pin_aangevraagd_op: string | null; pin_hash: string | null }[]
  const bezet = new Set(rijen.map((r) => r.code))
  for (const r of rijen) {
    if (r.actief) uit.set(r.persoon_id, { code: r.code, pinStatus: isPinStatus(r.pin_status) ? r.pin_status : 'geen', pinAangevraagdOp: r.pin_aangevraagd_op, ...controleVoor(r.pin_status, r.pin_hash) })
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
    .select('persoon_id, code, pin_status, pin_aangevraagd_op, pin_hash')
    .eq('user_id', userId)
    .eq('rol', 'eigenaar')
    .eq('actief', true)
  if (error || !Array.isArray(links)) return null
  const rijen = links as { persoon_id: string; code: string; pin_status: string; pin_aangevraagd_op: string | null; pin_hash: string | null }[]
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
      ? [{ id: r.persoon_id, naam, code: r.code, pinStatus: isPinStatus(r.pin_status) ? r.pin_status : 'geen', pinAangevraagdOp: r.pin_aangevraagd_op, ...controleVoor(r.pin_status, r.pin_hash) }]
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
    .map((p) => ({ naam: p.naam, tekst: `${p.naam} koos een pincode voor de PT-app — keur goed in Fit Factory PT (Coach).` }))
  const eig = (eigenaren ?? [])
    .filter((e) => e.pinStatus === 'wacht')
    .map((e) => ({ naam: e.naam, tekst: `${e.naam} (eigenaar) koos een pincode voor de PT-app — keur goed in Fit Factory PT (Beheer).` }))
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

/**
 * Kane (beheerder) opent de PT-app vanuit zijn hoofdaccount: geen pincode, maar
 * een sessie op zijn beheerderslink. De aanroeper heeft de founder-gate al
 * gepasseerd. Null = geen actieve beheerderslink of opslaan mislukt.
 * `pin_status` moet 'actief' zijn, anders keurt `sessieGeldig` de sessie meteen
 * af en zou de pagina blijven herladen.
 */
export async function startBeheerSessie(
  admin: SupabaseClient,
  userId: string,
  nu: Date,
): Promise<{ code: string; token: string; verlooptOp: Date } | null> {
  const { data, error } = await admin
    .from('pt_lead_links')
    .select('persoon_id, code')
    .eq('user_id', userId)
    .eq('rol', 'beheerder')
    .eq('actief', true)
    .eq('pin_status', 'actief')
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  const sessie = await maakSessie(admin, data.persoon_id, nu, BEHEER_SESSIE_UUR * 60 * 60 * 1000)
  return sessie ? { code: data.code, ...sessie } : null
}

/** Dit toestel uitloggen: de sessie verdwijnt uit de database. */
export async function logUit(admin: SupabaseClient, token: string): Promise<void> {
  if (token.length > 100) return
  await admin.from('pt_lead_sessies').delete().eq('token_hash', tokenHash(token))
}
