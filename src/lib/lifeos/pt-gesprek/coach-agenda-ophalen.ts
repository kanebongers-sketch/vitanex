// ─── LifeOS | de agenda "Coachgesprekken PT" ophalen (SERVER-ONLY) ─────────
// Zoekt de coachagenda op naam in de Google-agendalijst en leest of schrijft daar
// de coachgesprekken. De regels zelf (welke agenda's, ontdubbelen) staan puur en
// getest in `coach-agenda.ts`.
//
// Zuinig met Google: het resultaat van de agendalijst blijft tien minuten in het
// geheugen van dit proces (een mislukte poging een minuut), en gelijktijdige
// verzoeken delen dezelfde vraag. De bestaande scope `calendar.calendarlist.readonly`
// leest de lijst al; er komt geen scope bij. Geeft Google een 403 (een koppeling van
// voor die scope), dan loggen we dat en werkt alles door zoals vroeger, alleen in de
// gekozen agenda. Opnieuw koppelen lost dat op.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalEvents, haalKalenders, type EventsUitkomst, type GoogleAfspraak } from '@/lib/lifeos/agenda/google'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { leesKalenders } from '@/lib/lifeos/agenda/kalenders'
import { AgendaSchrijfFout } from '@/lib/lifeos/agenda/schrijven'
import {
  coachSchrijfAgenda,
  extraCoachAgenda,
  ontdubbelEvents,
  vindCoachAgenda,
  type AgendaInLijst,
  type CoachAgenda,
} from './coach-agenda'

const GEVONDEN_MS = 10 * 60_000
const MISLUKT_MS = 60_000

interface CacheRegel {
  tot: number
  belofte: Promise<CoachAgenda | null>
}

/** Per gebruiker: de gevonden coachagenda (of null) en tot wanneer die geldt. */
const CACHE = new Map<string, CacheRegel>()

/**
 * De coachagenda van deze gebruiker, of null als die er niet is of niet te lezen
 * is. Gooit nooit: zonder coachagenda werkt LifeOS gewoon door op de gekozen agenda.
 */
export function haalCoachAgenda(admin: SupabaseClient, userId: string, toegangstoken: string): Promise<CoachAgenda | null> {
  const nu = Date.now()
  const bestaand = CACHE.get(userId)
  if (bestaand && bestaand.tot > nu) return bestaand.belofte

  const regel: CacheRegel = { tot: nu + GEVONDEN_MS, belofte: Promise.resolve(null) }
  regel.belofte = zoekCoachAgenda(admin, userId, toegangstoken)
    .then((uit) => {
      if (!uit.gelukt) regel.tot = Date.now() + MISLUKT_MS
      return uit.agenda
    })
    .catch((fout: unknown) => {
      console.error('[coach-agenda] zoeken mislukt', fout)
      regel.tot = Date.now() + MISLUKT_MS
      return null
    })
  CACHE.set(userId, regel)
  return regel.belofte
}

async function zoekCoachAgenda(
  admin: SupabaseClient,
  userId: string,
  toegangstoken: string,
): Promise<{ gelukt: boolean; agenda: CoachAgenda | null }> {
  const lijst = await haalKalenders(toegangstoken)
  if (lijst.staat === 'ok') return { gelukt: true, agenda: vindCoachAgenda(lijst.kalenders) }

  if (lijst.staat === 'scope_ontbreekt') {
    console.warn('[coach-agenda] de koppeling mag de agendalijst niet lezen (403). Koppel Google opnieuw om "Coachgesprekken PT" te vinden.')
  } else {
    console.warn(`[coach-agenda] agendalijst niet gelezen (${lijst.staat}); val terug op de opgeslagen lijst.`)
  }

  // Terugval zonder Google-verzoek: de gespiegelde agendalijst uit de laatste sync.
  const opgeslagen = await leesKalenders(admin, userId)
  if (!opgeslagen.ok) return { gelukt: false, agenda: null }
  const spiegel: AgendaInLijst[] = opgeslagen.waarde.map((k) => ({ id: k.kalenderId, naam: k.naam, primair: false, toegang: k.toegang }))
  return { gelukt: false, agenda: vindCoachAgenda(spiegel) }
}

/**
 * De afspraken uit de coachagenda, als die bestaat en een andere is dan de gekozen
 * agenda. Best effort: bij een fout een lege lijst (en een logregel), zodat de
 * gekozen agenda altijd blijft werken.
 */
export async function haalExtraCoachEvents(
  admin: SupabaseClient,
  userId: string,
  toegangstoken: string,
  van: Date,
  tot: Date,
  gekozen: string | null,
): Promise<GoogleAfspraak[]> {
  const extra = extraCoachAgenda(gekozen, await haalCoachAgenda(admin, userId, toegangstoken))
  if (extra === null) return []
  const uit = await haalEvents(toegangstoken, van, tot, extra)
  if (uit.staat !== 'ok') {
    console.warn(`[coach-agenda] afspraken uit "Coachgesprekken PT" niet gelezen (${uit.staat})`)
    return []
  }
  return uit.events.map((e) => ({ ...e, kalenderId: extra }))
}

/**
 * De afspraken uit de gekozen agenda plus de coachagenda, samengevoegd zonder
 * dubbelen en op starttijd. De status volgt de gekozen agenda, net als voorheen.
 */
export async function haalEventsMetCoachAgenda(
  admin: SupabaseClient,
  userId: string,
  toegangstoken: string,
  van: Date,
  tot: Date,
  gekozen: string | null,
): Promise<EventsUitkomst> {
  const [hoofd, extra] = await Promise.all([
    haalEvents(toegangstoken, van, tot, gekozen),
    haalExtraCoachEvents(admin, userId, toegangstoken, van, tot, gekozen),
  ])
  if (hoofd.staat !== 'ok') return hoofd
  return { staat: 'ok', events: ontdubbelEvents([hoofd.events, extra]) }
}

/**
 * De agenda waarin LifeOS een coachgesprek inplant: "Coachgesprekken PT" als die
 * bestaat en beschrijfbaar is, anders de gekozen agenda.
 */
export async function coachgesprekSchrijfAgenda(admin: SupabaseClient, userId: string): Promise<string | null> {
  const gekozen = await leesGekozenKalender(admin, userId)
  const token = await geldigToken(admin, userId)
  if (token.staat !== 'ok') return gekozen
  return coachSchrijfAgenda(gekozen, await haalCoachAgenda(admin, userId, token.toegangstoken))
}

/**
 * Voor wijzigen of verwijderen van een afspraak waarvan de cache niet weet in welke
 * agenda hij staat: eerst in `eerste`, en geeft Google daar een 404, dan een keer in
 * de andere agenda (gekozen of "Coachgesprekken PT"). Zo vindt LifeOS ook een
 * coachgesprek dat nog niet in de cache staat. Andere fouten gaan gewoon door.
 */
export async function metCoachTerugval<T>(
  admin: SupabaseClient,
  userId: string,
  eerste: string | null,
  actie: (kalenderId: string | null) => Promise<T>,
): Promise<T> {
  try {
    return await actie(eerste)
  } catch (fout) {
    if (!(fout instanceof AgendaSchrijfFout) || fout.soort !== 'niet_gevonden') throw fout
    const gekozen = await leesGekozenKalender(admin, userId)
    const coach = await coachgesprekSchrijfAgenda(admin, userId)
    const ander = [coach, gekozen].find((k) => k !== eerste)
    if (ander === undefined) throw fout
    return actie(ander)
  }
}
