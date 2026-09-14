// ─── LifeOS — agenda-sync (server-to-server) ────────────────────────────────
// SERVER-ONLY. Haalt vandaag t/m +7 dagen op uit ALLE zichtbare agenda's en zet
// ze in de cache (`agenda_events`). Dit is de kern die vroeger volledig in
// `app/api/lifeos/agenda/sync/route.ts` zat.
//
// ─── WAAROM DIT EEN LIB IS EN GEEN ROUTE ────────────────────────────────────
// De sync draaide alleen wanneer Kane de agenda-kaart opende. Daardoor zag Vita
// zijn agenda niet: Vita's signalen in de ochtendmail komen uit `haalContext`, en
// dat leest de `agenda_events`-cache — maar niets ververste die tabel eerst, dus
// een afspraak die je gisteren in Google zette, bestond voor Vita niet. "Al het andere
// wacht tot Kane een pagina opent" — dat is precies het verschil tussen een
// dashboard en een stafchef.
//
// Door de logica hier los te trekken van de sessie-route kan ze OOK server-to-
// server draaien: één keer per cron (`cron/lifeos-agenda-sync`, om de cache warm
// te houden) en één keer vlak vóór de ochtend-briefing (`cron/dagplanning-mail`,
// zodat Vita's signalen op verse agenda redeneren). De route en de crons mappen
// deze uitkomst elk op hun eigen antwoord — de logica staat op één plek, niet in
// tweevoud.
//
// De service-role client en het userId komen als PARAMETER binnen (zie
// `@/lib/lifeos/admin`): de sessie-route reikt ze aan achter de founder-gate, de
// cron bouwt ze zelf op de vaste `lifeosUserId()`. Single-tenant, precies zoals
// de rest van LifeOS.

import type { SupabaseClient } from '@supabase/supabase-js'
import { forceerVernieuwing, geldigToken } from './koppeling'
import { haalEvents, haalKalenders, type KalendersUitkomst } from './google'
import type { GoogleAfspraak } from './google'
import { bewaarEvents } from './opslag'
import { kleurEvents, leesKalenders, verversKalenders } from './kalenders'

/** Vandaag + 7. Verder vooruit kijken heeft geen doel: je dag runnen is het punt. */
const DAGEN_VOORUIT = 7

/**
 * Het resultaat van één sync-poging. Semantisch, niet HTTP: de sessie-route en
 * de cron mappen dit elk op hun eigen antwoord.
 *
 *   - `ok`             → de cache is bijgewerkt; `gesynct` is het aantal rijen.
 *   - `niet_gekoppeld` → er is geen agenda gekoppeld (geen fout, gewoon leeg).
 *   - `verlopen`       → de toestemming is echt ingetrokken; opnieuw koppelen.
 *   - `onbereikbaar`   → Google gaf een netwerk-/serverfout. De cache blijft
 *                        ongemoeid — dit is NIET "je dag is leeg".
 *   - `opslag_fout`    → we konden de agenda-lijst of de events niet wegschrijven.
 */
export type AgendaSyncUitkomst =
  | { staat: 'ok'; gesynct: number; van: Date; tot: Date }
  | { staat: 'niet_gekoppeld' }
  | { staat: 'verlopen' }
  | { staat: 'onbereikbaar' }
  | { staat: 'opslag_fout'; melding: string }

/**
 * Ververst de agenda-cache voor één gebruiker.
 *
 * Eerst verversen we de kalenderlijst (naam/kleur/toegang bijwerken, de
 * zichtbaar-voorkeur behouden). Zo werkt de sync ook op een verse koppeling,
 * vóór de zijbalk de lijst heeft opgehaald — geen race. Daarna halen we de events
 * uit elke ZICHTBARE agenda, kleuren ze met de kleur van die agenda, mergen alles
 * en schrijven het weg. `bewaarEvents` ruimt meteen op wat er niet meer hoort
 * (uitgevinkte agenda's), maar laat een agenda staan waarvan Google net faalde.
 *
 * Idempotent: twee keer draaien = dezelfde rijen. De garantie zit in de unieke
 * index (user_id, bron, extern_id) uit migratie 020, niet in deze functie.
 */
export async function syncAgenda(
  admin: SupabaseClient,
  userId: string,
): Promise<AgendaSyncUitkomst> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') return { staat: 'niet_gekoppeld' }
  if (token.staat === 'fout') return { staat: 'onbereikbaar' }

  // Ververs de kalenderlijst, zodat we weten welke agenda's zichtbaar zijn (en met
  // welke kleur) — ook op een verse koppeling waar de zijbalk nog niets ophaalde.
  const lijst = await haalKalenderlijst(admin, userId, token.toegangstoken)
  if (lijst.staat === 'verlopen' || lijst.staat === 'scope_ontbreekt') return { staat: 'verlopen' }
  if (lijst.staat === 'fout') return { staat: 'onbereikbaar' }

  const ververst = await verversKalenders(admin, userId, lijst.kalenders)
  if (!ververst.ok) return { staat: 'opslag_fout', melding: 'Kon je agenda-lijst niet bijwerken.' }

  const opgeslagen = await leesKalenders(admin, userId)
  if (!opgeslagen.ok) return { staat: 'opslag_fout', melding: 'Kon je agenda-lijst niet lezen.' }

  const zichtbare = opgeslagen.waarde
    .filter((k) => k.zichtbaar)
    .map((k) => ({ id: k.kalenderId, kleur: k.kleur }))
  const zichtbareIds = zichtbare.map((k) => k.id)

  const van = new Date()
  van.setHours(0, 0, 0, 0)
  const tot = new Date(van)
  tot.setDate(tot.getDate() + DAGEN_VOORUIT + 1)

  const uitkomst = await syncZichtbareAgendas(admin, userId, token.toegangstoken, zichtbare, van, tot)
  // Een 401 dat ook ná een geforceerde refresh 401 blijft: de toestemming is echt
  // ingetrokken. Nu is "koppel opnieuw" het juiste antwoord.
  if (uitkomst.staat === 'verlopen') return { staat: 'verlopen' }
  // Álle zichtbare agenda's faalden op het netwerk: "Google onbereikbaar", geen
  // lege dag. De cache blijft ongemoeid.
  if (uitkomst.staat === 'fout') return { staat: 'onbereikbaar' }

  const bewaard = await bewaarEvents(
    admin,
    userId,
    uitkomst.events,
    zichtbareIds,
    uitkomst.gesyncteIds,
    van,
    tot,
  )
  if (!bewaard.ok) return { staat: 'opslag_fout', melding: 'Opslaan mislukt.' }

  return { staat: 'ok', gesynct: bewaard.waarde, van, tot }
}

/** Eén zichtbare agenda: waar de sync 'm ophaalt en mee kleurt. */
interface ZichtbareAgenda {
  id: string
  kleur: string | null
}

type MultiSyncUitkomst =
  | { staat: 'ok'; events: GoogleAfspraak[]; gesyncteIds: string[] }
  /** Token echt dood (ook na een verse refresh): opnieuw koppelen. */
  | { staat: 'verlopen' }
  /** Álle zichtbare agenda's faalden op het netwerk. */
  | { staat: 'fout' }

/**
 * Haalt de events uit elke zichtbare agenda, kleurt ze, en merget alles.
 *
 * Token-vernieuwing is GEDEELD over de agenda's: één 401 → één geforceerde
 * refresh → verder met het nieuwe token. Blijft het daarna 401, dan is de
 * toestemming echt weg en stopt de hele sync met `verlopen`.
 *
 * Per agenda is de fetch BEST-EFFORT: faalt er één op het netwerk, dan slaan we
 * die over (server-side gelogd) en gaan we door met de rest — één trage agenda mag
 * je hele dag niet wissen. Alleen als ÉLKE zichtbare agenda zo faalt, is dat
 * "Google onbereikbaar" (`fout`).
 */
async function syncZichtbareAgendas(
  admin: SupabaseClient,
  userId: string,
  token: string,
  zichtbare: readonly ZichtbareAgenda[],
  van: Date,
  tot: Date,
): Promise<MultiSyncUitkomst> {
  const events: GoogleAfspraak[] = []
  const gesyncteIds: string[] = []
  let huidigToken = token
  let ververst = false
  let netwerkfout = false

  for (const agenda of zichtbare) {
    let uit = await haalEvents(huidigToken, van, tot, agenda.id)

    if (uit.staat === 'verlopen' && !ververst) {
      const vers = await forceerVernieuwing(admin, userId)
      if (vers.staat === 'niet_gekoppeld') return { staat: 'verlopen' }
      if (vers.staat === 'fout') return { staat: 'fout' }
      huidigToken = vers.toegangstoken
      ververst = true
      uit = await haalEvents(huidigToken, van, tot, agenda.id)
    }

    if (uit.staat === 'verlopen') return { staat: 'verlopen' }
    if (uit.staat === 'fout') {
      netwerkfout = true
      console.error(`[agenda] sync van agenda ${agenda.id} mislukt: ${uit.reden}`)
      continue
    }

    events.push(...kleurEvents(uit.events, agenda.id, agenda.kleur))
    gesyncteIds.push(agenda.id)
  }

  if (gesyncteIds.length === 0 && netwerkfout) return { staat: 'fout' }

  return { staat: 'ok', events, gesyncteIds }
}

/**
 * De kalenderlijst ophalen, met precies één tweede kans bij een 401 mid-flight —
 * zelfde patroon als de events-fetch en als `kalenders/route.ts`.
 */
async function haalKalenderlijst(
  admin: SupabaseClient,
  userId: string,
  token: string,
): Promise<KalendersUitkomst> {
  const eerste = await haalKalenders(token)
  if (eerste.staat !== 'verlopen') return eerste

  const vers = await forceerVernieuwing(admin, userId)
  if (vers.staat === 'niet_gekoppeld') return { staat: 'verlopen' }
  if (vers.staat === 'fout') return { staat: 'fout', reden: vers.reden }

  return haalKalenders(vers.toegangstoken)
}
