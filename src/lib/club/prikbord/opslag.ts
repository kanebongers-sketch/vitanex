// ─── Club, Prikbord: lezen en schrijven (SERVER-ONLY) ───────────────────────
// Elke query filtert op de sportschool (user_id). Een leesfout wordt gelogd
// en geeft null (de pagina toont een nette melding); schrijven geeft false of
// null. Zonder migratie 489 geven de lezers null, de rest van Club werkt door.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalTeamMetRollen } from '@/lib/club/rollen/opslag'
import type { MededelingInvoer, UitvoeringInvoer, WerkwijzeMeta } from './invoer'
import { openVoor, telOpen, type NieuweMededeling, type NieuweVersie, type OpenTelling } from './model'
import {
  GELEZEN_KOLOMMEN,
  MEDEDELING_KOLOMMEN,
  UITVOERING_KOLOMMEN,
  VERSIE_KOLOMMEN,
  WERKWIJZE_KOLOMMEN,
  gelezenUitRij,
  mededelingUitRij,
  uitvoeringUitRij,
  versieUitRij,
  werkwijzeUitRij,
} from './rijen'
import type { Doelgroep, Gelezen, Kijker, Mededeling, Stap, TeamPersoon, Uitvoering, Werkwijze, WerkwijzeSoort } from './typen'

function log(wat: string, bericht: string): void {
  console.error(`[club/prikbord] ${wat} mislukt`, bericht)
}

/** Hoogstens zoveel mededelingen op het Prikbord (nieuwste eerst). */
const MAX_MEDEDELINGEN = 300
/** Gearchiveerde of verlopen mededelingen blijven zo lang zichtbaar in het archief. */
export const ARCHIEF_DAGEN = 90
/** Zoveel ids per verzoek met .in(): de URL blijft kort. */
export const IDS_PER_VERZOEK = 50

/** Het filter voor lopende en recent gearchiveerde of verlopen mededelingen (PostgREST or). */
export function lopendOfRecentFilter(nu: Date, dagen = ARCHIEF_DAGEN): string {
  const grens = new Date(nu.getTime() - dagen * 86_400_000).toISOString()
  return `and(gearchiveerd.eq.false,or(verloopt_op.is.null,verloopt_op.gte."${grens}")),geplaatst_op.gte."${grens}"`
}

/** Lopende en recent gearchiveerde mededelingen (nieuwste eerst). */
export async function haalMededelingen(admin: SupabaseClient, userId: string, nu = new Date()): Promise<Mededeling[] | null> {
  const { data, error } = await admin
    .from('club_mededelingen')
    .select(MEDEDELING_KOLOMMEN)
    .eq('user_id', userId)
    .or(lopendOfRecentFilter(nu))
    .order('geplaatst_op', { ascending: false })
    .limit(MAX_MEDEDELINGEN)
  if (error) {
    log('mededelingen lezen', error.message)
    return null
  }
  return (data ?? []).flatMap((r) => mededelingUitRij(r) ?? [])
}

/** Een lijst in stukken van hoogstens `grootte`. */
export function inStukken<T>(lijst: readonly T[], grootte = IDS_PER_VERZOEK): T[][] {
  const stukken: T[][] = []
  for (let i = 0; i < lijst.length; i += grootte) stukken.push(lijst.slice(i, i + grootte))
  return stukken
}

/**
 * De gelezen-regels bij deze mededelingen. Met een profiel alleen die van hem
 * (gefilterd op profiel_id, geen lange lijst ids in de URL); zonder profiel
 * (de leiding) in stukken van IDS_PER_VERZOEK mededelingen.
 */
export async function haalGelezen(admin: SupabaseClient, userId: string, mededelingIds: readonly string[], profielId?: string): Promise<Gelezen[] | null> {
  if (mededelingIds.length === 0) return []
  const gevraagd = new Set(mededelingIds)
  if (profielId) {
    const { data, error } = await admin.from('club_mededeling_gelezen').select(GELEZEN_KOLOMMEN).eq('user_id', userId).eq('profiel_id', profielId).limit(20_000)
    if (error) {
      log('gelezen lezen', error.message)
      return null
    }
    return (data ?? []).flatMap((r) => gelezenUitRij(r) ?? []).filter((g) => gevraagd.has(g.mededelingId))
  }
  const antwoorden = await Promise.all(
    inStukken([...gevraagd]).map((ids) => admin.from('club_mededeling_gelezen').select(GELEZEN_KOLOMMEN).eq('user_id', userId).in('mededeling_id', ids).limit(20_000)),
  )
  const fout = antwoorden.find((a) => a.error)
  if (fout?.error) {
    log('gelezen lezen', fout.error.message)
    return null
  }
  return antwoorden.flatMap((a) => (a.data ?? []).flatMap((r) => gelezenUitRij(r) ?? []))
}

/** Alle werkwijzen met de stappen van de huidige versie (ook het archief). */
export async function haalWerkwijzen(admin: SupabaseClient, userId: string): Promise<Werkwijze[] | null> {
  const { data, error } = await admin.from('club_werkwijzen').select(WERKWIJZE_KOLOMMEN).eq('user_id', userId).order('titel').limit(500)
  if (error) {
    log('werkwijzen lezen', error.message)
    return null
  }
  const rijen = (data ?? []) as Record<string, unknown>[]
  const ids = rijen.map((r) => r.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return []
  const versies = await admin.from('club_werkwijze_versies').select(VERSIE_KOLOMMEN).eq('user_id', userId).in('werkwijze_id', ids).limit(5000)
  if (versies.error) {
    log('versies lezen', versies.error.message)
    return null
  }
  const lijst = (versies.data ?? []).flatMap((v) => versieUitRij(v) ?? [])
  return rijen.flatMap((r) => werkwijzeUitRij(r, lijst) ?? [])
}

/** De laatste uitvoeringen, per werkwijze hoogstens een paar (voor de leiding). */
export async function haalUitvoeringen(admin: SupabaseClient, userId: string, max = 200): Promise<Uitvoering[] | null> {
  const { data, error } = await admin.from('club_werkwijze_uitvoeringen').select(UITVOERING_KOLOMMEN).eq('user_id', userId).order('gestart_op', { ascending: false }).limit(max)
  if (error) {
    log('uitvoeringen lezen', error.message)
    return null
  }
  return (data ?? []).flatMap((r) => uitvoeringUitRij(r) ?? [])
}

/** Het team voor "7 van 9 bevestigd": actieve medewerkers en de profielen van beheerders. */
export async function haalTeam(admin: SupabaseClient, userId: string): Promise<TeamPersoon[] | null> {
  const team = await haalTeamMetRollen(admin, userId)
  if (!team) return null
  return team
    .filter((p) => p.actief || p.beheerder)
    .map((p) => ({ id: p.id, naam: p.naam, rollen: p.rollen, vestigingen: p.vestigingen, alleVestigingen: p.alleVestigingen }))
}

/** Bij welke takenlijst hoort welke werkwijze (voor "Hoe doe je dit" in Taken); leeg bij een fout. */
export async function haalWerkwijzeBijLijst(admin: SupabaseClient, userId: string): Promise<ReadonlyMap<string, string>> {
  const { data, error } = await admin.from('club_werkwijzen').select('id, takenlijst_id').eq('user_id', userId).eq('gearchiveerd', false).not('takenlijst_id', 'is', null).limit(500)
  if (error) {
    log('werkwijzen bij takenlijsten lezen', error.message)
    return new Map()
  }
  return new Map(((data ?? []) as { id: unknown; takenlijst_id: unknown }[]).flatMap((r) => (typeof r.id === 'string' && typeof r.takenlijst_id === 'string' ? [[r.takenlijst_id, r.id] as const] : [])))
}

/** Wat er voor deze persoon open staat (de regel op Vandaag en de teller). Null bij een fout. */
export async function haalOpenTelling(admin: SupabaseClient, userId: string, kijker: Kijker, nu: Date): Promise<OpenTelling | null> {
  if (!kijker.profielId) return { mededelingen: 0, werkwijzen: 0 }
  // Alleen lopende mededelingen: niet gearchiveerd en niet verlopen.
  const { data, error } = await admin
    .from('club_mededelingen')
    .select(MEDEDELING_KOLOMMEN)
    .eq('user_id', userId)
    .eq('gearchiveerd', false)
    .or(`verloopt_op.is.null,verloopt_op.gt."${nu.toISOString()}"`)
    .order('geplaatst_op', { ascending: false })
    .limit(MAX_MEDEDELINGEN)
  if (error) {
    log('open mededelingen lezen', error.message)
    return null
  }
  const mededelingen = (data ?? []).flatMap((r) => mededelingUitRij(r) ?? [])
  const wijzigingen = mededelingen.some((m) => m.soort === 'wijziging')
  const [gelezen, werkwijzen] = await Promise.all([
    haalGelezen(admin, userId, mededelingen.map((m) => m.id), kijker.profielId),
    wijzigingen ? haalWerkwijzenKort(admin, userId) : Promise.resolve([]),
  ])
  if (!gelezen || !werkwijzen) return null
  return telOpen(openVoor({ kijker, mededelingen, gelezen, werkwijzen, nu }))
}

/** Alleen versie en archief, genoeg om te zien of een wijziging is vervangen. */
async function haalWerkwijzenKort(admin: SupabaseClient, userId: string): Promise<Werkwijze[] | null> {
  const { data, error } = await admin.from('club_werkwijzen').select('id, versie, gearchiveerd').eq('user_id', userId).limit(500)
  if (error) {
    log('werkwijzen lezen', error.message)
    return null
  }
  return ((data ?? []) as Record<string, unknown>[]).flatMap((r) =>
    typeof r.id === 'string' && typeof r.versie === 'number'
      ? [{ id: r.id, versie: r.versie, gearchiveerd: r.gearchiveerd === true, titel: '', soort: 'eigen' as const, vestigingen: [], rollen: [], takenlijstId: null, bronNotitieId: null, bijgewerktOp: '', stappen: [], watAnders: null }]
      : [],
  )
}

// ── Schrijven ────────────────────────────────────────────────────────────────

export async function plaatsMededeling(admin: SupabaseClient, userId: string, m: MededelingInvoer | NieuweMededeling, door: string | null): Promise<string | null> {
  const isWijziging = 'soort' in m && m.soort === 'wijziging'
  const { data, error } = await admin
    .from('club_mededelingen')
    .insert({
      user_id: userId,
      titel: m.titel,
      inhoud: m.inhoud,
      vestigingen: [...m.vestigingen],
      rollen: [...m.rollen],
      verplicht: m.verplicht,
      soort: isWijziging ? 'wijziging' : 'mededeling',
      werkwijze_id: isWijziging ? (m as NieuweMededeling).werkwijzeId : null,
      werkwijze_versie: isWijziging ? (m as NieuweMededeling).werkwijzeVersie : null,
      verloopt_op: 'verlooptOp' in m ? m.verlooptOp : null,
      door_profiel: door,
    })
    .select('id')
    .single()
  if (error) {
    log('mededeling plaatsen', error.message)
    return null
  }
  return typeof data?.id === 'string' ? data.id : null
}

export async function archiveerMededeling(admin: SupabaseClient, userId: string, id: string, gearchiveerd: boolean): Promise<boolean | null> {
  const { data, error } = await admin.from('club_mededelingen').update({ gearchiveerd }).eq('id', id).eq('user_id', userId).select('id')
  if (error) {
    log('mededeling archiveren', error.message)
    return null
  }
  return (data ?? []).length > 0
}

export async function haalMededeling(admin: SupabaseClient, userId: string, id: string): Promise<Mededeling | null | undefined> {
  const { data, error } = await admin.from('club_mededelingen').select(MEDEDELING_KOLOMMEN).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) {
    log('mededeling lezen', error.message)
    return undefined
  }
  return mededelingUitRij(data)
}

/**
 * Gelezen (en eventueel bevestigd). Veilig bij twee verzoeken tegelijk: eerst
 * een regel als die er nog niet is (bestaat hij al, dan verandert er niets, dus
 * gelezen_op blijft het eerste moment en een bevestiging wordt nooit gewist),
 * daarna bij bevestigen alleen bevestigd_op zetten waar die nog leeg is.
 */
export async function markeerGelezen(admin: SupabaseClient, userId: string, mededelingId: string, profielId: string, bevestig: boolean): Promise<boolean> {
  const nu = new Date().toISOString()
  const regel = await admin
    .from('club_mededeling_gelezen')
    .upsert({ user_id: userId, mededeling_id: mededelingId, profiel_id: profielId, gelezen_op: nu, bevestigd_op: bevestig ? nu : null }, { onConflict: 'mededeling_id,profiel_id', ignoreDuplicates: true })
  if (regel.error) {
    log('gelezen bewaren', regel.error.message)
    return false
  }
  if (!bevestig) return true
  const { error } = await admin
    .from('club_mededeling_gelezen')
    .update({ bevestigd_op: nu })
    .eq('user_id', userId)
    .eq('mededeling_id', mededelingId)
    .eq('profiel_id', profielId)
    .is('bevestigd_op', null)
  if (error) log('bevestigen', error.message)
  return !error
}

export interface NieuweWerkwijze extends Doelgroep {
  titel: string
  soort: WerkwijzeSoort
  stappen: Stap[]
  takenlijstId: string | null
  bronNotitieId: string | null
}

/** Een werkwijze met versie 1. Lukt de versie niet, dan gaat de werkwijze weer weg. */
export async function maakWerkwijze(admin: SupabaseClient, userId: string, w: NieuweWerkwijze, door: string | null): Promise<string | null> {
  const { data, error } = await admin
    .from('club_werkwijzen')
    .insert({ user_id: userId, titel: w.titel, soort: w.soort, vestigingen: [...w.vestigingen], rollen: [...w.rollen], versie: 1, takenlijst_id: w.takenlijstId, bron_notitie_id: w.bronNotitieId })
    .select('id')
    .single()
  if (error || typeof data?.id !== 'string') {
    log('werkwijze maken', error?.message ?? 'geen id')
    return null
  }
  const versie = await admin.from('club_werkwijze_versies').insert({ user_id: userId, werkwijze_id: data.id, versie: 1, stappen: w.stappen, door_profiel: door })
  if (versie.error) {
    log('eerste versie bewaren', versie.error.message)
    await admin.from('club_werkwijzen').delete().eq('id', data.id).eq('user_id', userId)
    return null
  }
  return data.id
}

/**
 * Uitkomst van een nieuwe versie. 'melding': de versie staat, maar de
 * verplichte mededeling kon niet geplaatst worden (alleen zonder migratie 492);
 * de UI biedt dan "Melding opnieuw plaatsen".
 */
export type VersieUitkomst = 'ok' | 'oud' | 'fout' | 'melding'

function functieOntbreekt(error: { code?: string }): boolean {
  return error.code === 'PGRST202' || error.code === '42883'
}

/**
 * Een nieuwe versie: versie, versienummer en (bij een belangrijke wijziging)
 * de mededeling in een transactie (functie club_werkwijze_nieuwe_versie,
 * migratie 492). Zonder die functie de oude weg in stappen.
 */
export async function bewaarNieuweVersie(admin: SupabaseClient, userId: string, w: Werkwijze, v: NieuweVersie, door: string | null): Promise<VersieUitkomst> {
  const m = v.mededeling
  const { data, error } = await admin.rpc('club_werkwijze_nieuwe_versie', {
    p_user: userId,
    p_werkwijze: w.id,
    p_oude_versie: w.versie,
    p_versie: v.versie,
    p_stappen: v.stappen,
    p_wat_anders: v.watAnders,
    p_door: door,
    p_mededeling: m ? { titel: m.titel, inhoud: m.inhoud, vestigingen: [...m.vestigingen], rollen: [...m.rollen] } : null,
  })
  if (!error) return data === 'ok' ? 'ok' : 'oud'
  log('nieuwe versie (database-functie)', error.message)
  if (!functieOntbreekt(error)) return 'fout'
  return bewaarNieuweVersieInStappen(admin, userId, w, v, door)
}

/**
 * Zonder migratie 492: eerst de versie zelf (uniek per werkwijze: twee mensen
 * tegelijk geeft een fout in plaats van een gat), dan het nummer op de
 * werkwijze, alleen als die nog op de oude versie staat, dan de mededeling.
 */
async function bewaarNieuweVersieInStappen(admin: SupabaseClient, userId: string, w: Werkwijze, v: NieuweVersie, door: string | null): Promise<VersieUitkomst> {
  const versie = await admin.from('club_werkwijze_versies').insert({ user_id: userId, werkwijze_id: w.id, versie: v.versie, stappen: v.stappen, wat_anders: v.watAnders, door_profiel: door })
  if (versie.error) {
    // 23505: deze versie bestaat al (iemand anders was net eerder).
    if (versie.error.code === '23505') return 'oud'
    log('versie bewaren', versie.error.message)
    return 'fout'
  }
  const { data, error } = await admin
    .from('club_werkwijzen')
    .update({ versie: v.versie, bijgewerkt_op: new Date().toISOString() })
    .eq('id', w.id)
    .eq('user_id', userId)
    .eq('versie', w.versie)
    .select('id')
  if (error || (data ?? []).length === 0) {
    if (error) log('versienummer bijwerken', error.message)
    await admin.from('club_werkwijze_versies').delete().eq('werkwijze_id', w.id).eq('user_id', userId).eq('versie', v.versie)
    return error ? 'fout' : 'oud'
  }
  if (v.mededeling && !(await plaatsMededeling(admin, userId, v.mededeling, door))) return 'melding'
  return 'ok'
}

/** Staat er al een wijziging-mededeling voor deze versie? Null bij een leesfout. */
export async function heeftWijzigingMededeling(admin: SupabaseClient, userId: string, werkwijzeId: string, versie: number): Promise<boolean | null> {
  const { data, error } = await admin.from('club_mededelingen').select('id').eq('user_id', userId).eq('werkwijze_id', werkwijzeId).eq('werkwijze_versie', versie).limit(1)
  if (error) {
    log('wijziging-mededeling lezen', error.message)
    return null
  }
  return (data ?? []).length > 0
}

export async function wijzigWerkwijze(admin: SupabaseClient, userId: string, id: string, meta: WerkwijzeMeta): Promise<boolean | null> {
  const velden: Record<string, unknown> = { bijgewerkt_op: new Date().toISOString() }
  if (meta.titel !== undefined) velden.titel = meta.titel
  if (meta.vestigingen !== undefined) velden.vestigingen = meta.vestigingen
  if (meta.rollen !== undefined) velden.rollen = meta.rollen
  if (meta.takenlijstId !== undefined) velden.takenlijst_id = meta.takenlijstId
  if (meta.gearchiveerd !== undefined) velden.gearchiveerd = meta.gearchiveerd
  const { data, error } = await admin.from('club_werkwijzen').update(velden).eq('id', id).eq('user_id', userId).select('id')
  if (error) {
    log('werkwijze wijzigen', error.message)
    return null
  }
  return (data ?? []).length > 0
}

/** Bestaat deze takenlijst bij deze sportschool? */
export async function takenlijstBestaat(admin: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { data, error } = await admin.from('club_takenlijsten').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) log('takenlijst lezen', error.message)
  return !error && data !== null
}

/** Bestaat dit lid bij deze sportschool? */
export async function lidBestaat(admin: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { data, error } = await admin.from('club_leden').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) log('lid lezen', error.message)
  return !error && data !== null
}

export async function bewaarUitvoering(admin: SupabaseClient, userId: string, u: UitvoeringInvoer, profielId: string): Promise<boolean> {
  const { error } = await admin.from('club_werkwijze_uitvoeringen').insert({
    user_id: userId,
    werkwijze_id: u.werkwijzeId,
    versie: u.versie,
    vestiging: u.vestiging,
    profiel_id: profielId,
    gestart_op: u.gestartOp,
    afgerond_op: new Date().toISOString(),
    afgevinkt: u.afgevinkt,
    notitie: u.notitie,
    lid_id: u.lidId,
  })
  if (error) log('uitvoering bewaren', error.message)
  return !error
}

export interface NotitieBron {
  titel: string
  inhoud: string
  map: string
  gearchiveerd: boolean
  /** null = een notitie voor alle vestigingen. */
  vestiging: string | null
}

/** Een notitie (titel, tekst, map, archief en vestiging) om er een werkwijze van te maken. */
export async function haalNotitie(admin: SupabaseClient, userId: string, id: string): Promise<NotitieBron | null> {
  const { data, error } = await admin.from('club_kladblok').select('titel, inhoud, map, gearchiveerd, vestiging').eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) log('notitie lezen', error.message)
  if (error || !data || typeof data.titel !== 'string') return null
  return {
    titel: data.titel,
    inhoud: typeof data.inhoud === 'string' ? data.inhoud : '',
    map: typeof data.map === 'string' ? data.map : '',
    gearchiveerd: data.gearchiveerd === true,
    vestiging: typeof data.vestiging === 'string' ? data.vestiging : null,
  }
}

/** Welke notitie is al een werkwijze geworden (notitie naar werkwijze). */
export function werkwijzeVanNotitie(werkwijzen: readonly Werkwijze[]): Record<string, string> {
  return Object.fromEntries(werkwijzen.filter((w) => w.bronNotitieId && !w.gearchiveerd).map((w) => [w.bronNotitieId as string, w.id]))
}

export interface TakenlijstKeuze {
  id: string
  naam: string
  vestiging: string
}

/** De actieve takenlijsten van alle vestigingen (om een werkwijze aan te koppelen); leeg bij een fout. */
export async function haalTakenlijsten(admin: SupabaseClient, userId: string): Promise<TakenlijstKeuze[]> {
  const { data, error } = await admin.from('club_takenlijsten').select('id, naam, vestiging').eq('user_id', userId).eq('actief', true).order('volgorde').limit(200)
  if (error) {
    log('takenlijsten lezen', error.message)
    return []
  }
  return ((data ?? []) as Record<string, unknown>[]).flatMap((r) =>
    typeof r.id === 'string' && typeof r.naam === 'string' && typeof r.vestiging === 'string' ? [{ id: r.id, naam: r.naam, vestiging: r.vestiging }] : [],
  )
}
