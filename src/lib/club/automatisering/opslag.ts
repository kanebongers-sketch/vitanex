// ─── Club: automatiseringen en opvolgtaken lezen en schrijven (SERVER-ONLY) ──
// Elke query filtert op user_id (de sportschool). De ronde van vandaag draait
// als iemand de opvolglijst opent (geen cron): ze rekent de aanleidingen uit,
// maakt nieuwe taken (de unieke sleutel lid + regel + periode houdt dubbele
// tegen) en laat open taken vervallen waarvan de stand niet meer klopt.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { alleRijen, haalLedenRijen } from '@/lib/club/leden/data'
import type { LedenRij } from '@/lib/club/leden/lijst'
import { dagSleutel } from '@/lib/club/leden/tijd'
import { regelNaarRij, regelsCompleet, type Regel, type RegelSleutel } from './regels'
import { MIJLPAAL_VENSTER, bepaalAanleidingen, planRonde, type BestaandeTaak, type LidSignaal } from './signalen'
import { TAAK_KOLOMMEN, taakUitRij, telPerRegel, type Taak } from './taken'

const MS_DAG = 86_400_000

/** De zeven regels van een sportschool; null bij een leesfout. */
export async function haalRegels(admin: SupabaseClient, userId: string): Promise<Regel[] | null> {
  const { data, error } = await admin.from('club_automatiseringen').select('regel, aan, drempel, rol, medewerker_id, sjabloon').eq('user_id', userId)
  if (error) {
    console.error('[club] automatiseringen lezen mislukt', error.message)
    return null
  }
  return regelsCompleet(data ?? [])
}

/** Een regel opslaan (nieuw of bijwerken). */
export async function slaRegelOp(admin: SupabaseClient, userId: string, regel: Regel): Promise<boolean> {
  const { error } = await admin
    .from('club_automatiseringen')
    .upsert({ user_id: userId, ...regelNaarRij(regel), bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id,regel' })
  if (error) console.error('[club] automatisering opslaan mislukt', error.message)
  return !error
}

export interface MedewerkerKort {
  id: string
  naam: string
}

/** Alle actieve medewerkers van de sportschool (alle vestigingen). */
export async function haalAlleMedewerkers(admin: SupabaseClient, userId: string): Promise<MedewerkerKort[] | null> {
  const { data, error } = await admin.from('club_medewerkers').select('id, naam').eq('user_id', userId).eq('actief', true).order('naam')
  if (error) {
    console.error('[club] medewerkers lezen mislukt', error.message)
    return null
  }
  return (data ?? []).flatMap((r) => (typeof r.id === 'string' && typeof r.naam === 'string' ? [{ id: r.id, naam: r.naam }] : []))
}

interface Totalen {
  totaal: number
  voor: number
}

/**
 * Bezoekdagen per lid (ooit en voor `voor`). De functie geeft een rij per lid;
 * PostgREST geeft hoogstens 1000 rijen per verzoek, dus we lezen in blokken
 * (op lid_id gesorteerd, zodat de blokken elkaar niet overlappen).
 */
export async function haalBezoekTotalen(admin: SupabaseClient, userId: string, vestiging: Vestiging, voor: Date): Promise<Map<string, Totalen> | null> {
  const rijen = await alleRijen('bezoektotalen', (van, tot) =>
    admin.rpc('club_bezoek_totalen', { p_user: userId, p_vestiging: vestiging, p_voor: voor.toISOString() }).order('lid_id').range(van, tot),
  )
  if (!rijen) return null
  const uit = new Map<string, Totalen>()
  for (const r of rijen as Record<string, unknown>[]) {
    if (typeof r.lid_id === 'string') uit.set(r.lid_id, { totaal: Number(r.totaal) || 0, voor: Number(r.voor) || 0 })
  }
  return uit
}

function naarSignaal(rij: LedenRij, totalen: ReadonlyMap<string, Totalen>): LidSignaal {
  const t = totalen.get(rij.lid.id)
  return {
    id: rij.lid.id,
    status: rij.lid.status,
    lidSinds: rij.lid.lidSinds,
    einddatum: rij.lid.einddatum,
    geboortedatum: rij.lid.geboortedatum,
    laatsteBezoek: rij.laatsteBezoek ? dagSleutel(rij.laatsteBezoek) : null,
    behoudScore: rij.behoud?.score ?? null,
    bezoekenTotaal: t?.totaal ?? 0,
    bezoekenVoorVenster: t?.voor ?? 0,
  }
}

async function haalOpenSleutels(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<BestaandeTaak[] | null> {
  const rijen = await alleRijen('open opvolgtaken', (van, tot) =>
    admin.from('club_opvolgtaken').select('id, lid_id, regel, periode').eq('user_id', userId).eq('vestiging', vestiging).eq('status', 'open').order('id').range(van, tot),
  )
  if (!rijen) return null
  return rijen.flatMap((r) => {
    const o = r as Record<string, unknown>
    return typeof o.id === 'string' && typeof o.lid_id === 'string' && typeof o.periode === 'string'
      ? [{ id: o.id, lidId: o.lid_id, regel: o.regel as RegelSleutel, periode: o.periode }]
      : []
  })
}

export interface RondeUitkomst {
  nieuw: number
  vervallen: number
}

/**
 * De ronde van vandaag voor een vestiging. Veilig om vaker te draaien: wat er
 * al staat, komt er niet nog een keer bij. Null als iets niet te lezen was.
 */
export async function maakTakenVoorVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu: Date): Promise<RondeUitkomst | null> {
  const [regels, rijen, totalen, open] = await Promise.all([
    haalRegels(admin, userId),
    haalLedenRijen(admin, userId, vestiging, nu),
    haalBezoekTotalen(admin, userId, vestiging, new Date(nu.getTime() - MIJLPAAL_VENSTER * MS_DAG)),
    haalOpenSleutels(admin, userId, vestiging),
  ])
  if (!regels || !rijen || !totalen || !open) return null
  const aanleidingen = bepaalAanleidingen(rijen.map((r) => naarSignaal(r, totalen)), regels, dagSleutel(nu))
  const ronde = planRonde(aanleidingen, open, new Set(rijen.map((r) => r.lid.id)))
  const perRegel = new Map(regels.map((r) => [r.sleutel, regelNaarRij(r)]))
  const demo = new Set(rijen.filter((r) => r.lid.demo).map((r) => r.lid.id))

  if (ronde.nieuw.length > 0) {
    const nieuweRijen = ronde.nieuw.map((a) => ({
      user_id: userId,
      vestiging,
      lid_id: a.lidId,
      regel: a.regel,
      periode: a.periode,
      waarde: a.waarde,
      reden: a.reden.slice(0, 200),
      rol: perRegel.get(a.regel)?.rol ?? null,
      medewerker_id: perRegel.get(a.regel)?.medewerker_id ?? null,
      demo: demo.has(a.lidId),
    }))
    const { error } = await admin.from('club_opvolgtaken').upsert(nieuweRijen, { onConflict: 'user_id,lid_id,regel,periode', ignoreDuplicates: true })
    if (error) {
      console.error('[club] opvolgtaken aanmaken mislukt', error.message)
      return null
    }
  }
  if (ronde.vervallen.length > 0) {
    const { error } = await admin
      .from('club_opvolgtaken')
      .update({ status: 'vervallen', afgehandeld_door: 'Club', afgehandeld_op: nu.toISOString() })
      .eq('user_id', userId)
      .eq('status', 'open')
      .in('id', ronde.vervallen)
    if (error) console.error('[club] opvolgtaken laten vervallen mislukt', error.message)
  }
  const { error } = await admin.from('club_opvolg_rondes').upsert({ user_id: userId, vestiging, dag: dagSleutel(nu), gedaan_op: nu.toISOString() }, { onConflict: 'user_id,vestiging,dag' })
  if (error) console.error('[club] opvolgronde vastleggen mislukt', error.message)
  return { nieuw: ronde.nieuw.length, vervallen: ronde.vervallen.length }
}

/** Voor Club Vandaag: draai de ronde alleen als die vandaag nog niet draaide (snel bij elk openen). */
export async function zorgVoorRondeVanVandaag(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu: Date): Promise<void> {
  const { data, error } = await admin.from('club_opvolg_rondes').select('dag').eq('user_id', userId).eq('vestiging', vestiging).eq('dag', dagSleutel(nu)).maybeSingle()
  if (error) {
    console.error('[club] opvolgronde lezen mislukt', error.message)
    return
  }
  if (!data) await maakTakenVoorVandaag(admin, userId, vestiging, nu)
}

function naarTaken(data: unknown[] | null): Taak[] {
  return (data ?? []).map(taakUitRij).filter((t): t is Taak => t !== null)
}

/** Alle open taken van een vestiging. */
export async function haalOpenTaken(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<Taak[] | null> {
  const rijen = await alleRijen('opvolgtaken', (van, tot) =>
    admin.from('club_opvolgtaken').select(TAAK_KOLOMMEN).eq('user_id', userId).eq('vestiging', vestiging).eq('status', 'open').order('aangemaakt_op').order('id').range(van, tot),
  )
  return rijen ? naarTaken(rijen) : null
}

/** Wat het team de laatste dagen afhandelde (niet wat Club zelf liet vervallen), nieuwste eerst. */
export async function haalRecentAfgehandeld(admin: SupabaseClient, userId: string, vestiging: Vestiging, nu: Date, dagen = 7, limiet = 30): Promise<Taak[] | null> {
  const { data, error } = await admin
    .from('club_opvolgtaken')
    .select(TAAK_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .in('status', ['gedaan', 'overgeslagen'])
    .gte('afgehandeld_op', new Date(nu.getTime() - dagen * MS_DAG).toISOString())
    .order('afgehandeld_op', { ascending: false })
    .limit(limiet)
  if (error) {
    console.error('[club] afgehandelde opvolgtaken lezen mislukt', error.message)
    return null
  }
  return naarTaken(data)
}

/** Aantal open taken per regel, voor Club Vandaag. */
export async function telOpenPerRegel(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<{ regel: RegelSleutel; aantal: number }[] | null> {
  const rijen = await alleRijen('open opvolgtaken tellen', (van, tot) =>
    admin.from('club_opvolgtaken').select('id, regel').eq('user_id', userId).eq('vestiging', vestiging).eq('status', 'open').order('id').range(van, tot),
  )
  if (!rijen) return null
  return telPerRegel(rijen.map((r) => String((r as Record<string, unknown>).regel)))
}

export type Bijgewerkt = { soort: 'ok'; taak: Taak } | { soort: 'niet_gevonden' } | { soort: 'fout' }

/** Een taak bijwerken, alleen binnen deze sportschool. */
export async function werkTaakBij(admin: SupabaseClient, userId: string, id: string, wijziging: Record<string, string | null>): Promise<Bijgewerkt> {
  const { data, error } = await admin.from('club_opvolgtaken').update(wijziging).eq('user_id', userId).eq('id', id).select(TAAK_KOLOMMEN).maybeSingle()
  if (error) {
    console.error('[club] opvolgtaak bijwerken mislukt', error.message)
    return { soort: 'fout' }
  }
  const taak = taakUitRij(data)
  return taak ? { soort: 'ok', taak } : { soort: 'niet_gevonden' }
}

/** Bestaat deze medewerker binnen de sportschool? */
export async function isMedewerkerVan(admin: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { data, error } = await admin.from('club_medewerkers').select('id').eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) console.error('[club] medewerker controleren mislukt', error.message)
  return !error && data !== null
}
