// ─── Club, ledenapp: training afvinken en lessen van een lid (SERVER-ONLY) ──
// Gedeelde stappen voor de voorvertoning (beheerder-routes) en de leden-API.
// Het lid is altijd al bepaald door de aanroeper; hier wordt elke rij nog eens
// tegen dat lid en de sportschool gecontroleerd.

import type { NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, type ClubSchrijver } from '@/lib/club/toegang'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { annuleerReservering, haalReservering, reserveer } from '@/lib/club/rooster/reserveren-opslag'
import { isUuid } from './invoer'
import { leesGelogdeSets } from './sets'
import { leesTrainingId } from './training-id'
import { trainingDag, trainingTijdstip } from './training-tijd'
import { oefeningNamen, toegestaanOpDag } from '@/lib/club/training/alternatieven-opslag'

export interface TrainingVraag {
  schemaId: unknown
  dag: unknown
  /** Optioneel: per set wat het lid deed (zie sets.ts). Zonder sets is het afvinken. */
  sets?: unknown
  duurSec?: unknown
  /** Vast id van deze training (uuid, gemaakt bij het starten). Zelfde id nog eens: niets dubbel opslaan. */
  clientId?: unknown
  /** Moment van afronden op de telefoon (ms of ISO). Bepaalt de datum, binnen de grenzen van training-tijd.ts. */
  afgerondOp?: unknown
}

interface OpgeslagenLog {
  id: string
  op: string
}

/** Het succesantwoord van een opgeslagen training; voor een herhaalde inzending precies hetzelfde. */
function trainingOpgeslagen(log: OpgeslagenLog, sets: number): NextResponse {
  return clubJson({ id: log.id, op: log.op, datum: trainingDag(new Date(log.op)), sets }, 201)
}

/**
 * Staat deze training (zelfde id, zelfde lid) er al? Dan het succesantwoord,
 * zonder iets opnieuw te schrijven. Er nog niet: null. Leesfout: een 500.
 */
async function alOpgeslagen(s: ClubSchrijver, lidId: string, clientId: string): Promise<NextResponse | null> {
  const { data, error } = await s.admin
    .from('club_trainingslog')
    .select('id, op')
    .eq('user_id', s.userId)
    .eq('lid_id', lidId)
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) {
    console.error('[club/app] eerdere training zoeken mislukt', error.message)
    return clubFout('Afvinken is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || typeof data.id !== 'string' || typeof data.op !== 'string') return null
  const telling = await s.admin.from('club_set_logs').select('id', { count: 'exact', head: true }).eq('user_id', s.userId).eq('trainingslog_id', data.id)
  if (telling.error) console.error('[club/app] sets tellen mislukt', telling.error.message)
  return trainingOpgeslagen({ id: data.id, op: data.op }, telling.count ?? 0)
}

/** De oefeningen (club_oefeningen.id) op deze dag van het schema; null bij een leesfout. */
async function oefeningenVanDag(s: ClubSchrijver, schemaId: string, dag: number): Promise<Set<string> | null> {
  const { data, error } = await s.admin.from('club_schema_oefeningen').select('oefening_id').eq('user_id', s.userId).eq('schema_id', schemaId).eq('dag', dag)
  if (error) {
    console.error('[club/app] schema-oefeningen lezen mislukt', error.message)
    return null
  }
  return new Set((data ?? []).map((r) => (typeof r.oefening_id === 'string' ? r.oefening_id : '')).filter(Boolean))
}

/** Staat er een set in met een oefening die niet op de dag staat? Alleen dan zijn de alternatieven nodig. */
function heeftAndereOefening(sets: unknown, opDag: ReadonlySet<string>): boolean {
  if (!Array.isArray(sets)) return false
  return sets.some((x: unknown) => typeof x === 'object' && x !== null && 'oefeningId' in x && typeof x.oefeningId === 'string' && !opDag.has(x.oefeningId))
}

/** Een training uit het eigen schema afvinken, met of zonder gelogde sets. */
export async function vinkTrainingAf(s: ClubSchrijver, lid: Lid, v: TrainingVraag): Promise<NextResponse> {
  if (!isUuid(v.schemaId)) return clubFout('Onbekend schema.', 400)
  if (typeof v.dag !== 'number' || !Number.isInteger(v.dag) || v.dag < 1 || v.dag > 7) return clubFout('Onbekende trainingsdag.', 400)
  // Zonder id (oudere app): zoals vroeger. Met een ongeldig id: weigeren, anders kan dubbel opslaan weer.
  const clientId = v.clientId === undefined || v.clientId === null ? null : leesTrainingId(v.clientId)
  if (v.clientId !== undefined && v.clientId !== null && !clientId) return clubFout('Ongeldige training.', 400)
  if (clientId) {
    const eerder = await alOpgeslagen(s, lid.id, clientId)
    if (eerder) return eerder
  }
  const schema = await s.admin.from('club_schemas').select('id').eq('user_id', s.userId).eq('id', v.schemaId).eq('lid_id', lid.id).maybeSingle()
  if (schema.error) {
    console.error('[club/app] schema lezen mislukt', schema.error.message)
    return clubFout('Het schema kon niet worden gelezen.', 500)
  }
  if (!schema.data) return clubFout('Dit schema hoort niet bij dit lid.', 404)
  const opDag = v.sets === undefined || v.sets === null ? new Set<string>() : await oefeningenVanDag(s, v.schemaId, v.dag)
  // Toestel bezet: een lid mag ook een veilig alternatief van een oefening van de dag loggen (alternatieven.ts).
  const toegestaan = opDag && heeftAndereOefening(v.sets, opDag) ? await toegestaanOpDag(s, opDag) : opDag
  if (!opDag || !toegestaan) return clubFout('Het schema kon niet worden gelezen.', 500)
  const invoer = leesGelogdeSets(v.sets, v.duurSec, toegestaan)
  if (typeof invoer === 'string') return clubFout(invoer, 400)
  const anders = await oefeningNamen(s, invoer.sets.map((x) => x.oefeningId).filter((id) => !opDag.has(id)))

  const op = trainingTijdstip(v.afgerondOp, new Date()).toISOString()
  const { data, error } = await s.admin
    .from('club_trainingslog')
    .insert({ user_id: s.userId, lid_id: lid.id, schema_id: v.schemaId, dag: v.dag, uitgevoerd: [], duur_sec: invoer.duurSec, demo: lid.demo, op, client_id: clientId })
    .select('id, op')
    .single()
  // Tegelijk binnengekomen (twee verzoeken met hetzelfde id): de ander was net eerder, dat is de opgeslagen training.
  if (error?.code === '23505' && clientId) {
    const eerder = await alOpgeslagen(s, lid.id, clientId)
    if (eerder) return eerder
  }
  if (error || !data) {
    console.error('[club/app] training afvinken mislukt', error?.message)
    return clubFout('Afvinken is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (invoer.sets.length > 0) {
    const rijen = invoer.sets.map((x) => ({
      user_id: s.userId, lid_id: lid.id, trainingslog_id: data.id, schema_id: v.schemaId, oefening_id: x.oefeningId, set_nr: x.setNr,
      herhalingen: x.herhalingen, gewicht_kg: x.gewichtKg, tijd_sec: x.tijdSec, op: data.op, demo: lid.demo,
    }))
    const sets = await s.admin.from('club_set_logs').insert(rijen)
    if (sets.error) {
      console.error('[club/app] sets opslaan mislukt', sets.error.message)
      await s.admin.from('club_trainingslog').delete().eq('user_id', s.userId).eq('id', data.id)
      return clubFout('De sets konden niet worden opgeslagen. Je invoer staat er nog: probeer het opnieuw.', 500)
    }
  }
  // De trainer ziet in het logboek welke andere oefening het lid koos; de sets staan op die oefening.
  const actie = anders.length > 0 ? 'Training gelogd in ledenapp, met andere oefening' : invoer.sets.length > 0 ? 'Training gelogd in ledenapp' : 'Training afgevinkt in ledenapp'
  const onderwerp = anders.length > 0 ? `${volledigeNaam(lid)} · andere oefening: ${anders.join(', ')}` : volledigeNaam(lid)
  await logActie(s, actie, onderwerp, lid.vestiging)
  return trainingOpgeslagen(data, invoer.sets.length)
}

/** Een afgevinkte training ongedaan maken. Met `lidId`: alleen een training van dat lid. */
export async function wisTraining(s: ClubSchrijver, id: string, lidId: string | null): Promise<NextResponse> {
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const basis = s.admin.from('club_trainingslog').delete().eq('user_id', s.userId).eq('id', id)
  const { data, error } = await (lidId ? basis.eq('lid_id', lidId) : basis).select('id, lid_id')
  if (error) {
    console.error('[club/app] afvinken ongedaan maken mislukt', error.message)
    return clubFout('Ongedaan maken is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return clubFout('Niet gevonden.', 404)
  await logActie(s, 'Afgevinkte training ongedaan gemaakt', null, null)
  return clubJson({ ok: true })
}

/** Het lid boekt een les (of komt op de wachtlijst), met de regels voor de app. */
export async function boekLesVoorLid(s: ClubSchrijver, lid: Lid, lesId: unknown): Promise<NextResponse> {
  if (!isUuid(lesId)) return clubFout('Kies een les.', 400)
  // bron 'app': de lidmaatschapsregels weigeren, geen "toch boeken" zoals aan de balie.
  return alsAntwoord(await reserveer(s, { lesId, lidId: lid.id, bron: 'app', toch: false }))
}

/** Het lid meldt zich af voor een eigen reservering. */
export async function annuleerLesVoorLid(s: ClubSchrijver, lid: Lid, reserveringId: string): Promise<NextResponse> {
  if (!isUuid(reserveringId)) return clubFout('Deze reservering bestaat niet.', 404)
  const res = await haalReservering(s.admin, s.userId, reserveringId)
  // Andermans reservering bestaat voor dit lid niet (zelfde antwoord als onbekend).
  if (!res || res.lidId !== lid.id) return clubFout('Deze reservering bestaat niet.', 404)
  const uit = await annuleerReservering(s, reserveringId)
  // Wie doorschoof van de wachtlijst is een ander lid: dat id gaat niet naar de app.
  return uit.ok ? clubJson({ status: uit.waarde.status, teLaat: uit.waarde.teLaat, doorgeschoven: uit.waarde.doorgeschoven !== null }) : alsAntwoord(uit)
}
