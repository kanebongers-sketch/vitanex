// ─── LifeOS — PT-signalen ophalen (SERVER-ONLY) ─────────────────────────────
// De I/O-kant van de PT-signalen: leest één breed venster (laatste 8 weken) uit je
// persoonlijke agenda en laat de pure logica beslissen:
//   - afhaak     (`afhaak.ts`)      — lopende klant, maar al weken niet op PT;
//   - statusHints (`klantstatus.ts`) — traint al, maar staat nog als prospect.
// Eén Google-call voor beide. Gedeeld door de ochtendmail en de weekmail, zodat
// ze exact hetzelfde zeggen. Best-effort: niet gekoppeld, verlopen of onbereikbaar
// → lege lijsten — nooit een verzonnen zorg, nooit een omgevallen mail.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalAfhaak, type Afhaak } from './afhaak'
import { bepaalStatusHints, ptKlantenUit, type PtStatusHint } from './klantstatus'
import type { PtEvent } from './pt-klant'

/** Het venster dat `bepaalAfhaak` nodig heeft om "gestopt" van "net begonnen" te scheiden. */
export const AFHAAK_VENSTER_DAGEN = 56

export interface PtSignalen {
  afhaak: Afhaak[]
  statusHints: PtStatusHint[]
}

const LEEG: PtSignalen = { afhaak: [], statusHints: [] }

export async function haalPtSignalen(
  admin: SupabaseClient,
  userId: string,
  personen: readonly Persoon[],
  nu: Date,
): Promise<PtSignalen> {
  if (!personen.some((p) => p.groep === 'pt_klant')) return LEEG

  try {
    const token = await geldigToken(admin, userId)
    if (token.staat !== 'ok') return LEEG
    const kalenderId = await leesGekozenKalender(admin, userId)

    const van = new Date(nu.getTime() - AFHAAK_VENSTER_DAGEN * 24 * 60 * 60 * 1000)
    const gelezen = await haalEvents(token.toegangstoken, van, nu, kalenderId)
    if (gelezen.staat !== 'ok') return LEEG

    const events: PtEvent[] = gelezen.events.map((e) => ({ titel: e.titel, startOp: e.startOp.toISOString() }))
    return {
      afhaak: bepaalAfhaak(ptKlantenUit(personen), events, nu),
      statusHints: bepaalStatusHints(personen, events, nu),
    }
  } catch (oorzaak) {
    console.error('[pt-signalen] agenda-venster ophalen mislukt', oorzaak)
    return LEEG
  }
}
