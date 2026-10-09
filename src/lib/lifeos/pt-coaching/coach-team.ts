// ─── PT-coaching — het coach-overzicht van het team ophalen (SERVER-ONLY) ──
// Voor de coach-pagina van een eigenaar of de beheerder: per PT'er de agenda
// (laatste en volgende coachgesprek, uit Kane's gekoppelde Google Agenda), alle
// verslagen, de open aandachtspunten, de check-in van deze week en de leads die
// eerst opgepakt moeten worden. De service-role-client komt als parameter binnen.
// Leads en klanten zijn al geladen door `eigenaarGegevens`; die geef je mee.

import type { SupabaseClient } from '@supabase/supabase-js'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents, type GoogleAfspraak } from '@/lib/lifeos/agenda/google'
import { matchtCoachgesprek } from '@/lib/lifeos/pt-gesprek/pt-gesprek'
import { huidigeWeek } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckinsVoor } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { ptOverzicht } from '@/lib/lifeos/pt-dashboard/overzicht'
import type { PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { dagSleutelNl, type Lead } from '@/lib/lifeos/leads/leads'
import { haalOpenPunten, haalRecenteEvaluaties } from './opslag'
import type { CoachRij } from './coach-overzicht'

/** Hoe ver terug en vooruit we in de agenda kijken voor het laatste/volgende gesprek. */
const TERUG_DAGEN = 21
const VOORUIT_DAGEN = 60
/** Zoveel verslagen per PT'er laden we (ruim een jaar wekelijks). */
const MAX_VERSLAGEN = 60

export type AgendaStaat = 'ok' | 'niet_gekoppeld' | 'fout'

export interface CoachTeam {
  /** Zonder agenda weten we het volgende gesprek niet; de pagina zegt dat eerlijk. */
  agenda: AgendaStaat
  rijen: CoachRij[]
}

interface Gesprekken {
  laatsteOp: string | null
  volgendeOp: string | null
}

/** Het laatste (geweest) en eerstvolgende coachgesprek van één PT'er uit de agenda-events. */
function gesprekkenVan(naam: string, events: readonly GoogleAfspraak[], nu: Date): Gesprekken {
  const nuMs = nu.getTime()
  const eigen = events
    .filter((e) => !e.heleDag && matchtCoachgesprek(e.titel, naam))
    .sort((a, b) => a.startOp.getTime() - b.startOp.getTime())
  const geweest = eigen.filter((e) => e.startOp.getTime() <= nuMs)
  const komend = eigen.find((e) => e.startOp.getTime() > nuMs)
  return {
    laatsteOp: geweest.length > 0 ? geweest[geweest.length - 1].startOp.toISOString() : null,
    volgendeOp: komend ? komend.startOp.toISOString() : null,
  }
}

async function haalAgenda(admin: SupabaseClient, userId: string, nu: Date): Promise<{ staat: AgendaStaat; events: GoogleAfspraak[] }> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') return { staat: 'niet_gekoppeld', events: [] }
  if (token.staat === 'fout') return { staat: 'fout', events: [] }
  const kalenderId = await leesGekozenKalender(admin, userId)
  const van = new Date(nu.getTime() - TERUG_DAGEN * 24 * 60 * 60 * 1000)
  const tot = new Date(nu.getTime() + VOORUIT_DAGEN * 24 * 60 * 60 * 1000)
  const events = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (events.staat === 'verlopen') return { staat: 'niet_gekoppeld', events: [] }
  if (events.staat === 'fout') return { staat: 'fout', events: [] }
  return { staat: 'ok', events: events.events }
}

export async function haalCoachTeam(
  admin: SupabaseClient,
  userId: string,
  team: readonly { id: string; naam: string }[],
  leads: ReadonlyMap<string, Lead[]>,
  klanten: ReadonlyMap<string, PtKlant[]>,
  nu: Date,
): Promise<CoachTeam> {
  const ids = team.map((p) => p.id)
  const [agenda, verslagen, punten, checkins] = await Promise.all([
    haalAgenda(admin, userId, nu).catch((): { staat: AgendaStaat; events: GoogleAfspraak[] } => ({ staat: 'fout', events: [] })),
    haalRecenteEvaluaties(admin, userId, ids, MAX_VERSLAGEN),
    haalOpenPunten(admin, userId, ids),
    haalCheckinsVoor(admin, userId, ids, huidigeWeek(nu)),
  ])
  const vandaag = dagSleutelNl(nu)
  const rijen = team.map((p): CoachRij => {
    const g = gesprekkenVan(p.naam, agenda.events, nu)
    const o = ptOverzicht(leads.get(p.id) ?? [], klanten.get(p.id) ?? [], vandaag)
    return {
      id: p.id,
      naam: p.naam,
      laatsteGesprekOp: g.laatsteOp,
      volgendeOp: g.volgendeOp,
      verslagen: verslagen.get(p.id) ?? [],
      openPunten: punten.get(p.id) ?? [],
      checkin: checkins.get(p.id) ?? null,
      opTePakken: { teLaat: o.teLaat, vandaag: o.vandaag, zonderPlan: o.zonderPlan },
    }
  })
  return { agenda: agenda.staat, rijen }
}
