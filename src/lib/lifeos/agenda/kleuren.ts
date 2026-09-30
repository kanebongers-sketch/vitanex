// ─── LifeOS — afspraken kleuren per categorie (SERVER-ONLY) ─────────────────
// Na elke agenda-sync: elke afspraak in je PERSOONLIJKE agenda (en alleen die)
// krijgt de kleur van zijn categorie (zie `categorie-kleur.ts`). Een kleur die jij zelf
// koos blijft staan; LifeOS onthoudt per afspraak wat het zelf zette (migratie
// 310). Best-effort per afspraak: een afspraak die je niet mag wijzigen (een
// uitnodiging van iemand anders) slaat de rest niet over.

import type { SupabaseClient } from '@supabase/supabase-js'
import { geldigToken, leesGekozenKalender } from './koppeling'
import { haalEvents } from './google'
import { wijzigAgendaEvent } from './schrijven'
import { categoriseerMet, type AgendaCategorie } from './categorie'
import { haalCategorieRegels } from './categorie-opslag'
import { bepaalKleur } from './categorie-kleur'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'

/** Terug (je week in beeld) en vooruit (wat komt). */
const DAGEN_TERUG = 7
const DAGEN_VOORUIT = 30
/** Per ronde maximaal zoveel schrijfacties: de eerste keer gaat in een paar rondes. */
const MAX_PER_RONDE = 60

export type KleurUitkomst = { staat: 'ok'; gekleurd: number } | { staat: 'overgeslagen' }

async function leesGeschreven(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<Map<string, string>> {
  const uit = new Map<string, string>()
  if (ids.length === 0) return uit
  const { data } = await admin
    .from('agenda_events')
    .select('extern_id, kleur_geschreven')
    .eq('user_id', userId)
    .in('extern_id', ids)
  for (const r of Array.isArray(data) ? data : []) {
    if (typeof r?.extern_id === 'string' && typeof r.kleur_geschreven === 'string') uit.set(r.extern_id, r.kleur_geschreven)
  }
  return uit
}

export async function kleurAfspraken(admin: SupabaseClient, userId: string): Promise<KleurUitkomst> {
  const token = await geldigToken(admin, userId)
  if (token.staat !== 'ok') return { staat: 'overgeslagen' }
  const personen = await haalPersonen(admin, userId)
  if (!personen.ok) return { staat: 'overgeslagen' }
  const regels = await haalCategorieRegels(admin, userId)
    .then((u) => (u.ok ? u.waarde : new Map<string, AgendaCategorie>()))
    .catch(() => new Map<string, AgendaCategorie>())

  // DE PERSOONLIJKE AGENDA, en alleen die (null = je primary).
  const kalenderId = await leesGekozenKalender(admin, userId)
  const nu = Date.now()
  const van = new Date(nu - DAGEN_TERUG * 24 * 60 * 60 * 1000)
  const tot = new Date(nu + DAGEN_VOORUIT * 24 * 60 * 60 * 1000)
  const gelezen = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (gelezen.staat !== 'ok') return { staat: 'overgeslagen' }

  const geschreven = await leesGeschreven(admin, userId, gelezen.events.map((e) => e.externId))
  let gekleurd = 0
  for (const e of gelezen.events) {
    if (gekleurd >= MAX_PER_RONDE) break
    const categorie = categoriseerMet(e.titel, personen.waarde, regels)
    const doel = bepaalKleur(categorie, e.kleurId ?? null, geschreven.get(e.externId) ?? null)
    if (doel === null) continue
    try {
      await wijzigAgendaEvent(admin, userId, e.externId, { kleurId: doel }, kalenderId)
      await admin.from('agenda_events').update({ kleur_geschreven: doel }).eq('user_id', userId).eq('extern_id', e.externId)
      gekleurd++
    } catch (oorzaak) {
      console.warn(`[agenda-kleur] ${e.externId} niet gekleurd:`, oorzaak instanceof Error ? oorzaak.message : oorzaak)
    }
  }
  return { staat: 'ok', gekleurd }
}
