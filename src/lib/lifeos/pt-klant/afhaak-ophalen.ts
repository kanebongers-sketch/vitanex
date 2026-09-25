// ─── LifeOS — PT-signalen ophalen (SERVER-ONLY) ─────────────────────────────
// De I/O-kant van de PT-signalen: leest één breed venster (laatste 8 weken) uit je
// persoonlijke agenda en laat de pure logica beslissen:
//   - afhaak     (`afhaak.ts`)      — lopende klant, maar al weken niet op PT;
//   - statusHints (`klantstatus.ts`) — traint al, maar staat nog als prospect;
//   - inplannen  (`pt-klant.ts`)     — wie deze week nog een sessie mist (dezelfde
//     weekstatus als de PT-kaart op het dashboard).
// Eén Google-call voor alles; het venster loopt door t/m volgende week, want een
// 2-wekelijkse klant die volgende week geboekt staat is níet "nog in te plannen". Gedeeld door de ochtendmail en de weekmail, zodat
// ze exact hetzelfde zeggen. Best-effort: niet gekoppeld, verlopen of onbereikbaar
// → lege lijsten — nooit een verzonnen zorg, nooit een omgevallen mail.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalAfhaak, type Afhaak } from './afhaak'
import {
  bepaalOnbekendePtSessies,
  bepaalStatusHints,
  ptKlantenUit,
  type OnbekendePtSessie,
  type PtStatusHint,
} from './klantstatus'
import { bepaalWeekStatus, maandagVan, type PtEvent, type PtWeekStatus } from './pt-klant'
import { datumSleutel } from '@/lib/lifeos/datum/datum'

/** Het venster dat `bepaalAfhaak` nodig heeft om "gestopt" van "net begonnen" te scheiden. */
export const AFHAAK_VENSTER_DAGEN = 56

export interface PtSignalen {
  afhaak: Afhaak[]
  statusHints: PtStatusHint[]
  onbekend: OnbekendePtSessie[]
  /** Klanten met een tekort deze week (niet op vakantie). */
  inplannen: PtWeekStatus[]
}

const LEEG: PtSignalen = { afhaak: [], statusHints: [], onbekend: [], inplannen: [] }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function haalPtSignalen(
  admin: SupabaseClient,
  userId: string,
  personen: readonly Persoon[],
  nu: Date,
): Promise<PtSignalen> {

  try {
    const token = await geldigToken(admin, userId)
    if (token.staat !== 'ok') return LEEG
    const kalenderId = await leesGekozenKalender(admin, userId)

    const weekVan = maandagVan(nu)
    const van = new Date(Math.min(weekVan.getTime() - WEEK_MS, nu.getTime() - AFHAAK_VENSTER_DAGEN * 24 * 60 * 60 * 1000))
    const tot = new Date(weekVan.getTime() + 2 * WEEK_MS)
    const gelezen = await haalEvents(token.toegangstoken, van, tot, kalenderId)
    if (gelezen.staat !== 'ok') return LEEG

    // Afhaak, statusHints en onbekend kijken zelf alleen naar het verleden (t ≤ nu);
    // de toekomst in dit venster is er voor de weekstatus.
    const events: PtEvent[] = gelezen.events.map((e) => ({ titel: e.titel, startOp: e.startOp.toISOString() }))
    const klanten = ptKlantenUit(personen)
    const alleNamen = personen.map((p) => p.naam)
    const week = bepaalWeekStatus(klanten, events, weekVan.toISOString(), datumSleutel(nu), alleNamen)
    return {
      afhaak: bepaalAfhaak(klanten, events, nu, alleNamen),
      statusHints: bepaalStatusHints(personen, events, nu),
      onbekend: bepaalOnbekendePtSessies(personen, events, nu),
      inplannen: week.filter((k) => k.tekort > 0),
    }
  } catch (oorzaak) {
    console.error('[pt-signalen] agenda-venster ophalen mislukt', oorzaak)
    return LEEG
  }
}
