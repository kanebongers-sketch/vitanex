// ─── LifeOS — automatische acties uitvoeren (SERVER-ONLY) ───────────────────
// Draait na elke agenda-sync. Leest de PT-signalen, laat `plan.ts` beslissen wat
// automatisch mag, en voert het uit — elke actie eerst geclaimd in het logboek
// (migratie 300): de unieke insert is het slot tegen dubbel werk, en blijft staan
// als herinnering zodat LifeOS nooit terugvecht tegen iets dat jij terugdraaide.
//
// Waarborgen:
//   • Agenda: ALLEEN je persoonlijke (gekozen) agenda — dezelfde als het hernoemen.
//     Een afspraak die jij ooit na een LifeOS-hernoem corrigeerde (geblokkeerd),
//     blijft met rust.
//   • Best-effort per actie: mislukt er één, dan geeft hij zijn claim terug (volgende
//     ronde opnieuw) en gaan de andere door.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalPersonen, maakPersoon, wijzigPersoon } from '@/lib/lifeos/crm/opslag'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { wijzigAgendaEvent } from '@/lib/lifeos/agenda/schrijven'
import { haalPtSignalen } from '@/lib/lifeos/pt-klant/afhaak-ophalen'
import { logSleutel, planAutomatischeActies, type ActieSoort, type GeplandeActie } from './plan'

const TABEL = 'automatische_acties'

export interface AutomatischUitkomst {
  uitgevoerd: number
  mislukt: number
}

async function leesGedaan(admin: SupabaseClient, userId: string): Promise<Set<string> | null> {
  const { data, error } = await admin.from(TABEL).select('soort, sleutel').eq('user_id', userId)
  if (error || !Array.isArray(data)) return null
  return new Set(data.map((r: { soort: ActieSoort; sleutel: string }) => logSleutel(r.soort, r.sleutel)))
}

/** Afspraken die jij na een LifeOS-hernoem corrigeerde: nooit meer aanraken. */
async function geblokkeerdeEvents(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const { data } = await admin
    .from('agenda_events')
    .select('extern_id')
    .eq('user_id', userId)
    .eq('hernoem_geblokkeerd', true)
    .in('extern_id', ids)
  return new Set((Array.isArray(data) ? data : []).map((r: { extern_id: string }) => r.extern_id))
}

/** Claim in het logboek. false = al gedaan (of de claim lukte niet) → overslaan. */
async function claim(admin: SupabaseClient, userId: string, a: GeplandeActie): Promise<string | null> {
  const { data, error } = await admin
    .from(TABEL)
    .insert({ user_id: userId, soort: a.soort, sleutel: a.sleutel, omschrijving: a.omschrijving })
    .select('id')
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

async function voerEenUit(
  admin: SupabaseClient,
  userId: string,
  a: GeplandeActie,
  kalenderId: string | null,
): Promise<boolean> {
  if (a.soort === 'status_actief') {
    const u = await wijzigPersoon(admin, userId, a.persoonId, { status: 'actieve_klant' })
    return u.ok
  }
  if (a.soort === 'typfout') {
    await wijzigAgendaEvent(admin, userId, a.eventId, { titel: a.nieuweTitel }, kalenderId)
    // Vastleggen als "door LifeOS geschreven": corrigeer jij 'm terug, dan blokkeert
    // het hernoemen deze afspraak voortaan (zelfde geheugen als migratie 220).
    await admin
      .from('agenda_events')
      .update({ hernoem_geschreven: a.nieuweTitel })
      .eq('user_id', userId)
      .eq('extern_id', a.eventId)
    return true
  }
  const u = await maakPersoon(admin, userId, {
    naam: a.naam,
    groep: 'pt_klant',
    status: 'actieve_klant',
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: 'Automatisch toegevoegd door LifeOS: stond als PT-sessie in je agenda.',
  })
  return u.ok
}

export async function voerAutomatischeActiesUit(admin: SupabaseClient, userId: string): Promise<AutomatischUitkomst> {
  const leeg: AutomatischUitkomst = { uitgevoerd: 0, mislukt: 0 }
  const personen = await haalPersonen(admin, userId)
  if (!personen.ok) return leeg
  const gedaan = await leesGedaan(admin, userId)
  // Logboek niet te lezen → niets doen: zonder geheugen zouden we kunnen terugvechten.
  if (gedaan === null) return leeg

  const signalen = await haalPtSignalen(admin, userId, personen.waarde, new Date())
  const plan = planAutomatischeActies(
    { statusHints: signalen.statusHints, typfouten: signalen.typfoutenAlle, onbekend: signalen.onbekend },
    gedaan,
  )
  if (plan.length === 0) return leeg

  const geblokkeerd = await geblokkeerdeEvents(
    admin,
    userId,
    plan.flatMap((a) => (a.soort === 'typfout' ? [a.eventId] : [])),
  )
  const kalenderId = await leesGekozenKalender(admin, userId)

  const uit = { ...leeg }
  for (const a of plan) {
    if (a.soort === 'typfout' && geblokkeerd.has(a.eventId)) continue
    const id = await claim(admin, userId, a)
    if (id === null) continue
    let gelukt = false
    try {
      gelukt = await voerEenUit(admin, userId, a, kalenderId)
    } catch (oorzaak) {
      console.error(`[automatisch] ${a.soort} mislukt:`, oorzaak instanceof Error ? oorzaak.message : oorzaak)
    }
    if (gelukt) uit.uitgevoerd++
    else {
      uit.mislukt++
      await admin.from(TABEL).delete().eq('id', id)
    }
  }
  return uit
}

/** Wat er sinds `sinds` automatisch gebeurde, voor de ochtendmail. Fout → leeg. */
export async function haalRecenteActies(admin: SupabaseClient, userId: string, sinds: Date): Promise<string[]> {
  const { data, error } = await admin
    .from(TABEL)
    .select('omschrijving')
    .eq('user_id', userId)
    .gte('aangemaakt_op', sinds.toISOString())
    .order('aangemaakt_op', { ascending: true })
  if (error || !Array.isArray(data)) return []
  // Meerdere afspraken met dezelfde typfout geven dezelfde zin: één keer tonen.
  return [...new Set(data.map((r: { omschrijving: string }) => r.omschrijving))]
}
