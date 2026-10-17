// ─── Fit Factory Club: het maandrapport ophalen (SERVER) ────────────────────
// Alle bronnen tegelijk, over 13 maanden: de 12 maanden van de trend plus
// dezelfde maand vorig jaar. Daarna puur rekenen in maakRapport.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { haalBezoek, haalLeadsCijfers, haalLedenCijfers, haalLessen } from './bronnen'
import { haalBegin, haalLesDagen } from './bronnen-maand'
import { maandGrenzen, plusMaanden, type Maand } from './maand'
import type { Bereik } from './periode'
import { maakRapport, TREND_MAANDEN, type Rapport } from './rapport'
import { dagSleutel } from './tijd'

export interface RapportUitkomst {
  rapport: Rapport
  vandaag: string
  meldingen: string[]
}

const VOORUIT_DAGEN = 14

function vroegste(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b
}

export async function haalRapport(
  admin: SupabaseClient,
  userId: string,
  vestigingen: readonly VestigingInfo[],
  vestiging: Vestiging,
  maand: Maand,
  bereik: Bereik,
  nu = new Date(),
): Promise<RapportUitkomst> {
  const vandaag = dagSleutel(nu)
  const gekozen = maandGrenzen(maand)
  const van = maandGrenzen(plusMaanden(maand, -TREND_MAANDEN)).van
  const totNu = vroegste(gekozen.tot, nu)
  const vooruit = new Date(nu.getTime() + VOORUIT_DAGEN * 86_400_000)
  const [leden, bezoek, lesDagen, leads, begin, komend] = await Promise.all([
    haalLedenCijfers(admin, userId),
    haalBezoek(admin, userId, van, gekozen.tot, gekozen.van),
    haalLesDagen(admin, userId, van, totNu),
    haalLeadsCijfers(admin, userId, van, gekozen.tot),
    haalBegin(admin, userId, vestigingen.map((v) => v.sleutel)),
    haalLessen(admin, userId, nu, vooruit),
  ])
  // Zonder migratie 396 zijn de lessen van de maand al per les opgehaald.
  const lessen = lesDagen.perLes
    ? { data: lesDagen.perLes.filter((l) => l.start.getTime() >= gekozen.van.getTime()), fout: null }
    : await haalLessen(admin, userId, gekozen.van, totNu)
  const rapport = maakRapport({
    vandaag,
    nu,
    maand,
    bereik,
    vestiging,
    vestigingen,
    bronnen: { leden: leden.data, bezoek: bezoek.data, lesDagen: lesDagen.data, leads: leads.data, begin: begin.data },
    lessen: lessen.data,
    komend: komend.data,
  })
  const fouten = [leden.fout, bezoek.fout, lesDagen.fout, lessen.fout, leads.fout, begin.fout, komend.fout]
  const meldingen = [...new Set(fouten.filter((m): m is string => m !== null))]
  return { rapport, vandaag, meldingen }
}
