// ─── PT-app — het team door de ogen van een clubmanager (PUUR) ──────────────
// Een clubmanager ziet alleen zijn eigen club(s): de leads en klanten met díe
// clubs, en de trainers die daar iets hebben lopen. Geen clubs = niets. Dit gebeurt op de server, vóór er
// iets gerenderd wordt, zodat geen enkel scherm per ongeluk andere clubs toont.
// Doelen vallen weg: die gelden per PT'er over alle clubs, en een voortgang op
// alleen dit deel van de cijfers zou misleiden.

import type { Club } from './clubs'
import { zonderPrijs } from './abonnementen'
import type { PtTeamGegevens } from './team-opslag'

export function voorClub(g: PtTeamGegevens, clubs: readonly Club[]): PtTeamGegevens {
  const eigen = new Set<string>(clubs)
  const leads = new Map([...g.leads].map(([id, lijst]) => [id, lijst.filter((l) => l.club !== null && eigen.has(l.club))]))
  // Zonder afwijkende prijs: een clubmanager ziet geen bedragen, ook niet in de data naar de browser.
  const klanten = new Map([...g.klanten].map(([id, lijst]) => [id, lijst.filter((k) => eigen.has(k.club)).map(zonderPrijs)]))
  // Trainers die in deze club een lead of klant hebben; wie er (nog) niets heeft, staat er niet tussen.
  const team = g.team.filter((p) => (leads.get(p.id)?.length ?? 0) + (klanten.get(p.id)?.length ?? 0) > 0)
  const inTeam = new Set(team.map((p) => p.id))
  return {
    team,
    leads: new Map([...leads].filter(([id]) => inTeam.has(id))),
    klanten: new Map([...klanten].filter(([id]) => inTeam.has(id))),
    beheerderId: g.beheerderId && inTeam.has(g.beheerderId) ? g.beheerderId : null,
  }
}
