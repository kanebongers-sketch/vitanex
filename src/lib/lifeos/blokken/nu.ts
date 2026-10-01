// ─── LifeOS — "nu mee bezig": een blok vanaf nu (SERVER-ONLY) ───────────────
// Begin je aan een taak, dan zet één tik er een blok voor in je persoonlijke
// agenda, vanaf nu, zo lang als de taak duurt (standaard 30 min). Had LifeOS de
// taak al ingepland, dan verschuift dát blok naar nu — geen tweede blok ernaast.

import type { SupabaseClient } from '@supabase/supabase-js'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { AgendaSchrijfFout, maakAgendaEvent, wijzigAgendaEvent } from '@/lib/lifeos/agenda/schrijven'
import type { Taak } from '@/lib/lifeos/taken/taken'
import { STANDAARD_TAAK_MIN } from './plan'

const VIJF_MIN = 5 * 60_000
const UITLEG = 'Door LifeOS gezet toen je aan deze taak begon. Vink je de taak af, dan blijft dit blok staan als logboek.'

export interface NuBlok {
  startOp: string
  eindOp: string
}

export async function startTaakNu(admin: SupabaseClient, userId: string, taak: Taak, nu = new Date()): Promise<NuBlok> {
  const minuten = Math.min(180, Math.max(15, taak.inspanningMinuten ?? STANDAARD_TAAK_MIN))
  const start = new Date(Math.floor(nu.getTime() / VIJF_MIN) * VIJF_MIN)
  const eind = new Date(start.getTime() + minuten * 60_000)
  const titel = `Taak: ${taak.titel}`.slice(0, 120)
  const sleutel = `taak:${taak.id}`
  const kalenderId = await leesGekozenKalender(admin, userId)

  const { data: rij } = await admin
    .from('agenda_blokken')
    .select('id, extern_id, status')
    .eq('user_id', userId)
    .eq('sleutel', sleutel)
    .maybeSingle()
  const bestaand = rij as { id: string; extern_id: string | null; status: string } | null

  // Al een blok voor deze taak in je agenda? Verschuif het naar nu.
  if (bestaand?.extern_id && bestaand.status === 'gepland') {
    try {
      await wijzigAgendaEvent(admin, userId, bestaand.extern_id, { startOp: start.toISOString(), eindOp: eind.toISOString() }, kalenderId)
      await admin.from('agenda_blokken').update({ start_op: start.toISOString(), eind_op: eind.toISOString() }).eq('id', bestaand.id)
      return { startOp: start.toISOString(), eindOp: eind.toISOString() }
    } catch (oorzaak) {
      // Jij gooide het blok weg in Google → gewoon een nieuw maken.
      if (!(oorzaak instanceof AgendaSchrijfFout && oorzaak.soort === 'niet_gevonden')) throw oorzaak
    }
  }

  const event = await maakAgendaEvent(
    admin,
    userId,
    { titel, startOp: start.toISOString(), eindOp: eind.toISOString(), beschrijving: UITLEG },
    kalenderId,
  )
  const velden = {
    soort: 'taak', taak_ids: [taak.id], extern_id: event.externId, titel,
    start_op: start.toISOString(), eind_op: eind.toISOString(), status: 'gepland',
  }
  if (bestaand) await admin.from('agenda_blokken').update(velden).eq('id', bestaand.id)
  else await admin.from('agenda_blokken').insert({ user_id: userId, sleutel, ...velden })
  return { startOp: start.toISOString(), eindOp: eind.toISOString() }
}
