// ─── Club, afspraken: hulp voor de API-routes (SERVER-ONLY) ─────────────────
// Gedeelde stappen: body lezen, trainers voor een type, en een nieuwe of
// verplaatste afspraak controleren tegen de vrije tijden.

import type { NextRequest } from 'next/server'
import type { ClubSchrijver } from '@/lib/club/toegang'
import { haalMedewerkers, type Medewerker } from '@/lib/club/kern/medewerker'
import { nlNaarUtc } from '@/lib/club/rooster/tijd'
import type { AfspraakType } from './model'
import { magGeven } from './regels'
import { trainerVoorTijd } from './sloten-opslag'

/** De JSON-body, of null bij onleesbare invoer. */
export async function leesJson(req: NextRequest): Promise<unknown> {
  return req.json().catch(() => null)
}

/** De medewerkers die dit type in deze vestiging mogen geven; null bij een leesfout. */
export async function trainersVoorType(t: ClubSchrijver, vestiging: string, type: AfspraakType): Promise<Medewerker[] | null> {
  const lijst = await haalMedewerkers(t.admin, t.userId, vestiging)
  return lijst ? lijst.filter((m) => magGeven(type, m, vestiging)) : null
}

export type Controle = { ok: true; medewerkerId: string; start: Date } | { ok: false; fout: string; status: number }

interface TijdVraag {
  vestiging: string
  type: AfspraakType
  datum: string
  tijd: string
  /** De gekozen trainer; null = maakt niet uit (alleen in de app). */
  medewerkerId: string | null
  vanaf: Date | null
  tot: Date | null
  negeerAfspraakId?: string
}

/**
 * Past deze afspraak? De trainer moet het type mogen geven, werken en vrij
 * zijn. De database controleert overlap daarna nog een keer (race-veilig).
 */
export async function controleerTijd(t: ClubSchrijver, v: TijdVraag): Promise<Controle> {
  const trainers = await trainersVoorType(t, v.vestiging, v.type)
  if (!trainers) return { ok: false, status: 500, fout: 'De trainers konden niet worden geladen.' }
  if (v.medewerkerId && !trainers.some((m) => m.id === v.medewerkerId)) {
    return { ok: false, status: 400, fout: 'Deze trainer geeft dit soort afspraak niet in deze vestiging.' }
  }
  const ids = v.medewerkerId ? [v.medewerkerId] : trainers.map((m) => m.id)
  if (ids.length === 0) return { ok: false, status: 409, fout: 'Er is geen trainer die dit soort afspraak geeft.' }
  const gekozen = await trainerVoorTijd(t.admin, t.userId, { vestiging: v.vestiging, type: v.type, datum: v.datum, medewerkerIds: ids, vanaf: v.vanaf, tot: v.tot, negeerAfspraakId: v.negeerAfspraakId }, v.tijd)
  if (gekozen === undefined) return { ok: false, status: 500, fout: 'De agenda kon niet worden gecontroleerd. Probeer het opnieuw.' }
  if (gekozen === null) {
    return { ok: false, status: 409, fout: 'Dit tijdstip is niet vrij: de trainer werkt dan niet, geeft een les of heeft al een afspraak.' }
  }
  return { ok: true, medewerkerId: gekozen, start: nlNaarUtc(v.datum, v.tijd) }
}
