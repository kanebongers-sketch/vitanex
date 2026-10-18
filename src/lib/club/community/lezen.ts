// ─── Club, community: lezen voor de ledenapp (SERVER-ONLY) ──────────────────
// Elke query filtert op user_id van de sportschool; het lid komt uit de
// toegang (sessie), nooit uit de vraag. Leden zien van elkaar alleen de
// privacynaam. Een leesfout wordt gelogd en geeft null (nette melding).

import type { SupabaseClient } from '@supabase/supabase-js'
import { alleRijen } from '@/lib/club/leden/data'
import { privacyNaam } from '@/lib/club/challenges/voortgang'
import { haalChallenge, haalStand, type StandData } from '@/lib/club/challenges/lezen'
import { maakStandCache, standSleutel } from '@/lib/club/challenges/stand-cache'
import { nlDelen } from '@/lib/club/rooster/tijd'
import {
  GROEP_KOLOMMEN,
  REACTIE_LABEL,
  TIJDLIJN_MAX,
  fragment,
  groepUitRij,
  groepZichtbaarVoor,
  isBerichtStatus,
  isReactieSoort,
  ranglijstBron,
  telReacties,
  zietBericht,
  type Activiteit,
  type Groep,
  type RanglijstBron,
  type ReactieSoort,
  type TijdlijnBericht,
} from './model'
import { bezoekdagenInMaand, groepRanglijst, maandVenster, type GroepDeelnemer, type GroepRanglijst } from './ranglijst'

export interface LidContext {
  admin: SupabaseClient
  userId: string
  lid: { id: string; vestiging: string }
}

type R = Record<string, unknown>

export function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/community] ${wat} mislukt`, fout.message)
}

export type GroepLidStatus = 'lid' | 'verwijderd' | null

/** De status van het lid in een groep; undefined bij een leesfout. */
export async function lidStatusIn(admin: SupabaseClient, userId: string, groepId: string, lidId: string): Promise<GroepLidStatus | undefined> {
  const { data, error } = await admin.from('club_community_groepsleden').select('status').eq('user_id', userId).eq('groep_id', groepId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    meld('lidmaatschap lezen', error)
    return undefined
  }
  const s = (data as R | null)?.status
  return s === 'lid' || s === 'verwijderd' ? s : null
}

export async function haalGroep(admin: SupabaseClient, userId: string, id: string): Promise<Groep | null | undefined> {
  const { data, error } = await admin.from('club_community_groepen').select(GROEP_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) {
    meld('groep lezen', error)
    return undefined
  }
  return groepUitRij(data)
}

export async function haalOpRanglijst(admin: SupabaseClient, userId: string, lidId: string): Promise<boolean | null> {
  const { data, error } = await admin.from('club_community_voorkeuren').select('op_ranglijst').eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    meld('voorkeur lezen', error)
    return null
  }
  return (data as R | null)?.op_ranglijst === true
}

// ── Overzicht ───────────────────────────────────────────────────────────────

export interface GroepKaart {
  groep: Groep
  isLid: boolean
  leden: number
}

export interface CommunityOverzicht {
  groepen: GroepKaart[]
  activiteit: Activiteit[]
  nieuw: number
  opRanglijst: boolean
}

async function haalActiviteit(c: LidContext, gezienOp: string | null): Promise<Activiteit[] | null> {
  const { data, error } = await c.admin
    .from('club_community_reacties')
    .select('id, soort, aangemaakt_op, club_leden(voornaam, achternaam), club_community_berichten!inner(lid_id, tekst, groep_id, status)')
    .eq('user_id', c.userId)
    .eq('club_community_berichten.lid_id', c.lid.id)
    .neq('lid_id', c.lid.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(20)
  if (error) {
    meld('activiteit lezen', error)
    return null
  }
  const grens = gezienOp ? Date.parse(gezienOp) : 0
  return ((data ?? []) as R[]).flatMap((r) => {
    const lid = (Array.isArray(r.club_leden) ? r.club_leden[0] : r.club_leden) as R | null
    const b = (Array.isArray(r.club_community_berichten) ? r.club_community_berichten[0] : r.club_community_berichten) as R | null
    if (!lid || !b || typeof r.id !== 'string' || !isReactieSoort(r.soort) || typeof r.aangemaakt_op !== 'string') return []
    if (typeof lid.voornaam !== 'string' || typeof lid.achternaam !== 'string' || typeof b.tekst !== 'string' || typeof b.groep_id !== 'string') return []
    return [{ id: r.id, soort: r.soort, tekst: `${privacyNaam(lid.voornaam, lid.achternaam)} ${REACTIE_LABEL[r.soort].werkwoord}`, bericht: fragment(b.tekst), groepId: b.groep_id, op: r.aangemaakt_op, nieuw: Date.parse(r.aangemaakt_op) > grens }]
  })
}

async function telGroepsleden(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<Map<string, number> | null> {
  if (ids.length === 0) return new Map()
  const rijen = await alleRijen('groepsleden tellen', (van, tot) => admin.from('club_community_groepsleden').select('id, groep_id').eq('user_id', userId).eq('status', 'lid').in('groep_id', [...ids]).order('id').range(van, tot))
  if (!rijen) return null
  return (rijen as R[]).reduce((m, r) => (typeof r.groep_id === 'string' ? m.set(r.groep_id, (m.get(r.groep_id) ?? 0) + 1) : m), new Map<string, number>())
}

/** Alle groepen die het lid ziet, de reacties op zijn berichten en zijn voorkeur. */
export async function haalCommunityOverzicht(c: LidContext): Promise<CommunityOverzicht | null> {
  const [groepen, mijn, voorkeur] = await Promise.all([
    c.admin.from('club_community_groepen').select(GROEP_KOLOMMEN).eq('user_id', c.userId).is('gearchiveerd_op', null).order('naam').limit(200),
    c.admin.from('club_community_groepsleden').select('groep_id, status').eq('user_id', c.userId).eq('lid_id', c.lid.id).limit(500),
    c.admin.from('club_community_voorkeuren').select('op_ranglijst, activiteit_gezien_op').eq('user_id', c.userId).eq('lid_id', c.lid.id).maybeSingle(),
  ])
  if (groepen.error || mijn.error || voorkeur.error) {
    meld('overzicht lezen', (groepen.error ?? mijn.error ?? voorkeur.error)!)
    return null
  }
  const status = new Map(((mijn.data ?? []) as R[]).map((r) => [r.groep_id as string, r.status as string]))
  const zichtbaar = ((groepen.data ?? []) as unknown[])
    .map(groepUitRij)
    .filter((g): g is Groep => g !== null && status.get(g.id) !== 'verwijderd' && groepZichtbaarVoor(g, c.lid.vestiging, status.get(g.id) === 'lid'))
  const v = voorkeur.data as R | null
  const [aantallen, activiteit] = await Promise.all([telGroepsleden(c.admin, c.userId, zichtbaar.map((g) => g.id)), haalActiviteit(c, typeof v?.activiteit_gezien_op === 'string' ? v.activiteit_gezien_op : null)])
  if (!aantallen || !activiteit) return null
  const kaarten = zichtbaar
    .map((g) => ({ groep: g, isLid: status.get(g.id) === 'lid', leden: aantallen.get(g.id) ?? 0 }))
    .sort((a, b) => Number(b.isLid) - Number(a.isLid) || a.groep.naam.localeCompare(b.groep.naam, 'nl'))
  return { groepen: kaarten, activiteit, nieuw: activiteit.filter((a) => a.nieuw).length, opRanglijst: v?.op_ranglijst === true }
}

// ── Een groep ───────────────────────────────────────────────────────────────

export interface GroepScherm {
  groep: Groep
  isLid: boolean
  leden: number
  tijdlijn: TijdlijnBericht[] | null
  ranglijst: (GroepRanglijst & { bron: RanglijstBron; titel: string }) | null
  opRanglijst: boolean
}

function berichtUitRij(r: R, lidId: string, reacties: ReturnType<typeof telReacties>, gemeld: ReadonlySet<string>): TijdlijnBericht | null {
  const lid = (Array.isArray(r.club_leden) ? r.club_leden[0] : r.club_leden) as R | null
  if (typeof r.id !== 'string' || typeof r.tekst !== 'string' || typeof r.aangemaakt_op !== 'string' || !isBerichtStatus(r.status) || !lid) return null
  const eigen = r.lid_id === lidId
  if (!zietBericht({ status: r.status, lidId: String(r.lid_id) }, lidId)) return null
  const naam = typeof lid.voornaam === 'string' && typeof lid.achternaam === 'string' ? privacyNaam(lid.voornaam, lid.achternaam) : 'Lid'
  return { id: r.id, auteur: eigen ? 'Jij' : naam, eigen, tekst: r.tekst, status: r.status, op: r.aangemaakt_op, reacties: reacties.get(r.id) ?? { duim: 0, highfive: 0, eigen: [] }, gemeld: gemeld.has(r.id) }
}

async function haalTijdlijn(c: LidContext, groepId: string): Promise<TijdlijnBericht[] | null> {
  const { data, error } = await c.admin
    .from('club_community_berichten')
    .select('id, lid_id, tekst, status, aangemaakt_op, club_leden(voornaam, achternaam)')
    .eq('user_id', c.userId)
    .eq('groep_id', groepId)
    .or(`status.eq.zichtbaar,lid_id.eq.${c.lid.id}`)
    .order('aangemaakt_op', { ascending: false })
    .limit(TIJDLIJN_MAX)
  if (error) {
    meld('tijdlijn lezen', error)
    return null
  }
  const rijen = (data ?? []) as R[]
  const ids = rijen.map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return []
  const [reacties, gemeld] = await Promise.all([
    c.admin.from('club_community_reacties').select('bericht_id, lid_id, soort').eq('user_id', c.userId).in('bericht_id', ids).limit(5000),
    c.admin.from('club_community_meldingen').select('bericht_id').eq('user_id', c.userId).eq('lid_id', c.lid.id).in('bericht_id', ids),
  ])
  if (reacties.error || gemeld.error) {
    meld('reacties lezen', (reacties.error ?? gemeld.error)!)
    return null
  }
  const telling = telReacties(
    ((reacties.data ?? []) as R[]).flatMap((r) => (typeof r.bericht_id === 'string' && typeof r.lid_id === 'string' && isReactieSoort(r.soort) ? [{ berichtId: r.bericht_id, lidId: r.lid_id, soort: r.soort as ReactieSoort }] : [])),
    c.lid.id,
  )
  const gemeldSet = new Set(((gemeld.data ?? []) as R[]).map((r) => r.bericht_id as string))
  return rijen.map((r) => berichtUitRij(r, c.lid.id, telling, gemeldSet)).filter((b): b is TijdlijnBericht => b !== null)
}

async function haalDeelnemers(admin: SupabaseClient, userId: string, groepId: string): Promise<GroepDeelnemer[] | null> {
  const rijen = await alleRijen('groepsleden', (van, tot) =>
    admin.from('club_community_groepsleden').select('id, club_leden!inner(id, voornaam, achternaam)').eq('user_id', userId).eq('groep_id', groepId).eq('status', 'lid').order('id').range(van, tot),
  )
  if (!rijen) return null
  return (rijen as R[]).flatMap((r) => {
    const l = (Array.isArray(r.club_leden) ? r.club_leden[0] : r.club_leden) as R | null
    return l && typeof l.id === 'string' && typeof l.voornaam === 'string' && typeof l.achternaam === 'string' ? [{ lidId: l.id, voornaam: l.voornaam, achternaam: l.achternaam }] : []
  })
}

async function haalOpLijst(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<Set<string> | null> {
  if (ids.length === 0) return new Set()
  const { data, error } = await admin.from('club_community_voorkeuren').select('lid_id').eq('user_id', userId).eq('op_ranglijst', true).in('lid_id', [...ids])
  if (error) {
    meld('ranglijstvoorkeur lezen', error)
    return null
  }
  return new Set(((data ?? []) as R[]).map((r) => r.lid_id as string))
}

async function bezoekScores(admin: SupabaseClient, userId: string, ids: readonly string[], nu: Date): Promise<{ scores: Map<string, number>; titel: string } | null> {
  const maand = nlDelen(nu).datum.slice(0, 7)
  const venster = maandVenster(maand)
  const rijen = ids.length === 0 ? [] : await alleRijen('bezoeken groep', (van, tot) => admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId).in('lid_id', [...ids]).gte('op', venster.van).lt('op', venster.tot).order('id').range(van, tot))
  if (!rijen) return null
  const momenten = (rijen as R[]).flatMap((r) => (typeof r.lid_id === 'string' && typeof r.op === 'string' ? [{ lidId: r.lid_id, op: r.op }] : []))
  const naam = new Intl.DateTimeFormat('nl-NL', { month: 'long', timeZone: 'UTC' }).format(new Date(`${maand}-15T12:00:00Z`))
  return { scores: bezoekdagenInMaand(momenten, maand), titel: `Bezoekdagen in ${naam}` }
}

/** De stand van een gekoppelde challenge, een minuut gedeeld (zoals in Voortgang). */
const STANDEN = maakStandCache<StandData>()

async function challengeScores(admin: SupabaseClient, userId: string, challengeId: string): Promise<{ scores: Map<string, number>; titel: string } | null> {
  const c = await haalChallenge(admin, userId, challengeId)
  if (!c) return null
  const data = await STANDEN.haal(standSleutel(userId, c), () => haalStand(admin, userId, c))
  return data ? { scores: new Map(data.stand.map((s) => [s.lidId, s.score])), titel: c.titel } : null
}

async function haalRanglijst(c: LidContext, g: Groep, nu: Date): Promise<GroepScherm['ranglijst']> {
  const deelnemers = await haalDeelnemers(c.admin, c.userId, g.id)
  if (!deelnemers) return null
  const ids = deelnemers.map((d) => d.lidId)
  const bron = ranglijstBron(g)
  const [opLijst, uitChallenge] = await Promise.all([haalOpLijst(c.admin, c.userId, ids), bron === 'challenge' && g.challengeId ? challengeScores(c.admin, c.userId, g.challengeId) : Promise.resolve(null)])
  const scores = uitChallenge ?? (await bezoekScores(c.admin, c.userId, ids, nu))
  if (!opLijst || !scores) return null
  return { ...groepRanglijst(deelnemers, scores.scores, opLijst, c.lid.id), bron: uitChallenge ? 'challenge' : 'bezoeken', titel: scores.titel }
}

/**
 * Een groep voor het lid. 'weg' = bestaat niet, gearchiveerd, niet zichtbaar
 * of het lid is eruit gehaald. Niet-leden van een open groep zien alleen de
 * kop (naam, uitleg, aantal) en de knop om lid te worden, nooit berichten.
 */
export async function haalGroepScherm(c: LidContext, groepId: string, nu = new Date()): Promise<GroepScherm | 'weg' | null> {
  const [g, status, opRanglijst] = await Promise.all([haalGroep(c.admin, c.userId, groepId), lidStatusIn(c.admin, c.userId, groepId, c.lid.id), haalOpRanglijst(c.admin, c.userId, c.lid.id)])
  if (g === undefined || status === undefined || opRanglijst === null) return null
  if (!g || status === 'verwijderd' || !groepZichtbaarVoor(g, c.lid.vestiging, status === 'lid')) return 'weg'
  const isLid = status === 'lid'
  const [aantallen, tijdlijn, ranglijst] = await Promise.all([
    telGroepsleden(c.admin, c.userId, [g.id]),
    isLid ? haalTijdlijn(c, g.id) : Promise.resolve([]),
    isLid && g.ranglijst ? haalRanglijst(c, g, nu) : Promise.resolve(null),
  ])
  return { groep: g, isLid, leden: aantallen?.get(g.id) ?? 0, tijdlijn, ranglijst, opRanglijst }
}

/** Het aantal nieuwe reacties op de berichten van een lid (voor een badge of de bel); null bij een fout. */
export async function telNieuweReacties(c: LidContext): Promise<number | null> {
  const { data, error } = await c.admin.from('club_community_voorkeuren').select('activiteit_gezien_op').eq('user_id', c.userId).eq('lid_id', c.lid.id).maybeSingle()
  if (error) {
    meld('gezien lezen', error)
    return null
  }
  const lijst = await haalActiviteit(c, ((data as R | null)?.activiteit_gezien_op as string | undefined) ?? null)
  return lijst ? lijst.filter((a) => a.nieuw).length : null
}
