// ─── Fit Factory Club: het cijferrapport ophalen (SERVER) ───────────────────
// Vijf gerichte bronnen tegelijk, daarna puur rekenen in maakRapport.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalBezoek, haalLeadsCijfers, haalLedenCijfers, haalLessen } from './bronnen'
import { periodeStart, wekenReeks, type Bereik, type Periode } from './periode'
import { maakRapport, type Rapport } from './rapport'
import { dagSleutel, dagStart } from './tijd'

export interface RapportUitkomst {
  rapport: Rapport
  maandagen: string[]
  vandaag: string
  meldingen: string[]
}

const VOORUIT_DAGEN = 14

export async function haalRapport(
  admin: SupabaseClient,
  userId: string,
  vestiging: Vestiging,
  weken: Periode,
  bereik: Bereik,
  nu = new Date(),
): Promise<RapportUitkomst> {
  const vandaag = dagSleutel(nu)
  const maandagen = wekenReeks(vandaag, weken)
  const van = dagStart(periodeStart(vandaag, weken))
  const vooruit = new Date(nu.getTime() + VOORUIT_DAGEN * 86_400_000)
  const [leden, bezoek, lessen, leads] = await Promise.all([
    haalLedenCijfers(admin, userId),
    haalBezoek(admin, userId, van),
    haalLessen(admin, userId, van, vooruit),
    haalLeadsCijfers(admin, userId, van),
  ])
  const voorbij = lessen.data.filter((l) => l.start.getTime() < nu.getTime())
  const komend = lessen.data.filter((l) => l.start.getTime() >= nu.getTime())
  const rapport = maakRapport({
    vandaag,
    nu,
    maandagen,
    bereik,
    vestiging,
    leden: leden.data,
    bezoek: bezoek.data,
    lessen: voorbij,
    komend,
    leads: leads.data,
  })
  const meldingen = [leden.fout, bezoek.fout, lessen.fout, leads.fout].filter((m): m is string => m !== null)
  return { rapport, maandagen, vandaag, meldingen }
}
