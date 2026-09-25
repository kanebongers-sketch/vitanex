// ─── LifeOS — afhaak-signaal ophalen (SERVER-ONLY) ──────────────────────────
// De I/O-kant van `afhaak.ts`: leest een breed venster (laatste 8 weken) uit je
// persoonlijke agenda en laat de pure `bepaalAfhaak` beslissen wie afhaakt.
// Gedeeld door de ochtendmail en de weekmail, zodat beide exact hetzelfde signaal
// geven. Best-effort: niet gekoppeld, verlopen of onbereikbaar → gewoon geen
// signalen — nooit een verzonnen zorg, nooit een omgevallen mail.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalAfhaak, type Afhaak } from './afhaak'
import type { PtKlant, PtEvent } from './pt-klant'

/** Het venster dat `bepaalAfhaak` nodig heeft om "gestopt" van "net begonnen" te scheiden. */
export const AFHAAK_VENSTER_DAGEN = 56

/** De PT-klanten uit je CRM, in de vorm die de PT-logica verwacht. */
export function ptKlantenUit(personen: readonly Persoon[]): PtKlant[] {
  return personen
    .filter((p) => p.groep === 'pt_klant')
    .map((p) => ({
      id: p.id,
      naam: p.naam,
      email: p.email,
      abonnement: p.abonnement,
      duo: p.duo,
      locatie: p.locatie,
      vakantieTot: p.vakantieTot,
    }))
}

export async function haalAfhaak(
  admin: SupabaseClient,
  userId: string,
  personen: readonly Persoon[],
  nu: Date,
): Promise<Afhaak[]> {
  const klanten = ptKlantenUit(personen)
  if (klanten.length === 0) return []

  try {
    const token = await geldigToken(admin, userId)
    if (token.staat !== 'ok') return []
    const kalenderId = await leesGekozenKalender(admin, userId)

    const van = new Date(nu.getTime() - AFHAAK_VENSTER_DAGEN * 24 * 60 * 60 * 1000)
    const gelezen = await haalEvents(token.toegangstoken, van, nu, kalenderId)
    if (gelezen.staat !== 'ok') return []

    const events: PtEvent[] = gelezen.events.map((e) => ({ titel: e.titel, startOp: e.startOp.toISOString() }))
    return bepaalAfhaak(klanten, events, nu)
  } catch (oorzaak) {
    console.error('[afhaak] agenda-venster ophalen mislukt', oorzaak)
    return []
  }
}
