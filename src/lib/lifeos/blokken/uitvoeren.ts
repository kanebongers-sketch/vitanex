// ─── LifeOS — blokken in je agenda zetten en opruimen (SERVER-ONLY) ─────────
// Draait na elke agenda-sync. `plan.ts` beslist; dit bestand schrijft — ALLEEN in
// je persoonlijke (gekozen) agenda, net als het hernoemen en kleuren.
//
//   • Elk nieuw blok wordt eerst geclaimd in `agenda_blokken` (unieke sleutel = het
//     slot tegen twee klokken), dan pas in Google gezet. Mislukt Google, dan gaat
//     de claim terug en probeert de volgende ronde het opnieuw.
//   • Is een taak af (of weg) en is het blok nog niet begonnen, dan haalt LifeOS
//     het blok weer uit je agenda. Bouwblokken blijven altijd staan.
//   • Best-effort per blok: één mislukking houdt de rest niet tegen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'
import { AgendaSchrijfFout, maakAgendaEvent, verwijderAgendaEvent, wijzigAgendaEvent } from '@/lib/lifeos/agenda/schrijven'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { HORIZON_DAGEN, planBlokken, teOpruimen, type BestaandBlok, type BlokSoort, type BlokVoorstel, type TaakKandidaat } from './plan'

const TABEL = 'agenda_blokken'
/** Per ronde: de eerste keer gaat in een paar rondes, en een fout blijft klein. */
const MAX_NIEUW = 12

export interface BlokkenUitkomst {
  gepland: string[]
  opgeruimd: number
  hersteld: number
}

interface Rij {
  id: string
  sleutel: string
  soort: BlokSoort
  taak_ids: string[] | null
  extern_id: string | null
  titel: string
  start_op: string | null
  status: 'gepland' | 'opgeruimd'
}

async function leesBlokken(admin: SupabaseClient, userId: string): Promise<(BestaandBlok & { id: string; externId: string | null; titel: string })[] | null> {
  const { data, error } = await admin.from(TABEL).select('id, sleutel, soort, taak_ids, extern_id, titel, start_op, status').eq('user_id', userId)
  if (error || !Array.isArray(data)) return null
  return (data as Rij[]).map((r) => ({
    id: r.id,
    sleutel: r.sleutel,
    soort: r.soort,
    taakIds: r.taak_ids ?? [],
    externId: r.extern_id,
    titel: r.titel,
    startOp: r.start_op ? new Date(r.start_op) : null,
    status: r.status,
  }))
}

async function mailTaakIds(admin: SupabaseClient, userId: string): Promise<Set<string> | null> {
  const { data, error } = await admin.from('mail_taken').select('taak_id').eq('user_id', userId).not('taak_id', 'is', null)
  if (error || !Array.isArray(data)) return null
  return new Set((data as { taak_id: string }[]).map((r) => r.taak_id))
}

async function zetInAgenda(admin: SupabaseClient, userId: string, v: BlokVoorstel, kalenderId: string | null): Promise<boolean> {
  const { data: claim, error } = await admin
    .from(TABEL)
    .insert({
      user_id: userId, soort: v.soort, sleutel: v.sleutel, taak_ids: v.taakIds, titel: v.titel,
      start_op: v.startOp.toISOString(), eind_op: v.eindOp.toISOString(),
    })
    .select('id')
    .single()
  if (error || !claim) return false
  const id = (claim as { id: string }).id
  try {
    const event = await maakAgendaEvent(
      admin,
      userId,
      { titel: v.titel, startOp: v.startOp.toISOString(), eindOp: v.eindOp.toISOString(), beschrijving: v.beschrijving },
      kalenderId,
    )
    await admin.from(TABEL).update({ extern_id: event.externId }).eq('id', id)
    return true
  } catch (oorzaak) {
    console.warn(`[blokken] ${v.sleutel} niet gezet:`, oorzaak instanceof Error ? oorzaak.message : oorzaak)
    await admin.from(TABEL).delete().eq('id', id)
    return false
  }
}

/**
 * Zette LifeOS zelf (het hernoemen) een andere titel op een van zijn eigen blokken,
 * dan krijgt het blok zijn eigen titel terug. Hernoemde JIJ het, dan blijft het
 * staan: alleen wanneer de huidige titel precies is wat LifeOS schreef
 * (`hernoem_geschreven`), was het LifeOS.
 */
async function herstelTitels(
  admin: SupabaseClient,
  userId: string,
  blokken: readonly { externId: string | null; titel: string; status: string; startOp: Date | null }[],
  kalenderId: string | null,
  nu: Date,
): Promise<number> {
  const actief = blokken.filter((b) => b.status === 'gepland' && b.externId && b.startOp && b.startOp > nu)
  if (actief.length === 0) return 0
  const { data, error } = await admin
    .from('agenda_events')
    .select('extern_id, titel, hernoem_geschreven')
    .eq('user_id', userId)
    .in('extern_id', actief.map((b) => b.externId as string))
  if (error || !Array.isArray(data)) return 0
  let hersteld = 0
  for (const r of data as { extern_id: string; titel: string | null; hernoem_geschreven: string | null }[]) {
    const blok = actief.find((b) => b.externId === r.extern_id)
    if (!blok || r.titel === blok.titel || r.titel === null || r.hernoem_geschreven !== r.titel) continue
    try {
      await wijzigAgendaEvent(admin, userId, r.extern_id, { titel: blok.titel }, kalenderId)
      await admin.from('agenda_events').update({ hernoem_geschreven: null }).eq('user_id', userId).eq('extern_id', r.extern_id)
      hersteld++
    } catch (oorzaak) {
      console.warn(`[blokken] titel van ${r.extern_id} niet hersteld:`, oorzaak instanceof Error ? oorzaak.message : oorzaak)
    }
  }
  return hersteld
}

async function ruimOp(
  admin: SupabaseClient,
  userId: string,
  blok: { id: string; externId: string | null; sleutel: string },
  kalenderId: string | null,
): Promise<boolean> {
  try {
    if (blok.externId) await verwijderAgendaEvent(admin, userId, blok.externId, kalenderId)
  } catch (oorzaak) {
    // Al weg bij Google (jij verwijderde het zelf) = het doel is bereikt.
    if (!(oorzaak instanceof AgendaSchrijfFout && oorzaak.soort === 'niet_gevonden')) {
      console.warn(`[blokken] ${blok.sleutel} niet opgeruimd:`, oorzaak instanceof Error ? oorzaak.message : oorzaak)
      return false
    }
  }
  await admin.from(TABEL).update({ status: 'opgeruimd' }).eq('id', blok.id)
  return true
}

export async function planAgendaBlokken(admin: SupabaseClient, userId: string, nu = new Date()): Promise<BlokkenUitkomst> {
  const leeg: BlokkenUitkomst = { gepland: [], opgeruimd: 0, hersteld: 0 }
  const [blokken, uitMail, taken, agenda] = await Promise.all([
    leesBlokken(admin, userId),
    mailTaakIds(admin, userId),
    haalTaken(admin, userId, { alleenOpen: true }),
    haalEventsUitCache(admin, userId, nu, new Date(nu.getTime() + (HORIZON_DAGEN + 1) * 24 * 60 * 60 * 1000)),
  ])
  // Zonder geheugen of zonder je agenda geen beslissingen: anders dubbel of over een afspraak heen.
  if (blokken === null || uitMail === null || !taken.ok || !agenda.ok) return leeg

  const kalenderId = await leesGekozenKalender(admin, userId)
  const open = taken.waarde.filter((t) => !t.klaar)
  const openIds = new Set(open.map((t) => t.id))

  let opgeruimd = 0
  for (const blok of teOpruimen(blokken, openIds, nu)) {
    const b = blokken.find((x) => x.sleutel === blok.sleutel)
    if (b && (await ruimOp(admin, userId, b, kalenderId))) opgeruimd++
  }

  const hersteld = await herstelTitels(admin, userId, blokken, kalenderId, nu)

  const kandidaten: TaakKandidaat[] = open.map((t) => ({
    id: t.id,
    titel: t.titel,
    datum: t.datum,
    deadline: t.deadline,
    inspanningMinuten: t.inspanningMinuten,
    top3: t.top3Positie !== null,
    uitMail: uitMail.has(t.id),
  }))
  const voorstellen = planBlokken({ nu, afspraken: agenda.waarde, taken: kandidaten, bestaand: blokken }).slice(0, MAX_NIEUW)

  const gepland: string[] = []
  for (const v of voorstellen) {
    if (await zetInAgenda(admin, userId, v, kalenderId)) gepland.push(v.titel)
  }
  return { gepland, opgeruimd, hersteld }
}
