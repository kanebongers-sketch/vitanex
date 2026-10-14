// ─── Fit Factory Club: check-in lezen en schrijven (SERVER-ONLY) ────────────
// Zoeken aan de balie (gescande code of naam), inchecken en het paneel
// "Nu binnen". De regels zelf staan puur in ./regels.ts.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalLid, initialen, LID_KOLOMMEN, LID_STATUS_LABEL, lidUitRij, magTrainen, volledigeNaam, zoekLeden, type Lid } from '@/lib/club/kern/lid'
import { VESTIGING_LABEL, type Vestiging } from '@/lib/club/kern/vestiging'
import { dagGrenzen } from '@/lib/club/leden/tijd'
import { checkinUitRij, RESERVERING_SELECT, reserveringUitRij, type CheckinRij, type LidReservering } from '@/lib/club/leden/rijen'
import {
  beoordeelCheckin, bronVoorMatch, DUBBEL_MIN, isCode, leesVenster, lesInVenster, lesVandaag, magInVestiging, vatDagSamen,
  type CheckinBron, type DagSamenvatting, type MatchVeld,
} from './regels'
import type { BalieLid, CheckinAntwoord, ZoekAntwoord } from './types'

const MIN = 60_000

interface CodeTreffer {
  leden: Lid[]
  veld: MatchVeld
}

function veldWaarde(rij: unknown, veld: string): string | null {
  if (typeof rij !== 'object' || rij === null) return null
  const waarde: unknown = Reflect.get(rij, veld)
  return typeof waarde === 'string' ? waarde.toUpperCase() : null
}

/** Zoek precies op QR-token, Sportivity-ID of lidnummer (alle vestigingen). */
async function zoekOpCode(admin: SupabaseClient, userId: string, code: string): Promise<CodeTreffer | null> {
  const groot = code.toUpperCase()
  const { data, error } = await admin.from('club_leden').select(`${LID_KOLOMMEN}, qr_token`).eq('user_id', userId)
    .or(`qr_token.eq.${code},sportivity_id.eq.${code},lidnummer.eq.${code},lidnummer.eq.${groot}`).limit(5)
  if (error) {
    console.error('[club] code zoeken mislukt', error.message)
    return null
  }
  const rijen: unknown[] = data ?? []
  const velden: MatchVeld[] = ['qr_token', 'sportivity_id', 'lidnummer']
  for (const veld of velden) {
    const leden = rijen.filter((r) => veldWaarde(r, veld) === groot).map(lidUitRij).filter((l): l is Lid => l !== null)
    if (leden.length) return { leden, veld }
  }
  return { leden: [], veld: 'naam' }
}

async function laatsteCheckins(admin: SupabaseClient, userId: string, ids: string[], sinds: Date): Promise<Map<string, Date>> {
  const uit = new Map<string, Date>()
  if (!ids.length) return uit
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId)
    .in('lid_id', ids).gte('op', sinds.toISOString()).order('op', { ascending: false }).limit(200)
  if (error) console.error('[club] laatste check-ins lezen mislukt', error.message)
  for (const c of (data ?? []).map(checkinUitRij)) {
    if (c && !uit.has(c.lidId)) uit.set(c.lidId, c.op)
  }
  return uit
}

/** Reserveringen van vandaag (Nederlandse dag) voor deze leden. */
async function reserveringenVandaag(admin: SupabaseClient, userId: string, ids: string[], nu: Date): Promise<LidReservering[]> {
  if (!ids.length) return []
  const { van, tot } = dagGrenzen(nu)
  const { data, error } = await admin.from('club_reserveringen').select(RESERVERING_SELECT).eq('user_id', userId)
    .in('lid_id', ids).gte('club_lessen.start_op', van.toISOString()).lt('club_lessen.start_op', tot.toISOString()).limit(100)
  if (error) console.error('[club] reserveringen vandaag lezen mislukt', error.message)
  return (data ?? []).map(reserveringUitRij).filter((r): r is LidReservering => r !== null)
}

async function haalVenster(admin: SupabaseClient, userId: string, v: Vestiging): Promise<number> {
  const { data } = await admin.from('club_vestigingen').select('regels').eq('user_id', userId).eq('vestiging', v).maybeSingle()
  return leesVenster(typeof data === 'object' && data !== null ? (data as Record<string, unknown>).regels : null)
}

function naarBalieLid(lid: Lid, v: Vestiging, laatste: Date | undefined, res: LidReservering[], nu: Date, venster: number): BalieLid {
  const les = lesVandaag(res, nu)
  const inVenster = lesInVenster(res, nu, venster)
  const geenToegang = !magInVestiging(lid.vestiging, v)
  return {
    id: lid.id,
    naam: volledigeNaam(lid),
    initialen: initialen(lid),
    lidnummer: lid.lidnummer,
    status: lid.status,
    statusLabel: LID_STATUS_LABEL[lid.status],
    magTrainen: magTrainen(lid.status) && !geenToegang,
    abonnement: lid.abonnement,
    vestigingLabel: VESTIGING_LABEL[lid.vestiging],
    andereVestiging: lid.vestiging !== v,
    geenToegang,
    les: les ? { naam: les.lesNaam, start: les.start.toISOString(), status: les.status, inVenster: inVenster?.id === les.id } : null,
    dubbelSinds: laatste && nu.getTime() - laatste.getTime() < DUBBEL_MIN * MIN ? laatste.toISOString() : null,
  }
}

/**
 * Op naam in de andere vestigingen, voor een lid dat zijn pas vergat. Zelfde
 * zoekregels als zoekLeden; alleen gebruikt als de eigen vestiging weinig geeft.
 */
async function zoekElders(admin: SupabaseClient, userId: string, v: Vestiging, term: string, limiet: number): Promise<Lid[]> {
  const schoon = term.replace(/[%,()*]/g, ' ').slice(0, 60).trim()
  if (schoon.length < 3) return []
  const zoek = schoon.split(/\s+/).slice(0, 3).reduce(
    (q, deel) => q.or(`voornaam.ilike.%${deel}%,achternaam.ilike.%${deel}%,lidnummer.ilike.%${deel}%`),
    admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).neq('vestiging', v),
  )
  const { data, error } = await zoek.order('achternaam').order('voornaam').limit(limiet)
  if (error) {
    console.error('[club] leden elders zoeken mislukt', error.message)
    return []
  }
  return (data ?? []).map(lidUitRij).filter((l): l is Lid => l !== null)
}

async function zoekOpNaam(admin: SupabaseClient, userId: string, v: Vestiging, term: string): Promise<Lid[] | null> {
  const eigen = await zoekLeden(admin, userId, v, term, 8)
  if (!eigen || eigen.length >= 3) return eigen
  return [...eigen, ...(await zoekElders(admin, userId, v, term, 5))]
}

/** Zoeken aan de balie: eerst een exacte code, anders op naam (eerst deze vestiging). Null bij een fout. */
export async function zoekVoorBalie(admin: SupabaseClient, userId: string, v: Vestiging, invoer: string, nu: Date): Promise<ZoekAntwoord | null> {
  const term = invoer.trim().slice(0, 80)
  if (!term) return { exact: false, bron: 'balie', leden: [] }
  const code = isCode(term) ? await zoekOpCode(admin, userId, term) : { leden: [], veld: 'naam' as const }
  if (!code) return null
  const exact = code.leden.length > 0
  const leden = exact ? code.leden : await zoekOpNaam(admin, userId, v, term)
  if (!leden) return null
  const ids = leden.map((l) => l.id)
  const [laatste, reserveringen, venster] = await Promise.all([
    laatsteCheckins(admin, userId, ids, new Date(nu.getTime() - DUBBEL_MIN * MIN)),
    reserveringenVandaag(admin, userId, ids, nu),
    haalVenster(admin, userId, v),
  ])
  return {
    exact,
    bron: exact ? bronVoorMatch(code.veld) : 'balie',
    leden: leden.map((l) => naarBalieLid(l, v, laatste.get(l.id), reserveringen.filter((r) => r.lidId === l.id), nu, venster)),
  }
}

export interface CheckinVerzoek {
  lidId: string
  vestiging: Vestiging
  bron: CheckinBron
}

export type CheckinUitslag =
  | { ok: true; lid: Lid; antwoord: CheckinAntwoord }
  | { ok: false; fout: string; status: number }

/** Zet de geboekte les in het venster op "aanwezig". Geeft de les terug, of null. */
async function markeerAanwezig(admin: SupabaseClient, userId: string, lidId: string, v: Vestiging, nu: Date): Promise<LidReservering | null> {
  const [res, venster] = await Promise.all([reserveringenVandaag(admin, userId, [lidId], nu), haalVenster(admin, userId, v)])
  const les = lesInVenster(res, nu, venster)
  if (!les) return null
  const { error } = await admin.from('club_reserveringen').update({ status: 'aanwezig', gewijzigd_op: nu.toISOString() })
    .eq('user_id', userId).eq('id', les.id).eq('status', 'geboekt')
  if (error) {
    console.error('[club] aanwezig zetten mislukt', error.message)
    return null
  }
  return les
}

export async function checkIn(admin: SupabaseClient, userId: string, verzoek: CheckinVerzoek, nu: Date): Promise<CheckinUitslag> {
  const lid = await haalLid(admin, userId, verzoek.lidId)
  if (!lid) return { ok: false, fout: 'Dit lid bestaat niet (meer).', status: 404 }
  const laatste = (await laatsteCheckins(admin, userId, [lid.id], new Date(nu.getTime() - DUBBEL_MIN * MIN))).get(lid.id) ?? null
  const besluit = beoordeelCheckin(lid.status, laatste, nu, magInVestiging(lid.vestiging, verzoek.vestiging))
  if (besluit.soort === 'niet_actief') return { ok: true, lid, antwoord: { soort: 'niet_actief', statusLabel: LID_STATUS_LABEL[besluit.status] } }
  if (besluit.soort === 'geen_toegang') return { ok: true, lid, antwoord: { soort: 'geen_toegang', vestigingLabel: VESTIGING_LABEL[lid.vestiging] } }
  if (besluit.soort === 'dubbel') return { ok: true, lid, antwoord: { soort: 'dubbel', op: besluit.op.toISOString() } }
  const { data, error } = await admin.from('club_checkins')
    .insert({ user_id: userId, lid_id: lid.id, vestiging: verzoek.vestiging, bron: verzoek.bron, op: nu.toISOString() })
    .select('id, lid_id, op').single()
  const rij = checkinUitRij(data)
  if (error || !rij) {
    console.error('[club] inchecken mislukt', error?.message ?? 'geen rij terug')
    return { ok: false, fout: 'Inchecken lukte niet. Probeer het opnieuw.', status: 500 }
  }
  const les = await markeerAanwezig(admin, userId, lid.id, verzoek.vestiging, nu)
  return {
    ok: true,
    lid,
    antwoord: { soort: 'ingecheckt', op: rij.op.toISOString(), les: les ? { naam: les.lesNaam, start: les.start.toISOString() } : null },
  }
}

/** Check-ins van vandaag in deze vestiging, samengevat voor het paneel. Null bij een fout. */
export async function haalDagPaneel(admin: SupabaseClient, userId: string, v: Vestiging, nu: Date): Promise<DagSamenvatting | null> {
  const { van } = dagGrenzen(nu)
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op, bron, vestiging, club_leden(voornaam, achternaam)')
    .eq('user_id', userId).eq('vestiging', v).gte('op', van.toISOString()).order('op', { ascending: false }).limit(1000)
  if (error) {
    console.error('[club] check-ins vandaag lezen mislukt', error.message)
    return null
  }
  return vatDagSamen((data ?? []).map(checkinUitRij).filter((c): c is CheckinRij => c !== null), nu)
}
