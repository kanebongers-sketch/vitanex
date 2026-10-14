// ─── Fit Factory Club, personeel: alles voor een week laden (SERVER) ────────

import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { isoWeekdag, plusDagen, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { haalBemand, haalBeschikbaarheid, haalDiensten, haalNotities, haalSjablonen, haalSoorten } from '@/lib/club/personeel/opslag'
import type { Beschikbaarheid, Dienst, DienstSoort, PersoneelLid, RoosterNotitie, Sjabloon } from '@/lib/club/personeel/typen'
import type { Bereik } from './weergave'

export interface WeekData {
  soorten: DienstSoort[]
  /** De week plus een dag ervoor en erna (voor de rustregel). */
  alle: Dienst[]
  week: Dienst[]
  beschikbaarheid: Beschikbaarheid[]
  notities: RoosterNotitie[]
  bemand: Openingstijden
  sjablonen: Sjabloon[]
}

export async function laadWeek(t: ClubToegang, vestiging: Vestiging, maandag: string, team: readonly PersoneelLid[], metPatronen: boolean): Promise<WeekData | null> {
  const zondagNa = plusDagen(maandag, 7)
  const [soorten, alle, beschikbaarheid, notities, bemand, sjablonen] = await Promise.all([
    haalSoorten(t.admin, t.userId, vestiging),
    haalDiensten(t.admin, t.userId, vestiging, plusDagen(maandag, -1), plusDagen(zondagNa, 1)),
    haalBeschikbaarheid(t.admin, t.userId, team.map((l) => l.id)),
    haalNotities(t.admin, t.userId, vestiging, maandag, zondagNa),
    haalBemand(t.admin, t.userId, vestiging),
    metPatronen ? haalSjablonen(t.admin, t.userId, vestiging) : Promise.resolve([]),
  ])
  if (!soorten || !alle || !beschikbaarheid || !notities || !sjablonen) return null
  const week = alle.filter((d) => d.datum >= maandag && d.datum < zondagNa)
  return { soorten, alle, week, beschikbaarheid, notities, bemand, sjablonen }
}

/** Het tijdbereik van het raster: bemande uren en diensten samen, op hele uren. */
export function bereikVan(bemand: Openingstijden, diensten: readonly Dienst[], dagen: readonly string[]): Bereik {
  const tijden: number[] = []
  for (const d of dagen) {
    const b = bemand[isoWeekdag(d) - 1]
    if (b) tijden.push(tijdNaarMinuten(b.van), tijdNaarMinuten(b.tot))
  }
  for (const d of diensten) tijden.push(tijdNaarMinuten(d.begin), tijdNaarMinuten(d.eind))
  if (tijden.length === 0) return { van: 8 * 60, tot: 22 * 60 }
  return { van: Math.floor(Math.min(...tijden) / 60) * 60, tot: Math.ceil(Math.max(...tijden) / 60) * 60 }
}
