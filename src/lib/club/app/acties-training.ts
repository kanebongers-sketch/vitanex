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

export interface TrainingVraag {
  schemaId: unknown
  dag: unknown
}

/** Een training uit het eigen schema afvinken. */
export async function vinkTrainingAf(s: ClubSchrijver, lid: Lid, v: TrainingVraag): Promise<NextResponse> {
  if (!isUuid(v.schemaId)) return clubFout('Onbekend schema.', 400)
  if (typeof v.dag !== 'number' || !Number.isInteger(v.dag) || v.dag < 1 || v.dag > 7) return clubFout('Onbekende trainingsdag.', 400)
  const schema = await s.admin.from('club_schemas').select('id').eq('user_id', s.userId).eq('id', v.schemaId).eq('lid_id', lid.id).maybeSingle()
  if (schema.error) {
    console.error('[club/app] schema lezen mislukt', schema.error.message)
    return clubFout('Het schema kon niet worden gelezen.', 500)
  }
  if (!schema.data) return clubFout('Dit schema hoort niet bij dit lid.', 404)
  const { data, error } = await s.admin
    .from('club_trainingslog')
    .insert({ user_id: s.userId, lid_id: lid.id, schema_id: v.schemaId, dag: v.dag, uitgevoerd: [], demo: lid.demo })
    .select('id, op')
    .single()
  if (error || !data) {
    console.error('[club/app] training afvinken mislukt', error?.message)
    return clubFout('Afvinken is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(s, 'Training afgevinkt in ledenapp', volledigeNaam(lid), lid.vestiging)
  return clubJson({ id: data.id, op: data.op }, 201)
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
