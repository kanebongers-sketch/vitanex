// POST /api/lifeos/agenda/sync — haalt vandaag t/m +7 dagen op uit ALLE zichtbare
// agenda's en zet ze in de cache.
//
// Multi-agenda: eerst verversen we je kalenderlijst (naam/kleur/toegang bijwerken,
// de zichtbaar-voorkeur behouden). Zo werkt de sync ook op een verse koppeling,
// vóór de zijbalk de lijst heeft opgehaald — geen race. Daarna halen we de events
// uit elke ZICHTBARE agenda, kleuren ze met de kleur van die agenda, mergen alles
// en schrijven het weg. `bewaarEvents` ruimt meteen op wat er niet meer hoort
// (uitgevinkte agenda's), maar laat een agenda staan waarvan Google net faalde.
//
// Idempotent: twee keer draaien = dezelfde rijen. De garantie zit in de unieke
// index (user_id, bron, extern_id) uit migratie 020, niet in deze route.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { forceerVernieuwing, geldigToken } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents, haalKalenders, type KalendersUitkomst } from '@/lib/lifeos/agenda/google'
import type { GoogleAfspraak } from '@/lib/lifeos/agenda/google'
import { bewaarEvents } from '@/lib/lifeos/agenda/opslag'
import { kleurEvents, leesKalenders, verversKalenders } from '@/lib/lifeos/agenda/kalenders'

/** Vandaag + 7. Verder vooruit kijken heeft geen doel: je dag runnen is het punt. */
const DAGEN_VOORUIT = 7

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }
  if (token.staat === 'fout') {
    // Uitdrukkelijk 502 en niet "leeg": Google even niet bereikbaar is iets
    // anders dan een lege agenda.
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  // Ververs de kalenderlijst, zodat we weten welke agenda's zichtbaar zijn (en met
  // welke kleur) — ook op een verse koppeling waar de zijbalk nog niets ophaalde.
  const lijst = await haalKalenderlijst(toegang.admin, toegang.userId, token.toegangstoken)
  if (lijst.staat === 'verlopen' || lijst.staat === 'scope_ontbreekt') {
    return NextResponse.json({ fout: 'De agendakoppeling is verlopen. Koppel opnieuw.' }, { status: 409 })
  }
  if (lijst.staat === 'fout') {
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const ververst = await verversKalenders(toegang.admin, toegang.userId, lijst.kalenders)
  if (!ververst.ok) {
    return NextResponse.json({ fout: 'Kon je agenda-lijst niet bijwerken.' }, { status: 502 })
  }

  const opgeslagen = await leesKalenders(toegang.admin, toegang.userId)
  if (!opgeslagen.ok) {
    return NextResponse.json({ fout: 'Kon je agenda-lijst niet lezen.' }, { status: 502 })
  }

  const zichtbare = opgeslagen.waarde
    .filter((k) => k.zichtbaar)
    .map((k) => ({ id: k.kalenderId, kleur: k.kleur }))
  const zichtbareIds = zichtbare.map((k) => k.id)

  const van = new Date()
  van.setHours(0, 0, 0, 0)
  const tot = new Date(van)
  tot.setDate(tot.getDate() + DAGEN_VOORUIT + 1)

  const uitkomst = await syncZichtbareAgendas(
    toegang.admin,
    toegang.userId,
    token.toegangstoken,
    zichtbare,
    van,
    tot,
  )
  if (uitkomst.staat === 'verlopen') {
    // Een 401, en ook ná een geforceerde refresh nog steeds: de toestemming is
    // echt ingetrokken. Nu is "koppel opnieuw" het juiste antwoord.
    return NextResponse.json({ fout: 'De agendakoppeling is verlopen. Koppel opnieuw.' }, { status: 409 })
  }
  if (uitkomst.staat === 'fout') {
    // Álle zichtbare agenda's faalden op het netwerk: dat is "Google onbereikbaar",
    // geen lege dag. De cache blijft ongemoeid.
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const bewaard = await bewaarEvents(
    toegang.admin,
    toegang.userId,
    uitkomst.events,
    zichtbareIds,
    uitkomst.gesyncteIds,
    van,
    tot,
  )
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 })
  }

  return NextResponse.json({
    gesynct: bewaard.waarde,
    van: van.toISOString(),
    tot: tot.toISOString(),
  })
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
